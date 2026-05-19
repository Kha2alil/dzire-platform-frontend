// ==================== student-common.js ====================
// Shared utilities for all student pages

const API = 'http://localhost:3000/api';
const SERVER_URL = 'http://localhost:3000';

// ─── XP Level Configuration ──────────────────────────────
const GENERAL_LEVEL_THRESHOLDS = [
  0,    // Level 1
  100,  // Level 2
  220,  // Level 3
  364,  // Level 4
  537,  // Level 5
  744,  // Level 6
  993,  // Level 7
  1292, // Level 8
  1650, // Level 9
  2080, // Level 10
  2596, // Level 11
  3215, // Level 12
  3958, // Level 13
  4850, // Level 14
  5920, // Level 15
  7204, // Level 16
  8745, // Level 17
  10594,// Level 18
  12813,// Level 19
  15476,// Level 20
  18671,// Level 21
  22505,// Level 22
  27106,// Level 23
  32627,// Level 24
  39252,// Level 25
  47202,// Level 26
  56742,// Level 27
  68190,// Level 28
  81928,// Level 29
  98314 // Level 30
];

function calculateGlobalLevel(totalXP) {
  let level = 1;
  for (let i = 0; i < GENERAL_LEVEL_THRESHOLDS.length; i++) {
    if (totalXP >= GENERAL_LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
}

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
function getRankTitle(level) {
  if (level >= 30) return 'Grand Master';
  if (level >= 27) return 'Sage';
  if (level >= 24) return 'Architect';
  if (level >= 21) return 'Virtuoso';
  if (level >= 18) return 'Expert';
  if (level >= 15) return 'Master';
  if (level >= 12) return 'Craftsman';
  if (level >= 9)  return 'Builder';
  if (level >= 6)  return 'Apprentice';
  if (level >= 3)  return 'Initiate';
  return 'Beginner';
}

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

// ─── NOTIFICATION POLLING + BADGE CELEBRATION POPUP (timestamp‑based) ───
(function () {
    const API_BASE = 'http://localhost:3000';
    const TS_KEY = 'lastSeenNotificationTimestamp';
    let lastSeenTs = localStorage.getItem(TS_KEY) || '1970-01-01T00:00:00.000Z';

    function getToken() {
        return localStorage.getItem('token') || localStorage.getItem('dzire_token') || '';
    }

    const notifBtn   = document.getElementById('notifBtn');
    const notifPanel = document.getElementById('notifPanel');
    const notifBadge = document.getElementById('notifBadge');
    const notifList  = document.getElementById('notifList');
    const clearBtn   = document.getElementById('clearNotif');

    if (notifBtn && notifPanel) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notifPanel.classList.toggle('open');
            if (notifPanel.classList.contains('open')) loadNotifications();
        });

        document.addEventListener('click', (e) => {
            if (!notifPanel.contains(e.target) && e.target !== notifBtn && !notifBtn.contains(e.target)) {
                notifPanel.classList.remove('open');
            }
        });

        if (clearBtn) {
            clearBtn.addEventListener('click', async () => {
                try {
                    await axios.patch(`${API_BASE}/api/notifications/read-all`, {}, {
                        headers: { Authorization: `Bearer ${getToken()}` }
                    });
                    loadNotifications();
                } catch (err) {
                    console.error('Mark all read failed:', err);
                }
            });
        }
    }

    async function loadNotifications() {
        try {
            const res = await axios.get(`${API_BASE}/api/notifications?limit=20`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const notifications = res.data.notifications || [];
            const unreadCount = notifications.filter(n => !n.is_read).length;
            updateBadge(unreadCount);

            if (notifList) {
                if (notifications.length === 0) {
                    notifList.innerHTML = '<div class="notif-item"><span style="color:var(--text-3)">No notifications</span></div>';
                } else {
                    notifList.innerHTML = notifications.map(n => `
                        <div class="notif-item ${n.is_read ? '' : 'unread'}" data-id="${n.id}">
                            <div class="notif-content" onclick="window.markNotifRead('${n.id}'); if('${n.link}') location.href='${n.link}'">
                                <strong>${escapeHtml(n.title)}</strong><br>${escapeHtml(n.message)}
                            </div>
                            <div class="notif-ts">${timeAgo(n.created_at)}</div>
                        </div>`).join('');
                }
            }

            const unreadBadgeNotifications = notifications.filter(
                n => !n.is_read && n.title && n.title.includes('New Badge')
            );

            for (const n of unreadBadgeNotifications) {
                if (n.created_at > lastSeenTs) {
                    showBadgeCelebration(n);
                }
            }

            if (notifications.length > 0) {
                const newestTs = notifications[0].created_at;
                if (newestTs > lastSeenTs) {
                    lastSeenTs = newestTs;
                    localStorage.setItem(TS_KEY, lastSeenTs);
                }
            }
        } catch (err) {
            console.error('Failed to load notifications:', err);
        }
    }

    window.loadNotifications = loadNotifications;

    setInterval(async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/notifications?limit=5`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const notifications = res.data.notifications || [];
            if (notifications.length === 0) return;

            const newNotifications = notifications.filter(n => n.created_at > lastSeenTs);
            if (!newNotifications.length) return;

            lastSeenTs = notifications[0].created_at;
            localStorage.setItem(TS_KEY, lastSeenTs);

            for (const n of newNotifications) {
                if (n.title && n.title.includes('New Badge')) {
                    showBadgeCelebration(n);
                } else {
                    window.showToast(`${n.title} – ${n.message}`, 'success');
                }
                const unreadCount = notifications.filter(x => !x.is_read).length;
                updateBadge(unreadCount);
                if (notifPanel && notifPanel.classList.contains('open')) {
                    loadNotifications();
                }
            }
        } catch (err) {
            // Silently ignore polling errors
        }
    }, 30000);

    function showBadgeCelebration(notification) {
        const old = document.querySelector('.badge-celebrate-overlay');
        if (old) old.remove();

        const overlay = document.createElement('div');
        overlay.className = 'badge-celebrate-overlay';

        const badgeName = notification.title.replace('🏅 New Badge: ', '').replace('New Badge: ', '');
        const badgeDesc = notification.message;

        overlay.innerHTML = `
            <div class="badge-celebrate-card">
                <div class="badge-celebrate-close" id="badgeCelebrateClose">✕</div>
                <div class="badge-celebrate-icon">🎖️</div>
                <div class="badge-celebrate-name">${escapeHtml(badgeName)}</div>
                <div class="badge-celebrate-desc">${escapeHtml(badgeDesc)}</div>
                <button class="badge-celebrate-btn" onclick="location.href='student-badges.html'">View My Badges</button>
            </div>
        `;

        document.body.appendChild(overlay);

        const closeBtn = overlay.querySelector('#badgeCelebrateClose');
        closeBtn.addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });

        setTimeout(() => {
            if (document.body.contains(overlay)) overlay.remove();
        }, 8000);
    }

    window.testBadgePopup = function() {
        showBadgeCelebration({
            title: '🏅 New Badge: Code Warrior',
            message: 'You earned the "Code Warrior" badge!',
            created_at: new Date().toISOString()
        });
    };

    function updateBadge(count) {
        if (notifBadge) {
            notifBadge.style.display = count > 0 ? 'block' : 'none';
            notifBadge.textContent = count;
        }
    }

    window.markNotifRead = async function (id) {
        try {
            await axios.patch(`${API_BASE}/api/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
        } catch (err) {
            console.error('Mark read failed:', err);
        }
    };

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
    }

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

    loadNotifications();
})();

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
window.loadSharedUserData = async function () {
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

            // ── Placement badge (sub‑domain level) ──
            try {
                const onboarding = JSON.parse(localStorage.getItem('onboarding'));
                const welcomeTitle = document.querySelector('.welcome-title');
                if (welcomeTitle && onboarding && onboarding.level) {
                    const placementLevel = onboarding.level.charAt(0).toUpperCase() + onboarding.level.slice(1);
                    let badge = welcomeTitle.querySelector('.placement-badge');
                    if (!badge) {
                        badge = document.createElement('span');
                        badge.className = 'badge badge-amber placement-badge';
                        badge.style.marginLeft = '10px';
                        badge.style.fontSize = '13px';
                        welcomeTitle.appendChild(badge);
                    }
                    badge.textContent = `📚 Course Level: ${placementLevel}`;
                } else if (welcomeTitle && (!onboarding || !onboarding.level)) {
                    // If onboarding data is missing, fetch from API
                    const statusRes = await window.apiCall('GET', '/onboarding/status');
                    if (statusRes && statusRes.success && statusRes.onboardingDone) {
                        const level = statusRes.result.level || 'beginner';
                        const placementLevel = level.charAt(0).toUpperCase() + level.slice(1);
                        let badge = welcomeTitle.querySelector('.placement-badge');
                        if (!badge) {
                            badge = document.createElement('span');
                            badge.className = 'badge badge-amber placement-badge';
                            badge.style.marginLeft = '10px';
                            badge.style.fontSize = '13px';
                            welcomeTitle.appendChild(badge);
                        }
                        badge.textContent = `📚 Course Level: ${placementLevel}`;
                        // Save to localStorage for next time
                        localStorage.setItem('onboarding', JSON.stringify({
                            level: level,
                            subdomain_id: statusRes.result.subdomain_id,
                            domain_id: statusRes.result.domain_id
                        }));
                    }
                }
            } catch (e) {
                console.warn('Placement badge update failed:', e);
            }

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
            const totalXP = s.total_xp;
            const level = calculateGlobalLevel(totalXP);

            // XP bracket for progress bar
            const currentBracketLow = GENERAL_LEVEL_THRESHOLDS[level - 1];
            const nextThreshold = level < GENERAL_LEVEL_THRESHOLDS.length
                ? GENERAL_LEVEL_THRESHOLDS[level]
                : GENERAL_LEVEL_THRESHOLDS[GENERAL_LEVEL_THRESHOLDS.length - 1];
            const bracketXP = nextThreshold - currentBracketLow;
            const xpGainedInBracket = totalXP - currentBracketLow;
            const pct = bracketXP > 0 ? Math.round((xpGainedInBracket / bracketXP) * 100) : 0;
            const xpToNext = nextThreshold - totalXP;
            const rankTitle = getRankTitle(level);

            // ── Sidebar role ──
            const roleEl = document.querySelector('.sidebar-profile .profile-role');
            if (roleEl) {
                let roleText = `Level ${level} · ${rankTitle}`;
                try {
                    const onboarding = JSON.parse(localStorage.getItem('onboarding'));
                    if (onboarding && onboarding.level) {
                        const placementLevel = onboarding.level.charAt(0).toUpperCase() + onboarding.level.slice(1);
                        if (!rankTitle.toLowerCase().includes(onboarding.level.toLowerCase())) {
                            roleText += ` · ${placementLevel}`;
                        }
                    }
                } catch (e) { }
                roleEl.textContent = roleText;
            }

            // ── Topbar XP bar ──
            const xpStrong = document.querySelector('.xp-label strong');
            if (xpStrong) xpStrong.textContent = totalXP.toLocaleString();
            const xpFill = document.querySelector('.xp-fill');
            if (xpFill) xpFill.style.width = `${pct}%`;
            const xpLevel = document.querySelector('.xp-level');
            if (xpLevel) xpLevel.textContent = `Lv.${level}`;

            // ── Dashboard level ring ──
            const levelNum = document.querySelector('.level-num');
            if (levelNum) levelNum.textContent = level;
            const levelXp = document.querySelector('.level-xp');
            if (levelXp) levelXp.textContent = `${totalXP.toLocaleString()} / ${nextThreshold.toLocaleString()} XP`;
            const levelNext = document.querySelector('.level-next');
            if (levelNext) levelNext.textContent = `${xpToNext.toLocaleString()} XP to Level ${level + 1}`;
            const levelTitle = document.querySelector('.level-title');
            if (levelTitle) levelTitle.textContent = `${rankTitle} 🗡️`;
            const ring = document.querySelector('.level-ring circle:last-child');
            if (ring) {
                const circumference = 213.6;
                const offset = circumference - (circumference * pct / 100);
                ring.setAttribute('stroke-dashoffset', offset.toFixed(1));
            }

            // ── Profile page stats ──
            const bigLevel = document.querySelector('.big-avatar-level');
            if (bigLevel) bigLevel.textContent = level;
            const totalXpEl = document.getElementById('statTotalXp');
            if (totalXpEl) totalXpEl.textContent = totalXP.toLocaleString();
            const levelEl = document.getElementById('statCurrentLevel');
            if (levelEl) levelEl.textContent = level;
            const streakEl = document.getElementById('statStreak');
            if (streakEl) streakEl.textContent = s.current_streak ?? '—';
            const statVals = document.querySelectorAll('.profile-stat-val');
            if (statVals.length >= 5) {
                if (!document.getElementById('statTotalXp')) statVals[0].textContent = totalXP.toLocaleString();
                if (!document.getElementById('statCurrentLevel')) statVals[1].textContent = level;
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

// ==============================
// IMMEDIATE BADGE CELEBRATION
// ==============================
window.checkForNewBadges = async function() {
    try {
        const token = localStorage.getItem('token') || '';
        const res = await axios.get('http://localhost:3000/api/badges/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.data.success || !res.data.badges) return;

        const badges = res.data.badges;
        const lastCount = parseInt(localStorage.getItem('lastBadgeCount') || '0', 10);

        if (badges.length > lastCount) {
            // A new badge was earned – show the latest one
            const latestBadge = badges[0]; // badges are ordered by earned_at DESC
            const overlay = document.createElement('div');
            overlay.className = 'badge-celebrate-overlay';
            overlay.innerHTML = `
                <div class="badge-celebrate-card">
                    <div class="badge-celebrate-close" id="badgeCelebrateClose">✕</div>
                    <div class="badge-celebrate-icon">🎖️</div>
                    <div class="badge-celebrate-name">${escapeHtml(latestBadge.name)}</div>
                    <div class="badge-celebrate-desc">${escapeHtml(latestBadge.description || 'New badge earned!')}</div>
                    <button class="badge-celebrate-btn" onclick="location.href='student-badges.html'">View My Badges</button>
                </div>
            `;
            document.body.appendChild(overlay);

            const closeBtn = overlay.querySelector('#badgeCelebrateClose');
            closeBtn.addEventListener('click', () => overlay.remove());
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) overlay.remove();
            });
            setTimeout(() => {
                if (document.body.contains(overlay)) overlay.remove();
            }, 8000);

            // Update stored count
            localStorage.setItem('lastBadgeCount', badges.length);
        }
    } catch (err) {
        // Silently ignore – the popup is optional
    }
};

// Initialise the badge count on page load
(async function initBadgeCount() {
    try {
        const token = localStorage.getItem('token') || '';
        const res = await axios.get('http://localhost:3000/api/badges/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success && res.data.badges) {
            localStorage.setItem('lastBadgeCount', res.data.badges.length);
        }
    } catch (err) { /* ignore */ }
})();

// ─────────────────────────────────────────────────────────────
// Initialisation
window.initStudentCommon = async function() {
    window.initSidebarToggle();
    window.initGlobalSearch();
    await window.loadSharedUserData();
};

// Auto-run when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window._studentCommonInitialized === 'undefined') {
        window.initStudentCommon();
        window._studentCommonInitialized = true;
    }
});