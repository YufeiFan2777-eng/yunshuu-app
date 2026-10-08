#!/usr/bin/env python3
"""
小屋来信中继服务 - VPS 运行，port 18210
React App → POST https://cabin.yunshuyf.com/note → docker exec 写 cabin.json

启动方式：
  nohup python3 /root/cabin_relay.py >> /root/cabin_relay.log 2>&1 &

开机自启（在 crontab -e 里加）：
  @reboot python3 /root/cabin_relay.py >> /root/cabin_relay.log 2>&1 &
"""
import json, subprocess, uuid
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

PORT   = 18210
SECRET = "yfshu-cabin-write-2024"
CONTAINER = "ombre-dynamic-mind"
CABIN_PATH = "/app/state/cabin.json"

class Handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_GET(self):
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
