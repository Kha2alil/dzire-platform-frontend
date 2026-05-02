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

// ========== تحديث شريط XP العلوي ==========
function updateTopbarUI(totalXP, level) {
  const xpLabel = document.querySelector('.xp-label strong');
  if (xpLabel) xpLabel.innerText = totalXP;
  const xpLevel = document.querySelector('.xp-level');
  if (xpLevel) xpLevel.innerText = `Lv.${level}`;
  const nextLevelXP = Math.floor(totalXP / 100 + 1) * 100;
  const xpFill = document.querySelector('.xp-fill');
  if (xpFill) {
    const percent = (totalXP / nextLevelXP) * 100;
    xpFill.style.width = `${percent}%`;
  }
  localStorage.setItem('totalXP', totalXP);
  localStorage.setItem('currentLevel', level);
  console.log(`🎚️ XP UI Updated: ${totalXP} (Level ${level})`);
}

// ========== جلب أحدث إحصائيات XP والمستوى (مثل dashboard) ==========
async function fetchAndUpdateGamificationStats() {
  try {
    const res = await axios.get(`${API_BASE}/gamification/me`);
    if (res.data && res.data.stats) {
      const total_xp = res.data.stats.total_xp || 0;
      const current_level = res.data.stats.current_level || 1;
      updateTopbarUI(total_xp, current_level);
      console.log(`✅ Gamification stats refreshed: XP=${total_xp}, Level=${current_level}`);
      return true;
    } else {
      console.warn("Unexpected response from /gamification/me", res.data);
      return false;
    }
  } catch (err) {
    console.error("Failed to fetch gamification stats:", err.message);
    return false;
  }
}

// ========== جلب subdomain_id من المسار المخصص ==========
async function fetchCourseSubdomain() {
  try {
    const res = await axios.get(`${API_COURSES}/${courseId}/subdomain`);
    if (res.data && res.data.success && res.data.data.id) {
      currentSubdomainId = res.data.data.id;
      console.log("📌 Course subdomain:", currentSubdomainId);
      return true;
    }
  } catch (err) {
    console.error("Failed to fetch subdomain:", err.message);
  }
  return false;
}

// ========== إرسال طلب إضافة XP إلى الخادم ==========
async function callUpdateProgress(xpGained) {
  if (!currentSubdomainId && !(await fetchCourseSubdomain())) {
    console.warn("No subdomainId – skipping XP update");
    return false;
  }
  let studentId = localStorage.getItem('userId');
  if (!studentId && token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      studentId = payload.id || payload.userId;
      localStorage.setItem('userId', studentId);
    } catch (e) { console.error("Failed to decode token", e); }
  }
  if (!studentId) return false;

  try {
    await axios.post(`${API_STUDENTS}/${studentId}/update`, {
      subdomainId: currentSubdomainId,
      xpGained: xpGained
    });
    console.log(`📡 XP update request sent: +${xpGained} XP to subdomain ${currentSubdomainId}`);
    return true;
  } catch (err) {
    console.error("Failed to update XP:", err);
    return false;
  }
}

// ========== تحميل تفاصيل الكورس (الفصول والدروس والتقييمات) ==========
async function fetchCourseDetails(shouldLoadFirst = false) {
  if (!courseId) {
    alert("Course ID not found");
    window.location.href = 'student-dashboard.html';
    return;
  }
  try {
    await fetchCourseSubdomain();

    // 🔥 تحديث الشريط العلوي فور تحميل الصفحة (بدون انتظار أي حدث)
    await fetchAndUpdateGamificationStats();

    const resChapters = await axios.get(`${API_COURSES}/${courseId}/chapters`);
    const chapters = resChapters.data.data || resChapters.data;

    const chaptersWithLessons = await Promise.all(chapters.map(async (chapter) => {
      try {
        const resLessons = await axios.get(`${API_COURSES}/${courseId}/chapters/${chapter.id}/lessons`);
        return { ...chapter, lessons: resLessons.data.data || resLessons.data };
      } catch (err) {
        return { ...chapter, lessons: [] };
      }
    }));
    courseData.chapters = chaptersWithLessons;
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
    console.error("Error fetching course details:", err);
    showToast("Failed to load course, please refresh", "error");
  }
}

// ========== جلب التقييمات ==========
async function fetchAssessments() {
  try {
    const res = await axios.get(`${API_STUDENTS}/courses/${courseId}/assessments`);
    if (res.data.success) assessmentsList = res.data.data || [];
    else assessmentsList = [];
  } catch (err) {
    assessmentsList = [];
  }
}

