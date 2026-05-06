async function fetchAssessments() {
    try {
        const data = await apiCall('GET', '/teacher/assessments');
        if (data && data.success) {
            renderAssessments(data.data);
        } else {
            showToast('Failed to load assessments', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Error loading assessments', 'error');
    }
}

function renderAssessments(assessments) {
    const el = document.getElementById('assessmentTable');
    if (!el) return;
    if (!assessments.length) {
        el.innerHTML = '<tr><td colspan="7">No assessments found</td></tr>';
        return;
    }
    el.innerHTML = assessments.map(a => {
        const typeClass = a.type === 'final_exam' ? 'badge-red' : a.type === 'quiz' ? 'badge-blue' : 'badge-purple';
        const scoreColor = a.avg_score >= 75 ? 'var(--green)' : a.avg_score >= 50 ? 'var(--amber)' : 'var(--red)';
        return `
            <tr>
                <td style="font-weight:500">${escapeHtml(a.title)}</td>
                <td style="color:var(--text-2);font-size:12px">${escapeHtml(a.course_title)}</td>
                <td><div class="badge ${typeClass}">${a.type}</div></td>
                <td style="color:var(--text-2)">${a.questions_count} Qs</td>
                <td><span style="font-weight:700;color:${scoreColor}">${a.avg_score}%</span></td>
                <td style="color:var(--text-2)">${a.students_attempted} students</td>
                <td><span class="badge badge-blue">${a.passing_score}% pass</span></td>
            </tr>
        `;
    }).join('');
}

function initAssessments() {
    fetchAssessments();
    renderNotifications();
}
initAssessments();