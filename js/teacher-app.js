/* ── DATA ── */
const COURSES = [
  { id:1, emoji:'🌐', title:'Full-Stack Web Development', students:142, lessons:24, progress:78, status:'Active', level:'Intermediate', color:'rgba(59,130,246,0.15)', rating:4.9, score:74, trend:'↑' },
  { id:2, emoji:'⚛️', title:'JavaScript Advanced Concepts', students:98, lessons:18, progress:55, status:'Active', level:'Advanced', color:'rgba(167,139,250,0.15)', rating:4.7, score:68, trend:'↑' },
  { id:3, emoji:'🗄️', title:'Node.js & PostgreSQL Mastery', students:76, lessons:20, progress:34, status:'Pending', level:'Intermediate', color:'rgba(16,185,129,0.15)', rating:4.6, score:61, trend:'→' },
  { id:4, emoji:'🎨', title:'CSS & Tailwind Deep Dive', students:32, lessons:12, progress:90, status:'Active', level:'Beginner', color:'rgba(245,158,11,0.15)', rating:4.8, score:82, trend:'↑' },
  { id:5, emoji:'🔒', title:'Web Security Fundamentals', students:54, lessons:16, progress:20, status:'Draft', level:'Advanced', color:'rgba(239,68,68,0.15)', rating:4.5, score:58, trend:'↓' },
  { id:6, emoji:'🚀', title:'React from Zero to Hero', students:87, lessons:22, progress:45, status:'Active', level:'Intermediate', color:'rgba(34,211,238,0.12)', rating:4.9, score:77, trend:'↑' },
];

const STUDENTS = [
  { name:'Ahmed Mansouri', initials:'AM', color:'rgba(59,130,246,0.2)', tcolor:'var(--blue-400)', email:'ahmed@mail.com', course:'Full-Stack', progress:92, xp:2840, level:8, lastActive:'2 min ago', status:'Active' },
  { name:'Sara Benali', initials:'SB', color:'rgba(167,139,250,0.2)', tcolor:'var(--purple)', email:'sara@mail.com', course:'JavaScript', progress:75, xp:1920, level:6, lastActive:'1 hr ago', status:'Active' },
  { name:'Yacine Merad', initials:'YM', color:'rgba(16,185,129,0.2)', tcolor:'var(--green)', email:'yacine@mail.com', course:'Node.js', progress:45, xp:980, level:4, lastActive:'3 hr ago', status:'Active' },
  { name:'Lina Khelifi', initials:'LK', color:'rgba(239,68,68,0.2)', tcolor:'var(--red)', email:'lina@mail.com', course:'Full-Stack', progress:28, xp:420, level:2, lastActive:'1 day ago', status:'At Risk' },
  { name:'Rami Tahir', initials:'RT', color:'rgba(245,158,11,0.2)', tcolor:'var(--amber)', email:'rami@mail.com', course:'CSS', progress:60, xp:1340, level:5, lastActive:'5 hr ago', status:'Active' },
  { name:'Nour Aissaoui', initials:'NA', color:'rgba(34,211,238,0.12)', tcolor:'var(--cyan)', email:'nour@mail.com', course:'JavaScript', progress:88, xp:2200, level:7, lastActive:'30 min ago', status:'Active' },
  { name:'Karim Bouzid', initials:'KB', color:'rgba(59,130,246,0.2)', tcolor:'var(--blue-400)', email:'karim@mail.com', course:'Node.js', progress:15, xp:180, level:1, lastActive:'3 days ago', status:'Inactive' },
  { name:'Amira Saad', initials:'AS', color:'rgba(167,139,250,0.2)', tcolor:'var(--purple)', email:'amira@mail.com', course:'Full-Stack', progress:70, xp:1760, level:6, lastActive:'2 hr ago', status:'Active' },
];

const FAILURE_POINTS = [
  { rank:1, topic:'Async / Await Logic', pct:88, color:'var(--red)', fillClass:'fill-red' },
  { rank:2, topic:'REST API Design Patterns', pct:71, color:'var(--amber)', fillClass:'fill-amber' },
  { rank:3, topic:'CSS Flexbox & Grid', pct:59, color:'var(--blue-500)', fillClass:'fill-blue' },
  { rank:4, topic:'SQL JOIN Queries', pct:44, color:'var(--text-3)', fillClass:'fill-muted' },
  { rank:5, topic:'JWT Authentication', pct:38, color:'var(--text-3)', fillClass:'fill-muted' },
  { rank:6, topic:'DOM Manipulation', pct:29, color:'var(--text-3)', fillClass:'fill-muted' },
];

