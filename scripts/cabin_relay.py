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
