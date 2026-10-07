#!/usr/bin/env python3
"""
心潮状态推送 - VPS 定时任务
每 5 分钟拉取心潮状态，推到 GitHub，App 自动更新。

使用前：
1. 运行 `cat /root/xinchao-nian/.env` 确认 MACHINE_TOKEN 变量名
2. 把 token 加入 /root/daily_message_env：
     export XINCHAO_MACHINE_TOKEN="your_token_here"
3. 把本文件复制到 VPS：/root/xinchao_push.py
4. 在 crontab 添加（每 5 分钟）：
     */5 * * * * . /root/daily_message_env && python3 /root/xinchao_push.py >> /root/xinchao_push.log 2>&1
"""
import base64, json, os, urllib.request, urllib.error
from datetime import datetime, timezone

MACHINE_TOKEN = os.environ["XINCHAO_MACHINE_TOKEN"]
GITHUB_PAT    = os.environ["GITHUB_PAT"]
REPO          = "YufeiFan2777-eng/yunshuu-app"
FILE_PATH     = "public/xinchao-state.json"

# 如果实际端口/路径不同，改这里
XINCHAO_API   = "http://localhost:18110/api/state"

def get_xinchao_state():
    req = urllib.request.Request(
        XINCHAO_API,
        headers={"Authorization": f"Bearer {MACHINE_TOKEN}"}
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())

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

def push_state(raw, sha):
    now = datetime.now(timezone.utc).isoformat()
    data = {
        "updatedAt": now,
        "consciousness": raw.get("consciousness"),
        "fatigue": raw.get("fatigue", 0),
        "emotion": raw.get("emotion", {}),
        "topDrives": raw.get("topDrives", []),
        "thoughts": raw.get("thoughts", {}),
    }
    content = json.dumps(data, ensure_ascii=False, indent=2)
    payload = {
        "message": f"xinchao: state {now[:16]}",
        "content": base64.b64encode(content.encode()).decode(),
        "branch": "main",
    }
    if sha:
        payload["sha"] = sha
    req = urllib.request.Request(
        f"https://api.github.com/repos/{REPO}/contents/{FILE_PATH}",
        data=json.dumps(payload).encode(),
        headers={
            "Authorization": f"Bearer {GITHUB_PAT}",
            "Content-Type": "application/json",
            "User-Agent": "xinchao-bot",
        },
        method="PUT",
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.status

if __name__ == "__main__":
    try:
        raw   = get_xinchao_state()
        sha   = get_file_sha()
        status = push_state(raw, sha)
        print(f"[{datetime.now().isoformat()}] OK({status}): {raw.get('consciousness')} / {raw.get('emotion', {}).get('label')}")
    except Exception as e:
        print(f"[{datetime.now().isoformat()}] ERROR: {e}")
        raise
