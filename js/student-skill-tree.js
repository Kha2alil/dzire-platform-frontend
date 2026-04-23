// ==================== student-skill-tree.js ====================
// Dynamic Skill Tree – with clickable tier details

const API_BASE = 'http://localhost:3000';
const BADGE_TIERS = ['beginner', 'intermediate', 'advanced'];

const SKILL_TREE_CONFIG = {
    'Frontend Development': ['Frontend'],
    'Backend Development': ['Backend'],
    'Full-Stack Development': ['Frontend', 'Backend'],
    'default': ['Frontend']
};

const skillMap = {};
let earnedBadgeTiersGlobal = {};

// Requirements per tier (hardcoded to match seeded rules)
const TIER_REQUIREMENTS = {
    beginner: {
        description: 'Complete at least 1 Beginner course and earn 500 XP in this skill.',
        thresholds: { courses: 1, xp: 500 }
    },
    intermediate: {
        description: 'Complete at least 1 Intermediate course and earn 800 XP in this skill.',
        thresholds: { courses: 1, xp: 800 }
    },
    advanced: {
        description: 'Complete at least 1 Advanced course and earn 1200 XP in this skill.',
        thresholds: { courses: 1, xp: 1200 }
    }
};

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

function mapUnlockedSkills(list) {
    return new Set(list.map(s => s.id));
}

function mapEarnedBadges(list) {
    const map = {};
    list.forEach(b => {
        if (b.category === 'skill' && b.skill_id) {
            if (!map[b.skill_id]) map[b.skill_id] = new Set();
            map[b.skill_id].add(b.required_tier);
        }
    });
    return map;
}

function getSkillIcon(code) {
    const icons = {
        html_basics: '🌐', css_basics: '🎨', js_fundamentals: '⚡',
        git_basics: '🔀', tailwind: '🌬️', github: '🐙',
        nodejs_basics: '🗄️', express: '🚂', database: '🗃️'
    };
    return icons[code] || '📌';
}

async function initSkillTree() {
    try {
        let allowedCategories = SKILL_TREE_CONFIG.default;
        try {
            const placementData = await fetchData('/api/onboarding/status');
            if (placementData.onboardingDone) {
                const subdomainName = placementData.result.subdomain_name;
                if (SKILL_TREE_CONFIG[subdomainName]) {
                    allowedCategories = SKILL_TREE_CONFIG[subdomainName];
                }
            }
        } catch (e) {
            console.warn('Placement fetch failed, using default.');
        }

        const skillsData = await fetchData('/api/skills');
        const allSkills = skillsData.skills || [];
        const visibleSkills = allSkills.filter(s => allowedCategories.includes(s.category));

        let unlockedSkills = new Set();
        try {
            const unlockData = await fetchData('/api/skills/me/unlocked');
            if (unlockData.skills) unlockedSkills = mapUnlockedSkills(unlockData.skills);
        } catch (e) { console.warn('Unlocked skills fetch failed.'); }

        try {
            const badgesData = await fetchData('/api/badges/me');
            if (badgesData.badges) earnedBadgeTiersGlobal = mapEarnedBadges(badgesData.badges);
        } catch (e) { console.warn('Badges fetch failed.'); }

        const tree = buildSkillTree(visibleSkills, unlockedSkills, earnedBadgeTiersGlobal, allowedCategories);
        renderSkillTree(tree);
        updateSummaryBadges(tree);  

    } catch (error) {
        console.error('Failed to init skill tree:', error);
        const container = document.getElementById('skillTreeWrap');
        if (container) container.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Unable to load skill tree</div></div>';
    }
}

function buildSkillTree(skills, unlockedSet, earnedMap, categories) {
    const groups = {};
    skills.forEach(skill => {
        skillMap[skill.id] = skill;
        const cat = skill.category;
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(skill);
    });

    const ordered = categories.filter(c => groups[c]);
    return ordered.map(cat => ({
        tier: cat + ' Skills',
        skills: groups[cat].map(skill => {
            const isUnlocked = unlockedSet.has(skill.id);
            const earned = earnedMap[skill.id] || new Set();
            let state = 'locked';
            if (isUnlocked) {
                const allEarned = BADGE_TIERS.every(t => earned.has(t));
                state = allEarned ? 'mastered' : 'active';
            }
            return {
                id: skill.id,
                name: skill.name,
                icon: getSkillIcon(skill.code),
                state,
                earnedTiers: earned
            };
        })
    }));
}