// ========== تحميل الدرس ==========
async function loadLessonDetails(lessonId, chapterId) {
  try {
    const res = await axios.get(`${API_COURSES}/${courseId}/lessons/${lessonId}`);
    const lessonData = res.data.data || res.data;
    currentLesson = { ...lessonData, id: lessonId, chapterId: chapterId };
    const assessmentDiv = document.getElementById('assessmentContent');
    const videoDiv = document.getElementById('videoContent');
    const pdfDiv = document.getElementById('pdfContent');
    const videoBtn = document.getElementById('modeVideoBtn');
    const pdfBtn = document.getElementById('modePdfBtn');
    if (assessmentDiv) assessmentDiv.style.display = 'none';
    if (videoDiv) videoDiv.style.display = 'block';
    if (pdfDiv) pdfDiv.style.display = 'none';
    if (videoBtn) videoBtn.classList.add('active');
    if (pdfBtn) pdfBtn.classList.remove('active');
    updateLessonDisplay();
    renderSidebar();
  } catch (err) {
    console.error(err);
    showToast("Failed to load lesson", "error");
  }
}

// ========== عرض القائمة الجانبية ==========
function renderSidebar() {
  const sidebar = document.getElementById('playerSidebar');
  if (!sidebar) return;
  let html = '';
  const maxProgress = Number(courseData.last_completed_order || 0);

  courseData.chapters.forEach(chapter => {
    let chapterStatusClass = '';
    const hasActiveLesson = chapter.lessons?.some(l => currentLesson && String(l.id) === String(currentLesson.id));
    const allDone = chapter.lessons?.every(l => Number(l.order_index) <= maxProgress);
    if (allDone && chapter.lessons?.length) chapterStatusClass = 'ch-done';
    else if (hasActiveLesson) chapterStatusClass = 'ch-current';
    html += `<div class="chapter-block ${chapterStatusClass}">`;
    const completedCount = chapter.lessons?.filter(l => Number(l.order_index) <= maxProgress).length || 0;
    const totalLessons = chapter.lessons?.length || 0;
    html += `<div class="chapter-title">${escapeHtml(chapter.title)} <span style="font-size:9px;opacity:0.6;">${completedCount}/${totalLessons}</span></div>`;
    html += `<div class="lessons-list ${completedCount > 0 ? 'has-done' : ''}">`;

    if (chapter.lessons) {
      chapter.lessons.forEach(lesson => {
        const lessonOrder = Number(lesson.order_index || 0);
        const isLocked = (lessonOrder > 1) && (lessonOrder > (maxProgress + 1));
        const isDone = (lessonOrder <= maxProgress) && maxProgress > 0;
        const isActive = (currentLesson && String(currentLesson.id) === String(lesson.id));
        let statusClass = '';
        if (isLocked) statusClass = 'locked';
        else if (isDone) statusClass = 'done';
        else if (isActive) statusClass = 'active';
        html += `<div class="lesson-item ${statusClass}" onclick="${isLocked ? '' : `window.handleLessonClick('${lesson.id}', '${chapter.id}')`}" style="cursor: ${isLocked ? 'not-allowed' : 'pointer'};"><span class="lesson-label">${escapeHtml(lesson.title)}</span></div>`;

        const lessonAssessments = assessmentsList.filter(a => a.lesson_id === lesson.id);
        if (lessonAssessments.length) {
          html += `<div class="lesson-assessments">`;
          lessonAssessments.forEach(ass => {
            html += `<div class="assessment-under-lesson" onclick="event.stopPropagation(); window.loadAssessmentInline('${ass.id}')">
                        <span class="ass-icon">📝</span>
                        <span>${escapeHtml(ass.title)}</span>
                        <span class="ass-badge">${ass.type === 'quiz' ? 'Quiz' : 'Exam'}</span>
                      </div>`;
          });
          html += `</div>`;
        }
      });
    }
    html += `</div></div>`;
  });
  sidebar.innerHTML = html;
}

window.handleLessonClick = async (lessonId, chapterId) => {
  await loadLessonDetails(lessonId, chapterId);
};

