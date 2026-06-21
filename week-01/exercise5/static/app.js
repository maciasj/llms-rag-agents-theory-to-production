const messages = [];
let totalPrompt = 0;
let totalCompletion = 0;
let totalTokens = 0;

const input = document.getElementById('input');
const sendBtn = document.getElementById('send');
const messagesDiv = document.getElementById('messages');
const tokensDiv = document.getElementById('tokens');
const messagesJson = document.getElementById('messages-json');

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
  } else {
    bubble.textContent = content;
  }
  div.appendChild(bubble);
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function updateContextView() {
  tokensDiv.textContent = [
    `Prompt tokens: ${totalPrompt}`,
    `Completion tokens: ${totalCompletion}`,
    `Total tokens: ${totalTokens}`,
  ].join('\n');
  messagesJson.textContent = JSON.stringify(messages, null, 2);
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  sendBtn.disabled = true;

  addMessage('user', text);

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

sendBtn.addEventListener('click', sendMessage);
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});