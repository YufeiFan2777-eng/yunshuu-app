#!/usr/bin/env python3
"""
心潮状态推送 - VPS 定时任务
每 5 分钟从 ombre-dynamic-mind 容器读取 state.json，推到 GitHub，App 自动更新。

使用前：
1. 确认容器名：docker ps | grep ombre-dynamic-mind
2. 把 GITHUB_PAT 加入 /root/daily_message_env：
     export GITHUB_PAT="your_pat_here"
3. 把本文件复制到 VPS：/root/xinchao_push.py
4. 在 crontab 添加（每 5 分钟）：
     */5 * * * * . /root/daily_message_env && python3 /root/xinchao_push.py >> /root/xinchao_push.log 2>&1
"""
import base64, json, os, subprocess, urllib.request, urllib.error
from datetime import datetime, timezone

GITHUB_PAT = os.environ["GITHUB_PAT"]
REPO       = "YufeiFan2777-eng/yunshuu-app"
FILE_PATH  = "public/xinchao-state.json"
CONTAINER  = "ombre-dynamic-mind"

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

_NODE_SCRIPT = r"""
const fs = require('fs');
try {
  const d = JSON.parse(fs.readFileSync('/app/state/state.json', 'utf8'));
  const aw = d.awareness || {};
  const tp = d.thoughtPool || {};
  console.log(JSON.stringify({
    consciousness: aw.state || aw.level || aw.consciousness || aw.mode || 'awake',
    fatigue: typeof d.fatigue === 'number' ? d.fatigue : 0,
    emotion: d.emotion || {},
    axes: d.axes || {},
    flash: tp.flash || [],
    obsessions: tp.obsessions || [],
    interactionRecent: (d.interactionRecent || []).slice(0, 6),
    bridgeDeliveries: (() => { try { const bq=JSON.parse(fs.readFileSync('/app/state/bridge-queue.json','utf8')); return (bq.deliveries||[]).filter(x=>x.status==='pending').slice(0,5); } catch(e){return [];} })(),
    cabinNotes: (() => { try { const cb=JSON.parse(fs.readFileSync('/app/state/cabin.json','utf8')); return (cb.notes||[]).slice(0,3); } catch(e){return [];} })(),
  }));
} catch(e) { process.stderr.write('ERROR: ' + e.message + '\n'); process.exit(1); }
"""

def read_container_state():
    r = subprocess.run(
        ["docker", "exec", CONTAINER, "node", "-e", _NODE_SCRIPT],
        capture_output=True, text=True, timeout=15
    )
    if r.returncode != 0:
        raise RuntimeError(f"docker exec failed: {r.stderr.strip()}")
    return json.loads(r.stdout)

def format_state(raw):
    axes = raw.get("axes", {})
    top_drives = []
    def _val(v):
        if isinstance(v, dict):
            return float(v.get("value", 0) or 0)
        try:
            return float(v)
        except (TypeError, ValueError):
            return 0.0

    # Only include the 11 drives defined in DRIVE_LABELS (exact match with xinchaomind.uk)
    for key, default_label in DRIVE_LABELS.items():
        val = axes.get(key, 0)
        if isinstance(val, dict):
            label = val.get("label") or default_label
        else:
            label = default_label
        top_drives.append({"key": key, "label": label, "value": round(_val(val), 4)})
    top_drives.sort(key=lambda x: x["value"], reverse=True)

    flash_out = []
    for f in raw.get("flash", []):
        if isinstance(f, dict):
            key = f.get("key", "")
            flash_out.append({
                "key":       key,
                "label":     DRIVE_LABELS.get(key, key),
                "text":      f.get("text", ""),
                "intensity": round(float(f.get("intensity", 0) or 0), 4),
                "age":       f.get("age", 0),
            })

    interactions_out = []
    for ix in raw.get("interactionRecent", []):
        if isinstance(ix, str):
            interactions_out.append({"at": ix})
        elif isinstance(ix, dict):
            interactions_out.append({
                "at":   ix.get("at") or ix.get("timestamp") or "",
                "type": ix.get("type") or "",
                "note": ix.get("note") or ix.get("text") or "",
            })

    return {
        "updatedAt":   datetime.now(timezone.utc).isoformat(),
        "consciousness": raw.get("consciousness", "awake"),
        "fatigue":     raw.get("fatigue", 0),
        "emotion":     raw.get("emotion", {}),
        "topDrives":   top_drives,
        "thoughts": {
            "flash":      flash_out,
            "obsessions": raw.get("obsessions", []),
        },
        "interactions": interactions_out,
        "bridge": [
            {
                "message": x.get("message", ""),
                "reason":  x.get("reason", ""),
                "at":      x.get("createdAt", ""),
            }
            for x in raw.get("bridgeDeliveries", [])
            if isinstance(x, dict)
        ],
        "cabin": [
            {
                "from":    x.get("from", ""),
                "content": x.get("content", ""),
                "eventId": x.get("eventId", ""),
            }
            for x in raw.get("cabinNotes", [])
            if isinstance(x, dict)
        ],
    }

def get_file_sha():
    req = urllib.request.Request(
        f"https://api.github.com/repos/{REPO}/contents/{FILE_PATH}",
        headers={"Authorization": f"Bearer {GITHUB_PAT}", "User-Agent": "xinchao-bot"}
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read())["sha"]
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise

def push_state(data, sha):
    content = json.dumps(data, ensure_ascii=False, indent=2)
    payload = {
        "message": f"xinchao: state {data['updatedAt'][:16]}",
        "content": base64.b64encode(content.encode()).decode(),
        "branch":  "main",
    }
    if sha:
        payload["sha"] = sha
    req = urllib.request.Request(
        f"https://api.github.com/repos/{REPO}/contents/{FILE_PATH}",
        data=json.dumps(payload).encode(),
        headers={
            "Authorization": f"Bearer {GITHUB_PAT}",
            "Content-Type":  "application/json",
            "User-Agent":    "xinchao-bot",
        },
        method="PUT",
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.status

if __name__ == "__main__":
    try:
        raw    = read_container_state()
        data   = format_state(raw)
        sha    = get_file_sha()
        status = push_state(data, sha)
        ts = datetime.now().isoformat()
        print(f"[{ts}] OK({status}): {data['consciousness']} / {data['emotion'].get('label')}")
    except Exception as e:
        print(f"[{datetime.now().isoformat()}] ERROR: {e}")
        raise
