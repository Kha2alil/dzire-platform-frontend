/* ═══════════════════════════════════════════════════════════════
   teacher-dashboard.js – Fully dynamic: stats, activity, failure points
   ═══════════════════════════════════════════════════════════════ */

let allCourses = [];

// ── 1. Fetch courses ─────────────────────────────────────────────
async function fetchCourses() {
  try {
    const data = await apiCall('GET', '/courses');
    if (data && data.success) {
      allCourses = data.data.courses || [];
      return allCourses;
    } else return [];
  } catch (err) { return []; }
}

// ── 2. Fetch total students ──────────────────────────────────────
async function fetchTotalStudents() {
  try {
    const response = await apiCall('GET', '/courses/student-count');
    if (response && response.success && response.data) {
      return response.data.totalStudents || response.data.studentCount || 0;
    }
    return null;
  } catch (err) {
    console.error('Error fetching total students:', err);
    return null;
  }
}

// ── 3. Fetch failure points count ────────────────────────────────
async function fetchFailurePointsCount() {
  try {
    const res = await apiCall('GET', '/teacher/failure-points/count');
    if (res && res.success) return res.count;
  } catch (err) { /* ignore */ }
  return 0;
}

// ── 4. Update dashboard stats ────────────────────────────────────
function updateDashboardStats(totalStudentsFromApi = null, failurePointsCount = 0) {
  const activeCourses = allCourses.filter(c => c.is_published === 1).length;
  const totalStudents = (totalStudentsFromApi !== null)
    ? totalStudentsFromApi
    : allCourses.reduce((sum, c) => sum + (c.students_count || 0), 0);
  const avgRating = allCourses.length
    ? (allCourses.reduce((sum, c) => sum + (c.rating || 4.5), 0) / allCourses.length).toFixed(1)
    : '4.8';

  const statValues = document.querySelectorAll('.stat-value');
  if (statValues[0]) statValues[0].textContent = activeCourses;
  if (statValues[1]) statValues[1].textContent = totalStudents;
  if (statValues[2]) statValues[2].textContent = avgRating;
  if (statValues[3]) statValues[3].textContent = failurePointsCount;
}

// ── 5. Render course list in dashboard ───────────────────────────
function renderDashCourses() {
  const el = document.getElementById('dashCourseList');
  if (!el) return;
  const recent = allCourses.slice(0, 6);
  if (!recent.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">📚</div><div class="empty-title">No courses yet</div><div class="empty-sub">Click "New Course" to get started</div></div>';
    return;
  }
  el.innerHTML = recent.map(c => {
    const emoji = getCourseEmoji(c.title);
    const color = getCourseColor(c.difficulty_level);
    const statusBadge = c.is_published ? 'badge-green' : 'badge-blue';
    const progress = c.progress || 0;
    return `
      <div style="display:flex;align-items:center;gap:14px;padding:13px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="openCourseBuilder('${c.id}')">
        <div style="width:42px;height:42px;border-radius:10px;background:${color};display:flex;align-items:center;justify-content:center;font-size:18px">${emoji}</div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:500">${escapeHtml(c.title)}</div>
          <div style="font-size:11px;color:var(--text-3)">👥 ${c.students_count || 0} · 📹 ${c.lessons_count || 0} lessons</div>
          <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
        </div>
        <div class="badge ${statusBadge}">${c.is_published ? 'Published' : 'Draft'}</div>
      </div>
    `;
  }).join('');
}

function getCourseEmoji(title) {
  const t = title.toLowerCase();
  if (t.includes('react')) return '⚛️';
  if (t.includes('node')) return '🗄️';
  if (t.includes('css')) return '🎨';
  if (t.includes('security')) return '🔒';
  if (t.includes('full-stack')) return '🌐';
  return '📚';
}

function getCourseColor(level) {
  if (level === 'Beginner') return 'rgba(16,185,129,0.15)';
  if (level === 'Advanced') return 'rgba(239,68,68,0.15)';
  return 'rgba(59,130,246,0.15)';
}

// ── 6. Dynamic Failure Points (no static fallback) ───────────────

async function loadFailurePointsWidget() {
  const container = document.getElementById('dashFpList');
  if (!container) return;

  try {
    const fpData = await apiCall('GET', '/teacher/failure-points?limit=4');
    if (fpData && fpData.success && fpData.data.length > 0) {
      if (typeof renderFpListFromData === 'function') {
        renderFpListFromData(fpData.data, 'dashFpList');
      } else {
        // renderFpListFromData should be loaded via teacher-common.js
        container.innerHTML = '<div class="empty-state">Real data available but renderer missing.</div>';
      }
    } else {
      container.innerHTML = '<div class="empty-state">No failure data yet</div>';
    }
  } catch (err) {
    console.error('Failure points fetch error:', err);
    container.innerHTML = '<div class="empty-state">Could not load failure points</div>';
  }
}

// ── 7. Dynamic Recent Activity ───────────────────────────────────
async function loadRecentActivity() {
  const container = document.getElementById('dashActivity');
  if (!container) return;

  try {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:3000/api/notifications?limit=5', {
      headers: { Authorization: `Bearer ${token.replace(/['"]+/g, '')}` }
    });
    const data = await res.json();
    if (data.success && data.notifications) {
      renderActivity(data.notifications);
    } else {
      container.innerHTML = '<div class="activity-item"><div class="activity-body"><div class="activity-text">No recent activity</div></div></div>';
    }
  } catch (err) {
    console.error('Teacher activity fetch error:', err);
    container.innerHTML = '<div class="activity-item"><div class="activity-body"><div class="activity-text">Could not load activity</div></div></div>';
  }
}

function renderActivity(notifications) {
  const container = document.getElementById('dashActivity');
  if (!container) return;

  if (notifications.length === 0) {
    container.innerHTML = '<div class="activity-item"><div class="activity-body"><div class="activity-text">No recent activity</div></div></div>';
    return;
  }

  const colorMap = {
    enrollment: 'var(--blue-400)',
    achievement: 'var(--purple)',
    system: 'var(--amber)',
    assignment: 'var(--green)',
    announcement: 'var(--cyan)',
  };

  container.innerHTML = notifications.map(n => {
    const dotColor = colorMap[n.type] || 'var(--text-3)';
    const time = timeAgo(n.created_at);
    return `
      <div class="activity-item">
        <div class="activity-dot" style="background:${dotColor}"></div>
        <div class="activity-body">
          <div class="activity-text"><strong>${escapeHtml(n.title)}</strong> ${escapeHtml(n.message)}</div>
          <div class="activity-time">${time}</div>
        </div>
      </div>
    `;
  }).join('');
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

// ── 8. Initialisation ────────────────────────────────────────────
async function initDashboard() {
  await fetchSubdomains();
  await fetchCourses();

  const totalStudentsCount = await fetchTotalStudents();
  const failurePointsTotal = await fetchFailurePointsCount();

  // Failure points widget (dynamic, no static fallback)
  loadFailurePointsWidget();

  // Other stats
  updateDashboardStats(totalStudentsCount, failurePointsTotal);

  renderDashCourses();

  // Dynamic recent activity from notifications
  loadRecentActivity();

  // Weekly chart (static for now)
  renderChart('weekChart', [42,68,55,91,73,28,18], ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']);

  // Notifications bell (already handled by teacher-common.js)
}

initDashboard();