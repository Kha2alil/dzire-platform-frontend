/* teacher-analytics.js */
let allCourses = [];

async function fetchCourses() {
  try {
    const data = await apiCall('GET', '/courses');
    if (data && data.success) {
      allCourses = data.data.courses || [];
      renderAnalyticsTable();
      return allCourses;
    } else return [];
  } catch (err) { return []; }
}

function renderAnalyticsTable() {
  const el = document.getElementById('analyticsTable');
  if (!el) return;
  if (!allCourses.length) {
    el.innerHTML = '<tr><td colspan="6" style="text-align:center">No courses yet</td></tr>';
    return;
  }
  el.innerHTML = allCourses.map(c => {
    const emoji = getCourseEmoji(c.title);
    const score = c.avg_score || 70;
    const scoreColor = score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--amber)' : 'var(--red)';
    const trend = c.trend || '→';
    const trendColor = trend === '↑' ? 'var(--green)' : trend === '↓' ? 'var(--red)' : 'var(--text-3)';
    return `
      <tr>
        <td><div style="display:flex;align-items:center;gap:10px"><div style="font-size:18px">${emoji}</div><div style="font-weight:500">${escapeHtml(c.title)}</div></div></td>
        <td style="color:var(--text-2)">${c.students_count || 0}</td>
        <td><div style="display:flex;align-items:center;gap:8px"><div class="progress-bar" style="width:70px"><div class="progress-fill" style="width:${c.progress || 0}%"></div></div><span style="font-size:12px">${c.progress || 0}%</span></div></td>
        <td><span style="font-weight:700;color:${scoreColor}">${score}%</span></td>
        <td><span style="color:var(--amber)">★</span> ${c.rating || 4.5}</td>
        <td><span style="font-size:16px;color:${trendColor}">${trend}</span></td>
      </tr>
    `;
  }).join('');
}

function getCourseEmoji(title) {
  const t = title.toLowerCase();
  if (t.includes('react')) return '⚛️';
  if (t.includes('node')) return '🗄️';
  if (t.includes('css')) return '🎨';
  if (t.includes('security')) return '🔒';
  if (t.includes('full-stack')) return '🌐';
  return '📚';
}

async function initAnalytics() {
  await fetchCourses();
  renderChart('monthChart', [60,75,50,90,80,110,95,130], ['J','F','M','A','M','J','J','A']);
  renderNotifications();
}
initAnalytics();