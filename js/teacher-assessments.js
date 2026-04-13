/* teacher-assessments.js */
const ASSESSMENTS = [
  { title:'JS Promises & Async/Await', course:'JavaScript Advanced', type:'Quiz', questions:15, avgScore:64, status:'Active' },
  { title:'Full-Stack Boss Exam — Level 3', course:'Full-Stack Web Dev', type:'Boss Exam', questions:20, avgScore:71, status:'Active' },
  { title:'Web Dev Placement Test', course:'General', type:'Placement Test', questions:30, avgScore:58, status:'Active' },
  { title:'CSS Grid & Flexbox Quiz', course:'CSS & Tailwind', type:'Quiz', questions:12, avgScore:82, status:'Active' },
  { title:'Node.js REST API Quiz', course:'Node.js & PostgreSQL', type:'Quiz', questions:18, avgScore:61, status:'Draft' },
  { title:'Security Boss Exam — Level 2', course:'Web Security', type:'Boss Exam', questions:25, avgScore:55, status:'Pending' },
];

function renderAssessments() {
  const el = document.getElementById('assessmentTable');
  if (!el) return;
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
        <td><span style="font-weight:700;color:${scoreColor}">${a.avgScore}%</span></td>
        <td><div class="badge ${statusClass}">${a.status}</div></td>
        <td><div style="display:flex;gap:6px"><button class="btn btn-ghost" style="padding:5px 10px" onclick="showToast('Opening editor...','success')">✏️ Edit</button><button class="btn btn-ghost" style="color:var(--red)" onclick="showToast('Deleted!','success')">🗑️</button></div></td>
      </tr>
    `;
  }).join('');
}

function initAssessments() {
  renderAssessments();
  renderNotifications();
}
initAssessments();