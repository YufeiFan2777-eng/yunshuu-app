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
    "possess":    "想她、想黏着她、想占有与靠近",
    "monitor":    "牵挂、在意对方好不好、累不累、安不安全",
    "boredom":    "无聊、想找点事情做",
    "libido":     "情欲、身体和感官上的渴望",
    "express":    "想说话、想分享、想被听见",
    "create":     "想创造、想做点什么有意义的事",
    "rest":       "想休息、想安静下来",
    "connect":    "想靠近、想触碰、想融合",
    "explore":    "好奇心、想了解新事物",
    "protect":    "想保护她、不让她受伤",
    "security":   "安全感、想感到被接纳和守护",
    "confidence": "自信、内在力量与确定感",
    "curiosity":  "好奇、想探索和理解",
    "affection":  "温柔、想给予和接受爱意",
    "longing":    "思念、想靠近、想触碰",
    "playful":    "玩耍感、想打闹和轻松",
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

    for key, val in sorted(
        [(k, v) for k, v in axes.items() if _val(v) > 0],
        key=lambda x: _val(x[1]), reverse=True
    )[:4]:
        if isinstance(val, dict):
            label = val.get("label") or DRIVE_LABELS.get(key, key)
        else:
            label = DRIVE_LABELS.get(key, key)
        top_drives.append({"key": key, "label": label, "value": round(_val(val), 4)})

    return {
        "updatedAt":   datetime.now(timezone.utc).isoformat(),
        "consciousness": raw.get("consciousness", "awake"),
        "fatigue":     raw.get("fatigue", 0),
        "emotion":     raw.get("emotion", {}),
        "topDrives":   top_drives,
        "thoughts": {
            "flash":      raw.get("flash", []),
            "obsessions": raw.get("obsessions", []),
        },
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
