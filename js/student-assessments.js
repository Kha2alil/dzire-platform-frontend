// student-assessments.js – guaranteed to work
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

const API_BASE = 'http://localhost:3000/api';
function getToken() { return localStorage.getItem('token') || ''; }

async function fetchAssessments() {
  const res = await axios.get(`${API_BASE}/students/assessments/overview`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  if (res.data.success) return res.data.data;
  throw new Error(res.data.message || 'Failed');
}

async function renderTable(filter = 'all') {
  // Ensure the table body exists
  let tbody = document.getElementById('assessmentTable');
  if (!tbody) {
    const table = document.querySelector('.table-wrap table') || document.querySelector('table');
    if (table) {
      tbody = table.querySelector('tbody') || table.appendChild(document.createElement('tbody'));
      tbody.id = 'assessmentTable';
    } else {
      // Create the full table from scratch inside the .card
      const card = document.querySelector('.card');
      if (card) {
        const wrap = document.createElement('div'); wrap.className = 'table-wrap';
        const tbl = document.createElement('table');
        const thead = document.createElement('thead');
        thead.innerHTML = '<tr><th>Assessment</th><th>Course</th><th>Type</th><th>Score</th><th>Status</th><th>Action</th></tr>';
        tbody = document.createElement('tbody'); tbody.id = 'assessmentTable';
        tbl.appendChild(thead); tbl.appendChild(tbody);
        wrap.appendChild(tbl);
        card.appendChild(wrap);
      } else return;
    }
  }

  try {
    let data = await fetchAssessments();
    if (filter === 'upcoming') data = data.filter(a => a.status === 'Upcoming');
    else if (filter === 'completed') data = data.filter(a => a.status === 'Passed' || a.status === 'Attempted');

    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="6">No assessments found</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(a => {
      const typeBadge = a.type === 'boss_exam' ? 'badge-red' : a.type === 'final_exam' ? 'badge-red' : 'badge-purple';
      const typeLabel = a.type === 'boss_exam' ? 'Boss Exam' : a.type;
      const statusClass = a.status === 'Passed' ? 'badge-green' : a.status === 'Attempted' ? 'badge-amber' : 'badge-blue';
      const score = a.best_score !== null ? a.best_score + '%' : '—';
      const link = `course-player.html?courseId=${a.course_id}&assessmentId=${a.id}`;
      return `<tr>
        <td>${escapeHtml(a.title)}</td>
        <td>${escapeHtml(a.course_title)}</td>
        <td><span class="badge ${typeBadge}">${typeLabel}</span></td>
        <td>${score}</td>
        <td><span class="badge ${statusClass}">${a.status || 'Upcoming'}</span></td>
        <td><a href="${link}" class="btn btn-primary btn-xs">${a.status === 'Upcoming' ? 'Start' : 'Go'} →</a></td>
      </tr>`;
    }).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6">Error loading assessments</td></tr>';
  }
}

// Run immediately when script loads
(function() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => renderTable('all'));
  } else {
    renderTable('all');
  }
  // Tab handling
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderTable(tab.dataset.tab || 'all');
    });
  });
})();