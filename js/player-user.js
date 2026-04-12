/* ══════════════════════════════════════
   player-user.js  —  Dzire Course Player
   يُحمَّل في course-player.html فقط
   يجلب بيانات المستخدم ويحدّث الـ sidebar
══════════════════════════════════════ */

const PLAYER_API = 'http://localhost:3000/api';

function playerGetToken() {
    return localStorage.getItem('token');
}

/* إذا لا يوجد توكن — أرجعه لتسجيل الدخول */
if (!playerGetToken()) {
    window.location.href = 'login.html';
}

/* ─────────────────────────────────────
   تحديث الـ Sidebar بالبيانات الحقيقية
───────────────────────────────────── */
async function loadPlayerUserData() {
    try {
        /* 1. بيانات المستخدم الأساسية */
        const meRes = await fetch(`${PLAYER_API}/auth/me`, {
            headers: { 'Authorization': `Bearer ${playerGetToken()}` }
        });
        const meData = await meRes.json();

        if (meData?.success) {
            const user      = meData.user;
            const fullName  = user.full_name ?? 'Student';
            const initials  = fullName.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);

            /* الاسم في الـ sidebar */
            const nameEl = document.querySelector('.sidebar-profile .profile-name');
            if (nameEl) nameEl.textContent = fullName;

            /* الأحرف الأولى في الأفاتار */
            const avatarEl = document.querySelector('.sidebar-profile .profile-avatar');
            if (avatarEl) avatarEl.textContent = initials;
        }

        /* 2. بيانات الـ Gamification (XP / Level) */
        const statsRes = await fetch(`${PLAYER_API}/gamification/me`, {
            headers: { 'Authorization': `Bearer ${playerGetToken()}` }
        });
        const statsData = await statsRes.json();

        if (statsData?.success) {
            const s            = statsData.stats;
            const XP_PER_LEVEL = 1000;
            const xpInLevel    = s.total_xp % XP_PER_LEVEL;
            const pct          = Math.round((xpInLevel / XP_PER_LEVEL) * 100);

            /* Rank title */
            let rankTitle = 'Beginner';
            if (s.current_level >= 10) rankTitle = 'Master';
            else if (s.current_level >= 8) rankTitle = 'Code Warrior';
            else if (s.current_level >= 6) rankTitle = 'Developer';
            else if (s.current_level >= 4) rankTitle = 'Apprentice';

            /* sidebar role */
            const roleEl = document.querySelector('.sidebar-profile .profile-role');
            if (roleEl) roleEl.textContent = `Level ${s.current_level} · ${rankTitle}`;

            /* topbar XP bar */
            const xpStrong = document.querySelector('.xp-label strong');
            if (xpStrong) xpStrong.textContent = s.total_xp.toLocaleString();

            const xpFill = document.querySelector('.xp-fill');
            if (xpFill) xpFill.style.width = `${pct}%`;

            const xpLevel = document.querySelector('.xp-level');
            if (xpLevel) xpLevel.textContent = `Lv.${s.current_level}`;
        }

        /* 3. الأفاتار الصورة إذا وُجدت */
        const profileRes = await fetch(`${PLAYER_API}/profile/me`, {
            headers: { 'Authorization': `Bearer ${playerGetToken()}` }
        });
        const profileData = await profileRes.json();

        if (profileData?.success && profileData.profile?.avatar_url) {
            const url       = profileData.profile.avatar_url;
            const fullUrl   = url.startsWith('http') ? url : `http://localhost:3000/${url}`;
            const avatarEl  = document.querySelector('.sidebar-profile .profile-avatar');
            if (avatarEl) {
                avatarEl.style.backgroundImage    = `url(${fullUrl})`;
                avatarEl.style.backgroundSize     = 'cover';
                avatarEl.style.backgroundPosition = 'center';
                avatarEl.textContent = '';
            }
        }

    } catch (err) {
        console.error('[Dzire Player] loadPlayerUserData:', err);
    }
}

/* ─────────────────────────────────────
   Sidebar Toggle (نفس منطق الـ Dashboard)
───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    const sidebarEl = document.getElementById('sidebar');
    const mainEl    = document.getElementById('main');
    const toggleBtn = document.getElementById('sidebarToggle');

    if (toggleBtn && sidebarEl && mainEl) {
        let collapsed = false;
        toggleBtn.addEventListener('click', () => {
            collapsed = !collapsed;
            sidebarEl.classList.toggle('collapsed', collapsed);
            mainEl.classList.toggle('expanded', collapsed);
            toggleBtn.textContent = collapsed ? '▶' : '◀';
        });
    }

    /* تشغيل جلب البيانات */
    loadPlayerUserData();
});