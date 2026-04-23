/* ═══════════════════════════════════════════════════════════
   student-leaderboard.js - Leaderboard للطلاب
   المسار: /api/students/leaderboard
   ═══════════════════════════════════════════════════════════ */

// تكوين Axios – الأساس http://localhost:3000
axios.defaults.baseURL = 'http://localhost:3000';
const token = localStorage.getItem('token');
if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

let LEADERBOARD_DATA = [];
let currentTimeframe = 'week';

// ====================== دوال مساعدة ======================
function generateInitials(name) {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

function stringToRGB(str, alpha) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    const hex = "00000".substring(0, 6 - c.length) + c;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ====================== جلب البيانات ======================
async function fetchLeaderboard() {
    try {
        // المسار الصحيح: /api/students/leaderboard
        const response = await axios.get(`/api/students/leaderboard?timeframe=${currentTimeframe}`);
        if (response.data && response.data.success) {
            const users = response.data.data || [];
            LEADERBOARD_DATA = users.map((user, index) => ({
                ...user,
                rank: index + 1,
                initials: generateInitials(user.name),
                color: user.color || stringToRGB(user.name, 0.2),
                tcolor: user.tcolor || stringToRGB(user.name, 1.0),
                isMe: user.isMe === true
            }));
            renderPodium();
            renderRankings();
            updateHeaderBadge();
        } else {
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('Leaderboard fetch error:', error);
        if (typeof showToast === 'function') {
            showToast('Failed to load leaderboard', 'error');
        } else {
            alert('Failed to load leaderboard');
        }
    }
}

// ====================== عرض المنصة ======================
function renderPodium() {
    const container = document.getElementById('podium');
    if (!container || LEADERBOARD_DATA.length < 3) {
        if (container) container.innerHTML = '<div class="empty-state">Not enough data</div>';
        return;
    }
    const top3 = LEADERBOARD_DATA.slice(0, 3);
    const podiumOrder = [top3[1], top3[0], top3[2]];
    const podiumClass = ['p2', 'p1', 'p3'];
    container.innerHTML = podiumOrder.map((p, i) => `
        <div class="podium-slot ${podiumClass[i]}">
            <div class="podium-avatar" style="background:${p.color}; color:${p.tcolor}">
                ${p.rank === 1 ? '<div class="podium-crown">👑</div>' : ''}
                ${p.initials}
            </div>
            <div class="podium-name">${p.name.split(' ')[0]}</div>
            <div class="podium-xp">${parseInt(p.xp || 0).toLocaleString()} XP</div>
            <div class="podium-block">${p.rank}</div>
        </div>
    `).join('');
}

// ====================== عرض الجدول ======================
function renderRankings() {
    const container = document.getElementById('leaderboardTable');
    if (!container) return;
    if (!LEADERBOARD_DATA.length) {
        container.innerHTML = '<tr><td colspan="6">No data available</td></table>';
        return;
    }
    container.innerHTML = LEADERBOARD_DATA.map(p => {
        const rankIcon = p.rank <= 3
            ? ['🥇', '🥈', '🥉'][p.rank - 1]
            : `<span class="rank-num">#${p.rank}</span>`;
        return `
            <tr class="${p.isMe ? 'me-row' : ''}">
                <td><div class="rank-cell">${rankIcon}${p.isMe ? '<div class="badge badge-blue">You</div>' : ''}</div></td>
                <td>
                    <div class="user-cell">
                        <div class="avatar" style="background:${p.color}; color:${p.tcolor}">${p.initials}</div>
                        <div class="user-name">${escapeHtml(p.name)}</div>
                    </div>
                </td>
                <td><span class="badge badge-amber">Lv. ${p.level || 1}</span></td>
                <td><span class="lb-xp">${parseInt(p.xp || 0).toLocaleString()}</span></td>
                <td class="lb-quests">${p.quests || 0}</td>
                <td><span class="lb-streak">🔥 ${p.streak || 0}d</span></td>
            </tr>
        `;
    }).join('');
}

// ====================== تحديث النص "You are ranked #X" ======================
function updateHeaderBadge() {
    const me = LEADERBOARD_DATA.find(u => u.isMe === true);
    if (me) {
        const badgeDiv = document.querySelector('.section-header .badge');
        if (badgeDiv) badgeDiv.textContent = `You are #${me.rank}`;
        const subtitle = document.querySelector('.section-subtitle');
        if (subtitle) {
            subtitle.innerHTML = `Top students this week · You are ranked #${me.rank} ${me.rank === 1 ? '👑' : me.rank === 2 ? '🥈' : me.rank === 3 ? '🥉' : ''}`;
        }
    }
}

// ====================== تغيير الفترة الزمنية ======================
function initTimeframeSelector() {
    const selector = document.getElementById('leaderboardTimeframe');
    if (!selector) return;
    selector.addEventListener('change', async (e) => {
        currentTimeframe = e.target.value;
        await fetchLeaderboard();
    });
}

// ====================== تشغيل التهيئة ======================
document.addEventListener('DOMContentLoaded', () => {
    fetchLeaderboard();
    initTimeframeSelector();
});