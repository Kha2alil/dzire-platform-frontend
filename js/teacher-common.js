/* ═════════════════════════════════════════════════════════════════
   teacher-common.js – Shared utilities for all teacher pages
   (Real API notifications, sidebar toggle, charts, helpers)
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
  if (!container) return;
  const toast = document.createElement('div');
  const icons = { success: '✅', error: '❌', info: '🔔' };
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span class="toast-msg">${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
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

// ======================== NOTIFICATIONS (REAL API) ========================
const NOTIF_API = 'http://localhost:3000/api/notifications';

async function loadTeacherNotifications() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
        const res = await fetch(`${NOTIF_API}?limit=20`, {
            headers: { Authorization: `Bearer ${token.replace(/['"]+/g, '')}` }
        });
        if (!res.ok) throw new Error('Failed to fetch notifications');
        const data = await res.json();
        if (data.success) {
            renderTeacherNotifications(data.notifications || []);
        }
    } catch (err) {
        console.error('Teacher notifications fetch error:', err);
    }
}

function renderTeacherNotifications(notifications) {
    const list = document.getElementById('notifList');
    if (!list) return;

    if (notifications.length === 0) {
        list.innerHTML = '<div class="notif-item"><span style="color:var(--text-3)">No notifications</span></div>';
        updateNotifBadge(0);
        return;
    }

    list.innerHTML = notifications.map(n => `
        <div class="notif-item ${n.is_read ? '' : 'unread'}" data-id="${n.id}">
            <div class="notif-dot-small" style="background:${n.is_read ? 'transparent' : 'var(--red)'}"></div>
            <div class="notif-content" onclick="markTeacherNotifRead('${n.id}')">
                <div class="notif-msg"><strong>${escapeHtml(n.title)}</strong> ${escapeHtml(n.message)}</div>
                <div class="notif-ts">${timeAgo(n.created_at)}</div>
            </div>
        </div>
    `).join('');

    const unreadCount = notifications.filter(n => !n.is_read).length;
    updateNotifBadge(unreadCount);
}

function updateNotifBadge(count) {
    const badge = document.getElementById('notifBadge');
    if (badge) {
        badge.style.display = count > 0 ? 'block' : 'none';
        badge.textContent = count > 99 ? '99+' : count;
    }
}

async function markTeacherNotifRead(id) {
    try {
        const token = localStorage.getItem('token');
        await fetch(`${NOTIF_API}/${id}/read`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token.replace(/['"]+/g, '')}` }
        });
        loadTeacherNotifications();
    } catch (err) {
        console.error('Mark read failed:', err);
    }
}

async function clearAllTeacherNotifs() {
    try {
        const token = localStorage.getItem('token');
        await fetch(`${NOTIF_API}/read-all`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token.replace(/['"]+/g, '')}` }
        });
        loadTeacherNotifications();
    } catch (err) {
        console.error('Clear all failed:', err);
    }
}

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    const then = new Date(dateStr);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
            if (notifPanel.classList.contains('open')) loadTeacherNotifications();
        });
        document.addEventListener('click', (e) => {
            if (!notifBtn.contains(e.target)) notifPanel.classList.remove('open');
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', clearAllTeacherNotifs);
    }

    // Poll every 30 seconds
    setInterval(loadTeacherNotifications, 30000);
    // Initial load
    loadTeacherNotifications();
}

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

function renderFpListFromData(data, containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!data.length) {
        el.innerHTML = '<div class="empty-state">No data yet</div>';
        return;
    }
    const rankColors = ['var(--red)', 'var(--amber)', 'var(--blue-500)'];
    el.innerHTML = data.map((fp, idx) => `
        <div class="fp-item">
            <div class="fp-rank ${idx < 3 ? 'r'+(idx+1) : ''}">#${idx+1}</div>
            <div class="fp-info">
                <div class="fp-topic">${escapeHtml(fp.assessment_title)} (${escapeHtml(fp.course_title)})</div>
                <div class="fp-bar"><div class="fp-fill" style="width:${fp.failure_rate}%;background:${idx < 3 ? rankColors[idx] : 'var(--text-3)'}"></div></div>
            </div>
            <div class="fp-pct" style="color:${idx < 3 ? rankColors[idx] : 'var(--text-3)'}">${fp.failure_rate}%</div>
        </div>
    `).join('');
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

  // Notifications (real API)
  initNotificationPanel();

  // Subdomains dropdown (if modal exists)
  if (document.getElementById('newCourseSubdomain')) {
    fetchSubdomains().then(() => populateSubdomainDropdown());
  }
});