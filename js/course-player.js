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
let bossExamEditor = null;
let currentBossExam = null;
window.courseData = courseData;

// ========== تحديث شريط XP ==========
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

async function fetchAndUpdateGamificationStats() {
  try {
    const res = await axios.get(`${API_BASE}/gamification/me`);
    if (res.data && res.data.stats) {
      updateTopbarUI(res.data.stats.total_xp || 0, res.data.stats.current_level || 1);
      return true;
    }
  } catch (err) { }
  return false;
}

// ========== جلب subdomain_id (محاولة أكثر من مسار) ==========
async function fetchCourseSubdomain() {
  try {
    const res = await axios.get(`${API_COURSES}/${courseId}/subdomain`);
    if (res.data && res.data.success && res.data.data.id) {
      currentSubdomainId = res.data.data.id;
      return true;
    }
  } catch (err) { }
  // محاولة بديلة من تفاصيل الكورس
  try {
    const res = await axios.get(`${API_COURSES}/${courseId}`);
    if (res.data && res.data.success && res.data.data.subdomain_id) {
      currentSubdomainId = res.data.data.subdomain_id;
      return true;
    }
  } catch (err) { }
  return false;
}

// ========== إرسال طلب إضافة XP ==========
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
  try {
    await axios.post(`${API_STUDENTS}/${studentId}/update`, {
      subdomainId: currentSubdomainId,
      xpGained: xpGained
    });
    return true;
  } catch (err) {
    console.error("Failed to update XP:", err);
    return false;
  }
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

async function fetchAssessments() {
  try {
    const res = await axios.get(`${API_STUDENTS}/courses/${courseId}/assessments`);
    assessmentsList = res.data.success ? res.data.data || [] : [];
  } catch (err) { assessmentsList = []; }
}

