// ========== CONFIGURATION & STATE ==========
const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('courseId');
const token = localStorage.getItem('token');
const API_BASE = 'http://localhost:3000/api';
const API_COURSES = `${API_BASE}/courses`;
const API_STUDENTS = `${API_BASE}/students`;

if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

let courseData = { title: "", chapters: [] };
let currentLesson = null;
let assessmentsList = [];
let currentSubdomainId = null;
window.courseData = courseData;

// ========== تحديث شريط XP العلوي ==========
function updateTopbarUI(totalXP, level) {
  const xpLabel = document.querySelector('.xp-label strong');
  if (xpLabel) xpLabel.innerText = totalXP;
  const xpLevel = document.querySelector('.xp-level');
  if (xpLevel) xpLevel.innerText = `Lv.${level}`;
  const nextLevelXP = Math.floor(totalXP / 100 + 1) * 100;
  const xpFill = document.querySelector('.xp-fill');
  if (xpFill) xpFill.style.width = `${(totalXP / nextLevelXP) * 100}%`;
  localStorage.setItem('totalXP', totalXP);
  localStorage.setItem('currentLevel', level);
}

// ========== جلب أحدث إحصائيات XP ==========
async function fetchAndUpdateGamificationStats() {
  try {
    const res = await axios.get(`${API_BASE}/gamification/me`);
    if (res.data && res.data.stats) {
      updateTopbarUI(res.data.stats.total_xp || 0, res.data.stats.current_level || 1);
      return true;
    }
  } catch (err) { /* silent */ }
  return false;
}

// ========== جلب subdomain_id ==========
async function fetchCourseSubdomain() {
  try {
    const res = await axios.get(`${API_COURSES}/${courseId}/subdomain`);
    if (res.data && res.data.success && res.data.data.id) {
      currentSubdomainId = res.data.data.id;
      return true;
    }
  } catch (err) { /* silent */ }
  return false;
}

// ========== إرسال XP ==========
async function callUpdateProgress(xpGained) {
  if (!currentSubdomainId && !(await fetchCourseSubdomain())) return false;
  let studentId = localStorage.getItem('userId');
  if (!studentId && token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      studentId = payload.id || payload.userId;
      localStorage.setItem('userId', studentId);
    } catch (e) { return false; }
  }
  if (!studentId) return false;
  await axios.post(`${API_STUDENTS}/${studentId}/update`, {
    subdomainId: currentSubdomainId,
    xpGained: xpGained
  });
  return true;
}

// ========== تحميل تفاصيل الكورس ==========
async function fetchCourseDetails(shouldLoadFirst = false) {
  if (!courseId) { window.location.href = 'student-dashboard.html'; return; }
  try {
    await fetchCourseSubdomain();
    await fetchAndUpdateGamificationStats();

    const resChapters = await axios.get(`${API_COURSES}/${courseId}/chapters`);
    const chapters = resChapters.data.data || resChapters.data;

    courseData.chapters = await Promise.all(chapters.map(async (chapter) => {
      try {
        const resLessons = await axios.get(`${API_COURSES}/${courseId}/chapters/${chapter.id}/lessons`);
        return { ...chapter, lessons: resLessons.data.data || resLessons.data };
      } catch (err) {
        return { ...chapter, lessons: [] };
      }
    }));

    await fetchAssessments();

    try {
      const resProgress = await axios.get(`${API_COURSES}/enrolled`);
      const enrolledCourses = resProgress.data.data.courses || [];
      const currentCourse = enrolledCourses.find(c => String(c.id) === String(courseId));
      courseData.last_completed_order = currentCourse ? Number(currentCourse.last_completed_order) : 0;
    } catch (progErr) {
      courseData.last_completed_order = 0;
    }

    document.getElementById('pageTitle').innerText = "Dzire - Learning Space";
    if (shouldLoadFirst && courseData.chapters.length > 0) {
      const firstChapter = courseData.chapters[0];
      if (firstChapter.lessons?.length) {
        await loadLessonDetails(firstChapter.lessons[0].id, firstChapter.id);
      }
    }
    renderSidebar();
  } catch (err) {
    showToast("Failed to load course", "error");
  }
}

// ========== جلب التقييمات ==========
async function fetchAssessments() {
  try {
    const res = await axios.get(`${API_STUDENTS}/courses/${courseId}/assessments`);
    assessmentsList = res.data.success ? res.data.data || [] : [];
  } catch (err) { assessmentsList = []; }
}