const ASSESSMENTS = [
  { title:'JS Promises & Async/Await', course:'JavaScript Advanced', type:'Quiz', questions:15, avgScore:64, status:'Active' },
  { title:'Full-Stack Boss Exam — Level 3', course:'Full-Stack Web Dev', type:'Boss Exam', questions:20, avgScore:71, status:'Active' },
  { title:'Web Dev Placement Test', course:'General', type:'Placement Test', questions:30, avgScore:58, status:'Active' },
  { title:'CSS Grid & Flexbox Quiz', course:'CSS & Tailwind', type:'Quiz', questions:12, avgScore:82, status:'Active' },
  { title:'Node.js REST API Quiz', course:'Node.js & PostgreSQL', type:'Quiz', questions:18, avgScore:61, status:'Draft' },
  { title:'Security Boss Exam — Level 2', course:'Web Security', type:'Boss Exam', questions:25, avgScore:55, status:'Pending' },
];

const ACTIVITY = [
  { dot:'var(--green)', text:'<strong>Ahmed M.</strong> passed the Boss Exam in Full-Stack Level 3', time:'2 min ago' },
  { dot:'var(--red)', text:'<strong>Lina K.</strong> triggered a remedial session on Async/Await', time:'14 min ago' },
  { dot:'var(--blue-400)', text:'<strong>Sara B.</strong> completed the JavaScript Promises quiz', time:'1 hr ago' },
  { dot:'var(--purple)', text:'<strong>Yacine M.</strong> enrolled in Node.js & PostgreSQL Mastery', time:'3 hr ago' },
  { dot:'var(--amber)', text:'<strong>Rami T.</strong> failed the CSS Flexbox quiz 3× — remedial triggered', time:'5 hr ago' },
];

const NOTIFICATIONS = [
  { dot:'var(--green)', msg:'<strong>Ahmed M.</strong> passed the Full-Stack Boss Exam', time:'2 min ago', unread:true },
  { dot:'var(--red)', msg:'<strong>Lina K.</strong> has failed Async/Await 3 times — remedial needed', time:'14 min ago', unread:true },
  { dot:'var(--blue-400)', msg:'Your course <strong>Node.js & PostgreSQL</strong> is awaiting approval', time:'1 hr ago', unread:true },
  { dot:'var(--amber)', msg:'New enrollment in <strong>CSS & Tailwind Deep Dive</strong>', time:'3 hr ago', unread:false },
  { dot:'var(--purple)', msg:'Weekly analytics report is ready to view', time:'Yesterday', unread:false },
];

const FP_STUDENTS = [
  { name:'Lina Khelifi', initials:'LK', color:'rgba(239,68,68,0.2)', tcolor:'var(--red)', topic:'Async/Await Logic', attempts:5, lastTry:'2 hr ago', remedial:'Pending' },
  { name:'Karim Bouzid', initials:'KB', color:'rgba(59,130,246,0.2)', tcolor:'var(--blue-400)', topic:'REST API Design', attempts:4, lastTry:'1 day ago', remedial:'In Progress' },
  { name:'Yacine Merad', initials:'YM', color:'rgba(16,185,129,0.2)', tcolor:'var(--green)', topic:'SQL JOIN Queries', attempts:3, lastTry:'3 hr ago', remedial:'Not Started' },
  { name:'Rami Tahir', initials:'RT', color:'rgba(245,158,11,0.2)', tcolor:'var(--amber)', topic:'CSS Flexbox', attempts:3, lastTry:'5 hr ago', remedial:'Completed' },
];

/* ── NAVIGATION ── */
const pageTitles = {
  dashboard: 'Dashboard',
  courses: 'My Courses',
  assessments: 'Assessments',
  students: 'Students',
  analytics: 'Analytics',
  failure: 'Failure Points',
  profile: 'My Profile',
  settings: 'Settings',
};

const topbarActions = {
  dashboard: { label:'＋ New Course', action:"openModal('newCourse')" },
  courses:   { label:'＋ New Course', action:"openModal('newCourse')" },
  assessments:{ label:'＋ New Assessment', action:"openModal('newQuiz')" },
  students:  { label:'📤 Export', action:"showToast('Exported!','success')" },
  analytics: { label:'📥 Download Report', action:"showToast('Downloading...','success')" },
  failure:   { label:'📤 Export List', action:"showToast('Exported!','success')" },
  profile:   { label:'💾 Save Changes', action:"showToast('Profile saved!','success')" },
  settings:  { label:'💾 Save Settings', action:"showToast('Settings saved!','success')" },
};

