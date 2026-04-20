/* ═════════════════════════════════════════════════════════════════
   teacher-common.js – Shared utilities for all teacher pages
   (Fixed: sidebar toggle, notifications rendering)
═════════════════════════════════════════════════════════════════ */

// ======================== MOBILE SIDEBAR TOGGLE ========================
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.toggle('mobile-open');
  if (overlay) overlay.classList.toggle('active');
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.remove('mobile-open');
  if (overlay) overlay.classList.remove('active');
}

// ======================== API HELPERS ========================
const API_BASE = 'http://localhost:3000/api';

async function apiCall(method, endpoint, body = null) {
  try {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token.replace(/['"]+/g, '')}`;
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    return await res.json();
  } catch (err) {
    console.error('API error:', err);
    return { success: false, message: err.message };
  }
}

async function apiUpload(endpoint, formData) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: formData
    });
    return await res.json();
  } catch (err) {
    console.error('Upload error:', err);
    return { success: false, message: err.message };
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function getInitials(fullName) {
  if (!fullName) return '';
  return fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ======================== TOAST ========================
function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span><span class="toast-msg">${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'none';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ======================== MODALS ========================
function openModal(id) {
  const modal = document.getElementById(`modal-${id}`);
  if (modal) modal.classList.add('open');
  if (id === 'newCourse' && typeof populateSubdomainDropdown === 'function') populateSubdomainDropdown();
}

function closeModal(id) {
  const modal = document.getElementById(`modal-${id}`);
  if (modal) modal.classList.remove('open');
}

// Close modal when clicking outside
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
});

// ======================== NOTIFICATIONS ========================
const NOTIFICATIONS = [
  { dot: 'var(--green)', msg: '<strong>Ahmed M.</strong> passed the Full-Stack Boss Exam', time: '2 min ago', unread: true },
  { dot: 'var(--red)', msg: '<strong>Lina K.</strong> has failed Async/Await 3 times — remedial needed', time: '14 min ago', unread: true },
  { dot: 'var(--blue-400)', msg: 'Your course <strong>Node.js & PostgreSQL</strong> is awaiting approval', time: '1 hr ago', unread: true },
  { dot: 'var(--amber)', msg: 'New enrollment in <strong>CSS & Tailwind Deep Dive</strong>', time: '3 hr ago', unread: false },
  { dot: 'var(--purple)', msg: 'Weekly analytics report is ready to view', time: 'Yesterday', unread: false },
];

function renderNotifications() {
  const list = document.getElementById('notifList');
  if (!list) return;
  list.innerHTML = NOTIFICATIONS.map(n => `
    <div class="notif-item ${n.unread ? 'unread' : ''}" onclick="markRead(this)">
      <div class="notif-dot-small" style="background:${n.dot}"></div>
      <div class="notif-content">
        <div class="notif-msg">${n.msg}</div>
        <div class="notif-ts">${n.time}</div>
      </div>
    </div>
  `).join('');
  updateBadge();
}

function updateBadge() {
  const badge = document.getElementById('notifBadge');
  if (!badge) return;
  const unread = NOTIFICATIONS.filter(n => n.unread).length;
  badge.style.display = unread > 0 ? 'block' : 'none';
}

window.markRead = function(el) {
  el.classList.remove('unread');
  const idx = [...document.getElementById('notifList').children].indexOf(el);
  if (NOTIFICATIONS[idx]) NOTIFICATIONS[idx].unread = false;
  updateBadge();
};

// ======================== SIDEBAR TOGGLE (Desktop) ========================
function initSidebarToggle() {
  const sidebar = document.getElementById('sidebar');
  const mainEl = document.getElementById('main');
  const toggleBtn = document.getElementById('sidebarToggle');
  if (!sidebar || !mainEl || !toggleBtn) return;
  let collapsed = false;
  toggleBtn.addEventListener('click', () => {
    collapsed = !collapsed;
    sidebar.classList.toggle('collapsed', collapsed);
    mainEl.classList.toggle('expanded', collapsed);
    toggleBtn.textContent = collapsed ? '▶' : '◀';
  });
}

// ======================== NOTIFICATION PANEL BEHAVIOUR ========================
function initNotificationPanel() {
  const notifBtn = document.getElementById('notifBtn');
  const notifPanel = document.getElementById('notifPanel');
  const clearBtn = document.getElementById('clearNotif');
  if (notifBtn && notifPanel) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifPanel.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!notifBtn.contains(e.target)) notifPanel.classList.remove('open');
    });
  }
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      NOTIFICATIONS.forEach(n => n.unread = false);
      document.querySelectorAll('.notif-item').forEach(el => el.classList.remove('unread'));
      updateBadge();
    });
  }
}

// ======================== CHART HELPER ========================
function renderChart(containerId, values, labels) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const max = Math.max(...values);
  el.innerHTML = values.map((v, i) => `
    <div class="bar-col">
      <div class="bar" style="height:${Math.max(6, (v / max) * 100)}%">
        <div class="bar-tip">${v}</div>
      </div>
      <div class="bar-lbl">${labels[i]}</div>
    </div>
  `).join('');
}

// ======================== SUBDOMAINS ========================
let subdomainsList = [];
async function fetchSubdomains() {
  try {
    const data = await apiCall('GET', '/subdomains');
    if (data && data.success) subdomainsList = data.subdomains || [];
    return subdomainsList;
  } catch (err) { return []; }
}
function populateSubdomainDropdown() {
  const select = document.getElementById('newCourseSubdomain');
  if (!select) return;
  select.innerHTML = '<option value="">Select a subdomain</option>';
  subdomainsList.forEach(sd => {
    const opt = document.createElement('option');
    opt.value = sd.id;
    opt.textContent = sd.name;
    select.appendChild(opt);
  });
}

// ======================== OPEN COURSE BUILDER ========================
async function openCourseBuilder(courseId) {
  if (!courseId) {
    showToast('Course ID is missing', 'error');
    return;
  }
  window.location.href = `teacher-course-builder.html?courseId=${courseId}`;
}

// ======================== INITIALISE EVERYTHING ON PAGE LOAD ========================
document.addEventListener('DOMContentLoaded', function() {
  // Mobile sidebar (hamburger)
  const hamburger = document.getElementById('hamburgerBtn');
  const overlay = document.getElementById('sidebarOverlay');
  if (hamburger) hamburger.addEventListener('click', toggleSidebar);
  if (overlay) overlay.addEventListener('click', closeSidebar);

  // Desktop sidebar toggle
  initSidebarToggle();

  // Notifications
  renderNotifications();
  initNotificationPanel();

  // Subdomains dropdown (if modal exists)
  if (document.getElementById('newCourseSubdomain')) {
    fetchSubdomains().then(() => populateSubdomainDropdown());
  }
});