// ========== تحميل الدرس ==========
async function loadLessonDetails(lessonId, chapterId) {
  try {
    const res = await axios.get(`${API_COURSES}/${courseId}/lessons/${lessonId}`);
    currentLesson = { ...res.data.data || res.data, id: lessonId, chapterId: chapterId };
    document.getElementById('assessmentContent').style.display = 'none';
    updateLessonDisplay();
    renderSidebar();
  } catch (err) { showToast("Failed to load lesson", "error"); }
}

// ========== عرض القائمة الجانبية – بسيطة جداً ==========
function renderSidebar() {
  const sidebar = document.getElementById('playerSidebar');
  if (!sidebar) return;
  let html = '';

  courseData.chapters.forEach(chapter => {
    html += `<div class="chapter-block">`;
    html += `<div class="chapter-title">${escapeHtml(chapter.title)}</div>`;
    html += `<div class="lessons-list">`;

    chapter.lessons.forEach(lesson => {
      const isActive = currentLesson && String(currentLesson.id) === String(lesson.id);
      const statusClass = isActive ? 'active' : '';

      html += `<div class="lesson-item ${statusClass}" onclick="window.handleLessonClick('${lesson.id}', '${chapter.id}')" style="cursor:pointer;">
                ${escapeHtml(lesson.title)}
              </div>`;
    });

    html += `</div></div>`;
  });

  sidebar.innerHTML = html;
}

window.handleLessonClick = async (lessonId, chapterId) => {
  await loadLessonDetails(lessonId, chapterId);
};

function setActiveTab(tab) { /* unchanged */ }

function updateLessonDisplay() {
  if (!currentLesson) return;
  document.getElementById('lessonTitle').innerText = currentLesson.title || "";
  document.getElementById('lessonDesc').innerText = currentLesson.summary_text || currentLesson.description || "";
  document.getElementById('xpReward').innerText = currentLesson.xp || 0;

  // Video / PDF / Text logic unchanged…

  const completeBtn = document.getElementById('completeLessonBtn');
  if (completeBtn) {
    const isCompleted = checkIfLessonDone(currentLesson.id);
    completeBtn.innerText = isCompleted ? "COMPLETED" : "MARK AS COMPLETED";
    completeBtn.disabled = isCompleted;
  }
}

function checkIfLessonDone(lessonId) {
  let currentOrder = 0;
  for (const ch of courseData.chapters) {
    const lesson = ch.lessons.find(l => String(l.id) === String(lessonId));
    if (lesson) { currentOrder = lesson.order_index; break; }
  }
  return currentOrder <= courseData.last_completed_order;
}

// ========== زر إكمال الدرس ==========
const completeBtn = document.getElementById('completeLessonBtn');
if (completeBtn) {
  completeBtn.onclick = async () => {
    if (!currentLesson) return;
    const btn = completeBtn;
    btn.innerText = "SAVING...";
    btn.disabled = true;
    try {
      await axios.post(`${API_COURSES}/complete-lesson`, {
        courseId, chapterId: currentLesson.chapterId, lessonId: currentLesson.id,
        xp_reward: Number(currentLesson.xp || 0)
      });
      await callUpdateProgress(Number(currentLesson.xp || 0));
      await fetchAndUpdateGamificationStats();
      showToast("🎉 Lesson completed! XP added.", "success");
      await fetchCourseDetails(); // re-fetch to update locks
    } catch (err) {
      showToast("Failed to save progress", "error");
      btn.innerText = "MARK AS COMPLETED";
      btn.disabled = false;
    }
  };
}

// ========== التقييمات ==========
window.loadAssessmentInline = async function (assessmentId) { /* unchanged */ };
function displayAssessmentInline(assessment) { /* unchanged */ };
async function submitAssessmentInline(assessment) {
  // ... collect answers...
  const res = await axios.post(`${API_COURSES}/assessments/${assessment.id}/submit`, { answers });
  if (res.data.success) {
    showToast(`Score: ${res.data.score}% - ${res.data.passed ? 'Passed ✅' : 'Failed ❌'}`, res.data.passed ? 'success' : 'error');
    if (res.data.passed) await fetchCourseDetails();
  }
}

// ========== دوال مساعدة ==========
function showToast(msg, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 3000);
}

function escapeHtml(str) { return str ? str.replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m])) : ''; }
function escapeAttr(str) { return String(str).replace(/"/g, '&quot;'); }

fetchCourseDetails(true);