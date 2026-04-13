// js/student-dashboard.js (no imports, uses globals from student-common.js)
// Dashboard-specific logic

// Static data
const dailyGoalsData = [
    { text:'Watch 1 lesson video',  xp:'+10 XP', done:true  },
    { text:'Complete a quiz',       xp:'+20 XP', done:true  },
    { text:'Work on active quest',  xp:'+15 XP', done:false },
];

const activityData = [
    { dot:'var(--green)',    text:'You earned the <strong>Quiz Champion</strong> badge 🏆',                       time:'2 hr ago'   },
    { dot:'var(--blue-400)', text:'Completed lesson: <strong>Express Middleware Deep Dive</strong>',              time:'3 hr ago'   },
    { dot:'var(--amber)',    text:'Gained <strong>+80 XP</strong> from JS Closures Challenge quest',              time:'Yesterday'  },
    { dot:'var(--purple)',   text:'Reached <strong>Level 8</strong> — Code Warrior rank unlocked!',               time:'Yesterday'  },
    { dot:'var(--red)',      text:'Failed the Async/Await quiz — remedial session started automatically',          time:'2 days ago' },
];

const upcomingData = [
    { emoji:'📝', title:'Node.js REST API Quiz',      course:'Node.js & PostgreSQL', due:'Mar 12', color:'rgba(16,185,129,0.15)', urgency:'badge-blue' },
    { emoji:'⚔️', title:'Full-Stack Boss Exam Lv.3', course:'Full-Stack',           due:'TBD',    color:'rgba(239,68,68,0.15)',  urgency:'badge-red'  },
    { emoji:'📝', title:'React Hooks Quiz',           course:'React from Zero',      due:'Mar 20', color:'rgba(34,211,238,0.12)', urgency:'badge-blue' },
];

function renderDailyGoals() {
    const container = document.getElementById('dailyGoals');
    if (!container) return;
    container.innerHTML = dailyGoalsData.map((g, i) => `
        <div class="daily-goal-item ${g.done ? 'done' : ''}" data-index="${i}">
            <div class="goal-check">${g.done ? '✓' : ''}</div>
            <div class="goal-text">${g.text}</div>
            <div class="goal-xp">${g.xp}</div>
        </div>
    `).join('');
    document.querySelectorAll('.daily-goal-item').forEach(el => {
        el.addEventListener('click', function() {
            const idx = parseInt(this.dataset.index);
            if (!isNaN(idx)) {
                dailyGoalsData[idx].done = !dailyGoalsData[idx].done;
                renderDailyGoals();
                if (dailyGoalsData[idx].done) {
                    if (typeof showToast === 'function') showToast(`Goal complete! ${dailyGoalsData[idx].xp} earned 🎉`, 'success');
                }
            }
        });
    });
}

function renderActivity() {
    const container = document.getElementById('dashActivity');
    if (container) {
        container.innerHTML = activityData.map(a => `
            <div class="activity-item">
                <div class="activity-dot" style="background:${a.dot}"></div>
                <div class="activity-body">
                    <div class="activity-text">${a.text}</div>
                    <div class="activity-time">${a.time}</div>
                </div>
            </div>
        `).join('');
    }
}

function renderUpcoming() {
    const container = document.getElementById('upcomingAssessments');
    if (container) {
        container.innerHTML = upcomingData.map(u => `
            <div class="upcoming-item" onclick="window.location.href='student-assessments.html'">
                <div class="upcoming-icon" style="background:${u.color}">${u.emoji}</div>
                <div class="upcoming-info">
                    <div class="upcoming-title">${u.title}</div>
                    <div class="upcoming-meta">${u.course}</div>
                </div>
                <div class="badge ${u.urgency}">${u.due}</div>
            </div>
        `).join('');
    }
}

async function loadDashboardCourses() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/courses/enrolled', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const res = await response.json();
        let courses = [];
        if (res?.data?.courses) courses = res.data.courses;
        else if (res?.courses) courses = res.courses;
        else if (Array.isArray(res?.data)) courses = res.data;
        else if (Array.isArray(res)) courses = res;

        const total = courses.length;
        const active = courses.filter(c => Number(c.progress_percentage ?? 0) < 100).length;

        const statTotal = document.getElementById('stat-total-courses');
        const statActive = document.getElementById('stat-active-courses');
        const navBadge = document.getElementById('nav-courses-count');
        if (statTotal) statTotal.textContent = total;
        if (statActive) statActive.textContent = `${active} active`;
        if (navBadge) navBadge.textContent = total;

        const container = document.getElementById('dashCourseList');
        if (!container) return;

        const ongoing = courses.filter(c => Number(c.progress_percentage ?? 0) < 100).slice(0, 2);
        if (!ongoing.length) {
            container.innerHTML = '<p style="padding:20px;color:var(--text-3)">No courses in progress.</p>';
            return;
        }

        const SERVER_URL = 'http://localhost:3000';
        container.innerHTML = ongoing.map(c => {
            const id = c.id ?? c._id ?? c.course_id;
            const title = c.title ?? 'Course';
            const teacher = c.teacher_name ?? 'Instructor';
            const pct = Math.round(Number(c.progress_percentage ?? 0));
            const thumb = c.thumbnail_url ? (c.thumbnail_url.startsWith('http') ? c.thumbnail_url : `${SERVER_URL}${c.thumbnail_url}`) : null;
            const btnLabel = pct > 0 ? 'Resume ▶' : 'Start ▶';

            const imgBlock = thumb ? `
                <img src="${thumb}" alt="${title}" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:28px;background:var(--bg-3)">📚</div>
            ` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:28px;background:var(--bg-3)">📚</div>`;

            return `
                <div style="display:flex;gap:14px;align-items:center;padding:12px;border-radius:12px;margin-bottom:12px;background:var(--bg-2);border:1px solid var(--border-md);cursor:pointer;transition:background 0.2s;"
                     onmouseenter="this.style.background='var(--bg-3)'" onmouseleave="this.style.background='var(--bg-2)'"
                     onclick="window.location.href='course-player.html?courseId=${id}'">
                    <div style="width:72px;height:56px;border-radius:8px;overflow:hidden;flex-shrink:0;position:relative;">${imgBlock}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:600;font-size:14px;color:var(--text-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px;">${title}</div>
                        <div style="font-size:12px;color:var(--text-3);margin-bottom:8px;">👨‍🏫 ${teacher}</div>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <div style="flex:1;height:5px;background:var(--bg-3);border-radius:4px;overflow:hidden;"><div style="width:${pct}%;height:100%;background:var(--blue-500);border-radius:4px;"></div></div>
                            <span style="font-size:11px;font-weight:700;color:var(--blue-500);white-space:nowrap;">${pct}%</span>
                        </div>
                    </div>
                    <button class="btn btn-primary" style="flex-shrink:0;font-size:12px;padding:7px 14px;border-radius:8px;" onclick="event.stopPropagation();window.location.href='course-player.html?courseId=${id}'">${btnLabel}</button>
                </div>`;
        }).join('');
    } catch (err) {
        console.error('Error loading dashboard courses:', err);
        const container = document.getElementById('dashCourseList');
        if (container) container.innerHTML = '<p style="padding:20px;color:var(--text-3)">Could not load courses.</p>';
    }
}

// Initialize dashboard when DOM ready
document.addEventListener('DOMContentLoaded', async function() {
    renderDailyGoals();
    renderActivity();
    renderUpcoming();
    await loadDashboardCourses();
});