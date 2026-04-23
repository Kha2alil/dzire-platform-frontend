// ==================== student-badges.js ====================
const API_BASE = 'http://localhost:3000';
const SKILL_CATEGORY_MAP = {
    'Frontend Development': ['Frontend'],
    'Backend Development': ['Backend'],
    'Full-Stack Development': ['Frontend', 'Backend'],
    'default': ['Frontend']
};

let allBadges = [];
let earnedSet = new Set();
let currentFilter = 'all';

function getAuthToken() {
    return localStorage.getItem('token')
        || localStorage.getItem('dzire_token')
        || localStorage.getItem('jwt')
        || '';
}

async function fetchData(endpoint) {
    const token = getAuthToken();
    const res = await axios.get(endpoint, {
        baseURL: API_BASE,
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
}

function getBadgeIcon(name) {
    const map = {
        'First Steps': '👶', 'Code Warrior': '⚔️', 'Quiz Champion': '🏆', 'Perfect Score': '💯',
        'Course Hunter': '🔍', 'Course Champion': '🏅',
        'Sharp Mind': '🧠', 'Skill Unlocker': '🔓', 'Skill Evolver': '🧬', 'Mastery Achieved': '🏆',
        'Multi-Skilled': '🔗', 'Boss Slayer': '🗡️', 'Comeback': '🔄', 'Completionist': '🏁',
        'Elite': '👑', 'On Fire': '🔥', 'Streak Master': '🔥', 'Streak Legend': '🔥',
        'Consistent': '📆', 'Marathon': '⏳', 'Night Owl': '🦉',
        'Initiate': '🌱', 'Builder': '🛠️', 'Architect': '🏗️',
        'Apprentice': '⚒️', 'Craftsman': '🪚', 'Master': '🎓',
        'Expert': '⚡', 'Virtuoso': '🎻', 'Sage': '🧙'
    };
    for (const [key, icon] of Object.entries(map)) {
        if (name.includes(key)) return icon;
    }
    return '🎖️';
}

function getBadgeColor(tier) {
    const colors = [
        'rgba(59,130,246,0.15)', 'rgba(16,185,129,0.15)', 'rgba(245,158,11,0.15)',
        'rgba(167,139,250,0.15)', 'rgba(239,68,68,0.15)', 'rgba(34,211,238,0.12)'
    ];
    return colors[tier % colors.length] || colors[0];
}

function conditionToText(condition_json) {
    if (!condition_json) return '';
    const parts = [];
    const fieldNames = {
        total_xp: 'XP',
        courses_completed: 'courses completed',
        total_lessons_completed: 'lessons completed',
        total_courses_completed: 'courses completed',
        total_quizzes_passed: 'quizzes passed',
        perfect_quiz_count: 'perfect scores',
        courses_completed_in_skill: 'courses in this skill'
    };
    for (const [field, opObj] of Object.entries(condition_json)) {
        const operator = Object.keys(opObj)[0];
        const value = opObj[operator];
        const readableField = fieldNames[field] || field;
        parts.push(`${readableField} ${operator} ${value}`);
    }
    return parts.join(', ');
}

function showBadgeDetail(badge) {
    const earned = earnedSet.has(badge.id);
    const rulesHTML = badge.rules && badge.rules.length > 0
        ? badge.rules.map(r => `
            <div class="badge-rule-item">
                <div class="rule-trigger">Trigger: <strong>${r.trigger_event}</strong></div>
                <div class="rule-condition">${conditionToText(r.condition_json)}</div>
            </div>
        `).join('')
        : '<p style="color:var(--text-3)">No detailed requirements available.</p>';

    const modalHTML = `
        <div class="modal-overlay open" id="badgeModal">
            <div class="modal" style="max-width:400px">
                <div class="modal-header">
                    <div class="modal-title">${badge.name}</div>
                    <div class="modal-close" onclick="closeBadgeModal()">✕</div>
                </div>
                <div class="modal-body">
                    <div style="font-size:40px;text-align:center;margin-bottom:12px">${getBadgeIcon(badge.name)}</div>
                    <p style="color:var(--text-2);font-size:14px;line-height:1.6;margin-bottom:16px;text-align:center">${badge.description}</p>
                    <div class="badge-rules-list">${rulesHTML}</div>
                    <div style="text-align:center;margin-top:12px">
                        ${earned 
                            ? '<span style="color:var(--green);font-weight:600">✓ Earned</span>'
                            : '<span style="color:var(--text-3)">🔒 Not yet earned</span>'}
                    </div>
                </div>
            </div>
        </div>
    `;
    const old = document.getElementById('badgeModal');
    if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeBadgeModal() {
    const modal = document.getElementById('badgeModal');
    if (modal) modal.remove();
}

function renderBadges() {
    const container = document.getElementById('badgeGrid');
    if (!container) return;

    let filtered = allBadges;
    if (currentFilter === 'earned') filtered = allBadges.filter(b => earnedSet.has(b.id));
    else if (currentFilter === 'locked') filtered = allBadges.filter(b => !earnedSet.has(b.id));

    const earnedCount = allBadges.filter(b => earnedSet.has(b.id)).length;
    const totalCount = allBadges.length;
    const progressPercent = totalCount === 0 ? 0 : Math.round((earnedCount / totalCount) * 100);

    document.getElementById('badgeProgressCount').textContent = `${earnedCount} / ${totalCount} badges`;
    document.getElementById('badgeProgressFill').style.width = `${progressPercent}%`;
    document.querySelector('.section-subtitle').textContent = `${earnedCount} earned · ${totalCount - earnedCount} more to unlock`;

    container.innerHTML = filtered.map(badge => {
        const earned = earnedSet.has(badge.id);
        return `
            <div class="badge-card ${earned ? '' : 'badge-locked'}" onclick="showBadgeDetail(${JSON.stringify(badge).replace(/"/g, '&quot;')})">
                <div class="badge-icon" style="background:${getBadgeColor(badge.tier)}">${getBadgeIcon(badge.name)}</div>
                <div class="badge-name">${badge.name}</div>
                <div class="badge-desc">${badge.description}</div>
                ${earned ? '<div class="badge-earned-date">✓ Earned</div>' : '<div class="badge-not-earned">Not earned yet</div>'}
            </div>
        `;
    }).join('');
}

// Tabs filtering
function setupTabs() {
    const tabsContainer = document.getElementById('badgeTabs');
    if (!tabsContainer) return;
    tabsContainer.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            tabsContainer.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            renderBadges();
        });
    });
}

