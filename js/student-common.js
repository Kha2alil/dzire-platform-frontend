// ==================== student-common.js ====================
// Shared utilities for all student pages (plain script, no modules)

const API = 'http://localhost:3000/api';
const SERVER_URL = 'http://localhost:3000';

// ─────────────────────────────────────────────────────────────
// Auth helpers
window.getToken = function() {
    return localStorage.getItem('token');
};

window.getUser = function() {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
};

window.logout = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
};

// ─────────────────────────────────────────────────────────────
// API calls
window.apiCall = async function(method, endpoint, body = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.getToken()}`
            }
        };
        if (body) options.body = JSON.stringify(body);
        const res = await fetch(`${API}${endpoint}`, options);
        return await res.json();
    } catch (err) {
        console.error('API error:', err);
        return null;
    }
};

window.apiUpload = async function(endpoint, formData) {
    try {
        const res = await fetch(`${API}${endpoint}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${window.getToken()}` },
            body: formData
        });
        return await res.json();
    } catch (err) {
        console.error('Upload error:', err);
        return null;
    }
};

// ─────────────────────────────────────────────────────────────
// Toast notifications
window.showToast = function(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span><span class="toast-msg">${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// ─────────────────────────────────────────────────────────────
// Modal helpers
window.openModal = function(id) {
    const modal = document.getElementById(`modal-${id}`);
    if (modal) modal.classList.add('open');
};

window.closeModal = function(id) {
    const modal = document.getElementById(`modal-${id}`);
    if (modal) modal.classList.remove('open');
};

// ─────────────────────────────────────────────────────────────
// Helper: rank title from level
window.getRankTitle = function(level) {
    if (level >= 10) return 'Master';
    if (level >= 8)  return 'Code Warrior';
    if (level >= 6)  return 'Developer';
    if (level >= 4)  return 'Apprentice';
    return 'Beginner';
};

// Helper: initials from full name
window.getInitials = function(fullName) {
    return (fullName || '')
        .split(' ')
        .filter(Boolean)
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

// Helper: set avatar image (background)
window.setAvatarImage = function(url) {
    const fullUrl = url.startsWith('http') ? url : `${SERVER_URL}/${url}`;
    const smallAvatar = document.querySelector('.sidebar-profile .profile-avatar');
    if (smallAvatar) {
        smallAvatar.style.backgroundImage = `url(${fullUrl})`;
        smallAvatar.style.backgroundSize = 'cover';
        smallAvatar.style.backgroundPosition = 'center';
        smallAvatar.textContent = '';
    }
    const bigAvatar = document.querySelector('.big-avatar');
    if (bigAvatar) {
        bigAvatar.style.backgroundImage = `url(${fullUrl})`;
        bigAvatar.style.backgroundSize = 'cover';
        bigAvatar.style.backgroundPosition = 'center';
        bigAvatar.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) node.textContent = '';
        });
    }
};

// ─────────────────────────────────────────────────────────────
// Notifications panel
let notificationsData = [
    { dot:'var(--amber)',    msg:'Your streak is at <strong>28 days</strong>! Keep it up 🔥',             time:'1 hr ago',   unread:true  },
    { dot:'var(--green)',    msg:'You earned the <strong>Quiz Champion</strong> badge!',                  time:'2 hr ago',   unread:true  },
    { dot:'var(--blue-400)', msg:'New lesson: <strong>JWT Authentication with Node.js</strong>',          time:'5 hr ago',   unread:true  },
    { dot:'var(--purple)',   msg:'<strong>Khalil K.</strong> posted feedback on your REST API quest',     time:'Yesterday',  unread:false },
    { dot:'var(--red)',      msg:'Boss Exam <strong>Full-Stack Lv.3</strong> unlocks in 2 more quests',   time:'2 days ago', unread:false },
];

function updateNotifBadge() {
    const badge = document.getElementById('notifBadge');
    if (badge) badge.style.display = notificationsData.some(n => n.unread) ? 'block' : 'none';
}

function renderNotifications() {
    const list = document.getElementById('notifList');
    if (!list) return;
    list.innerHTML = notificationsData.map((n, idx) => `
        <div class="notif-item ${n.unread ? 'unread' : ''}" data-idx="${idx}">
            <div class="notif-dot-small" style="background:${n.dot}"></div>
            <div class="notif-content">
                <div class="notif-msg">${n.msg}</div>
                <div class="notif-ts">${n.time}</div>
            </div>
        </div>
    `).join('');
    document.querySelectorAll('.notif-item').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(el.dataset.idx);
            if (!isNaN(idx) && notificationsData[idx]) {
                notificationsData[idx].unread = false;
                el.classList.remove('unread');
                updateNotifBadge();
            }
        });
    });
    updateNotifBadge();
}

function initNotifications() {
    renderNotifications();
    const clearBtn = document.getElementById('clearNotif');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            notificationsData.forEach(n => n.unread = false);
            document.querySelectorAll('.notif-item').forEach(el => el.classList.remove('unread'));
            updateNotifBadge();
        });
    }
    const notifBtn = document.getElementById('notifBtn');
    const panel = document.getElementById('notifPanel');
    if (notifBtn && panel) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            panel.classList.toggle('open');
        });
        document.addEventListener('click', (e) => {
            if (!notifBtn.contains(e.target)) panel.classList.remove('open');
        });
    }
}

// ─────────────────────────────────────────────────────────────
// Sidebar toggle
window.initSidebarToggle = function() {
    const sidebar = document.getElementById('sidebar');
    const main = document.getElementById('main');
    const toggleBtn = document.getElementById('sidebarToggle');
    if (!sidebar || !main || !toggleBtn) return;
    let collapsed = false;
    toggleBtn.addEventListener('click', () => {
        collapsed = !collapsed;
        sidebar.classList.toggle('collapsed', collapsed);
        main.classList.toggle('expanded', collapsed);
        toggleBtn.textContent = collapsed ? '▶' : '◀';
    });
};

// Global search (placeholder)
window.initGlobalSearch = function() {
    const searchInput = document.getElementById('globalSearch');
    if (!searchInput) return;
    searchInput.addEventListener('input', function() {
        const q = this.value.toLowerCase().trim();
        if (!q) return;
        console.log('Global search:', q);
    });
};

// ─────────────────────────────────────────────────────────────
// Load user data (profile, gamification) into sidebar and topbar
window.loadSharedUserData = async function() {
    try {
        const meRes = await window.apiCall('GET', '/auth/me');
        if (meRes && meRes.success) {
            const user = meRes.user;
            const fullName = user.full_name;
            const initials = window.getInitials(fullName);
            const firstName = fullName.split(' ')[0];

            const nameEl = document.querySelector('.sidebar-profile .profile-name');
            if (nameEl) nameEl.textContent = fullName;
            const avatarEl = document.querySelector('.sidebar-profile .profile-avatar');
            if (avatarEl) avatarEl.textContent = initials;

            const welcomeSpan = document.querySelector('.welcome-title span');
            if (welcomeSpan) welcomeSpan.textContent = firstName;

            const fullNameInput = document.querySelector('#page-profile input[data-field="full_name"]');
            if (fullNameInput) fullNameInput.value = fullName;
            const usernameInput = document.querySelector('#page-profile input[data-field="username"]');
            if (usernameInput && user.username) usernameInput.value = user.username;
            const emailInput = document.querySelector('#page-profile input[data-field="email"]');
            if (emailInput && user.email) emailInput.value = user.email;

            localStorage.setItem('user', JSON.stringify(user));
        }

        const statsRes = await window.apiCall('GET', '/gamification/me');
        if (statsRes && statsRes.success) {
            const s = statsRes.stats;
            const XP_PER_LEVEL = 3000;               // Keep consistent with backend
            const xpInLevel = s.total_xp % XP_PER_LEVEL;
            const xpToNext = XP_PER_LEVEL - xpInLevel;
            const pct = Math.round((xpInLevel / XP_PER_LEVEL) * 100);
            const rankTitle = window.getRankTitle(s.current_level);

            // 1. Sidebar role
            const roleEl = document.querySelector('.sidebar-profile .profile-role');
            if (roleEl) roleEl.textContent = `Level ${s.current_level} · ${rankTitle}`;

            // 2. Topbar XP display
            const xpStrong = document.querySelector('.xp-label strong');
            if (xpStrong) xpStrong.textContent = s.total_xp.toLocaleString();

            const xpFill = document.querySelector('.xp-fill');
            if (xpFill) xpFill.style.width = `${pct}%`;

            const xpLevel = document.querySelector('.xp-level');
            if (xpLevel) xpLevel.textContent = `Lv.${s.current_level}`;

            // 3. Dashboard welcome banner (level ring & info)
            const levelNum = document.querySelector('.level-num');
            if (levelNum) levelNum.textContent = s.current_level;

            const levelXp = document.querySelector('.level-xp');
            if (levelXp) levelXp.textContent = `${s.total_xp.toLocaleString()} XP`;

            const levelNext = document.querySelector('.level-next');
            if (levelNext) levelNext.textContent = `${xpToNext} XP to Level ${s.current_level + 1}`;

            const levelTitle = document.querySelector('.level-title');
            if (levelTitle) levelTitle.textContent = `${rankTitle} 🗡️`;

            // 4. SVG ring (circumference = 2 * π * 34 ≈ 213.6)
            const ring = document.querySelector('.level-ring circle:last-child');
            if (ring) {
                const circumference = 213.6;
                const offset = circumference - (circumference * pct / 100);
                ring.setAttribute('stroke-dashoffset', offset.toFixed(1));
            }

            // 5. Streak in welcome banner
            if (s.current_streak !== undefined) {
                const streakSub = document.querySelector('.welcome-sub');
                if (streakSub) {
                    streakSub.innerHTML = `You're on a <strong>${s.current_streak}-day streak</strong>! Keep it up — you're crushing it.`;
                }
            }

            // 6. Big avatar level (profile page)
            const bigLevel = document.querySelector('.big-avatar-level');
            if (bigLevel) bigLevel.textContent = s.current_level;

            // 7. Profile page stats – prefer IDs over indices (more robust)
            const totalXpEl = document.getElementById('statTotalXp');
            if (totalXpEl) totalXpEl.textContent = s.total_xp.toLocaleString();

            const levelEl = document.getElementById('statCurrentLevel');
            if (levelEl) levelEl.textContent = s.current_level;

            const streakEl = document.getElementById('statStreak');
            if (streakEl) streakEl.textContent = s.current_streak ?? '—';

            // Fallback for older profile pages that still use .profile-stat-val indices
            const statVals = document.querySelectorAll('.profile-stat-val');
            if (statVals.length >= 5) {
                if (!document.getElementById('statTotalXp')) statVals[0].textContent = s.total_xp.toLocaleString();
                if (!document.getElementById('statCurrentLevel')) statVals[1].textContent = s.current_level;
                if (!document.getElementById('statStreak')) statVals[4].textContent = s.current_streak ?? '—';
            }
        }

        const profileRes = await window.apiCall('GET', '/profile/me');
        if (profileRes && profileRes.success) {
            const p = profileRes.profile;
            const bioEl = document.getElementById('profileBio');
            if (p.bio && bioEl) bioEl.value = p.bio;
            if (p.avatar_url) window.setAvatarImage(p.avatar_url);
        }
    } catch (err) {
        console.error('Error loading shared user data:', err);
    }
};

// ─────────────────────────────────────────────────────────────
// Initialisation to be called on every student page
window.initStudentCommon = async function() {
    window.initSidebarToggle();
    initNotifications();
    window.initGlobalSearch();
    await window.loadSharedUserData();
};

// Auto-run when DOM is ready (optional, but we can let each page call it explicitly)
// For pages that don't call it, we can run it automatically.
document.addEventListener('DOMContentLoaded', () => {
    // If the page hasn't already called initStudentCommon, do it now.
    if (typeof window._studentCommonInitialized === 'undefined') {
        window.initStudentCommon();
        window._studentCommonInitialized = true;
    }
});