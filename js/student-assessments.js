// ==================== student-assessments.js ====================
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        if (m === '"') return '&quot;';
        if (m === "'") return '&#39;';
        return m;
    });
}

const API_BASE = 'http://localhost:3000/api';

function getToken() {
    return localStorage.getItem('token') || '';
}

async function fetchAssessments() {
    try {
        const res = await axios.get(`${API_BASE}/students/assessments/overview`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (res.data.success) {
            return res.data.data;
        } else {
            throw new Error(res.data.message || 'Failed to load');
        }
    } catch (err) {
        console.error('Failed to fetch assessments:', err);
        showToast('Could not load assessments', 'error');
        return [];
    }
}

function getStatusCategory(status) {
    if (status === 'Upcoming') return 'upcoming';
    if (status === 'Passed' || status === 'Attempted') return 'completed';
    if (status === 'Locked') return 'locked';
    return 'all';
}

async function renderAssessments(filter = 'all') {
    const container = document.getElementById('assessmentTable');
    if (!container) return;

    const allData = await fetchAssessments();
    if (!allData) return;

    let filtered = allData;
    if (filter === 'upcoming') {
        filtered = allData.filter(a => a.status === 'Upcoming');
    } else if (filter === 'completed') {
        filtered = allData.filter(a => a.status === 'Passed' || a.status === 'Attempted');
    } else if (filter === 'locked') {
        filtered = allData.filter(a => a.status === 'Locked');
    }

    if (filtered.length === 0) {
        container.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px;">No assessments found</td></tr>';
        return;
    }

    container.innerHTML = filtered.map(a => {
        const typeClass   = a.type === 'final_exam' ? 'badge-red' : 'badge-purple';
        const statusClass = a.status === 'Passed'   ? 'badge-green' :
                            a.status === 'Attempted' ? 'badge-amber' :
                            a.status === 'Upcoming'  ? 'badge-blue' : 'badge-neutral';
        const scoreColor  = a.best_score === null ? 'var(--text-3)' : a.best_score >= 75 ? 'var(--green)' : a.best_score >= 50 ? 'var(--amber)' : 'var(--red)';
        const scoreDisplay = a.best_score !== null ? a.best_score + '%' + (a.attempts_count > 1 ? ` (${a.attempts_count} tries)` : '') : '—';
        const assLink = `course-player.html?courseId=${a.course_id}&assessmentId=${a.id}`;
        const action = a.status === 'Locked'
            ? '<span class="locked-label">🔒 Locked</span>'
            : `<a href="${assLink}" class="btn btn-primary btn-xs">${a.status === 'Upcoming' ? 'Start' : 'Go'} →</a>`;
        return `
            <tr>
                <td><div class="assessment-title">${escapeHtml(a.title)}</div></td>
                <td class="assessment-course">${escapeHtml(a.course_title)}</td>
                <td><div class="badge ${typeClass}">${a.type}</div></td>
                <td><span class="assessment-score" style="color:${scoreColor}">${scoreDisplay}</span></td>
                <td><div class="badge ${statusClass}">${a.status}</div></td>
                <td>${action}</td>
            </tr>
        `;
    }).join('');
}

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

document.addEventListener('DOMContentLoaded', () => {
    renderAssessments('all');
    initTabs();
});