async function initBadgesPage() {
    try {
        // Placement categories
        let allowedCategories = SKILL_CATEGORY_MAP.default;
        try {
            const placementData = await fetchData('/api/onboarding/status');
            if (placementData.onboardingDone) {
                const subdomainName = placementData.result.subdomain_name;
                if (SKILL_CATEGORY_MAP[subdomainName]) {
                    allowedCategories = SKILL_CATEGORY_MAP[subdomainName];
                }
            }
        } catch (e) { console.warn('Placement fetch failed.'); }

        // Skills for category mapping
        let skillCategoryMap = {};
        try {
            const skillsData = await fetchData('/api/skills');
            (skillsData.skills || []).forEach(s => { skillCategoryMap[s.id] = s.category; });
        } catch (e) { console.warn('Skills fetch failed.'); }

        // All badges (with rules)
        const badgesData = await fetchData('/api/badges');
        allBadges = (badgesData.badges || []).filter(badge => {
            if (badge.category === 'achievement') return true;
            if (badge.skill_id && skillCategoryMap[badge.skill_id]) {
                return allowedCategories.includes(skillCategoryMap[badge.skill_id]);
            }
            return false;
        });

        // Earned badges
        try {
            const earnedData = await fetchData('/api/badges/me');
            earnedSet = new Set((earnedData.badges || []).map(b => b.id));
        } catch (e) { console.warn('Earned badges fetch failed.'); }

        // Insert tabs HTML dynamically
        const header = document.querySelector('.section-header');
        if (header) {
            const tabsDiv = document.createElement('div');
            tabsDiv.className = 'tabs';
            tabsDiv.id = 'badgeTabs';
            tabsDiv.innerHTML = `
                <div class="tab active" data-filter="all">All</div>
                <div class="tab" data-filter="earned">Earned</div>
                <div class="tab" data-filter="locked">Not Earned</div>
            `;
            header.after(tabsDiv);
        }

        setupTabs();
        renderBadges();
    } catch (error) {
        console.error('Failed to load badges:', error);
        const container = document.getElementById('badgeGrid');
        if (container) container.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Unable to load badges</div></div>';
    }
}

document.addEventListener('DOMContentLoaded', initBadgesPage);
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay') && e.target.id === 'badgeModal') {
        closeBadgeModal();
    }
});