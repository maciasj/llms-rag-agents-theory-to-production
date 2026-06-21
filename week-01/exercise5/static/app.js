const messages = [];
let totalPrompt = 0;
let totalCompletion = 0;
let totalTokens = 0;
let streaming = true;
let attachedImage = null;

const input = document.getElementById('input');
const sendBtn = document.getElementById('send');
const messagesDiv = document.getElementById('messages');
const tokensDiv = document.getElementById('tokens');
const messagesJson = document.getElementById('messages-json');
const streamToggle = document.getElementById('stream-toggle');
const imageBtn = document.getElementById('image-btn');
const imageInput = document.getElementById('image-input');
const imagePreview = document.getElementById('image-preview');

imageBtn.addEventListener('click', () => imageInput.click());
imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    attachedImage = reader.result;
    imagePreview.innerHTML = `<img src="${attachedImage}"><button id="remove-image">&times;</button>`;
    imagePreview.querySelector('#remove-image').onclick = () => {
      attachedImage = null;
      imagePreview.innerHTML = '';
      imageInput.value = '';
    };
  };
  reader.readAsDataURL(file);
});

function userContent(text) {
  if (!attachedImage) return text;
  const parts = [{ type: 'text', text }];
  parts.push({ type: 'image_url', image_url: { url: attachedImage } });
  return parts;
}

function addMessage(role, content) {
  messages.push({ role, content });
  renderMessage(role, content);
  updateContextView();
}

function renderMessage(role, content) {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  if (role === 'assistant') {
    bubble.innerHTML = marked.parse(content);
  } else if (typeof content === 'string') {
    bubble.textContent = content;
  } else {
    let html = '';
    for (const part of content) {
      if (part.type === 'text') html += marked.parse(part.text);
      if (part.type === 'image_url') html += `<img src="${part.image_url.url}" class="chat-image">`;
    }
    bubble.innerHTML = html;
  }
  div.appendChild(bubble);
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function truncateForDisplay(obj) {
  return JSON.parse(JSON.stringify(obj, (key, val) => {
    if (typeof val === 'string' && val.length > 120 && val.startsWith('data:image')) {
      return val.slice(0, 80) + '…[base64 truncated]…' + val.slice(-40);
    }
    return val;
  }));
}

function updateContextView() {
  tokensDiv.textContent = [
    `Prompt tokens: ${totalPrompt}`,
    `Completion tokens: ${totalCompletion}`,
    `Total tokens: ${totalTokens}`,
  ].join('\n');
  messagesJson.textContent = JSON.stringify(truncateForDisplay(messages), null, 2);
}

function parseSSE(buffer) {
  const events = [];
  const parts = buffer.split('\n\n');
  for (let i = 0; i < parts.length - 1; i++) {
    const line = parts[i].trim();
    if (line.startsWith('data: ')) {
      try {
        events.push(JSON.parse(line.slice(6)));
      } catch (e) {}
    }
  }
  return { events, remainder: parts[parts.length - 1] };
}

function clearAttachedImage() {
  attachedImage = null;
  imagePreview.innerHTML = '';
  imageInput.value = '';
}

async function sendMessageStream(content) {
  input.value = '';
  sendBtn.disabled = true;

  messages.push({ role: 'user', content });
  renderMessage('user', content);
  clearAttachedImage();
  updateContextView();

  const assistantDiv = document.createElement('div');
  assistantDiv.className = 'message assistant';
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  assistantDiv.appendChild(bubble);
  messagesDiv.appendChild(assistantDiv);

  let fullContent = '';
  let buffer = '';

  try {
    const resp = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      bubble.textContent = `Error: ${resp.status} — ${detail}`;
      messages.push({ role: 'assistant', content: `Error: ${resp.status} — ${detail}` });
      updateContextView();
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const { events, remainder } = parseSSE(buffer);
      buffer = remainder;

      for (const event of events) {
        if (event.token) {
          fullContent += event.token;
          bubble.innerHTML = marked.parse(fullContent);
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
        if (event.done && event.usage) {
          totalPrompt = event.usage.prompt_tokens || 0;
          totalCompletion = event.usage.completion_tokens || 0;
          totalTokens = event.usage.total_tokens || 0;
        }
        if (event.error) {
          bubble.textContent = `Error: ${event.error} — ${event.detail}`;
        }
      }
    }

    messages.push({ role: 'assistant', content: fullContent });
    updateContextView();
  } catch (err) {
    bubble.textContent = `Network error: ${err.message}`;
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
}

async function sendMessageBaseline(content) {
  input.value = '';
  sendBtn.disabled = true;

  messages.push({ role: 'user', content });
  renderMessage('user', content);
  clearAttachedImage();
  updateContextView();

  try {
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      addMessage('assistant', `**Error**: ${resp.status} — ${detail}`);
      return;
    }

    const data = await resp.json();
    totalPrompt = data.usage.prompt_tokens;
    totalCompletion = data.usage.completion_tokens;
    totalTokens = data.usage.total_tokens;
    addMessage('assistant', data.reply);
  } catch (err) {
    addMessage('assistant', `**Network error**: ${err.message}`);
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text && !attachedImage) return;

  const content = userContent(text || '');

  if (streaming) {
    await sendMessageStream(content);
  } else {
    await sendMessageBaseline(content);
  }
}

streamToggle.addEventListener('change', () => {
  streaming = streamToggle.checked;
});

sendBtn.addEventListener('click', sendMessage);
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});