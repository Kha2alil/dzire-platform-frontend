(function() {
  const API_BASE = 'http://localhost:3000';

  // Only run on student pages (skip if no token)
  const token = localStorage.getItem('token');
  if (!token) return;

  // ── Build a storage key unique to the current student ─────
  let STORAGE_KEY = 'dzire_chat_messages';
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      STORAGE_KEY = `dzire_chat_messages_${user.id}`;
    }
  } catch (e) {}

  // ── Load saved messages or start fresh ──
  let messages = [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) messages = JSON.parse(saved);
  } catch (e) {
    messages = [];
  }

  // ── Create DOM elements ──
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'chatToggleBtn';
  toggleBtn.textContent = '⁉️';
  document.body.appendChild(toggleBtn);

  const panel = document.createElement('div');
  panel.id = 'chatPanel';
  panel.innerHTML = `
    <div class="chat-header">
      <span>⚡ Dzire Assistant</span>
      <div class="chat-header-actions">
        <button id="chatClear" title="Clear conversation">🗑️</button>
        <button id="chatClose" title="Close">✕</button>
      </div>
    </div>
    <div class="chat-messages" id="chatMessages">
    </div>
    <div class="chat-input-area">
      <input type="text" id="chatInput" placeholder="> Type a question..." />
      <button id="chatSend">Send</button>
    </div>
  `;
  document.body.appendChild(panel);

  // ── Elements references ──
  const closeBtn   = panel.querySelector('#chatClose');
  const clearBtn   = panel.querySelector('#chatClear');
  const messagesEl = panel.querySelector('#chatMessages');
  const inputEl    = panel.querySelector('#chatInput');
  const sendBtn    = panel.querySelector('#chatSend');

  // ── Render messages from storage ──
  function renderMessages() {
    messagesEl.innerHTML = '';
    if (messages.length === 0) {
      messagesEl.innerHTML = '<div class="chat-message bot">👋 Hello! Ask me anything about the platform.</div>';
      return;
    }
    messages.forEach(m => {
      const div = document.createElement('div');
      div.className = `chat-message ${m.sender}`;
      div.textContent = m.text;
      messagesEl.appendChild(div);
    });
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  renderMessages();

  // ── Save messages to localStorage ──
  function saveMessages() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }

  // ── Toggle panel ──
  toggleBtn.addEventListener('click', () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) inputEl.focus();
  });

  closeBtn.addEventListener('click', () => {
    panel.classList.remove('open');
  });

  // ── Clear conversation ──
  clearBtn.addEventListener('click', () => {
    messages = [];
    saveMessages();
    renderMessages();
    inputEl.focus();
  });

  // ── Send message ──
  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;

    // Add user message
    messages.push({ sender: 'user', text });
    saveMessages();
    renderMessages();
    inputEl.value = '';

    // Show typing indicator
    messages.push({ sender: 'bot', text: '...', isTyping: true });
    saveMessages();
    renderMessages();

    try {
      const res = await fetch(`${API_BASE}/api/chat/faq`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();

      // Remove typing indicator
      messages = messages.filter(m => !m.isTyping);

      if (data.success) {
        messages.push({ sender: 'bot', text: data.response });
      } else {
        messages.push({ sender: 'bot', text: data.response || 'Something went wrong.' });
      }
      saveMessages();
      renderMessages();
    } catch (err) {
      // Remove typing indicator
      messages = messages.filter(m => !m.isTyping);
      messages.push({ sender: 'bot', text: '⚠️ Could not reach the assistant. Please try again.' });
      saveMessages();
      renderMessages();
    }
  }

  // ── Event listeners ──
  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
})();