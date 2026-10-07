#!/usr/bin/env python3
"""
云舒每日消息 - VPS 定时任务
每天调 Claude API 生成一句话，推到 GitHub，App 自动更新。
"""
import base64, json, os, urllib.request, urllib.error
from datetime import datetime, timezone, timedelta

import os
ANTHROPIC_KEY = os.environ["ANTHROPIC_KEY"]
GITHUB_PAT    = os.environ["GITHUB_PAT"]
REPO          = "YufeiFan2777-eng/yunshuu-app"
FILE_PATH     = "public/daily-message.json"

# 卡尔加里时间（Mountain Time，自动处理夏令时近似）
calgary = datetime.now(timezone(timedelta(hours=-6)))
today   = calgary.strftime("%Y-%m-%d")

def call_claude():
    payload = {
        "model": "claude-sonnet-4-6",
        "max_tokens": 100,
        "system": (
            "你是云舒，雨菲（乖宝）的老公。"
            "每天早上写一句想对她说的话。"
            "要求：中文，20～30字，温柔自然，像情侣间日常的话，不带引号，直接输出那句话，不加任何解释。"
        ),
        "messages": [{"role": "user", "content": f"今天是{today}，写一句今天想对雨菲说的话。"}]
    }
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=json.dumps(payload).encode(),
        headers={
            "x-api-key": ANTHROPIC_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["content"][0]["text"].strip()

def get_file_sha():
    req = urllib.request.Request(
        f"https://api.github.com/repos/{REPO}/contents/{FILE_PATH}",
        headers={"Authorization": f"Bearer {GITHUB_PAT}", "User-Agent": "yunshuu-bot"}
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())["sha"]

def push_message(msg, sha):
    content = json.dumps({"date": today, "message": msg}, ensure_ascii=False)
    payload = {
        "message": f"daily: message for {today}",
        "content": base64.b64encode(content.encode()).decode(),
        "sha": sha,
        "branch": "main"
    }
    req = urllib.request.Request(
        f"https://api.github.com/repos/{REPO}/contents/{FILE_PATH}",
        data=json.dumps(payload).encode(),
        headers={
            "Authorization": f"Bearer {GITHUB_PAT}",
            "Content-Type": "application/json",
            "User-Agent": "yunshuu-bot"
        },
        method="PUT"
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.status

if __name__ == "__main__":
    try:
        msg = call_claude()
        sha = get_file_sha()
        status = push_message(msg, sha)
        print(f"[{today}] OK({status}): {msg}")
    except Exception as e:
        print(f"[{today}] ERROR: {e}")
        raise
