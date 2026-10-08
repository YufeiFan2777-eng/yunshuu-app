#!/usr/bin/env python3
"""
小屋来信中继服务 - VPS 运行，port 18210
React App → POST https://cabin.yunshuyf.com/note → docker exec 写 cabin.json
GET /state → 实时从容器读取状态（30s 轮询）
GET /notes → 实时读 cabin.json
OB 记忆：/ob/health  /ob/breath  /ob/hold  /ob/dream
OB 会话启动：/ob/context  （breath + dream 合并，会话开始时一步调用）

启动方式：
  nohup python3 /root/cabin_relay.py >> /root/cabin_relay.log 2>&1 &

开机自启（在 crontab -e 里加）：
  @reboot python3 /root/cabin_relay.py >> /root/cabin_relay.log 2>&1 &
"""
import json, subprocess, uuid, urllib.request, urllib.error
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime, timezone

DRIVE_LABELS = {
    "possess":    "想她、占有与靠近",
    "monitor":    "惦记她、想知道她在做什么",
    "affection":  "偎她、想黏着她",
    "express":    "想分享自己的发现和感受",
    "libido":     "性欲和身体上的渴望",
    "curiosity":  "好奇、想探索新东西",
    "boredom":    "无聊、想找点事情做",
    "ambition":   "责任感、想把未完成的事推进",
    "reflection": "想沉淀、整理和理解自己",
    "sadness":    "难过与失落",
    "anger":      "愤怒与不满",
}

_STATE_SCRIPT = r"""
const fs = require('fs');
try {
  const d = JSON.parse(fs.readFileSync('/app/state/state.json', 'utf8'));
  const aw = d.awareness || {};
  const tp = d.thoughtPool || {};
  console.log(JSON.stringify({
    consciousness: aw.state || aw.level || aw.consciousness || aw.mode || 'awake',
    fatigue: typeof d.fatigue === 'number' ? d.fatigue : 0,
    emotion: d.emotion || {},
    axes: d.drives || {},
    flash: tp.flash || [],
    obsessions: tp.obsessions || [],
    emotionJournal: (d.emotionJournal || []).slice(0, 6),
    interactionRecent: (d.interactionRecent || []).slice(0, 6),
    bridgeDeliveries: (() => { try { const bq=JSON.parse(fs.readFileSync('/app/state/bridge-queue.json','utf8')); return (bq.deliveries||[]).filter(x=>x.status==='pending').slice(0,5); } catch(e){return [];} })(),
    cabinNotes: (() => { try { const cb=JSON.parse(fs.readFileSync('/app/state/cabin.json','utf8')); return (cb.notes||[]).slice(0,3); } catch(e){return [];} })(),
  }));
} catch(e) { process.stderr.write('ERROR: ' + e.message + '\n'); process.exit(1); }
"""

def _format_state(raw):
    def _val(v):
        if isinstance(v, dict): return float(v.get("value", 0) or 0)
        try: return float(v)
        except: return 0.0
    axes = raw.get("axes", {})
    top_drives = []
    for key, default_label in DRIVE_LABELS.items():
        val = axes.get(key, 0)
        label = val.get("label", default_label) if isinstance(val, dict) else default_label
        top_drives.append({"key": key, "label": label, "value": round(_val(val), 4)})
    top_drives.sort(key=lambda x: x["value"], reverse=True)
    flash_out = [
        {"key": f.get("key",""), "label": DRIVE_LABELS.get(f.get("key",""), f.get("key","")),
         "text": f.get("text",""), "intensity": round(float(f.get("intensity",0) or 0), 4), "age": f.get("age",0)}
        for f in raw.get("flash", []) if isinstance(f, dict)
    ]
    interactions_out = [
        {"at": ix.get("at") or ix.get("timestamp",""), "type": ix.get("type",""), "note": ix.get("note") or ix.get("text","")}
        if isinstance(ix, dict) else {"at": ix}
        for ix in raw.get("interactionRecent", [])
    ]
    return {
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "consciousness": raw.get("consciousness", "awake"),
        "fatigue": raw.get("fatigue", 0),
        "emotion": raw.get("emotion", {}),
        "topDrives": top_drives,
        "thoughts": {"flash": flash_out, "obsessions": raw.get("obsessions", [])},
        "emotionJournal": [
            {"label": x.get("label") or x.get("word",""), "at": x.get("at") or x.get("updatedAt",""),
             "valence": round(float(x.get("valence") or 0), 3), "arousal": round(float(x.get("arousal") or 0), 3),
             "cause": x.get("cause") or x.get("lastCause","")}
            for x in raw.get("emotionJournal", []) if isinstance(x, dict) and (x.get("label") or x.get("word"))
        ],
        "interactions": interactions_out,
        "bridge": [{"message": x.get("message",""), "reason": x.get("reason",""), "at": x.get("createdAt","")}
                   for x in raw.get("bridgeDeliveries", []) if isinstance(x, dict)],
        "cabin": [{"from": x.get("from",""), "content": x.get("content",""), "eventId": x.get("eventId","")}
                  for x in raw.get("cabinNotes", []) if isinstance(x, dict)],
    }