function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');

  document.querySelectorAll('.nav-item[data-page="' + page + '"]').forEach(n => n.classList.add('active'));

  document.getElementById('pageTitle').textContent = pageTitles[page] || page;

  const action = topbarActions[page];
  if (action) {
    const btn = document.getElementById('topbarAction');
    btn.textContent = action.label;
    btn.setAttribute('onclick', action.action);
  }
}

document.querySelectorAll('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', () => navigate(item.dataset.page));
});

/* ── SIDEBAR TOGGLE ── */
const sidebar = document.getElementById('sidebar');
const mainEl  = document.getElementById('main');
const toggleBtn = document.getElementById('sidebarToggle');
let collapsed = false;

toggleBtn.addEventListener('click', () => {
  collapsed = !collapsed;
  sidebar.classList.toggle('collapsed', collapsed);
  mainEl.classList.toggle('expanded', collapsed);
  toggleBtn.textContent = collapsed ? '▶' : '◀';
});

/* ── MODALS ── */
function openModal(id) {
  document.getElementById('modal-' + id).classList.add('open');
}

function closeModal(id) {
  document.getElementById('modal-' + id).classList.remove('open');
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

function createCourse() {
  closeModal('newCourse');
  showToast('Course created and sent for approval! 🚀', 'success');
}

function createQuiz() {
  closeModal('newQuiz');
  showToast('Assessment created successfully! 📝', 'success');
}

/* ── TOAST ── */
function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.innerHTML = `<span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span><span class="toast-msg">${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'none';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ── NOTIFICATIONS ── */
const notifBtn = document.getElementById('notifBtn');
const notifPanel = document.getElementById('notifPanel');
const notifBadge = document.getElementById('notifBadge');

function renderNotifications() {
  const list = document.getElementById('notifList');
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
  const unread = NOTIFICATIONS.filter(n => n.unread).length;
  notifBadge.style.display = unread > 0 ? 'block' : 'none';
}

function markRead(el) {
  el.classList.remove('unread');
  const idx = [...document.getElementById('notifList').children].indexOf(el);
  if (NOTIFICATIONS[idx]) NOTIFICATIONS[idx].unread = false;
  updateBadge();
}

document.getElementById('clearNotif').addEventListener('click', () => {
  NOTIFICATIONS.forEach(n => n.unread = false);
  document.querySelectorAll('.notif-item').forEach(el => el.classList.remove('unread'));
  updateBadge();
});

notifBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  notifPanel.classList.toggle('open');
});

document.addEventListener('click', (e) => {
  if (!notifBtn.contains(e.target)) notifPanel.classList.remove('open');
});

/* ── RENDER DASHBOARD COURSES ── */
function renderDashCourses() {
  const el = document.getElementById('dashCourseList');
  el.innerHTML = COURSES.slice(0, 4).map(c => `
    <div style="display:flex;align-items:center;gap:14px;padding:13px 0;border-bottom:1px solid var(--border);cursor:pointer;transition:padding-left 0.2s" onmouseover="this.style.paddingLeft='8px'" onmouseout="this.style.paddingLeft='0'">
      <div style="width:42px;height:42px;border-radius:10px;background:${c.color};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${c.emoji}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px">${c.title}</div>
        <div style="font-size:11px;color:var(--text-3);margin-bottom:7px">👥 ${c.students} · 📹 ${c.lessons} lessons</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${c.progress}%"></div></div>
      </div>
      <div class="badge ${c.status === 'Active' ? 'badge-green' : c.status === 'Pending' ? 'badge-amber' : 'badge-blue'}">${c.status}</div>
    </div>
  `).join('');
}

/* ── RENDER FAILURE POINTS ── */
function renderFpList(containerId, limit = 999) {
  const el = document.getElementById(containerId);
  const rankClass = ['','r1','r2','r3'];
  el.innerHTML = FAILURE_POINTS.slice(0, limit).map((fp, i) => `
    <div class="fp-item">
      <div class="fp-rank ${rankClass[fp.rank] || ''}">#${fp.rank}</div>
      <div class="fp-info">
        <div class="fp-topic">${fp.topic}</div>
        <div class="fp-bar"><div class="fp-fill" style="width:${fp.pct}%;background:${fp.color}"></div></div>
      </div>
      <div class="fp-pct" style="color:${fp.color}">${fp.pct}%</div>
    </div>
  `).join('');
}

/* ── RENDER ACTIVITY ── */
function renderActivity(containerId, limit = 5) {
  const el = document.getElementById(containerId);
  el.innerHTML = ACTIVITY.slice(0, limit).map(a => `
    <div class="activity-item">
      <div class="activity-dot" style="background:${a.dot}"></div>
      <div class="activity-body">
        <div class="activity-text">${a.text}</div>
        <div class="activity-time">${a.time}</div>
      </div>
    </div>
  `).join('');
}

/* ── RENDER WEEKLY CHART ── */
function renderChart(containerId, values, labels) {
  const el = document.getElementById(containerId);
  const max = Math.max(...values);
  el.innerHTML = values.map((v, i) => `
    <div class="bar-col">
      <div class="bar" style="height:${Math.max(6, (v/max)*100)}%">
        <div class="bar-tip">${v}</div>
      </div>
      <div class="bar-lbl">${labels[i]}</div>
    </div>
  `).join('');
}

/* ── RENDER COURSE CARDS ── */
function renderCourseCards(data) {
  const el = document.getElementById('courseGrid');
  if (!data.length) {
    el.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">📚</div><div class="empty-title">No courses found</div><div class="empty-sub">Try adjusting your filters</div></div>`;
    return;
  }
  el.innerHTML = data.map(c => `
    <div class="course-card">
      <div class="course-card-top" style="background:${c.color}">${c.emoji}</div>
      <div class="course-card-body">
        <div class="course-card-title">${c.title}</div>
        <div class="course-card-meta">
          <span>👥 ${c.students}</span>
          <span>📹 ${c.lessons} lessons</span>
          <span>⭐ ${c.rating}</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${c.progress}%"></div></div>
        <div class="course-card-footer">
          <div class="badge ${c.level==='Beginner'?'badge-green':c.level==='Intermediate'?'badge-blue':'badge-purple'}">${c.level}</div>
          <div class="badge ${c.status==='Active'?'badge-green':c.status==='Pending'?'badge-amber':'badge-red'}">${c.status}</div>
          <div style="font-size:12px;color:var(--text-3)">${c.progress}% done</div>
        </div>
      </div>
    </div>
  `).join('');
}