async function loadLessonDetails(lessonId, chapterId) {
  try {
    const res = await axios.get(`${API_COURSES}/${courseId}/lessons/${lessonId}`);
    currentLesson = { ...res.data.data || res.data, id: lessonId, chapterId: chapterId };
    document.getElementById('assessmentContent').style.display = 'none';
    updateLessonDisplay();
    renderSidebar();
  } catch (err) { showToast("Failed to load lesson", "error"); }
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

        // عرض التقييمات المرتبطة بهذا الدرس
        const lessonAssessments = assessmentsList.filter(a => a.lesson_id === lesson.id);
        if (lessonAssessments.length) {
          html += `<div class="lesson-assessments">`;
          lessonAssessments.forEach(ass => {
            const icon = ass.type === 'boss_exam' ? '⚔️' : '📝';
            const badgeClass = ass.type === 'boss_exam' ? 'badge-red' : 'badge-blue';
            const badgeLabel = ass.type === 'boss_exam' ? 'Boss' : 'Quiz';
            html += `<div class="assessment-under-lesson" onclick="event.stopPropagation(); window.loadAssessmentInline('${ass.id}')">
                        <span class="ass-icon">${icon}</span>
                        <span>${escapeHtml(ass.title)}</span>
                        <span class="ass-badge ${badgeClass}">${badgeLabel}</span>
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

// ========== إدارة التبويبات ==========
function setActiveTab(tab) {
  const videoContent = document.getElementById('videoContent');
  const pdfContent = document.getElementById('pdfContent');
  const textContent = document.getElementById('textContent');
  const assessmentContent = document.getElementById('assessmentContent');
  const videoBtn = document.getElementById('modeVideoBtn');
  const pdfBtn = document.getElementById('modePdfBtn');
  const textBtn = document.getElementById('modeTextBtn');

  if (videoContent) videoContent.style.display = 'none';
  if (pdfContent) pdfContent.style.display = 'none';
  if (textContent) textContent.style.display = 'none';
  if (assessmentContent) assessmentContent.style.display = 'none';
  if (videoBtn) videoBtn.classList.remove('active');
  if (pdfBtn) pdfBtn.classList.remove('active');
  if (textBtn) textBtn.classList.remove('active');

  if (tab === 'video') {
    if (videoContent) videoContent.style.display = 'block';
    if (videoBtn) videoBtn.classList.add('active');
  } else if (tab === 'pdf') {
    if (pdfContent) pdfContent.style.display = 'block';
    if (pdfBtn) pdfBtn.classList.add('active');
    const pdfFrame = document.getElementById('mainPdfFrame');
    if (pdfFrame && currentLesson && (currentLesson.content_type === 'pdf' || currentLesson.pdf)) {
      let pdfUrl = currentLesson.content_url || currentLesson.pdf;
      if (pdfUrl && pdfUrl.startsWith('/')) pdfUrl = `http://localhost:3000${pdfUrl}`;
      if (pdfFrame.src !== pdfUrl) pdfFrame.src = pdfUrl;
    }
  } else if (tab === 'text') {
    if (textContent) textContent.style.display = 'block';
    if (textBtn) textBtn.classList.add('active');
  } else if (tab === 'assessment') {
    if (assessmentContent) assessmentContent.style.display = 'block';
  }
}

document.getElementById('modeVideoBtn')?.addEventListener('click', () => setActiveTab('video'));
document.getElementById('modePdfBtn')?.addEventListener('click', () => setActiveTab('pdf'));
document.getElementById('modeTextBtn')?.addEventListener('click', () => setActiveTab('text'));

// ========== عرض محتوى الدرس ==========
function updateLessonDisplay() {
  if (!currentLesson) return;
  document.getElementById('lessonTitle').innerText = currentLesson.title || "";
  document.getElementById('lessonDesc').innerText = currentLesson.summary_text || currentLesson.description || "";
  document.getElementById('xpReward').innerText = currentLesson.xp || 0;

  let contentType = currentLesson.content_type ||
    (currentLesson.video ? 'video' : (currentLesson.pdf ? 'pdf' : (currentLesson.content_text ? 'text' : null)));

  const videoSource = document.getElementById('videoSource');
  const videoPlayer = document.getElementById('mainVideoPlayer');
  if (contentType === 'video') {
    let videoUrl = currentLesson.content_url || currentLesson.video;
    if (videoUrl && videoUrl.startsWith('/')) videoUrl = `http://localhost:3000${videoUrl}`;
    if (videoSource && videoUrl) {
      videoSource.src = videoUrl;
      videoPlayer.load();
    }
  } else {
    if (videoSource) videoSource.src = '';
    if (videoPlayer) videoPlayer.load();
  }

  const pdfFrame = document.getElementById('mainPdfFrame');
  let isPdf = (contentType === 'pdf') || (currentLesson.pdf !== undefined && currentLesson.pdf !== null && currentLesson.pdf !== '');
  if (isPdf) {
    let pdfUrl = currentLesson.content_url || currentLesson.pdf;
    if (pdfUrl && pdfUrl.startsWith('/')) pdfUrl = `http://localhost:3000${pdfUrl}`;
    if (pdfFrame && pdfFrame.src !== pdfUrl) pdfFrame.src = pdfUrl;
  } else {
    if (pdfFrame && pdfFrame.src !== 'about:blank') pdfFrame.src = 'about:blank';
  }

  if (contentType === 'text') {
    const text = currentLesson.content_text || currentLesson.summary_text || '';
    const textBody = document.getElementById('textLessonBody');
    if (textBody) textBody.innerText = text;
  } else {
    const textBody = document.getElementById('textLessonBody');
    if (textBody) textBody.innerText = '';
  }

  if (contentType === 'video') {
    setActiveTab('video');
  } else if (contentType === 'pdf') {
    setActiveTab('pdf');
  } else if (contentType === 'text') {
    setActiveTab('text');
  } else {
    setActiveTab('video');
  }

  const assessmentDiv = document.getElementById('assessmentContent');
  if (assessmentDiv) assessmentDiv.style.display = 'none';

  const completeBtn = document.getElementById('completeLessonBtn');
  if (completeBtn) {
    completeBtn.style.display = 'inline-flex';
    const isCompleted = checkIfLessonDone(currentLesson.id);
    completeBtn.innerText = isCompleted ? "COMPLETED" : "MARK AS COMPLETED";
    completeBtn.disabled = isCompleted;
    if (isCompleted) completeBtn.style.background = "#10B981";
    else completeBtn.style.background = "";
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
      window.checkForNewBadges?.();
      await fetchCourseDetails();
    } catch (err) {
      showToast("Failed to save progress", "error");
      btn.innerText = "MARK AS COMPLETED";
      btn.disabled = false;
    }
  };
}