function updateSummaryBadges(tree) {
    // tree is array of { tier, skills: [{ state, ... }, ...] }
    let mastered = 0, active = 0, locked = 0;
    tree.forEach(group => {
        group.skills.forEach(skill => {
            if (skill.state === 'mastered') mastered++;
            else if (skill.state === 'active') active++;
            else locked++;
        });
    });

    // The three badges in the section-header: .badge-green, .badge-blue, .badge-neutral
    const badges = document.querySelectorAll('#page-skill-tree .section-header .badge');
    if (badges.length >= 3) {
        badges[0].textContent = `${mastered} Mastered`;
        badges[1].textContent = `${active} In Progress`;
        badges[2].textContent = `${locked} Locked`;
    }
}

function renderSkillTree(tree) {
    const container = document.getElementById('skillTreeWrap');
    if (!container) return;
    if (tree.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">🌳</div><div class="empty-title">No skills available for your domain</div></div>';
        return;
    }

    const bgMap = {
        unlocked: 'rgba(16,185,129,0.15)',
        active: 'rgba(59,130,246,0.15)',
        locked: 'rgba(255,255,255,0.04)'
    };

    container.innerHTML = tree.map(group => `
        <div class="skill-tier">
            <div class="skill-tier-label">${group.tier}</div>
            <div class="skill-row">
                ${group.skills.map(s => `
                    <div class="skill-node skill-${s.state === 'mastered' ? 'unlocked' : s.state}"
                         ${s.state !== 'locked' ? `onclick="showSkillDetail('${s.id}')"` : ''}>
                        ${s.state === 'mastered' ? '<div class="skill-check">✓</div>' : ''}
                        <div class="skill-node-icon" style="background:${bgMap[s.state === 'mastered' ? 'unlocked' : s.state]}">${s.icon}</div>
                        <div style="flex:1">
                            <div class="skill-node-name">${s.name}</div>
                            <div class="skill-node-xp">${renderTierDots(s.earnedTiers)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function renderTierDots(earned) {
    return BADGE_TIERS.map(tier => {
        const e = earned.has(tier);
        return `<span class="tier-dot ${e ? 'tier-earned' : ''}" title="${tier}"></span>`;
    }).join('');
}

// ─── SKILL DETAIL MODAL WITH EXPANDABLE TIERS ─────────
async function showSkillDetail(skillId) {
    const skill = skillMap[skillId];
    if (!skill) return;
    const earnedTiers = earnedBadgeTiersGlobal[skillId] || new Set();

    const tierRows = BADGE_TIERS.map(tier => {
        const earned = earnedTiers.has(tier);
        const requirements = TIER_REQUIREMENTS[tier];
        return `
            <div class="modal-tier-row" onclick="toggleTierDetail(this, '${tier}')">
                <div class="tier-dot-big ${earned ? 'tier-earned-big' : ''}"></div>
                <div class="tier-info">
                    <div class="tier-label">${tier.charAt(0).toUpperCase() + tier.slice(1)}</div>
                </div>
                <div class="tier-status">${earned ? '✓' : '—'}</div>
                <div class="tier-chevron">▼</div>
            </div>
            <div class="tier-detail" id="tier-detail-${tier}" style="display:none;">
                <p>${requirements.description}</p>
            </div>
        `;
    }).join('');

    const modalHTML = `
        <div class="modal-overlay open" id="skillModal">
            <div class="modal" style="max-width:420px">
                <div class="modal-header">
                    <div class="modal-title">${skill.name}</div>
                    <div class="modal-close" onclick="closeSkillModal()">✕</div>
                </div>
                <div class="modal-body">
                    <p style="color:var(--text-2); font-size:14px; line-height:1.6; margin-bottom:16px">${skill.description || 'Master this skill to unlock new abilities.'}</p>
                    <div class="skill-modal-tiers">${tierRows}</div>
                </div>
            </div>
        </div>
    `;

    const old = document.getElementById('skillModal');
    if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function toggleTierDetail(row, tier) {
    const detail = document.getElementById('tier-detail-' + tier);
    if (detail) {
        const isHidden = detail.style.display === 'none' || !detail.style.display;
        detail.style.display = isHidden ? 'block' : 'none';
        const chevron = row.querySelector('.tier-chevron');
        if (chevron) chevron.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
    }
}

function closeSkillModal() {
    const modal = document.getElementById('skillModal');
    if (modal) modal.remove();
}

// ─── BOOT ──────────────────────────────────
document.addEventListener('DOMContentLoaded', initSkillTree);

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay') && e.target.id === 'skillModal') {
        closeSkillModal();
    }
});