function filterCourses() {
  const search = document.getElementById('courseSearch').value.toLowerCase();
  const status = document.getElementById('courseFilter').value;
  const diff   = document.getElementById('diffFilter').value;
  const filtered = COURSES.filter(c =>
    (!search || c.title.toLowerCase().includes(search)) &&
    (!status || c.status === status) &&
    (!diff   || c.level === diff)
  );
  renderCourseCards(filtered);
}

/* ── RENDER STUDENT TABLE ── */
function renderStudentTable(data) {
  const el = document.getElementById('studentTable');
  el.innerHTML = data.map(s => {
    const progColor = s.progress >= 75 ? 'green' : s.progress >= 40 ? '' : 'red';
    const statusClass = s.status === 'Active' ? 'badge-green' : s.status === 'At Risk' ? 'badge-red' : 'badge-blue';
    return `
      <tr>
        <td>
          <div class="user-cell">
            <div class="avatar" style="background:${s.color};color:${s.tcolor}">${s.initials}</div>
            <div><div class="user-name">${s.name}</div><div class="user-sub">${s.email}</div></div>
          </div>
        </td>
        <td style="color:var(--text-2)">${s.course}</td>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="progress-bar" style="width:80px"><div class="progress-fill ${progColor}" style="width:${s.progress}%"></div></div>
            <span style="font-size:12px;color:var(--text-3)">${s.progress}%</span>
          </div>
        </td>
        <td><span style="font-family:'Syne',sans-serif;font-weight:700;color:var(--purple)">${s.xp.toLocaleString()}</span></td>
        <td><span class="badge badge-blue">Lv. ${s.level}</span></td>
        <td style="color:var(--text-3);font-size:12px">${s.lastActive}</td>
        <td><div class="badge ${statusClass}">${s.status}</div></td>
      </tr>
    `;
  }).join('');
}

function filterStudents() {
  const search = document.getElementById('studentSearch').value.toLowerCase();
  const course = document.getElementById('studentCourseFilter').value;
  const status = document.getElementById('studentStatusFilter').value;
  const filtered = STUDENTS.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search) || s.email.toLowerCase().includes(search);
    const matchCourse = !course || s.course.includes(course);
    const matchStatus = !status ||
      (status === 'high' && s.progress >= 75) ||
      (status === 'mid'  && s.progress >= 40 && s.progress < 75) ||
      (status === 'low'  && s.progress < 40);
    return matchSearch && matchCourse && matchStatus;
  });
  renderStudentTable(filtered);
}

