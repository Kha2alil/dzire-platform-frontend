// ==================== student-skill-tree.js ====================
// Renders the Skill Tree page

// SKILL_TREE data – copied exactly from original student-app.js
const SKILL_TREE = [
    { tier:'Foundation', skills:[
        { name:'HTML & CSS Basics',       icon:'🌐', xp:200, status:'unlocked' },
        { name:'JavaScript Fundamentals', icon:'⚡', xp:300, status:'unlocked' },
        { name:'Git & Version Control',   icon:'🔀', xp:150, status:'unlocked' },
    ]},
    { tier:'Core Skills', skills:[
        { name:'CSS Flexbox & Grid',      icon:'🎨', xp:250, status:'unlocked' },
        { name:'DOM Manipulation',        icon:'🖱️', xp:200, status:'unlocked' },
        { name:'Async JavaScript',        icon:'🔄', xp:350, status:'active'   },
        { name:'REST API Concepts',       icon:'🔗', xp:300, status:'active'   },
    ]},
    { tier:'Advanced', skills:[
        { name:'Node.js & Express',       icon:'🗄️', xp:400, status:'active'   },
        { name:'React Framework',         icon:'⚛️', xp:450, status:'locked'   },
        { name:'PostgreSQL & SQL',        icon:'🗃️', xp:380, status:'locked'   },
        { name:'Authentication & JWT',    icon:'🔐', xp:320, status:'locked'   },
    ]},
    { tier:'Mastery', skills:[
        { name:'Full-Stack Architecture', icon:'🏗️', xp:500, status:'locked'   },
        { name:'Deployment & DevOps',     icon:'🚀', xp:480, status:'locked'   },
        { name:'Testing & TDD',           icon:'🧪', xp:420, status:'locked'   },
    ]},
];

// Render function – identical to original renderSkillTree()
function renderSkillTree() {
    const container = document.getElementById('skillTreeWrap');
    if (!container) return;

    const bgMap = { unlocked:'rgba(16,185,129,0.15)', active:'rgba(59,130,246,0.15)', locked:'rgba(255,255,255,0.04)' };
    container.innerHTML = SKILL_TREE.map(tier => `
        <div class="skill-tier">
            <div class="skill-tier-label">${tier.tier}</div>
            <div class="skill-row">
                ${tier.skills.map(s => `
                    <div class="skill-node skill-${s.status}" ${s.status !== 'locked' ? 'onclick="showToast(\'Skill selected!\',\'success\')"' : ''}>
                        ${s.status === 'unlocked' ? '<div class="skill-check">✓</div>' : ''}
                        <div class="skill-node-icon" style="background:${bgMap[s.status]}">${s.icon}</div>
                        <div>
                            <div class="skill-node-name">${s.name}</div>
                            <div class="skill-node-xp">${s.status === 'unlocked' ? '✓ ' : ''}${s.xp} XP</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    renderSkillTree();
});