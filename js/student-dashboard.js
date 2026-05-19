// js/student-dashboard.js – Real recent activity (notifications + badges), courses & XP

const API_BASE = 'http://localhost:3000';

function getAuthToken() {
    return localStorage.getItem('token')
        || localStorage.getItem('dzire_token')
        || localStorage.getItem('jwt')
        || '';
}

async function fetchData(endpoint) {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

// ─── TIME AGO HELPER ───────────────────────────
function timeAgo(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    const then = new Date(dateStr);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── STATIC DATA (daily goals & upcoming) ───
const dailyGoalsData = [
    { text: 'Watch 1 lesson video',  xp: '+10 XP', done: true  },
    { text: 'Complete a quiz',       xp: '+20 XP', done: true  },
    { text: 'Work on active quest',  xp: '+15 XP', done: false },
];

const upcomingData = [
    { emoji: '📝', title: 'Node.js REST API Quiz',      course: 'Node.js & PostgreSQL', due: 'Mar 12', color: 'rgba(16,185,129,0.15)', urgency: 'badge-blue' },
    { emoji: '⚔️', title: 'Full-Stack Boss Exam Lv.3',  course: 'Full-Stack',           due: 'TBD',    color: 'rgba(239,68,68,0.15)',   urgency: 'badge-red'  },
    { emoji: '📝', title: 'React Hooks Quiz',            course: 'React from Zero',      due: 'Mar 20', color: 'rgba(34,211,238,0.12)', urgency: 'badge-blue' },
];

// ─── FETCH & UPDATE FUNCTIONS ──────────────────

// 1. Badges – update stat card and provide activity items
async function updateBadgesStat() {
    try {
        const data = await fetchData('/api/badges/me');
        const badges = data.badges || [];
        const count = badges.length;

        // Update stat card (Badges Earned)
        const statCards = document.querySelectorAll('.stat-value');
        statCards.forEach(el => {
            const label = el.nextElementSibling?.textContent || '';
            if (label.includes('Badges') || label.includes('badges')) {
                el.textContent = count;
            }
        });

        const subtitle = document.querySelector('#page-dashboard .section-subtitle');
        if (subtitle) {
            subtitle.textContent = `${count} badges earned · Keep going!`;
        }

        return badges; // return for activity merging
    } catch (e) {
        console.warn('Could not load badges:', e.message);
        return [];
    }
}

// 2. Notifications – activity feed
async function loadNotificationsForActivity() {
    try {
        const token = getAuthToken();
        const res = await fetch('http://localhost:3000/api/notifications?limit=5', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        return data.success ? data.notifications || [] : [];
    } catch (err) {
        console.error('Failed to load notifications:', err);
        return [];
    }
}

// 3. Build and render the merged activity feed
async function loadRecentActivity() {
    const container = document.getElementById('dashActivity');
    if (!container) return;

    // Fetch both sources in parallel
    const [badges, notifications] = await Promise.all([
        updateBadgesStat(),
        loadNotificationsForActivity()
    ]);

    // Convert badge objects to activity items
    const badgeItems = badges.slice(0, 5).map(b => ({
        dot: 'var(--purple)',
        text: `You earned the <strong>${escapeHtml(b.name)}</strong> badge 🏅`,
        time: timeAgo(b.earned_at),
        ts: new Date(b.earned_at).getTime()
    }));

    // Convert notification objects to activity items
    const colorMap = {
        enrollment: 'var(--blue-400)',
        achievement: 'var(--purple)',
        system: 'var(--amber)',
        assignment: 'var(--green)',
        announcement: 'var(--cyan)',
    };
    const notifItems = notifications.map(n => ({
        dot: colorMap[n.type] || 'var(--text-3)',
        text: `<strong>${escapeHtml(n.title)}</strong> ${escapeHtml(n.message)}`,
        time: timeAgo(n.created_at),
        ts: new Date(n.created_at).getTime()
    }));

    // Merge and sort by timestamp (newest first)
    const merged = [...badgeItems, ...notifItems].sort((a, b) => b.ts - a.ts);

    if (merged.length === 0) {
        container.innerHTML = '<div class="activity-item"><div class="activity-body"><div class="activity-text">No recent activity</div></div></div>';
        return;
    }

    container.innerHTML = merged.slice(0, 5).map(a => `
        <div class="activity-item">
            <div class="activity-dot" style="background:${a.dot}"></div>
            <div class="activity-body">
                <div class="activity-text">${a.text}</div>
                <div class="activity-time">${a.time}</div>
            </div>
        </div>
    `).join('');
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

// ─── Other dashboard updates (unchanged) ───
async function updateGamificationStats() {
    try {
        const res = await fetchData('/api/gamification/me');
        const stats = res.stats;
        if (!stats) return;

        const xp = stats.total_xp || 0;
        const level = stats.current_level || 1;
        const xpForNext = level * 1000;
        const xpPercent = Math.min(100, Math.round((xp / xpForNext) * 100));
        const xpRemaining = xpForNext - xp;

        const xpStrong = document.querySelector('.xp-label strong');
        const xpFill = document.querySelector('.xp-fill');
        const xpLevel = document.querySelector('.xp-level');
        if (xpStrong) xpStrong.textContent = xp.toLocaleString();
        if (xpFill) xpFill.style.width = `${xpPercent}%`;
        if (xpLevel) xpLevel.textContent = `Lv.${level}`;

        const levelNum = document.querySelector('.level-num');
        const levelXp = document.querySelector('.level-xp');
        const levelNext = document.querySelector('.level-next');
        if (levelNum) levelNum.textContent = level;
        if (levelXp) levelXp.textContent = `${xp.toLocaleString()} / ${xpForNext.toLocaleString()} XP`;
        if (levelNext) levelNext.textContent = `${xpRemaining.toLocaleString()} XP to Level ${level + 1}`;
    } catch (e) {
        console.warn('Could not load gamification stats:', e.message);
    }
}

async function updateWelcomeName() {
    try {
        const res = await fetchData('/api/auth/me');
        const user = res.user;
        if (!user) return;

        const firstName = (user.full_name || 'Student').split(' ')[0];
        const welcomeTitle = document.querySelector('.welcome-title');
        if (welcomeTitle) {
            welcomeTitle.innerHTML = `Welcome back, <span>${firstName}</span> 👾`;
        }

        const avatar = document.querySelector('.profile-avatar');
        const profileName = document.querySelector('.profile-name');
        if (avatar) avatar.textContent = firstName.substring(0, 2).toUpperCase();
        if (profileName) profileName.textContent = user.full_name || 'Student';
    } catch (e) {
        console.warn('Could not load user profile:', e.message);
    }
}

async function updateCoursesStat() {
    try {
        const res = await fetchData('/api/courses/enrolled');
        let courses = [];
        if (res?.data?.courses) courses = res.data.courses;
        else if (res?.courses) courses = res.courses;
        else if (Array.isArray(res?.data)) courses = res.data;
        else if (Array.isArray(res)) courses = res;

        const total = courses.length;
        const active = courses.filter(c => Number(c.progress_percentage ?? 0) < 100).length;

        const statCards = document.querySelectorAll('.stat-value');
        statCards.forEach(el => {
            const label = el.nextElementSibling?.textContent || '';
            if (label.includes('Enrolled')) {
                el.textContent = total;
            }
        });

        const activeTrend = document.querySelector('#stat-active-courses');
        if (activeTrend) activeTrend.textContent = `${active} active`;
    } catch (e) {
        console.warn('Could not update courses stat:', e.message);
    }
}

// ─── RENDER FUNCTIONS ──────────────────────────
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
            }
        });
    });
}

function renderUpcoming() {
    const container = document.getElementById('upcomingAssessments');
    if (!container) return;
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

async function loadDashboardCourses() {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE}/api/courses/enrolled`, {
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
                        <div style="font-weight:600;font-size:14px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px;">${title}</div>
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

// ─── INIT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function() {
    renderDailyGoals();
    renderUpcoming();

    // Dynamic recent activity (badges + notifications)
    loadRecentActivity();

    // Other API updates in parallel
    await Promise.allSettled([
        updateGamificationStats(),
        updateWelcomeName(),
        updateCoursesStat(),
        loadDashboardCourses()
    ]);
});