// student-quests.js – Quests page with CodeMirror IDE
const API_STUDENT = 'http://localhost:3000/api/student';
const token = localStorage.getItem('token');
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

let allQuests = [];
let studentAttempts = {};
let currentQuest = null;
let editor = null;
let activeTab = 'all';

const LANGUAGE_EMOJI = {
  html: '🌐',
  css: '🎨',
  javascript: '⚡',
};

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize CodeMirror
  editor = CodeMirror.fromTextArea(document.getElementById('codeEditor'), {
    mode: 'xml',
    theme: 'dracula',
    lineNumbers: true,
    autoCloseTags: true,
    extraKeys: { 'Ctrl-Space': 'autocomplete' },
    tabSize: 2,
    indentUnit: 2,
    matchBrackets: true,
  });
  editor.setSize('100%', '300px');

  // Load data
  await Promise.all([loadQuests(), loadAttempts()]);
  renderQuests();

  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      activeTab = this.dataset.tab;
      renderQuests();
    });
  });
});

async function loadQuests() {
  try {
    const res = await axios.get(`${API_STUDENT}/quests`);
    allQuests = res.data.data || [];
    if (allQuests.length > 0) {
      document.getElementById('nav-quests-count').textContent = allQuests.length;
    }
  } catch (err) {
    console.error('Failed to load quests', err);
    showMessage('Could not load quests', 'error');
  }
}

async function loadAttempts() {
  try {
    const res = await axios.get(`${API_STUDENT}/assessments/my-attempts`);
    const attempts = res.data.data || [];
    studentAttempts = {};
    attempts.forEach(a => {
      // a.passed is 0 or 1 from MySQL, convert to boolean
      studentAttempts[a.assessment_id] = a.passed === 1 || a.passed === true;
    });
  } catch (err) {
    // If route doesn't exist, build attempts from quest submissions directly
    console.log('my-attempts route not available, checking quest submissions individually');
    await loadAttemptsFallback();
  }
}

// Fallback: check each quest's submission status directly
async function loadAttemptsFallback() {
  studentAttempts = {};
  for (const quest of allQuests) {
    try {
      const res = await axios.get(`${API_STUDENT}/assessments/${quest.id}`);
      const data = res.data.data;
      if (data && data.already_passed === true) {
        studentAttempts[quest.id] = true;
      }
    } catch (e) {
      // ignore individual errors
    }
  }
}

function getQuestStatus(q) {
  if (studentAttempts[q.id] === true) return 'completed';
  return 'active';
}

function renderQuests() {
  const grid = document.getElementById('questGrid');
  if (!allQuests.length) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-icon">⚔️</div><div class="empty-title">No quests available yet. Check back soon!</div></div>';
    return;
  }

  let filtered = allQuests;
  if (activeTab !== 'all') {
    filtered = allQuests.filter(q => getQuestStatus(q) === activeTab);
  }

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">⚔️</div><div class="empty-title">No ${activeTab} quests</div></div>`;
    return;
  }

  grid.innerHTML = filtered.map(q => {
    const status = getQuestStatus(q);
    const statusMap = {
      active:    { cls:'q-active',    badge:'badge-blue',  label:'Active'      },
      completed: { cls:'q-completed', badge:'badge-green', label:'Completed ✓' },
      locked:    { cls:'q-locked',    badge:'badge-red',   label:'🔒 Locked'   },
    };
    const s = statusMap[status] || statusMap.active;
    const emoji = LANGUAGE_EMOJI[q.language] || '⚔️';
    const pct = status === 'completed' ? 100 : 0;

    return `
      <div class="quest-card ${s.cls} q-boss" onclick="openQuest('${q.id}')">
        <div class="quest-card-top">
          <div class="quest-emoji">${emoji}</div>
          <div class="badge ${s.badge}">${s.label}</div>
        </div>
        <div class="quest-card-title">${escapeHtml(q.title)}</div>
        <div class="quest-card-desc">${escapeHtml(q.description)}</div>
        <div class="quest-progress-wrap">
          <div class="quest-progress-meta"><span>Progress</span><span>${status === 'completed' ? '1/1' : '0/1'} task</span></div>
          <div class="progress-bar"><div class="progress-fill ${status === 'completed' ? 'green' : ''}" style="width:${pct}%"></div></div>
        </div>
        <div class="quest-card-footer">
          <span class="quest-type-label">Coding Challenge</span>
          <span class="quest-xp">⚡ +${q.xp_reward || 0} XP</span>
        </div>
      </div>
    `;
  }).join('');

  // Update header badges
  const completedCount = allQuests.filter(q => getQuestStatus(q) === 'completed').length;
  const activeCount = allQuests.filter(q => getQuestStatus(q) === 'active').length;
  const totalXP = allQuests.reduce((sum, q) => sum + (getQuestStatus(q) === 'completed' ? (q.xp_reward || 0) : 0), 0);
  document.getElementById('xpEarnedBadge').innerHTML = `⚡ ${totalXP} XP earned`;
  document.getElementById('activeCountBadge').textContent = `${activeCount} Active`;
}