/* ── RENDER ASSESSMENTS ── */
function renderAssessments() {
  const el = document.getElementById('assessmentTable');
  el.innerHTML = ASSESSMENTS.map(a => {
    const typeClass = a.type === 'Boss Exam' ? 'badge-red' : a.type === 'Placement Test' ? 'badge-purple' : 'badge-blue';
    const statusClass = a.status === 'Active' ? 'badge-green' : a.status === 'Draft' ? 'badge-blue' : 'badge-amber';
    const scoreColor = a.avgScore >= 75 ? 'var(--green)' : a.avgScore >= 50 ? 'var(--amber)' : 'var(--red)';
    return `
      <tr>
        <td><div style="font-weight:500">${a.title}</div></td>
        <td style="color:var(--text-2);font-size:12px">${a.course}</td>
        <td><div class="badge ${typeClass}">${a.type}</div></td>
        <td style="color:var(--text-2)">${a.questions} Qs</td>
        <td><span style="font-family:'Syne',sans-serif;font-weight:700;color:${scoreColor}">${a.avgScore}%</span></td>
        <td><div class="badge ${statusClass}">${a.status}</div></td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn btn-ghost" style="padding:5px 10px;font-size:11px" onclick="showToast('Opening editor...','success')">✏️ Edit</button>
            <button class="btn btn-ghost" style="padding:5px 10px;font-size:11px;border-color:var(--red-dim);color:var(--red)" onclick="showToast('Deleted!','success')">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/* ── RENDER ANALYTICS TABLE ── */
function renderAnalyticsTable() {
  const el = document.getElementById('analyticsTable');
  el.innerHTML = COURSES.map(c => {
    const scoreColor = c.score >= 75 ? 'var(--green)' : c.score >= 50 ? 'var(--amber)' : 'var(--red)';
    return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="font-size:18px">${c.emoji}</div>
            <div style="font-weight:500;font-size:13px">${c.title}</div>
          </div>
        </td>
        <td style="color:var(--text-2)">${c.students}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="progress-bar" style="width:70px"><div class="progress-fill" style="width:${c.progress}%"></div></div>
            <span style="font-size:12px;color:var(--text-3)">${c.progress}%</span>
          </div>
        </td>
        <td><span style="font-weight:700;color:${scoreColor};font-family:'Syne',sans-serif">${c.score}%</span></td>
        <td><span style="color:var(--amber)">★</span> ${c.rating}</td>
        <td><span style="font-size:16px;color:${c.trend==='↑'?'var(--green)':c.trend==='↓'?'var(--red)':'var(--text-3)'}">${c.trend}</span></td>
      </tr>
    `;
  }).join('');
}

/* ── RENDER FP STUDENT TABLE ── */
function renderFpStudentTable() {
  const el = document.getElementById('fpStudentTable');
  el.innerHTML = FP_STUDENTS.map(s => {
    const remClass = s.remedial === 'Completed' ? 'badge-green' : s.remedial === 'In Progress' ? 'badge-blue' : s.remedial === 'Pending' ? 'badge-amber' : 'badge-red';
    return `
      <tr>
        <td>
          <div class="user-cell">
            <div class="avatar" style="background:${s.color};color:${s.tcolor}">${s.initials}</div>
            <div class="user-name">${s.name}</div>
          </div>
        </td>
        <td><span style="color:var(--red)">${s.topic}</span></td>
        <td><span style="font-family:'Syne',sans-serif;font-weight:700">${s.attempts}×</span></td>
        <td style="color:var(--text-3);font-size:12px">${s.lastTry}</td>
        <td><div class="badge ${remClass}">${s.remedial}</div></td>
      </tr>
    `;
  }).join('');
}

/* ── TABS ── */
function switchTab(el, tabId) {
  el.closest('.tabs').querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

/* ── GLOBAL SEARCH ── */
document.getElementById('globalSearch').addEventListener('input', function() {
  const q = this.value.toLowerCase().trim();
  if (!q) return;
  const found = STUDENTS.find(s => s.name.toLowerCase().includes(q));
  if (found) {
    navigate('students');
    document.getElementById('studentSearch').value = q;
    filterStudents();
  }
});

/* ── INIT ── */
function init() {
  renderDashCourses();
  renderFpList('dashFpList', 4);
  renderFpList('fullFpList');
  renderActivity('dashActivity');
  renderCourseCards(COURSES);
  renderStudentTable(STUDENTS);
  renderAssessments();
  renderAnalyticsTable();
  renderFpStudentTable();
  renderNotifications();

  renderChart('weekChart',
    [42, 68, 55, 91, 73, 28, 18],
    ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  );
  renderChart('monthChart',
    [60, 75, 50, 90, 80, 110, 95, 130],
    ['J','F','M','A','M','J','J','A']
  );
  renderChart('fpChart',
    [88, 71, 59, 44, 38, 29],
    ['A','R','C','S','J','D']
  );
}

init();
