const BASE = import.meta.env.VITE_API_URL || '/api';

export async function getSessions() {
  const r = await fetch(`${BASE}/chat/sessions`);
  return r.json();
}

export async function createSession(name) {
  const r = await fetch(`${BASE}/chat/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return r.json();
}

export async function getMessages(sessionId) {
  const r = await fetch(`${BASE}/chat/sessions/${sessionId}/messages`);
  return r.json();
}

export async function getState() {
  const r = await fetch(`${BASE}/chat/state`);
  return r.json();
}

// 流式发送消息，onDelta(text) 每片段回调
export async function sendMessage(sessionId, content, onDelta) {
  const resp = await fetch(`${BASE}/chat/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(err.error || '发送失败');
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    let shouldBreak = false;
    for (const line of lines) {
      if (line === 'event: done') { shouldBreak = true; continue; }
      if (line.startsWith('event: ')) continue;
      if (!line.startsWith('data: ')) continue;

      try {
        const data = JSON.parse(line.slice(6));
        if (data.text) {
          fullContent += data.text;
          onDelta(data.text);
        }
        if (data.message) throw new Error(data.message);
      } catch (e) {
        if (e.message !== 'Unexpected end of JSON input') throw e;
      }
    }
    if (shouldBreak) break;
  }

  return fullContent;
}
