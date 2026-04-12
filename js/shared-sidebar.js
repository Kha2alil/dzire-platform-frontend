/* ═══════════════════════════════════════════════════════════
   shared-sidebar.js  —  Dzire
   ملف مشترك بين student-dashboard.html و course-player.html
   يُحمَّل أول شيء بعد axios في كل صفحة
═══════════════════════════════════════════════════════════ */

const SHARED_API = 'http://localhost:3000/api';
const SHARED_SRV = 'http://localhost:3000';

/* ─────────────────────────────────────
   Auth guard — إذا لا يوجد توكن أرجعه
───────────────────────────────────── */
(function guardAuth() {
    if (!localStorage.getItem('token')) {
        window.location.href = 'login.html';
    }
})();

/* ─────────────────────────────────────
   Helper: روابط الـ nav في course-player
   تحتاج href وليس data-page
───────────────────────────────────── */
function _isPlayerPage() {
    return window.location.pathname.includes('course-player');
}

/* ─────────────────────────────────────
   Helper: بناء رابط الأفاتار
───────────────────────────────────── */
function _buildUrl(path) {
    if (!path) return null;
    return path.startsWith('http') ? path : `${SHARED_SRV}/${path}`;
}

/* ─────────────────────────────────────
   Helper: الأحرف الأولى من الاسم
───────────────────────────────────── */
function _initials(name) {
    return (name || '').split(' ').filter(Boolean)
        .map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

/* ─────────────────────────────────────
   Helper: عنوان المستوى
───────────────────────────────────── */
function _rankTitle(level) {
    if (level >= 10) return 'Master';
    if (level >= 8)  return 'Code Warrior';
    if (level >= 6)  return 'Developer';
    if (level >= 4)  return 'Apprentice';
    return 'Beginner';
}

/* ─────────────────────────────────────
   Helper: fetch مع التوكن
───────────────────────────────────── */
async function _get(endpoint) {
    const res = await fetch(`${SHARED_API}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    return res.json();
}

/* ═══════════════════════════════════════
   تحديث الـ Sidebar بالبيانات الحقيقية
═══════════════════════════════════════ */
async function loadSharedSidebar() {
    try {
        /* ── 1. بيانات المستخدم ── */
        const meData = await _get('/auth/me');
        if (meData?.success) {
            const u        = meData.user;
            const initials = _initials(u.full_name);
            const firstName= (u.full_name || '').split(' ')[0];

            /* اسم الـ sidebar */
            const nameEl = document.querySelector('.sidebar-profile .profile-name');
            if (nameEl) nameEl.textContent = u.full_name;

            /* أحرف الأفاتار */
            const avatarEl = document.querySelector('.sidebar-profile .profile-avatar');
            if (avatarEl) avatarEl.textContent = initials;

            /* Welcome title — فقط في Dashboard */
            const welcomeEl = document.querySelector('.welcome-title span');
            if (welcomeEl) welcomeEl.textContent = firstName;

            /* Profile page inputs */
            ['full_name', 'username', 'email'].forEach(field => {
                const inp = document.querySelector(`#page-profile input[data-field="${field}"]`);
                if (inp && u[field] != null) inp.value = u[field];
            });

            localStorage.setItem('user', JSON.stringify(u));
        }

        /* ── 2. Gamification ── */
        const statsData = await _get('/gamification/me');
        if (statsData?.success) {
            const s            = statsData.stats;
            const XP_PER_LEVEL = 1000;
            const xpInLevel    = s.total_xp % XP_PER_LEVEL;
            const xpToNext     = XP_PER_LEVEL - xpInLevel;
            const pct          = Math.round((xpInLevel / XP_PER_LEVEL) * 100);
            const rank         = _rankTitle(s.current_level);
            const el           = sel => document.querySelector(sel);

            /* Sidebar role */
            if (el('.sidebar-profile .profile-role'))
                el('.sidebar-profile .profile-role').textContent = `Level ${s.current_level} · ${rank}`;

            /* Topbar XP bar */
            if (el('.xp-label strong'))
                el('.xp-label strong').textContent = s.total_xp.toLocaleString();
            if (el('.xp-fill'))
                el('.xp-fill').style.width = `${pct}%`;
            if (el('.xp-level'))
                el('.xp-level').textContent = `Lv.${s.current_level}`;

            /* Welcome banner — Dashboard فقط */
            if (el('.level-num'))  el('.level-num').textContent  = s.current_level;
            if (el('.level-xp'))   el('.level-xp').textContent   = `${s.total_xp.toLocaleString()} XP`;
            if (el('.level-next')) el('.level-next').textContent  = `${xpToNext} XP to Level ${s.current_level + 1}`;
            if (el('.level-title')) el('.level-title').textContent = `${rank} 🗡️`;

            /* SVG ring */
            const ring = el('.level-ring circle:last-child');
            if (ring) ring.setAttribute('stroke-dashoffset', (213.6 - 213.6 * pct / 100).toFixed(1));

            /* Streak */
            if (s.current_streak !== undefined) {
                const subEl = el('.welcome-sub');
                if (subEl) subEl.innerHTML =
                    `You're on a <strong>${s.current_streak}-day streak</strong>! Keep it up — you're crushing it.`;
            }

            /* Big avatar level */
            const bigLevel = el('.big-avatar-level');
            if (bigLevel) bigLevel.textContent = s.current_level;

            /* Profile stat values */
            const statVals = document.querySelectorAll('.profile-stat-val');
            if (statVals[0]) statVals[0].textContent = s.total_xp.toLocaleString();
            if (statVals[1]) statVals[1].textContent = s.current_level;
            if (statVals[4]) statVals[4].textContent = s.current_streak ?? '—';
        }

        /* ── 3. Profile (avatar + bio) ── */
        const profileData = await _get('/profile/me');
        if (profileData?.success) {
            const p = profileData.profile;

            /* Bio */
            const bioEl = document.querySelector('#page-profile .form-textarea');
            if (p.bio && bioEl) bioEl.value = p.bio;

            /* Avatar image */
            if (p.avatar_url) {
                const url      = _buildUrl(p.avatar_url);
                const avatarEl = document.querySelector('.sidebar-profile .profile-avatar');
                if (avatarEl) {
                    avatarEl.style.backgroundImage    = `url(${url})`;
                    avatarEl.style.backgroundSize     = 'cover';
                    avatarEl.style.backgroundPosition = 'center';
                    avatarEl.textContent = '';
                }
                /* Big avatar في صفحة Profile */
                const bigAvatar = document.querySelector('.big-avatar');
                if (bigAvatar) {
                    bigAvatar.style.backgroundImage    = `url(${url})`;
                    bigAvatar.style.backgroundSize     = 'cover';
                    bigAvatar.style.backgroundPosition = 'center';
                    bigAvatar.childNodes.forEach(n => {
                        if (n.nodeType === Node.TEXT_NODE) n.textContent = '';
                    });
                }
            }
        }

    } catch (err) {
        console.error('[Dzire Sidebar]', err);
    }
}