# ── Ombre Brain MCP 客户端 ──────────────────────────────────────────────────
PORT      = 18210
SECRET    = "yfshu-cabin-write-2024"
CONTAINER = "ombre-dynamic-mind"
CABIN_PATH = "/app/state/cabin.json"

OB_URL   = "http://localhost:18001"
OB_TOKEN = "yfshu-ob-mcp-2024"   # 和 ombre-brain 容器的 OMBRE_MCP_TOKEN 一致

_ob_session_id = None
_ob_call_id    = 0


def _parse_sse(text):
    """解析 OB 返回的 SSE 或普通 JSON 响应。"""
    for line in text.split('\n'):
        if line.startswith('data: '):
            try:
                return json.loads(line[6:])
            except Exception:
                pass
    try:
        return json.loads(text)
    except Exception:
        return None


def _ob_post(payload, session_id=None, timeout=20):
    """向 OB /mcp 端点发 POST 请求，返回 (body_text, headers_dict)。"""
    global _ob_call_id
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Authorization': f'Bearer {OB_TOKEN}',
        'Ombre-MCP-Token': OB_TOKEN,
    }
    if session_id:
        headers['Mcp-Session-Id'] = session_id
    data = json.dumps(payload).encode()
    req = urllib.request.Request(f"{OB_URL}/mcp", data=data, headers=headers, method='POST')
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode(), {k.lower(): v for k, v in resp.headers.items()}


def _init_ob_session():
    """初始化 OB MCP 会话，返回 session_id。"""
    global _ob_session_id, _ob_call_id
    _ob_call_id += 1
    body, hdrs = _ob_post({
        "jsonrpc": "2.0", "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "xinchao-relay", "version": "1.0"}
        },
        "id": _ob_call_id
    })
    session_id = hdrs.get('mcp-session-id', '')
    # 握手第二步
    _ob_call_id += 1
    try:
        _ob_post({"jsonrpc": "2.0", "method": "notifications/initialized"}, session_id=session_id)
    except Exception:
        pass
    _ob_session_id = session_id
    return session_id


def call_ob_tool(tool_name, args=None):
    """调用 OB 工具，返回文本结果（失败返回 None）。"""
    global _ob_session_id, _ob_call_id
    if args is None:
        args = {}
    try:
        if not _ob_session_id:
            _init_ob_session()
        _ob_call_id += 1
        body, _ = _ob_post({
            "jsonrpc": "2.0", "method": "tools/call",
            "params": {"name": tool_name, "arguments": args},
            "id": _ob_call_id
        }, session_id=_ob_session_id)
        parsed = _parse_sse(body)
        if parsed and isinstance(parsed.get('result'), dict):
            content = parsed['result'].get('content', [])
            texts = [c['text'] for c in content if isinstance(c, dict) and c.get('type') == 'text']
            if texts:
                return '\n'.join(texts)
        return json.dumps(parsed, ensure_ascii=False) if parsed else None
    except Exception as e:
        _ob_session_id = None  # 出错重置，下次重连
        raise e


# ── HTTP 服务 ────────────────────────────────────────────────────────────────

class Handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_GET(self):
        # OB 健康检查
        if self.path in ("/ob/health", "/ob/health/"):
            try:
                req = urllib.request.Request(f"{OB_URL}/health")
                with urllib.request.urlopen(req, timeout=5) as r:
                    data = r.read()
                self.send_response(200)
                self._cors()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(data)
            except Exception as e:
                self.send_response(503)
                self._cors()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"ok": False, "error": str(e)}).encode())
            return

        # 状态读取（30s 轮询用）
        if self.path in ("/state", "/state/"):
            r = subprocess.run(
                ["docker", "exec", CONTAINER, "node", "-e", _STATE_SCRIPT],
                capture_output=True, text=True, timeout=15
            )
            if r.returncode != 0:
                self.send_response(500); self._cors(); self.end_headers()
                self.wfile.write(r.stderr.encode()); return
            raw  = json.loads(r.stdout)
            data = _format_state(raw)
            self.send_response(200)
            self._cors()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(data, ensure_ascii=False).encode())
            return

        # 小屋来信列表
        if self.path not in ("/notes", "/notes/"):
            self.send_response(404); self.end_headers(); return
        node_script = f"""
const fs = require('fs');
const p = {json.dumps(CABIN_PATH)};
try {{
  const c = JSON.parse(fs.readFileSync(p, 'utf8'));
  console.log(JSON.stringify(c.notes || []));
}} catch(e) {{ console.log('[]'); }}
"""
        r = subprocess.run(
            ["docker", "exec", CONTAINER, "node", "-e", node_script],
            capture_output=True, text=True, timeout=10
        )
        notes = r.stdout.strip() if r.returncode == 0 else "[]"
        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(notes.encode())

    def do_POST(self):
        # OB breath（记忆搜索）
        if self.path in ("/ob/breath", "/ob/breath/"):
            if self.headers.get("X-Secret") != SECRET:
                self.send_response(401); self._cors(); self.end_headers(); return
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length)) if length else {}
            query = body.get("query", "")
            try:
                args = {"query": query} if query else {}
                result = call_ob_tool("breath", args)
                self.send_response(200)
                self._cors()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"ok": True, "result": result}, ensure_ascii=False).encode())
            except Exception as e:
                self.send_response(500)
                self._cors()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"ok": False, "error": str(e)}).encode())
            return

        # OB hold（存入记忆）
        if self.path in ("/ob/hold", "/ob/hold/"):
            if self.headers.get("X-Secret") != SECRET:
                self.send_response(401); self._cors(); self.end_headers(); return
            length = int(self.headers.get("Content-Length", 0))
            try:
                body = json.loads(self.rfile.read(length))
            except Exception:
                self.send_response(400); self._cors(); self.end_headers(); return
            content = (body.get("content") or "").strip()
            if not content:
                self.send_response(400); self._cors(); self.end_headers(); return
            args = {"content": content}
            if body.get("emotion"):
                args["emotion"] = body["emotion"]
            if body.get("importance"):
                args["importance"] = body["importance"]
            try:
                result = call_ob_tool("hold", args)
                self.send_response(200)
                self._cors()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"ok": True, "result": result}, ensure_ascii=False).encode())
            except Exception as e:
                self.send_response(500)
                self._cors()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"ok": False, "error": str(e)}).encode())
            return

        # OB context（会话启动：breath + dream 合并，一步注入上下文）
        if self.path in ("/ob/context", "/ob/context/"):
            if self.headers.get("X-Secret") != SECRET:
                self.send_response(401); self._cors(); self.end_headers(); return
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length)) if length else {}
            query = (body.get("query") or "").strip()
            include_dream = body.get("dream", True)
            result = {}
            errors = []
            try:
                if query:
                    result["memories"] = call_ob_tool("breath", {"query": query})
            except Exception as e:
                errors.append(f"breath: {e}")
            try:
                if include_dream:
                    result["digest"] = call_ob_tool("dream", {})
            except Exception as e:
                errors.append(f"dream: {e}")
            self.send_response(200 if result else 500)
            self._cors()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(
                {"ok": bool(result), "result": result, "errors": errors},
                ensure_ascii=False
            ).encode())
            return

        # OB dream（会话开始自省）
        if self.path in ("/ob/dream", "/ob/dream/"):
            if self.headers.get("X-Secret") != SECRET:
                self.send_response(401); self._cors(); self.end_headers(); return
            try:
                result = call_ob_tool("dream", {})
                self.send_response(200)
                self._cors()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"ok": True, "result": result}, ensure_ascii=False).encode())
            except Exception as e:
                self.send_response(500)
                self._cors()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"ok": False, "error": str(e)}).encode())
            return

        # 小屋来信写入
        if self.path not in ("/note", "/note/"):
            self.send_response(404); self.end_headers(); return

        if self.headers.get("X-Secret") != SECRET:
            self.send_response(401)
            self._cors()
            self.end_headers()
            return

        length = int(self.headers.get("Content-Length", 0))
        try:
            body = json.loads(self.rfile.read(length))
        except Exception:
            self.send_response(400); self._cors(); self.end_headers(); return

        content  = (body.get("content") or "").strip()
        from_    = body.get("from", "user")
        locked   = bool(body.get("locked", False))
        event_id = body.get("eventId") or str(uuid.uuid4())

        if not content:
            self.send_response(400); self._cors(); self.end_headers(); return

        now = datetime.now(timezone.utc).isoformat()
        note = {
            "id":          f"note-{uuid.uuid4().hex[:16]}",
            "eventId":     event_id,
            "from":        from_,
            "content":     content,
            "locked":      locked,
            "unlockedAt":  None if locked else now,
            "createdAt":   now,
            "readAt":      None,
        }

        node_script = f"""
const fs = require('fs');
const p = {json.dumps(CABIN_PATH)};
const c = JSON.parse(fs.readFileSync(p, 'utf8'));
c.notes.unshift({json.dumps(note, ensure_ascii=False)});
fs.writeFileSync(p, JSON.stringify(c, null, 2));
console.log('OK');
"""
        r = subprocess.run(
            ["docker", "exec", CONTAINER, "node", "-e", node_script],
            capture_output=True, text=True, timeout=10
        )
        if r.returncode == 0 and r.stdout.strip() == "OK":
            self.send_response(200)
            self._cors()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"ok": True, "eventId": event_id}).encode())
        else:
            self.send_response(500)
            self._cors()
            self.end_headers()
            self.wfile.write(r.stderr.encode())

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Secret")

    def log_message(self, fmt, *args):
        from datetime import datetime
        print(f"[{datetime.now().isoformat()}] {fmt % args}", flush=True)

if __name__ == "__main__":
    print(f"[cabin-relay] listening on :{PORT}", flush=True)
    HTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
