// ==================== student-assessments.js ====================
// Renders the Assessments page with tab filtering

// ASSESSMENTS_DATA – copied exactly from original student-app.js
const ASSESSMENTS_DATA = [
    { title:'CSS Grid & Flexbox Quiz',    course:'CSS & Tailwind',       type:'Quiz',      score:92,   status:'Passed',   date:'Mar 1'  },
    { title:'JS Closures & Scope',        course:'JavaScript Advanced',  type:'Quiz',      score:78,   status:'Passed',   date:'Mar 3'  },
    { title:'Node.js REST API Quiz',      course:'Node.js & PostgreSQL', type:'Quiz',      score:null, status:'Upcoming', date:'Mar 12' },
    { title:'Full-Stack Boss Exam Lv.3',  course:'Full-Stack',           type:'Boss Exam', score:null, status:'Locked',   date:'TBD'    },
    { title:'Async JavaScript Deep Dive', course:'JavaScript Advanced',  type:'Quiz',      score:65,   status:'Passed',   date:'Feb 28' },
    { title:'Web Dev Placement Test',     course:'General',              type:'Placement', score:82,   status:'Passed',   date:'Feb 15' },
    { title:'Node.js Boss Exam Lv.1',     course:'Node.js & PostgreSQL', type:'Boss Exam', score:71,   status:'Passed',   date:'Feb 20' },
];

// Helper to determine status category for filtering
function getStatusCategory(status) {
    if (status === 'Upcoming') return 'upcoming';
    if (status === 'Passed') return 'completed';
    return 'locked'; // for Locked
}

// Render function – identical to original renderAssessments() with filtering
function renderAssessments(filter = 'all') {
    const container = document.getElementById('assessmentTable');
    if (!container) return;

    let filtered = ASSESSMENTS_DATA;
    if (filter === 'upcoming') {
        filtered = ASSESSMENTS_DATA.filter(a => a.status === 'Upcoming');
    } else if (filter === 'completed') {
        filtered = ASSESSMENTS_DATA.filter(a => a.status === 'Passed');
    }
    // 'all' shows everything including Locked

    if (filtered.length === 0) {
        container.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px;">No assessments found</td></tr>';
        return;
    }

    container.innerHTML = filtered.map(a => {
        const typeClass   = a.type === 'Boss Exam' ? 'badge-red'    :
                            a.type === 'Placement' ? 'badge-purple' : 'badge-blue';
        const statusClass = a.status === 'Passed'   ? 'badge-green' :
                            a.status === 'Upcoming' ? 'badge-amber' : 'badge-blue';
        const scoreColor  = !a.score ? 'var(--text-3)' : a.score >= 75 ? 'var(--green)' : a.score >= 50 ? 'var(--amber)' : 'var(--red)';
        const action      = a.status === 'Upcoming'
            ? '<button class="btn btn-primary btn-xs" onclick="showToast(\'Starting...\',\'success\')">Start</button>'
            : a.status === 'Passed'
            ? '<button class="btn btn-ghost btn-xs" onclick="openModal(\'aiHint\')">Review</button>'
            : '<span class="locked-label">🔒 Locked</span>';
        return `
            <tr>
                <td><div class="assessment-title">${a.title}</div></td>
                <td class="assessment-course">${a.course}</td>
                <td><div class="badge ${typeClass}">${a.type}</div></td>
                <td><span class="assessment-score" style="color:${scoreColor}">${a.score ? a.score + '%' : '—'}</span></td>
                <td><div class="badge ${statusClass}">${a.status}</div></td>
                <td>${action}</td>
            </tr>
        `;
    }).join('');
}

// Tab switching
function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const filter = tab.dataset.tab || 'all';
            renderAssessments(filter);
        });
    });
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    renderAssessments('all');
    initTabs();
});