function setActiveTab(tab) {
  const videoContent = document.getElementById('videoContent');
  const pdfContent = document.getElementById('pdfContent');
  const assessmentContent = document.getElementById('assessmentContent');
  const videoBtn = document.getElementById('modeVideoBtn');
  const pdfBtn = document.getElementById('modePdfBtn');
  if (videoContent) videoContent.style.display = 'none';
  if (pdfContent) pdfContent.style.display = 'none';
  if (assessmentContent) assessmentContent.style.display = 'none';
  if (videoBtn) videoBtn.classList.remove('active');
  if (pdfBtn) pdfBtn.classList.remove('active');
  if (tab === 'video') {
    if (videoContent) videoContent.style.display = 'block';
    if (videoBtn) videoBtn.classList.add('active');
  } else if (tab === 'pdf') {
    if (pdfContent) pdfContent.style.display = 'block';
    if (pdfBtn) pdfBtn.classList.add('active');
  } else if (tab === 'assessment') {
    if (assessmentContent) assessmentContent.style.display = 'block';
  }
}

function updateLessonDisplay() {
  if (!currentLesson) return;
  document.getElementById('lessonTitle').innerText = currentLesson.title || "بدون عنوان";
  document.getElementById('lessonDesc').innerText = currentLesson.description || "لا يوجد وصف.";
  document.getElementById('xpReward').innerText = currentLesson.xp || 0;
  const videoPlayer = document.getElementById('mainVideoPlayer');
  const videoSource = document.getElementById('videoSource');
  if (videoPlayer && videoSource && currentLesson.video) {
    let vUrl = currentLesson.video;
    if (vUrl.startsWith('/') && !vUrl.startsWith('http')) vUrl = `http://localhost:3000${vUrl}`;
    videoSource.src = vUrl;
    videoPlayer.load();
  }
  const pdfFrame = document.getElementById('mainPdfFrame');
  if (pdfFrame && currentLesson.pdf) {
    let pUrl = currentLesson.pdf;
    if (pUrl.startsWith('/') && !pUrl.startsWith('http')) pUrl = `http://localhost:3000${pUrl}`;
    pdfFrame.src = pUrl;
  }
  const completeBtn = document.getElementById('completeLessonBtn');
  if (completeBtn) {
    const isCompleted = checkIfLessonDone(currentLesson.id);
    if (isCompleted) {
      completeBtn.innerText = "COMPLETED";
      completeBtn.disabled = true;
      completeBtn.style.background = "#10B981";
    } else {
      completeBtn.innerText = "MARK AS COMPLETED";
      completeBtn.disabled = false;
      completeBtn.style.background = "";
    }
  }
  const assessmentDiv = document.getElementById('assessmentContent');
  if (assessmentDiv) assessmentDiv.style.display = 'none';
  setActiveTab('video');
}

function checkIfLessonDone(lessonId) {
  let currentOrder = 0;
  for (const chapter of courseData.chapters) {
    const lesson = chapter.lessons.find(l => String(l.id) === String(lessonId));
    if (lesson) { currentOrder = lesson.order_index; break; }
  }
  const maxProgress = courseData.last_completed_order || 0;
  return Number(currentOrder) <= Number(maxProgress);
}

// ========== زر إكمال الدرس (مع تحديث XP وجلب الإحصائيات) ==========
const completeBtn = document.getElementById('completeLessonBtn');
if (completeBtn) {
  completeBtn.onclick = async () => {
    if (!currentLesson) return;
    const btn = completeBtn;
    try {
      btn.innerText = "SAVING...";
      btn.disabled = true;

      // 1. حفظ تقدم الدرس (قد يفشل لكن لا نوقف)
      try {
        await axios.post(`${API_COURSES}/complete-lesson`, {
          courseId, chapterId: currentLesson.chapterId, lessonId: currentLesson.id,
          xp_reward: Number(currentLesson.xp || 0)
        });
      } catch (e) {
        console.warn("complete-lesson failed, but XP update will continue", e);
      }

      // 2. إرسال طلب إضافة XP
      await callUpdateProgress(Number(currentLesson.xp || 0));

      // 3. انتظار قليل ثم جلب أحدث الإحصائيات (للتأكد من تحديث الخادم)
      await new Promise(r => setTimeout(r, 500));
      await fetchAndUpdateGamificationStats();

      showToast("🎉 Lesson completed! XP added.", "success");
      btn.innerText = "COMPLETED";
      btn.style.background = "#10B981";
      btn.disabled = true;

      // 4. إعادة تحميل القائمة الجانبية والتقدم
      await fetchCourseDetails();
    } catch (err) {
      console.error("Error completing lesson:", err);
      showToast("Failed to save progress", "error");
      btn.innerText = "MARK AS COMPLETED";
      btn.disabled = false;
    }
  };
}

