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
  if (!r.ok) throw new Error(`getMessages failed: ${r.status}`);
  return r.json();
}

export async function getState() {
  const r = await fetch(`${BASE}/chat/state`);
  return r.json();
}

export async function getVitals() {
  const r = await fetch(`${BASE}/vitals`);
  return r.json();
}

// 流式发送消息，onDelta(text) 每片段回调，onEvent(type, data) 工具调用事件回调
export async function sendMessage(sessionId, content, onDelta, onEvent) {
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
    let doneSent = false;
    let currentEvent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      let shouldBreak = false;
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim();
          if (currentEvent === 'done') { doneSent = true; shouldBreak = true; }
          continue;
        }
        if (line === '') { currentEvent = ''; continue; }
        if (!line.startsWith('data: ')) continue;

        try {
          const data = JSON.parse(line.slice(6));
          if (!currentEvent || currentEvent === 'delta') {
            if (data.text) { fullContent += data.text; onDelta(data.text); }
            if (data.message) throw new Error(data.message);
          } else if (currentEvent === 'error') {
            if (data.message) throw new Error(data.message);
          } else if (onEvent) {
            onEvent(currentEvent, data);
          }
        } catch (e) {
          if (e.message !== 'Unexpected end of JSON input') throw e;
        }
        currentEvent = '';
      }
      if (shouldBreak) break;
    }

  return { content: fullContent, doneSent };
}