async function openQuest(questId) {
  const quest = allQuests.find(q => q.id === questId);
  if (!quest) {
    showMessage('Quest not found', 'error');
    return;
  }

  currentQuest = quest;

  // Hide the quest grid section
  const questPage = document.getElementById('page-quests');
  const questGrid = document.getElementById('questGrid');
  const sectionHeader = questPage.querySelector('.section-header');
  const tabs = questPage.querySelector('.tabs');
  
  if (questGrid) questGrid.style.display = 'none';
  if (sectionHeader) sectionHeader.style.display = 'none';
  if (tabs) tabs.style.display = 'none';

  // Show editor
  const questEditor = document.getElementById('questEditor');
  questEditor.classList.add('active');
  questEditor.style.display = 'block';

  document.getElementById('questDetails').innerHTML = `
    <h2>${escapeHtml(currentQuest.title)}</h2>
    <p>${escapeHtml(currentQuest.description)}</p>
    <p><strong>Language:</strong> ${currentQuest.language}</p>
    <button class="btn btn-amber" onclick="getAIHint()" style="margin-top:10px">🤖 Get AI Hint</button>
  `;

  let mode = 'xml';
  if (currentQuest.language === 'javascript') mode = 'javascript';
  else if (currentQuest.language === 'css') mode = 'css';
  editor.setOption('mode', mode);
  editor.setValue(currentQuest.starter_code || '');
  editor.refresh();

  document.getElementById('outputBox').innerHTML = '<em>Output will appear here...</em>';
  document.getElementById('feedbackBox').innerHTML = '';
}

function backToQuests() {
  const questPage = document.getElementById('page-quests');
  const questGrid = document.getElementById('questGrid');
  const sectionHeader = questPage.querySelector('.section-header');
  const tabs = questPage.querySelector('.tabs');
  const questEditor = document.getElementById('questEditor');

  if (questGrid) questGrid.style.display = 'grid';
  if (sectionHeader) sectionHeader.style.display = 'flex';
  if (tabs) tabs.style.display = 'flex';
  questEditor.classList.remove('active');
  questEditor.style.display = 'none';
  currentQuest = null;

  renderQuests();
}

async function runQuestCode() {
  if (!currentQuest) return;
  const code = editor.getValue();
  const language = currentQuest.language;
  const outputBox = document.getElementById('outputBox');

  if (language === 'html' || language === 'css') {
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    outputBox.innerHTML = `<iframe src="${url}" style="width:100%; height:150px; border:none"></iframe>`;
  } else {
    try {
      const res = await axios.post('https://onecompiler.com/api/code/exec', {
        language: 'javascript',
        code: code,
        stdin: ''
      });
      const output = res.data.stdout || res.data.output || 'No output';
      outputBox.innerHTML = `<pre>${escapeHtml(output)}</pre>`;
    } catch (e) {
      outputBox.innerHTML = '<p style="color:red">Execution error — try Submit instead</p>';
    }
  }
}

async function submitQuestCode() {
  if (!currentQuest) return;
  const code = editor.getValue();
  
  const submitBtn = document.getElementById('submitQuestBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ Grading...';
  
  try {
    const res = await axios.post(`${API_STUDENT}/quests/${currentQuest.id}/submit`, {
      code,
      language: currentQuest.language
    });
    const data = res.data.data;
    let html = '';
    if (data.passed) {
      html = `<div style="background:rgba(16,185,129,0.08);border:1px solid var(--green);border-radius:var(--radius-sm);padding:14px;margin-top:10px">
        <strong>🎉 Quest passed! Score: ${data.score} / 100</strong>
        <p style="margin-top:6px">${escapeHtml(data.ai_feedback || '')}</p>
        ${data.xp_gained > 0 ? `<p style="color:var(--amber);font-weight:600">+${data.xp_gained} XP!</p>` : ''}
      </div>`;
      // Mark as passed locally
      studentAttempts[currentQuest.id] = true;
      if (typeof updateXPBar === 'function') updateXPBar();
    } else {
      html = `<div style="background:rgba(245,158,11,0.08);border:1px solid var(--amber);border-radius:var(--radius-sm);padding:14px;margin-top:10px">
        <strong>⏳ Score: ${data.score} / 100</strong>
        <p style="margin-top:6px">${escapeHtml(data.ai_feedback || '')}</p>
      </div>`;
    }
    document.getElementById('feedbackBox').innerHTML = html;
  } catch (err) {
    console.error(err);
    showMessage('Submission failed', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '✅ Submit for Grading';
  }
}

async function getAIHint() {
  if (!currentQuest) return;

  const code = editor.getValue();
  const language = currentQuest.language;

  document.getElementById('feedbackBox').innerHTML = '<p style="color:var(--amber)">🤖 AI is thinking...</p>';

  try {
    const res = await axios.post(`${API_STUDENT}/quests/${currentQuest.id}/hint`, {
      code,
      language
    });
    const data = res.data.data;
    document.getElementById('feedbackBox').innerHTML = `
      <div style="background:rgba(245,158,11,0.08);border:1px solid var(--amber);border-radius:var(--radius-sm);padding:14px;margin-top:10px">
        <strong>🤖 AI Hint:</strong>
        <p style="margin-top:6px">${escapeHtml(data.hint)}</p>
      </div>
    `;
  } catch (err) {
    console.error('AI hint failed:', err);
    document.getElementById('feedbackBox').innerHTML = '<p style="color:red">Could not get hint. Try again later.</p>';
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function showMessage(msg, type) {
  if (typeof showToast === 'function') showToast(msg, type);
  else alert(msg);
}