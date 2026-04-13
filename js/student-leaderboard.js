// ==================== student-leaderboard.js ====================
// Renders the Leaderboard page with podium and rankings

// LEADERBOARD_DATA – copied exactly from original student-app.js
const LEADERBOARD_DATA = [
    { name:'Nour Aissaoui',  initials:'NA', color:'rgba(34,211,238,0.2)',  tcolor:'var(--cyan)',     level:9, xp:3400, quests:22, streak:35, rank:1, isMe:false },
    { name:'Ahmed Mansouri', initials:'AM', color:'rgba(59,130,246,0.2)',  tcolor:'var(--blue-400)', level:8, xp:2840, quests:17, streak:28, rank:2, isMe:true  },
    { name:'Sara Benali',    initials:'SB', color:'rgba(167,139,250,0.2)', tcolor:'var(--purple)',   level:7, xp:2600, quests:15, streak:20, rank:3, isMe:false },
    { name:'Rami Tahir',     initials:'RT', color:'rgba(245,158,11,0.2)',  tcolor:'var(--amber)',    level:6, xp:2100, quests:13, streak:14, rank:4, isMe:false },
    { name:'Amira Saad',     initials:'AS', color:'rgba(167,139,250,0.2)', tcolor:'var(--purple)',   level:6, xp:1980, quests:12, streak:10, rank:5, isMe:false },
    { name:'Yacine Merad',   initials:'YM', color:'rgba(16,185,129,0.2)',  tcolor:'var(--green)',    level:5, xp:1650, quests:10, streak:7,  rank:6, isMe:false },
    { name:'Karim Bouzid',   initials:'KB', color:'rgba(59,130,246,0.2)',  tcolor:'var(--blue-400)', level:4, xp:1200, quests:8,  streak:5,  rank:7, isMe:false },
    { name:'Lina Khelifi',   initials:'LK', color:'rgba(239,68,68,0.2)',   tcolor:'var(--red)',      level:3, xp:890,  quests:5,  streak:3,  rank:8, isMe:false },
];

// Render podium (top 3)
function renderPodium() {
    const container = document.getElementById('podium');
    if (!container) return;

    const top3 = LEADERBOARD_DATA.slice(0, 3);
    const podiumOrder = [top3[1], top3[0], top3[2]];
    const podiumClass = ['p2', 'p1', 'p3'];
    const podiumRanks = ['2', '1', '3'];
    const crowns = [null, '👑', null];

    container.innerHTML = podiumOrder.map((p, i) => `
        <div class="podium-slot ${podiumClass[i]}">
            <div class="podium-avatar" style="background:${p.color};color:${p.tcolor}">
                ${crowns[i] ? `<div class="podium-crown">${crowns[i]}</div>` : ''}
                ${p.initials}
            </div>
            <div class="podium-name">${p.name.split(' ')[0]}</div>
            <div class="podium-xp">${p.xp.toLocaleString()} XP</div>
            <div class="podium-block">${podiumRanks[i]}</div>
        </div>
    `).join('');
}

// Render full rankings table
function renderRankings() {
    const container = document.getElementById('leaderboardTable');
    if (!container) return;

    container.innerHTML = LEADERBOARD_DATA.map(p => {
        const rankIcon = p.rank <= 3
            ? ['🥇','🥈','🥉'][p.rank - 1]
            : `<span class="rank-num">#${p.rank}</span>`;
        return `
            <tr class="${p.isMe ? 'me-row' : ''}">
                <td><div class="rank-cell">${rankIcon}${p.isMe ? '<div class="badge badge-blue">You</div>' : ''}</div></td>
                <td><div class="user-cell"><div class="avatar" style="background:${p.color};color:${p.tcolor}">${p.initials}</div><div class="user-name">${p.name}</div></div></td>
                <td><span class="badge badge-amber">Lv. ${p.level}</span></td>
                <td><span class="lb-xp">${p.xp.toLocaleString()}</span></td>
                <td class="lb-quests">${p.quests}</td>
                <td><span class="lb-streak">🔥 ${p.streak}d</span></td>
            </tr>
        `;
    }).join('');
}

// Timeframe selector – currently static (just shows toast)
function initTimeframeSelector() {
    const selector = document.getElementById('leaderboardTimeframe');
    if (selector) {
        selector.addEventListener('change', (e) => {
            showToast(`Leaderboard filtered by ${e.target.options[e.target.selectedIndex].text} (demo)`, 'success');
            // In a real implementation, you would fetch new data from API here
        });
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    renderPodium();
    renderRankings();
    initTimeframeSelector();
});