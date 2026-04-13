// ==================== student-badges.js ====================
// Renders the Badges & Achievements page

// BADGES_DATA – copied exactly from original student-app.js
const BADGES_DATA = [
    { name:'First Steps',       icon:'👶', desc:'Complete your first lesson',        color:'rgba(59,130,246,0.15)',  earned:true,  date:'Feb 10' },
    { name:'Code Warrior',      icon:'⚔️', desc:'Complete 10 quests',                color:'rgba(239,68,68,0.15)',   earned:true,  date:'Feb 18' },
    { name:'CSS Wizard',        icon:'🎨', desc:'Score 90%+ on a CSS quiz',          color:'rgba(167,139,250,0.15)', earned:true,  date:'Mar 1'  },
    { name:'Streak Master',     icon:'🔥', desc:'Maintain a 14-day streak',          color:'rgba(245,158,11,0.15)',  earned:true,  date:'Feb 25' },
    { name:'Quiz Champion',     icon:'🏆', desc:'Pass 5 quizzes in a row',           color:'rgba(16,185,129,0.15)',  earned:true,  date:'Mar 3'  },
    { name:'OSS Contributor',   icon:'📦', desc:'Publish an npm package',            color:'rgba(34,211,238,0.12)',  earned:true,  date:'Mar 5'  },
    { name:'Night Owl',         icon:'🦉', desc:'Study past midnight 3 times',       color:'rgba(99,102,241,0.15)',  earned:true,  date:'Feb 22' },
    { name:'Speed Runner',      icon:'⚡', desc:'Complete a quiz in under 5 min',     color:'rgba(251,191,36,0.15)',  earned:true,  date:'Feb 28' },
    { name:'Perfect Score',     icon:'💯', desc:'Score 100% on any assessment',      color:'rgba(16,185,129,0.15)',  earned:true,  date:'Mar 1'  },
    { name:'Bookworm',          icon:'📚', desc:'Read 20 lessons in a week',         color:'rgba(59,130,246,0.15)',  earned:true,  date:'Feb 16' },
    { name:'Team Player',       icon:'🤝', desc:'Help 3 students in forums',         color:'rgba(245,158,11,0.15)',  earned:true,  date:'Mar 4'  },
    { name:'API Master',        icon:'🔗', desc:'Complete the REST API quest',       color:'rgba(167,139,250,0.15)', earned:false, date:null     },
    { name:'Full-Stack Knight', icon:'🛡️', desc:'Pass the Full-Stack Boss Exam',     color:'rgba(239,68,68,0.15)',   earned:false, date:null     },
    { name:'Security Guard',    icon:'🔐', desc:'Complete the Secure the API quest', color:'rgba(34,211,238,0.12)',  earned:false, date:null     },
    { name:'DevOps Initiate',   icon:'🚀', desc:'Deploy an app to production',       color:'rgba(99,102,241,0.15)',  earned:false, date:null     },
    { name:'React Master',      icon:'⚛️', desc:'Complete the React course 100%',    color:'rgba(34,211,238,0.12)',  earned:false, date:null     },
];

// Render badges grid – identical to original renderBadges()
function renderBadges() {
    const container = document.getElementById('badgeGrid');
    if (!container) return;

    const earnedCount = BADGES_DATA.filter(b => b.earned).length;
    const totalCount = BADGES_DATA.length;
    const progressPercent = Math.round((earnedCount / totalCount) * 100);

    // Update progress text and bar
    const progressCountSpan = document.getElementById('badgeProgressCount');
    if (progressCountSpan) {
        progressCountSpan.textContent = `${earnedCount} / ${totalCount} badges`;
    }
    const progressFill = document.getElementById('badgeProgressFill');
    if (progressFill) {
        progressFill.style.width = `${progressPercent}%`;
    }

    container.innerHTML = BADGES_DATA.map(b => `
        <div class="badge-card ${b.earned ? '' : 'badge-locked'}">
            <div class="badge-icon" style="background:${b.color}">${b.icon}</div>
            <div class="badge-name">${b.name}</div>
            <div class="badge-desc">${b.desc}</div>
            ${b.earned ? `<div class="badge-earned-date">✓ Earned ${b.date}</div>` : '<div class="badge-not-earned">Not earned yet</div>'}
        </div>
    `).join('');
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    renderBadges();
});