/* ═══════════════════════════════════════
   Continue Learning + Stat Card
   (Dashboard فقط)
═══════════════════════════════════════ */
async function loadDashboardCourses() {
    try {
        const res  = await _get('/courses/enrolled');
        const data = res?.data?.courses ?? res?.courses ?? res?.data ?? [];
        const courses = Array.isArray(data) ? data : [];

        /* Stat card */
        const total  = courses.length;
        const active = courses.filter(c => Number(c.progress_percentage ?? 0) < 100).length;
        const statTotal  = document.getElementById('stat-total-courses');
        const statActive = document.getElementById('stat-active-courses');
        const navBadge   = document.getElementById('nav-courses-count');
        if (statTotal)  statTotal.textContent  = total;
        if (statActive) statActive.textContent = `${active} active`;
        if (navBadge)   navBadge.textContent   = total;

        /* Continue Learning */
        const container = document.getElementById('dashCourseList');
        if (!container) return;

        const ongoing = courses
            .filter(c => Number(c.progress_percentage ?? 0) < 100)
            .slice(0, 2);

        if (!ongoing.length) {
            container.innerHTML = '<p style="padding:20px;color:var(--text-3)">No courses in progress.</p>';
            return;
        }

        container.innerHTML = ongoing.map(c => {
            const id      = c.id ?? c._id ?? c.course_id;
            const title   = c.title ?? 'Course';
            const teacher = c.teacher_name ?? 'Instructor';
            const pct     = Math.round(Number(c.progress_percentage ?? 0));
            const thumb   = c.thumbnail_url
                ? (c.thumbnail_url.startsWith('http') ? c.thumbnail_url : `${SHARED_SRV}${c.thumbnail_url}`)
                : null;
            const btnLabel = pct > 0 ? 'Resume ▶' : 'Start ▶';

            const imgBlock = thumb
                ? `<img src="${thumb}" alt="${title}"
                        style="width:100%;height:100%;object-fit:cover;display:block;"
                        onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                   <div style="display:none;width:100%;height:100%;align-items:center;
                               justify-content:center;font-size:28px;background:var(--bg-3)">📚</div>`
                : `<div style="width:100%;height:100%;display:flex;align-items:center;
                              justify-content:center;font-size:28px;background:var(--bg-3)">📚</div>`;

            return `
            <div style="display:flex;gap:14px;align-items:center;
                        padding:12px;border-radius:12px;margin-bottom:12px;
                        background:var(--bg-2);border:1px solid var(--border-md);
                        cursor:pointer;transition:background 0.2s;"
                 onmouseenter="this.style.background='var(--bg-3)'"
                 onmouseleave="this.style.background='var(--bg-2)'"
                 onclick="window.location.href='course-player.html?courseId=${id}'">

                <div style="width:72px;height:56px;border-radius:8px;
                            overflow:hidden;flex-shrink:0;position:relative;">
                    ${imgBlock}
                </div>

                <div style="flex:1;min-width:0;">
                    <div style="font-weight:600;font-size:14px;color:var(--text-1);
                                white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
                                margin-bottom:3px;">${title}</div>
                    <div style="font-size:12px;color:var(--text-3);margin-bottom:8px;">
                        👨‍🏫 ${teacher}</div>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <div style="flex:1;height:5px;background:var(--bg-3);
                                    border-radius:4px;overflow:hidden;">
                            <div style="width:${pct}%;height:100%;
                                        background:var(--blue-500);border-radius:4px;"></div>
                        </div>
                        <span style="font-size:11px;font-weight:700;
                                     color:var(--blue-500);white-space:nowrap;">${pct}%</span>
                    </div>
                </div>

                <button class="btn btn-primary"
                        style="flex-shrink:0;font-size:12px;padding:7px 14px;border-radius:8px;"
                        onclick="event.stopPropagation();
                                 window.location.href='course-player.html?courseId=${id}'">
                    ${btnLabel}
                </button>
            </div>`;
        }).join('');

    } catch (err) {
        console.error('[Dzire Dashboard Courses]', err);
    }
}

/* ═══════════════════════════════════════
   Sidebar Toggle
═══════════════════════════════════════ */
function initSidebarToggle() {
    const sidebarEl = document.getElementById('sidebar');
    const mainEl    = document.getElementById('main');
    const toggleBtn = document.getElementById('sidebarToggle');
    if (!toggleBtn || !sidebarEl || !mainEl) return;

    let collapsed = false;
    toggleBtn.addEventListener('click', () => {
        collapsed = !collapsed;
        sidebarEl.classList.toggle('collapsed', collapsed);
        mainEl.classList.toggle('expanded',     collapsed);
        toggleBtn.textContent = collapsed ? '▶' : '◀';
    });
}

/* ═══════════════════════════════════════
   INIT
═══════════════════════════════════════ */
window.addEventListener('load', async () => {
    initSidebarToggle();
    await loadSharedSidebar();

    /* تحميل كورسات الـ Dashboard فقط إذا كنا في الصفحة الصحيحة */
    if (document.getElementById('dashCourseList')) {
        await loadDashboardCourses();
    }
});