/* teacher-dashboard.js */
let allCourses = [];

async function fetchCourses() {
  try {
    const data = await apiCall('GET', '/courses');
    if (data && data.success) {
      allCourses = data.data.courses || [];
      updateDashboardStats();
      renderDashCourses();
      return allCourses;
    } else return [];
  } catch (err) { return []; }
}

async function fetchTotalStudents() {
  try {
    // افترض أن المسار هو /api/teacher/stats (يمكنك تغييره حسب الـ route الخاص بك)
    const response = await apiCall('GET', '/courses/student-count');
    if (response && response.success && response.data) {
      // إذا كان الـ data يحتوي على totalStudents مباشرة
      return response.data.totalStudents || response.data.studentCount || 0;
    }
    return null;
  } catch (err) {
    console.error('Error fetching total students:', err);
    return null;
  }
}

function updateDashboardStats(totalStudentsFromApi = null) {
  const activeCourses = allCourses.filter(c => c.is_published === 1).length;
  const totalStudents = (totalStudentsFromApi !== null) ? totalStudentsFromApi : allCourses.reduce((sum, c) => sum + (c.students_count || 0), 0);
  const avgRating = allCourses.length ? (allCourses.reduce((sum, c) => sum + (c.rating || 4.5), 0) / allCourses.length).toFixed(1) : 4.8;
  const statValues = document.querySelectorAll('.stat-value');
  if (statValues[0]) statValues[0].textContent = activeCourses;
  if (statValues[1]) statValues[1].textContent = totalStudents;
  if (statValues[2]) statValues[2].textContent = avgRating;
  if (statValues[3]) statValues[3].textContent = 67;
}

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

const FAILURE_POINTS = [
  { rank:1, topic:'Async / Await Logic', pct:88, color:'var(--red)' },
  { rank:2, topic:'REST API Design Patterns', pct:71, color:'var(--amber)' },
  { rank:3, topic:'CSS Flexbox & Grid', pct:59, color:'var(--blue-500)' },
  { rank:4, topic:'SQL JOIN Queries', pct:44, color:'var(--text-3)' },
];
function renderFpList(containerId, limit=4) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const rankClass = ['','r1','r2','r3'];
  el.innerHTML = FAILURE_POINTS.slice(0,limit).map(fp => `
    <div class="fp-item">
      <div class="fp-rank ${rankClass[fp.rank]||''}">#${fp.rank}</div>
      <div class="fp-info">
        <div class="fp-topic">${fp.topic}</div>
        <div class="fp-bar"><div class="fp-fill" style="width:${fp.pct}%;background:${fp.color}"></div></div>
      </div>
      <div class="fp-pct" style="color:${fp.color}">${fp.pct}%</div>
    </div>
  `).join('');
}

const ACTIVITY = [
  { dot:'var(--green)', text:'<strong>Ahmed M.</strong> passed the Full-Stack Boss Exam', time:'2 min ago' },
  { dot:'var(--red)', text:'<strong>Lina K.</strong> triggered a remedial session on Async/Await', time:'14 min ago' },
  { dot:'var(--blue-400)', text:'<strong>Sara B.</strong> completed the JavaScript Promises quiz', time:'1 hr ago' },
  { dot:'var(--purple)', text:'<strong>Yacine M.</strong> enrolled in Node.js & PostgreSQL Mastery', time:'3 hr ago' },
  { dot:'var(--amber)', text:'<strong>Rami T.</strong> failed the CSS Flexbox quiz 3× — remedial triggered', time:'5 hr ago' },
];
function renderActivity(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = ACTIVITY.map(a => `
    <div class="activity-item">
      <div class="activity-dot" style="background:${a.dot}"></div>
      <div class="activity-body">
        <div class="activity-text">${a.text}</div>
        <div class="activity-time">${a.time}</div>
      </div>
    </div>
  `).join('');
}

async function initDashboard() {
  await fetchSubdomains();
  await fetchCourses();
  
  const totalStudentsCount = await fetchTotalStudents();
  if (totalStudentsCount !== null) {
    updateDashboardStats(totalStudentsCount);
  } else {
    updateDashboardStats();
  }
  
  renderFpList('dashFpList', 4);
  renderActivity('dashActivity');
  renderChart('weekChart', [42,68,55,91,73,28,18], ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']);
  renderNotifications();
}
initDashboard();