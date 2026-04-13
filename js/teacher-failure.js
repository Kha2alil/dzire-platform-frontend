/* teacher-failure.js */
const FAILURE_POINTS = [
  { rank:1, topic:'Async / Await Logic', pct:88, color:'var(--red)' },
  { rank:2, topic:'REST API Design Patterns', pct:71, color:'var(--amber)' },
  { rank:3, topic:'CSS Flexbox & Grid', pct:59, color:'var(--blue-500)' },
  { rank:4, topic:'SQL JOIN Queries', pct:44, color:'var(--text-3)' },
  { rank:5, topic:'JWT Authentication', pct:38, color:'var(--text-3)' },
  { rank:6, topic:'DOM Manipulation', pct:29, color:'var(--text-3)' },
];

const FP_STUDENTS = [
  { name:'Lina Khelifi', initials:'LK', color:'rgba(239,68,68,0.2)', tcolor:'var(--red)', topic:'Async/Await Logic', attempts:5, lastTry:'2 hr ago', remedial:'Pending' },
  { name:'Karim Bouzid', initials:'KB', color:'rgba(59,130,246,0.2)', tcolor:'var(--blue-400)', topic:'REST API Design', attempts:4, lastTry:'1 day ago', remedial:'In Progress' },
  { name:'Yacine Merad', initials:'YM', color:'rgba(16,185,129,0.2)', tcolor:'var(--green)', topic:'SQL JOIN Queries', attempts:3, lastTry:'3 hr ago', remedial:'Not Started' },
  { name:'Rami Tahir', initials:'RT', color:'rgba(245,158,11,0.2)', tcolor:'var(--amber)', topic:'CSS Flexbox', attempts:3, lastTry:'5 hr ago', remedial:'Completed' },
];

function renderFpList(containerId, limit=999) {
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

function renderFpStudentTable() {
  const el = document.getElementById('fpStudentTable');
  if (!el) return;
  el.innerHTML = FP_STUDENTS.map(s => {
    const remClass = s.remedial === 'Completed' ? 'badge-green' : s.remedial === 'In Progress' ? 'badge-blue' : s.remedial === 'Pending' ? 'badge-amber' : 'badge-red';
    return `
      <tr>
        <td><div class="user-cell"><div class="avatar" style="background:${s.color};color:${s.tcolor}">${s.initials}</div><div class="user-name">${s.name}</div></div></td>
        <td><span style="color:var(--red)">${s.topic}</span></td>
        <td><span style="font-weight:700">${s.attempts}×</span></td>
        <td style="color:var(--text-3);font-size:12px">${s.lastTry}</td>
        <td><div class="badge ${remClass}">${s.remedial}</div></td>
      </tr>
    `;
  }).join('');
}

function initFailure() {
  renderFpList('fullFpList');
  renderFpStudentTable();
  renderChart('fpChart', [88,71,59,44,38,29], ['A','R','C','S','J','D']);
  renderNotifications();
}
initFailure();