// ========== أزرار التبديل بين فيديو و PDF ==========
const videoBtn = document.getElementById('modeVideoBtn');
const pdfBtn = document.getElementById('modePdfBtn');
if (videoBtn) {
  videoBtn.onclick = () => { if (currentLesson) setActiveTab('video'); else showToast("No lesson open", "error"); };
}
if (pdfBtn) {
  pdfBtn.onclick = () => {
    if (currentLesson?.pdf) setActiveTab('pdf');
    else if (currentLesson && !currentLesson.pdf) showToast("No PDF for this lesson", "error");
    else showToast("No lesson open", "error");
  };
}

// ========== عرض التقييمات داخل الصفحة ==========
window.loadAssessmentInline = async function (assessmentId) {
  try {
    const res = await axios.get(`${API_STUDENTS}/${courseId}/assessments/${assessmentId}`);
    if (res.data.success) {
      const assessment = res.data.data;
      displayAssessmentInline(assessment);
      setActiveTab('assessment');
    } else {
      showToast("Failed to load assessment", "error");
    }
  } catch (err) {
    showToast("Error loading assessment", "error");
    console.error(err);
  }
};

function displayAssessmentInline(assessment) {
  const container = document.getElementById('quizQuestions');
  const titleEl = document.getElementById('quizTitle');
  const passingEl = document.getElementById('quizPassing');
  if (!container || !titleEl) {
    console.warn("Assessment container missing");
    return;
  }
  titleEl.innerText = assessment.title;
  if (passingEl) passingEl.innerHTML = `<i class="fa-solid fa-flag-checkered"></i> Passing Score: ${assessment.passing_score || 70}%`;

  let html = '';
  assessment.questions.forEach((q, idx) => {
    const isMultiple = q.correct_answer && q.correct_answer.includes(',');
    const inputType = isMultiple ? 'checkbox' : 'radio';
    const nameAttr = isMultiple ? `q_${q.id}_multi` : `q_${q.id}`;
    html += `<div class="quiz-question">
              <p><strong>${idx + 1}. ${escapeHtml(q.question_text)}</strong> <span class="points-badge">${q.points || 1} pts</span></p>
              <div class="quiz-options">`;
    q.options.forEach(opt => {
      html += `<label><input type="${inputType}" name="${nameAttr}" value="${escapeAttr(opt)}"> ${escapeHtml(opt)}</label>`;
    });
    html += `</div></div>`;
  });
  container.innerHTML = html;

  const submitBtn = document.getElementById('submitQuizBtn');
  if (submitBtn) {
    submitBtn.onclick = () => submitAssessmentInline(assessment);
  }
}

async function submitAssessmentInline(assessment) {
  const answers = [];
  assessment.questions.forEach(q => {
    const isMultiple = q.correct_answer && q.correct_answer.includes(',');
    let selectedValue = null;
    if (isMultiple) {
      const selected = Array.from(document.querySelectorAll(`input[name="q_${q.id}_multi"]:checked`)).map(cb => cb.value);
      selectedValue = selected;
    } else {
      const selected = document.querySelector(`input[name="q_${q.id}"]:checked`);
      selectedValue = selected ? selected.value : null;
    }
    answers.push({ questionId: q.id, answer: selectedValue });
  });

  console.log("📤 Sending answers:", JSON.stringify(answers, null, 2));

  try {
    const res = await axios.post(`${API_COURSES}/assessments/${assessment.id}/submit`, { answers });
    console.log("📥 Server response:", res.data);
    if (res.data.success) {
      const score = res.data.score;
      const passed = res.data.passed;
      showToast(`Score: ${score}% - ${passed ? 'Passed ✅' : 'Failed ❌'}`, passed ? 'success' : 'error');
      if (passed) {
        await fetchCourseDetails(false);
      }
    } else {
      showToast(res.data.message || 'Submission failed', 'error');
    }
  } catch (err) {
    console.error("❌ Submission error:", err);
    showToast('Error submitting assessment', 'error');
  }
}

// ========== دوال مساعدة ==========
function showToast(msg, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '8px';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span><span class="toast-msg">${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}
function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}

// ========== بدء التشغيل ==========
fetchCourseDetails(true);