// ========== تقييمات (عادية و Boss Exam) ==========
window.loadAssessmentInline = async function (assessmentId) {
  // إخفاء عناصر الدرس
  document.getElementById('lessonTitle').innerText = '';
  document.getElementById('lessonDesc').innerText = '';
  document.getElementById('xpReward').innerText = '0';
  const completeLessonBtn = document.getElementById('completeLessonBtn');
  if (completeLessonBtn) completeLessonBtn.style.display = 'none';
  const xpBadge = document.querySelector('.xp-badge');
  if (xpBadge) xpBadge.style.display = 'none';

  setActiveTab('assessment');

  try {
    const res = await axios.get(`${API_STUDENTS}/${courseId}/assessments/${assessmentId}`);
    if (res.data.success) {
      const assessment = res.data.data;
      assessment.alreadyPassed = assessment.already_passed || false;
      assessment.hasAttempted = assessment.has_attempted || false;

      if (assessment.type === 'boss_exam') {
        document.getElementById('quizContent').style.display = 'none';
        document.getElementById('bossExamContent').style.display = 'block';
        await loadBossExam(assessmentId);
        if (assessment.alreadyPassed) {
          showAlreadyPassedMessage('bossExamContent');
          disableBossExamControls();
        }
      } else {
        document.getElementById('quizContent').style.display = 'block';
        document.getElementById('bossExamContent').style.display = 'none';
        displayAssessmentInline(assessment);
      }
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
  const submitBtn = document.getElementById('submitQuizBtn');

  if (!container || !titleEl) return;

  titleEl.innerText = assessment.title;
  if (passingEl) passingEl.innerHTML = `<i class="fa-solid fa-flag-checkered"></i> Passing Score: ${assessment.passing_score || 70}%`;

  if (assessment.alreadyPassed) {
    container.innerHTML = `<div style="padding: 20px; text-align: center; background: rgba(16,185,129,0.1); border-radius: 12px;">
                              <i class="fa-solid fa-circle-check" style="color: #10B981; font-size: 2rem;"></i>
                              <p style="margin-top: 10px;">You have already passed this assessment.</p>
                            </div>`;
    if (submitBtn) submitBtn.disabled = true;
    return;
  }

  let warningDiv = null;
  if (assessment.hasAttempted && !assessment.alreadyPassed) {
    warningDiv = document.createElement('div');
    warningDiv.style.cssText = 'padding: 12px; background: rgba(245,158,11,0.1); border-radius: 8px; margin-bottom: 16px; text-align: center; color: #f59e0b;';
    warningDiv.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> You failed this assessment before. Try again!';
    container.parentNode.insertBefore(warningDiv, container);
  }

  // عرض الأسئلة (بدون عرض نقاط السؤال)
  let html = '';
  assessment.questions.forEach((q, idx) => {
    const isMultiple = q.correct_answer && q.correct_answer.includes(',');
    const inputType = isMultiple ? 'checkbox' : 'radio';
    const nameAttr = isMultiple ? `q_${q.id}_multi` : `q_${q.id}`;
    html += `<div class="quiz-question">
              <p><strong>${idx + 1}. ${escapeHtml(q.question_text)}</strong></p>
              <div class="quiz-options">`;
    q.options.forEach(opt => {
      html += `<label><input type="${inputType}" name="${nameAttr}" value="${escapeAttr(opt)}"> ${escapeHtml(opt)}</label>`;
    });
    html += `</div></div>`;
  });
  container.innerHTML = html;

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.onclick = () => submitAssessmentInline(assessment);
  }
}

async function submitAssessmentInline(assessment) {
  if (!assessment.questions || assessment.questions.length === 0) {
    showToast("No questions found in this assessment", "error");
    return;
  }
  const answers = [];
  let hasAnyAnswer = false;
  for (const q of assessment.questions) {
    const isMultiple = q.correct_answer && q.correct_answer.includes(',');
    let selectedValue = null;
    if (isMultiple) {
      const selected = Array.from(document.querySelectorAll(`input[name="q_${q.id}_multi"]:checked`)).map(cb => cb.value);
      if (selected.length > 0) {
        selectedValue = selected.map(s => s.trim()).join(',');
        hasAnyAnswer = true;
      }
    } else {
      const selected = document.querySelector(`input[name="q_${q.id}"]:checked`);
      if (selected) {
        selectedValue = selected.value.trim();
        hasAnyAnswer = true;
      }
    }
    answers.push({ questionId: q.id, answer: selectedValue });
  }
  if (!hasAnyAnswer) {
    showToast("Please select at least one answer before submitting", "error");
    return;
  }
  try {
    const res = await axios.post(`${API_COURSES}/assessments/${assessment.id}/submit`, { answers });
    if (res.data.success) {
      showToast(`Score: ${res.data.score}% - ${res.data.passed ? 'Passed ✅' : 'Failed ❌'}`, res.data.passed ? 'success' : 'error');
      if (res.data.passed) {
        const assessmentXp = assessment.xp_reward || 50;
        await callUpdateProgress(assessmentXp);
        await fetchAndUpdateGamificationStats();
        window.checkForNewBadges?.();
        await fetchCourseDetails(false);
      }
    } else {
      showToast(res.data.message || 'Submission failed', 'error');
    }
  } catch (err) {
    console.error("Submission error:", err);
    showToast('Error submitting assessment', 'error');
  }
}

// ========== دوال مساعدة لـ Boss Exam ==========
function showAlreadyPassedMessage(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const existingMsg = container.querySelector('.already-passed-msg');
  if (existingMsg) return;
  const msgDiv = document.createElement('div');
  msgDiv.className = 'already-passed-msg';
  msgDiv.style.cssText = 'padding: 12px; background: rgba(16,185,129,0.1); border-radius: 8px; margin-bottom: 16px; text-align: center; color: #10B981;';
  msgDiv.innerHTML = '<i class="fa-solid fa-circle-check"></i> You have already passed this boss exam.';
  container.prepend(msgDiv);
}

function disableBossExamControls() {
  const runBtn = document.getElementById('runSampleBtn');
  const submitBtn = document.getElementById('submitBossBtn');
  if (runBtn) runBtn.disabled = true;
  if (submitBtn) submitBtn.disabled = true;
}

window.loadBossExam = async function(assessmentId) {
  try {
    const res = await axios.get(`${API_STUDENTS}/${courseId}/assessments/${assessmentId}`);
    if (res.data.success) {
      const exam = res.data.data;
      currentBossExam = exam;

      document.getElementById('bossExamTitle').innerText = exam.title;
      document.getElementById('bossExamDescription').innerText = exam.description || '';
      document.getElementById('bossLanguageBadge').innerText = exam.language || 'javascript';
      document.getElementById('bossPassingBadge').innerText = `Pass: ${exam.passing_score}%`;

      const codeContainer = document.getElementById('codeEditorContainer');
      codeContainer.style.cssText = 'border:1px solid var(--border); margin-top:16px; border-radius:8px; overflow:hidden; min-height:300px;';

      let mode = 'javascript';
      let hintFn = CodeMirror.hint.javascript;
      if (exam.language === 'html') {
        mode = 'htmlmixed';
        hintFn = CodeMirror.hint.html;
      } else if (exam.language === 'css') {
        mode = 'css';
        hintFn = CodeMirror.hint.css;
      }

      const starterCode = exam.starter_code || '';
      if (bossExamEditor) {
        bossExamEditor.setOption('mode', mode);
        bossExamEditor.setOption('hintOptions', { hint: hintFn, completeSingle: false });
        bossExamEditor.setValue(starterCode);
      } else {
        bossExamEditor = CodeMirror(codeContainer, {
          lineNumbers: true,
          mode: mode,
          theme: 'dracula',
          value: starterCode,
          autoCloseTags: true,
          extraKeys: {
            'Ctrl-Space': 'autocomplete',
            'Tab': 'emmetExpandAbbreviation'
          },
          hintOptions: { hint: hintFn, completeSingle: false }
        });
        if (CodeMirror.emmet) CodeMirror.emmet.setOption('marker', false);
      }

      bossExamEditor.off('inputRead');
      bossExamEditor.on('inputRead', function(cm, change) {
        if (!change.text[0] || change.text[0] === ' ' || change.text[0] === '\n') return;
        if (exam.language === 'html') {
          const cursor = cm.getCursor();
          const line = cm.getLine(cursor.line);
          const beforeCursor = line.substring(0, cursor.ch);
          if (beforeCursor.lastIndexOf('<') > beforeCursor.lastIndexOf('>')) {
            CodeMirror.commands.autocomplete(cm);
          }
        } else if (exam.language === 'css') {
          const cursor = cm.getCursor();
          const line = cm.getLine(cursor.line);
          const textBefore = line.substring(0, cursor.ch).trim();
          if (textBefore.length > 0 && !textBefore.includes(':') && !textBefore.includes('{') && !textBefore.includes('}')) {
            CodeMirror.commands.autocomplete(cm);
          }
        }
      });
      setActiveTab('assessment');
    }
  } catch (err) {
    showToast("Failed to load boss exam", "error");
  }
};

async function runSampleTests() {
  if (!currentBossExam) return;
  const code = bossExamEditor.getValue();
  const testCases = currentBossExam.test_cases || [];
  const resultsDiv = document.getElementById('bossResults');
  resultsDiv.innerHTML = '<div class="spinner">Running...</div>';
  try {
    const res = await axios.post(`${API_COURSES}/assessments/${currentBossExam.id}/run-sample`, {
      code,
      language: currentBossExam.language,
      test_cases: testCases
    });
    if (res.data.success) {
      renderTestResults(res.data.results, false);
    } else {
      resultsDiv.innerHTML = `<div class="empty-state">Execution error: ${escapeHtml(res.data.message)}</div>`;
    }
  } catch (err) {
    resultsDiv.innerHTML = '<div class="empty-state">Failed to run tests</div>';
  }
}

async function submitBossExam() {
  if (!currentBossExam) {
    showToast("No boss exam loaded", "error");
    return;
  }
  const code = bossExamEditor ? bossExamEditor.getValue() : '';
  const resultsDiv = document.getElementById('bossResults');
  if (resultsDiv) resultsDiv.innerHTML = '<div class="spinner">Submitting...</div>';
  try {
    const res = await axios.post(`${API_COURSES}/assessments/${currentBossExam.id}/submit-code`, {
      code,
      language: currentBossExam.language
    });
    if (res.data.success) {
      renderTestResults(res.data.results, true, res.data.score, res.data.passed);
      if (res.data.passed) {
        const xpEarned = res.data.xp_gained || currentBossExam.xp_reward || 100;
        await callUpdateProgress(xpEarned);
        await fetchAndUpdateGamificationStats();
        window.checkForNewBadges?.();
        showToast(`🎉 Congratulations! You passed the Boss Exam. +${xpEarned} XP`, 'success');
      } else {
        const passingScore = currentBossExam.passing_score || 70;
        const displayScore = (!isNaN(res.data.score) && res.data.score != null) ? res.data.score : 'N/A';
        showToast(`❌ You did not pass. Score: ${displayScore}%. Required: ${passingScore}%. Check the AI feedback below.`, 'error');
      }
      if (res.data.ai_feedback && resultsDiv) {
        const aiDiv = document.createElement('div');
        aiDiv.style.cssText = 'margin-top:16px; padding:16px; background:rgba(59,130,246,0.06); border:1px solid var(--border); border-radius:8px;';
        aiDiv.innerHTML = `<strong>🤖 AI Feedback</strong><p style="white-space:pre-wrap;">${escapeHtml(res.data.ai_feedback)}</p>`;
        resultsDiv.appendChild(aiDiv);
      }
    } else {
      if (resultsDiv) resultsDiv.innerHTML = `<div class="empty-state">Submission failed: ${escapeHtml(res.data.message)}</div>`;
    }
  } catch (err) {
    if (resultsDiv) resultsDiv.innerHTML = '<div class="empty-state">Submission error</div>';
    console.error('Boss exam submit error:', err);
  }
}

function renderTestResults(results, isFinal, score, passed) {
  const resultsDiv = document.getElementById('bossResults');
  if (!resultsDiv) return;
  let html = '';
  if (results && results.length > 0) {
    results.forEach((r, i) => {
      const icon = r.passed ? '✅' : '❌';
      html += `<div style="margin-bottom:8px; background:${r.passed ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)'}; padding:10px; border-radius:6px;">
        <strong>Test ${i+1}:</strong> ${icon}
        <div>Input: <code>${escapeHtml(r.input)}</code></div>
        <div>Expected: <code>${escapeHtml(r.expected)}</code></div>
        <div>Actual: <code>${escapeHtml(r.actual)}</code></div>
      </div>`;
    });
  }
  if (isFinal) {
    const displayScore = (score !== undefined && score !== null && !isNaN(score)) ? score : 'N/A';
    const badgeClass = passed ? 'badge-green' : 'badge-red';
    html = `<div class="badge ${badgeClass}" style="margin-bottom:16px;">Score: ${displayScore}%</div>` + html;
  }
  resultsDiv.innerHTML = html;
}

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
  setTimeout(() => toast.remove(), 3000);
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