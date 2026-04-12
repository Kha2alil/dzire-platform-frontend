/* ══════════════════════════════════════
   dashboard-api.js  —  Dzire
   يُحمَّل بعد student-app.js فقط
══════════════════════════════════════ */

const API_BASE   = 'http://localhost:3000/api';
const SERVER_URL = 'http://localhost:3000';

function getAuthToken() {
    return localStorage.getItem('token');
}

/* ─────────────────────────────────────
   جلب الكورسات المسجّلة
───────────────────────────────────── */
async function fetchEnrolledCourses() {
    const res  = await fetch(`${API_BASE}/courses/enrolled`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    const data = await res.json();

    /* data.data.courses  ← الشكل الحقيقي عندك */
    if (Array.isArray(data?.data?.courses))  return data.data.courses;
    if (Array.isArray(data?.courses))        return data.courses;
    if (Array.isArray(data?.data))           return data.data;
    if (Array.isArray(data))                 return data;

    console.warn('[Dzire] شكل رد /enrolled غير متوقع:', data);
    return [];
}

/* ─────────────────────────────────────
   بناء رابط الصورة
───────────────────────────────────── */
function buildThumbnail(url) {
    if (!url) return null;
    return url.startsWith('http') ? url : `${SERVER_URL}${url}`;
}

/* ─────────────────────────────────────
   تحديث Stat Card
───────────────────────────────────── */
function updateEnrolledStat(courses) {
    const total  = courses.length;
    const active = courses.filter(c => Number(c.progress_percentage ?? 0) < 100).length;

    const statTotal  = document.getElementById('stat-total-courses');
    const statActive = document.getElementById('stat-active-courses');
    if (statTotal)  statTotal.textContent  = total;
    if (statActive) statActive.textContent = `${active} active`;

    const navBadge = document.getElementById('nav-courses-count');
    if (navBadge) navBadge.textContent = total;
}

/* ─────────────────────────────────────
   Continue Learning — البطاقات
───────────────────────────────────── */
function updateContinueLearning(courses) {
    const container = document.getElementById('dashCourseList');
    if (!container) return;

    /* أول كورسين غير مكتملين */
    const ongoing = courses
        .filter(c => Number(c.progress_percentage ?? 0) < 100)
        .slice(0, 2);

    if (!ongoing.length) {
        container.innerHTML = `
            <p style="padding:20px;color:var(--text-3)">
                No courses in progress.
            </p>`;
        return;
    }

    container.innerHTML = ongoing.map(c => {
        const id       = c.id ?? c._id ?? c.course_id;
        const title    = c.title ?? 'Course';
        const teacher  = c.teacher_name ?? 'Instructor';
        const pct      = Math.round(Number(c.progress_percentage ?? 0));
        const thumb    = buildThumbnail(c.thumbnail_url);
        const btnLabel = pct > 0 ? 'Resume ▶' : 'Start ▶';

        /* صورة أو placeholder لوني */
        const imageBlock = thumb
            ? `<img src="${thumb}"
                    alt="${title}"
                    style="width:100%;height:100%;object-fit:cover;display:block;"
                    onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
               <div style="display:none;width:100%;height:100%;
                           align-items:center;justify-content:center;
                           font-size:28px;background:var(--bg-3)">📚</div>`
            : `<div style="width:100%;height:100%;
                           display:flex;align-items:center;justify-content:center;
                           font-size:28px;background:var(--bg-3)">📚</div>`;

        return `
        <div style="display:flex;gap:14px;align-items:center;
                    padding:12px;border-radius:12px;margin-bottom:12px;
                    background:var(--bg-2);border:1px solid var(--border-md);
                    cursor:pointer;transition:background 0.2s;"
             onmouseenter="this.style.background='var(--bg-3)'"
             onmouseleave="this.style.background='var(--bg-2)'"
             onclick="window.location.href='course-player.html?courseId=${id}'">

            <!-- Thumbnail -->
            <div style="width:72px;height:56px;border-radius:8px;
                        overflow:hidden;flex-shrink:0;position:relative;">
                ${imageBlock}
            </div>

            <!-- Info -->
            <div style="flex:1;min-width:0;">
                <div style="font-weight:600;font-size:14px;color:var(--text-1);
                            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
                            margin-bottom:3px;">
                    ${title}
                </div>
                <div style="font-size:12px;color:var(--text-3);margin-bottom:8px;">
                    👨‍🏫 ${teacher}
                </div>

                <!-- Progress bar -->
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="flex:1;height:5px;background:var(--bg-3);
                                border-radius:4px;overflow:hidden;">
                        <div style="width:${pct}%;height:100%;
                                    background:var(--blue-500);
                                    border-radius:4px;"></div>
                    </div>
                    <span style="font-size:11px;font-weight:700;
                                 color:var(--blue-500);white-space:nowrap;">
                        ${pct}%
                    </span>
                </div>
            </div>

            <!-- Button -->
            <button class="btn btn-primary"
                    style="flex-shrink:0;font-size:12px;padding:7px 14px;border-radius:8px;"
                    onclick="event.stopPropagation();
                             window.location.href='course-player.html?courseId=${id}'">
                ${btnLabel}
            </button>
        </div>`;
    }).join('');
}

/* ─────────────────────────────────────
   INIT
───────────────────────────────────── */
window.addEventListener('load', async () => {
    if (!getAuthToken()) return;

    try {
        const courses = await fetchEnrolledCourses();
        updateEnrolledStat(courses);
        updateContinueLearning(courses);
    } catch (err) {
        console.error('[Dzire] dashboard-api error:', err);
    }
});
