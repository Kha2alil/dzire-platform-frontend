/* teacher-failure.js — real API + dynamic students */

// Static fallback (used only if API fails)
const STATIC_FAILURE_POINTS = [
  { rank:1, topic:'Async / Await Logic', pct:88, color:'var(--red)' },
  { rank:2, topic:'REST API Design Patterns', pct:71, color:'var(--amber)' },
  { rank:3, topic:'CSS Flexbox & Grid', pct:59, color:'var(--blue-500)' },
  { rank:4, topic:'SQL JOIN Queries', pct:44, color:'var(--text-3)' },
  { rank:5, topic:'JWT Authentication', pct:38, color:'var(--text-3)' },
  { rank:6, topic:'DOM Manipulation', pct:29, color:'var(--text-3)' },
];

let allFailurePoints = []; // will hold the API data (with assessment_id)

// Fetch failure points from server
async function fetchFailurePoints(limit = 20) {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get(`http://localhost:3000/api/teacher/failure-points?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.data.success) {
      return res.data.data;
    } else {
      throw new Error(res.data.message || 'Unknown error');
    }
  } catch (err) {
    console.error('Failed to fetch failure points:', err);
    return null;
  }
}

// Render failure point list from API data (with click handler)
function renderFpListFromData(data, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!data || data.length === 0) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">No failure data yet</div></div>';
    return;
  }
  allFailurePoints = data; // store for click handlers
  const rankColors = ['var(--red)', 'var(--amber)', 'var(--blue-500)'];
  el.innerHTML = data.map((fp, idx) => {
    const rankClass = idx < 3 ? `r${idx + 1}` : '';
    const barColor = idx < 3 ? rankColors[idx] : 'var(--text-3)';
    return `
      <div class="fp-item" onclick="loadStudentsForAssessment('${fp.assessment_id}', '${escapeHtml(fp.assessment_title)}')">
        <div class="fp-rank ${rankClass}">#${idx + 1}</div>
        <div class="fp-info">
          <div class="fp-topic">${escapeHtml(fp.assessment_title)} (${escapeHtml(fp.course_title)})</div>
          <div class="fp-bar"><div class="fp-fill" style="width:${fp.failure_rate}%;background:${barColor}"></div></div>
        </div>
        <div class="fp-pct" style="color:${barColor}">${fp.failure_rate}%</div>
      </div>
    `;
  }).join('');
}

// Static list rendering (fallback)
function renderFpListStatic(containerId, limit = 999) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const rankClass = ['', 'r1', 'r2', 'r3'];
  el.innerHTML = STATIC_FAILURE_POINTS.slice(0, limit).map(fp => `
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

// Fetch and render affected students for a specific assessment
async function loadStudentsForAssessment(assessmentId, assessmentTitle) {
  const tableEl = document.getElementById('fpStudentTable');
  if (!tableEl) return;
  
  // Show loading
  tableEl.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;">Loading students...</td></tr>';
  
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get(`http://localhost:3000/api/teacher/failure-points/${assessmentId}/students`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.data.success) {
      const students = res.data.data;
      if (students.length === 0) {
        tableEl.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;">No students found for this assessment</td></tr>';
        return;
      }
      renderDynamicStudentsTable(students, assessmentTitle);
    } else {
      throw new Error(res.data.message || 'Unknown error');
    }
  } catch (err) {
    console.error('Failed to load students:', err);
    tableEl.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--red);">Failed to load students</td></tr>';
  }
}

function renderDynamicStudentsTable(students, assessmentTitle) {
  const tableEl = document.getElementById('fpStudentTable');
  if (!tableEl) return;
  
  tableEl.innerHTML = students.map(s => {
    const initials = (s.full_name || '')
      .split(' ')
      .filter(Boolean)
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    const hash = (s.full_name || '').charCodeAt(0) % 5;
    const colors = [
      ['rgba(239,68,68,0.2)', 'var(--red)'],
      ['rgba(59,130,246,0.2)', 'var(--blue-400)'],
      ['rgba(16,185,129,0.2)', 'var(--green)'],
      ['rgba(245,158,11,0.2)', 'var(--amber)'],
      ['rgba(167,139,250,0.15)', 'var(--purple)'],
    ];
    const [bg, tc] = colors[hash];
    const lastAttempt = s.last_attempt ? new Date(s.last_attempt).toLocaleString() : 'N/A';
    const attempts = s.attempts || 0;
    // Simple remedial status based on attempts
    let remedial = attempts >= 5 ? 'Pending' : attempts >= 3 ? 'In Progress' : 'Not Started';
    let remClass = remedial === 'Pending' ? 'badge-amber' : remedial === 'In Progress' ? 'badge-blue' : 'badge-red';
    
    return `
      <tr>
        <td><div class="user-cell"><div class="avatar" style="background:${bg};color:${tc}">${initials}</div><div class="user-name">${escapeHtml(s.full_name)}</div></div></td>
        <td style="color:var(--red)">${escapeHtml(assessmentTitle)}</td>
        <td><span style="font-weight:700">${attempts}×</span></td>
        <td style="color:var(--text-3);font-size:12px">${lastAttempt}</td>
        <td><div class="badge ${remClass}">${remedial}</div></td>
      </tr>
    `;
  }).join('');
}

// Chart from API data
function renderFpChartFromData(data) {
  const values = data.map(d => d.failure_rate);
  const labels = data.map(d => (d.assessment_title || '').substring(0, 3));
  renderChart('fpChart', values.slice(0, 6), labels.slice(0, 6));
}

// Static chart fallback
function renderFpChartStatic() {
  renderChart('fpChart', [88, 71, 59, 44, 38, 29], ['A', 'R', 'C', 'S', 'J', 'D']);
}

async function initFailure() {
  const data = await fetchFailurePoints();

  if (data && data.length > 0) {
    renderFpListFromData(data, 'fullFpList');
    renderFpChartFromData(data);
    // Optionally, auto-load students for the first failure point
    // loadStudentsForAssessment(data[0].assessment_id, data[0].assessment_title);
  } else {
    renderFpListStatic('fullFpList');
    renderFpChartStatic();
  }

  // Clear student table until a failure point is clicked
  document.getElementById('fpStudentTable').innerHTML =
    '<tr><td colspan="5" style="text-align:center;padding:20px;">Click a failure point to see affected students</td></tr>';

  if (typeof renderNotifications === 'function') renderNotifications();
}

initFailure();