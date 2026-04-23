/* ═════════════════════════════════════════════════════════════════
   teacher-course-builder.js – جميع دوال بناء الكورس
   (مع إمكانية تغيير الدرس في وضع التعديل وحفظه)
═════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────
// GLOBAL STATE
// ─────────────────────────────────────────────────────────────────
let currentBuilderCourseId = null;
let currentChapterIdForQuiz = null;
let currentLessonIdForQuiz = null;
let currentQuizPassingScore = 65;
let currentEditAssessmentId = null;
let pendingEditAssessment = null;  // تخزين التقييم المراد تعديله مؤقتاً

// ─────────────────────────────────────────────────────────────────
// متغيرات المعاينة (Preview)
// ─────────────────────────────────────────────────────────────────
let previewLessonsList = [];
let currentPreviewIndex = 0;

// ─────────────────────────────────────────────────────────────────
// فتح بناء الكورس (يُستدعى من teacher-courses.js)
// ─────────────────────────────────────────────────────────────────
async function openCourseBuilder(courseId) {
  if (!courseId) {
    showToast('Course ID is missing', 'error');
    return;
  }
  currentBuilderCourseId = courseId;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const builderPage = document.getElementById('page-courseContent');
  if (builderPage) builderPage.classList.add('active');
  else {
    showToast('Course builder page not found', 'error');
    return;
  }

  const pageTitleSpan = document.getElementById('pageTitle');
  if (pageTitleSpan) pageTitleSpan.textContent = 'Course Builder';

  const chaptersContainer = document.getElementById('chaptersContainer');
  if (chaptersContainer) {
    chaptersContainer.innerHTML = '<div class="empty-state"><div class="empty-icon">📚</div><div class="empty-title">Loading course content...</div></div>';
  }

  try {
    const data = await apiCall('GET', `/courses/${courseId}`);
    if (!data || !data.success) throw new Error(data?.message || 'Failed to load course');

    const course = data.data.course || data.course;
    const courseTitleEl = document.getElementById('courseContentTitle');
    const courseSubtitleEl = document.getElementById('courseContentSubtitle');
    const courseDescEl = document.getElementById('courseDescription');
    const courseBadgesEl = document.getElementById('courseBadges');

    if (courseTitleEl) courseTitleEl.textContent = course.title;
    if (courseSubtitleEl) {
      const level = course.difficulty_level || 'Intermediate';
      const students = course.students_count || 0;
      const lessons = course.total_lessons || 0;
      courseSubtitleEl.textContent = `${level} · ${students} students · ${lessons} lessons`;
    }
    if (courseDescEl) courseDescEl.textContent = course.description || 'No description provided.';
    if (courseBadgesEl) {
      courseBadgesEl.innerHTML = `
        <div><span class="badge badge-blue">⭐ ${course.rating || 4.8}</span></div>
        <div><span class="badge badge-green">✅ ${course.completion_rate || 78}% completion</span></div>
        <div><span class="badge badge-purple">📹 ${course.total_lessons || 0} lessons</span></div>
      `;
    }

    renderChapters(course.chapters || []);
  } catch (err) {
    console.error('Error loading course:', err);
    showToast(err.message, 'error');
    if (chaptersContainer) chaptersContainer.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Failed to load course content</div></div>';
  }
}

// ─────────────────────────────────────────────────────────────────
// عرض الفصول والدروس
// ─────────────────────────────────────────────────────────────────
function renderChapters(chapters) {
  const container = document.getElementById('chaptersContainer');
  if (!container) return;

  if (!chapters || chapters.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📂</div><div class="empty-title">No chapters yet</div><div class="empty-sub">Click "New Chapter" to get started</div></div>';
    return;
  }

  chapters.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  let html = '';
  chapters.forEach(chapter => {
    const lessons = (chapter.lessons || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    const assessments = (chapter.assessments || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

    let itemsHtml = '';
    lessons.forEach(lesson => itemsHtml += renderLessonItem(lesson, chapter.id));
    assessments.forEach(assessment => itemsHtml += renderAssessmentItem(assessment, chapter.id));

    html += `
      <div class="chapter-card" data-chapter-id="${chapter.id}">
        <div class="chapter-header">
          <div class="chapter-title">
            <span class="chapter-expand">▼</span>
            <span>${escapeHtml(chapter.title)}</span>
          </div>
          <div class="chapter-actions">
            <button class="icon-btn-sm" onclick="editChapter('${chapter.id}')">✎</button>
            <button class="icon-btn-sm" onclick="deleteChapter('${chapter.id}')">🗑️</button>
          </div>
        </div>
        <div class="chapter-content">
          <div class="lessons-list">
            ${itemsHtml}
          </div>
          <div class="chapter-buttons">
            <button class="btn btn-ghost add-lesson-btn" onclick="openLessonModal('${chapter.id}')">＋ Add Lesson</button>
            <button class="btn btn-ghost add-assessment-btn" onclick="openAddQuizModal('${chapter.id}')">📝 Add Assessment</button>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  document.querySelectorAll('.chapter-header').forEach(header => {
    header.addEventListener('click', (e) => {
      if (e.target.closest('.chapter-actions')) return;
      const card = header.closest('.chapter-card');
      if (card) card.classList.toggle('collapsed');
    });
  });
}

function renderLessonItem(lesson, chapterId) {
  const hasVideo = !!lesson.video_url;
  const hasPdf = !!lesson.pdf_url;
  const hasSummary = !!lesson.summary_text;

  return `
    <div class="lesson-item" data-lesson-id="${lesson.id}">
      <div class="lesson-info">
        <div class="lesson-drag-icon">⋮⋮</div>
        <div class="lesson-icon" style="background: rgba(59,130,246,0.12);">📚</div>
        <div class="lesson-details">
          <div class="lesson-title" style="font-weight: 600; font-size: 14px; color: var(--text-1);">${escapeHtml(lesson.title)}</div>
          <div class="lesson-meta" style="display: flex; gap: 6px; margin-top: 4px;">
             ${hasVideo ? '<span class="badge badge-blue">🎥 Video</span>' : ''}
             ${hasPdf ? '<span class="badge badge-purple">📄 PDF</span>' : ''}
             ${hasSummary ? '<span class="badge badge-green">📝 Text</span>' : ''}
             ${!hasVideo && !hasPdf && !hasSummary ? '<span class="badge" style="background: var(--bg-3); color: var(--text-3);">No Content</span>' : ''}
          </div>
        </div>
      </div>
      <div class="lesson-actions" style="display: flex; align-items: center; gap: 8px;">
        <button class="btn btn-ghost" style="padding: 6px 10px; font-size: 12px;" onclick="uploadContent('${chapterId}', '${lesson.id}', 'video')" title="Upload Video">📤 Video</button>
        <button class="btn btn-ghost" style="padding: 6px 10px; font-size: 12px;" onclick="uploadContent('${chapterId}', '${lesson.id}', 'pdf')" title="Upload PDF">📤 PDF</button>
        <div style="width: 1px; height: 20px; background: var(--border); margin: 0 4px;"></div>
        <button class="icon-btn-sm" onclick="editLesson('${chapterId}', '${lesson.id}')" title="Edit Title">✎</button>
        <button class="icon-btn-sm" style="color: var(--red); border-color: rgba(239,68,68,0.2);" onclick="deleteLesson('${chapterId}', '${lesson.id}')" title="Delete Lesson">🗑️</button>
      </div>
    </div>
  `;
}

function renderAssessmentItem(assessment, chapterId) {
  const questionCount = assessment.questions_count || (assessment.questions ? assessment.questions.length : 0);
  const passingScore = assessment.passing_score || 70;

  const assessmentData = JSON.stringify(assessment).replace(/"/g, '&quot;');

  return `
    <div class="assessment-item" data-assessment-id="${assessment.id}" data-chapter-id="${chapterId}">
      <div class="assessment-info">
        <div class="lesson-drag-icon">⋮⋮</div>
        <div class="lesson-icon" style="background: rgba(167,139,250,0.12);">📝</div>
        <div class="lesson-details">
          <div class="lesson-title">${escapeHtml(assessment.title)}</div>
          <div class="lesson-meta">
            <span class="badge badge-purple">${questionCount} questions</span>
            <span class="badge badge-blue">Pass: ${passingScore}%</span>
          </div>
        </div>
      </div>
      <div class="lesson-actions">
        <button class="btn btn-ghost" onclick="openEditQuizModal(${assessmentData}, '${chapterId}')">✎ Edit</button>
        <button class="btn btn-ghost" style="color: var(--red);" onclick="deleteAssessment('${chapterId}', '${assessment.id}')">🗑️ Delete</button>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────
// دوال الفصول (Chapters)
// ─────────────────────────────────────────────────────────────────
async function createChapter() {
  const titleInput = document.getElementById('newChapterTitle');
  if (!titleInput) {
    showToast('Chapter modal not found', 'error');
    return;
  }
  const title = titleInput.value.trim();
  if (!title) {
    showToast('Please enter a chapter title', 'error');
    return;
  }

  // ✅ No longer calculate or send order_index
  const data = await apiCall('POST', `/courses/${currentBuilderCourseId}/chapters`, { title });
  if (!data || !data.success) {
    showToast(data?.message || 'Failed to create chapter', 'error');
    return;
  }

  closeModal('newChapter');
  showToast('Chapter created!', 'success');
  await openCourseBuilder(currentBuilderCourseId);
  titleInput.value = '';
}

async function deleteChapter(chapterId) {
  if (!confirm('Are you sure you want to delete this chapter and all its content?')) return;

  const data = await apiCall('DELETE', `/courses/${currentBuilderCourseId}/chapters/${chapterId}`);
  if (!data || !data.success) {
    showToast(data?.message || 'Failed to delete chapter', 'error');
    return;
  }

  showToast('Chapter deleted', 'success');
  await openCourseBuilder(currentBuilderCourseId);
}

async function editChapter(chapterId) {
  const chapterCard = document.querySelector(`.chapter-card[data-chapter-id="${chapterId}"]`);
  if (!chapterCard) return;
  const titleSpan = chapterCard.querySelector('.chapter-title span:last-child');
  const currentTitle = titleSpan ? titleSpan.textContent : '';

  const newTitle = prompt('Edit chapter title:', currentTitle);
  if (!newTitle || newTitle === currentTitle) return;

  const data = await apiCall('PATCH', `/courses/${currentBuilderCourseId}/chapters/${chapterId}`, { title: newTitle });
  if (!data || !data.success) {
    showToast(data?.message || 'Failed to update chapter', 'error');
    return;
  }

  if (titleSpan) titleSpan.textContent = newTitle;
  showToast('Chapter updated', 'success');
}

// ─────────────────────────────────────────────────────────────────
// دوال الدروس (Lessons)
// ─────────────────────────────────────────────────────────────────
function openLessonModal(chapterId) {
  window.currentLessonChapterId = chapterId;
  openModal('newLesson');
  const titleInput = document.getElementById('newLessonTitle');
  if (titleInput) titleInput.value = '';
  const contentTypeSelect = document.getElementById('newLessonContentType');
  if (contentTypeSelect) contentTypeSelect.value = 'video';
  const durationInput = document.getElementById('newLessonDuration');
  if (durationInput) durationInput.value = '';
  const freeCheckbox = document.getElementById('newLessonFreePreview');
  if (freeCheckbox) freeCheckbox.checked = false;
  const xpInput = document.getElementById('newLessonXp');
  if (xpInput) xpInput.value = '50';   // <-- default value
}

async function createLesson() {
  const chapterId = window.currentLessonChapterId;
  if (!chapterId) {
    showToast('No chapter selected', 'error');
    return;
  }

  const title = document.getElementById('newLessonTitle')?.value?.trim();
  const contentType = document.getElementById('newLessonContentType')?.value;
  const duration = parseInt(document.getElementById('newLessonDuration')?.value) || 0;
  const isFree = document.getElementById('newLessonFreePreview')?.checked || false;
  const xpReward = parseInt(document.getElementById('newLessonXp')?.value) || 0;  // <-- new

  if (!title) {
    showToast('Lesson title is required', 'error');
    return;
  }

  const data = await apiCall('POST', `/courses/${currentBuilderCourseId}/chapters/${chapterId}/lessons`, {
    title,
    content_type: contentType,
    duration,
    is_free: isFree,
    xp_reward: xpReward   // <-- add this
  });

  if (!data || !data.success) {
    showToast(data?.message || 'Failed to create lesson', 'error');
    return;
  }

  closeModal('newLesson');
  showToast('Lesson created!', 'success');
  await openCourseBuilder(currentBuilderCourseId);
}

async function editLesson(chapterId, lessonId) {
  const lessonItem = document.querySelector(`.lesson-item[data-lesson-id="${lessonId}"]`);
  if (!lessonItem) return;
  const titleElement = lessonItem.querySelector('.lesson-title');
  const currentTitle = titleElement ? titleElement.textContent : '';

  const newTitle = prompt('Edit lesson title:', currentTitle);
  if (!newTitle || newTitle === currentTitle) return;

  const data = await apiCall('PATCH', `/courses/${currentBuilderCourseId}/chapters/${chapterId}/lessons/${lessonId}`, { title: newTitle });
  if (!data || !data.success) {
    showToast(data?.message || 'Failed to update lesson', 'error');
    return;
  }

  if (titleElement) titleElement.textContent = newTitle;
  showToast('Lesson updated', 'success');
}

async function deleteLesson(chapterId, lessonId) {
  if (!confirm('Delete this lesson?')) return;

  const data = await apiCall('DELETE', `/courses/${currentBuilderCourseId}/chapters/${chapterId}/lessons/${lessonId}`);
  if (!data || !data.success) {
    showToast(data?.message || 'Failed to delete lesson', 'error');
    return;
  }

  showToast('Lesson deleted', 'success');
  await openCourseBuilder(currentBuilderCourseId);
}

// ─────────────────────────────────────────────────────────────────
// رفع المحتوى (Video / PDF)
// ─────────────────────────────────────────────────────────────────
async function uploadContent(chapterId, lessonId, type) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = type === 'video' ? 'video/mp4,video/mkv,video/avi' : 'application/pdf';

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    showToast(`Uploading ${type}... please wait ⏳`, 'info');

    try {
      const res = await apiUpload(`/courses/${currentBuilderCourseId}/chapters/${chapterId}/lessons/${lessonId}/content`, formData);

      if (res && res.success) {
        showToast(`✅ ${type} Uploaded successfully!`, 'success');
        await openCourseBuilder(currentBuilderCourseId);
      } else {
        showToast(`❌ Upload failed: ${res?.message || 'Unknown error'}`, 'error');
      }
    } catch (err) {
      console.error("Upload Error:", err);
      showToast('❌ Upload failed due to server error', 'error');
    }
  };

  input.click();
}

// ─────────────────────────────────────────────────────────────────
// دوال التقييمات (Assessments) – مع دعم ربط وتعديل الدرس
// ─────────────────────────────────────────────────────────────────

// دالة مساعدة لملء قائمة الدروس (مع تحديد الدرس الحالي إن وجد)
async function populateLessonSelectWithCurrent(select, chapterId, currentLessonId = null) {
    if (!select) return;
    select.innerHTML = '<option value="">-- None (Chapter level) --</option>';
    try {
        const data = await apiCall('GET', `/courses/chapters/${chapterId}/lessons`);
        if (data && data.success) {
            const lessons = data.data || [];
            lessons.forEach(lesson => {
                const option = document.createElement('option');
                option.value = lesson.id;
                option.textContent = lesson.title;
                if (currentLessonId && lesson.id === currentLessonId) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        } else {
            console.warn('No lessons found or API error');
        }
    } catch (err) {
        console.error('Failed to load lessons:', err);
        showToast('Could not load lessons for this chapter', 'error');
    }
}

// فتح مودال إضافة تقييم
function openAddQuizModal(chapterId, lessonId = null) {
    currentChapterIdForQuiz = chapterId;
    currentLessonIdForQuiz = lessonId;
    currentEditAssessmentId = null;
    pendingEditAssessment = null;

    const lessonSelect = document.getElementById('quiz_lesson_select');
    if (lessonSelect) {
        populateLessonSelectWithCurrent(lessonSelect, chapterId, lessonId);
    }

    const titleInput = document.getElementById('quiz_title_input');
    const typeInput = document.getElementById('quiz_type_input');
    const scoreInput = document.getElementById('quiz_passing_score_input');

    if (titleInput) titleInput.value = '';
    if (typeInput) typeInput.value = 'quiz';
    if (scoreInput) scoreInput.value = '70';

    openModal('newQuiz');
}

// الانتقال من المودال الأول إلى مودال بناء الأسئلة
function proceedToQuizBuilder() {
    const title = document.getElementById('quiz_title_input')?.value.trim();
    const type = document.getElementById('quiz_type_input')?.value || 'quiz';
    const scoreInput = document.getElementById('quiz_passing_score_input')?.value;
    const lessonSelect = document.getElementById('quiz_lesson_select');
    const selectedLessonId = lessonSelect ? lessonSelect.value : null;

    currentQuizPassingScore = parseInt(scoreInput) || 70;
    if (!title) { showToast('Please enter an assessment title', 'error'); return; }
    closeModal('newQuiz');

    const isEdit = !!pendingEditAssessment;
    openQuizBuilder(title, type, selectedLessonId, isEdit);
}

// فتح مودال بناء الأسئلة (يُستخدم للإضافة والتعديل)
function openQuizBuilder(title = '', type = 'quiz', lessonId = null, isEdit = false) {
    _qbCounter = 0;
    _qbQuestionIds = [];
    document.getElementById('qb-questions-container').innerHTML = '';
    document.getElementById('qb-title').value = title;
    const typeField = document.getElementById('qb-type');
    if (typeField) typeField.value = type;
    const scoreField = document.getElementById('qb-passing-score');
    if (scoreField) scoreField.value = currentQuizPassingScore;
    currentLessonIdForQuiz = lessonId;
    console.log('openQuizBuilder - lessonId set to:', currentLessonIdForQuiz);

    if (isEdit && pendingEditAssessment && pendingEditAssessment.questions) {
        // تحميل الأسئلة الموجودة
        pendingEditAssessment.questions.forEach((q) => {
            const uid = qbAddQuestion();
            setTimeout(() => {
                const qInput = document.getElementById(`qb-q-${uid}-text`);
                if (qInput) qInput.value = q.question_text || '';
                let opts = q.options;
                if (typeof opts === 'string') try { opts = JSON.parse(opts); } catch(e) { opts = []; }
                if (Array.isArray(opts)) {
                    const optContainer = document.getElementById(`qb-q-${uid}-options-list`);
                    if (optContainer) optContainer.innerHTML = '';
                    opts.forEach((optValue, idx) => {
                        if (idx < 4) {
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = _qbOptionRowHTML(uid, idx);
                            optContainer.appendChild(tempDiv.firstElementChild);
                            document.getElementById(`qb-q-${uid}-opt-${idx}`).value = optValue;
                            if (optValue === q.correct_answer && q.correct_answer !== "") {
                                const radio = document.getElementById(`qb-q-${uid}-correct-input-${idx}`);
                                if (radio) { radio.checked = true; _qbHandleRadioChange(`qb-q-${uid}`, idx); }
                            }
                        }
                    });
                }
                if (document.getElementById(`qb-q-${uid}-hint`)) document.getElementById(`qb-q-${uid}-hint`).value = q.socratic_hint || '';
                if (document.getElementById(`qb-q-${uid}-difficulty`)) document.getElementById(`qb-q-${uid}-difficulty`).value = q.difficulty_level || 'medium';
                if (document.getElementById(`qb-q-${uid}-points`)) document.getElementById(`qb-q-${uid}-points`).value = q.points || 5;
            }, 50);
        });
        pendingEditAssessment = null; // مسح بعد التحميل
    } else {
        qbAddQuestion();
    }

    openModal('quizBuilder');
}

// فتح مودال تعديل التقييم (يعرض المودال الأول لتعديل البيانات بما فيها الدرس)
function openEditQuizModal(assessment, chapterId) {
    // تخزين التقييم الحالي للاستخدام لاحقاً
    pendingEditAssessment = assessment;
    currentEditAssessmentId = assessment.id;
    currentChapterIdForQuiz = chapterId;
    currentLessonIdForQuiz = assessment.lesson_id || null;

    // تعبئة الحقول في المودال الأول
    const titleInput = document.getElementById('quiz_title_input');
    const typeSelect = document.getElementById('quiz_type_input');
    const scoreInput = document.getElementById('quiz_passing_score_input');
    const lessonSelect = document.getElementById('quiz_lesson_select');

    if (titleInput) titleInput.value = assessment.title;
    if (typeSelect) typeSelect.value = assessment.type || 'quiz';
    if (scoreInput) scoreInput.value = assessment.passing_score || 70;
    if (lessonSelect) {
        populateLessonSelectWithCurrent(lessonSelect, chapterId, assessment.lesson_id);
    }

    // فتح المودال الأول (الخاص بإدخال العنوان والنوع ودرجة النجاح واختيار الدرس)
    openModal('newQuiz');
}

// إنشاء تقييم بسيط (دون استخدام الـ Builder)
async function createAssessment() {
  const chapterId = window.currentAssessmentChapterId;
  if (!chapterId) {
    showToast('No chapter selected', 'error');
    return;
  }

  const title = document.getElementById('newAssessmentTitle')?.value?.trim();
  const type = document.getElementById('newAssessmentType')?.value;
  const passing_score = parseInt(document.getElementById('newAssessmentPassingScore')?.value) || 70;

  if (!title) {
    showToast('Assessment title is required', 'error');
    return;
  }

  const assessmentsCount = document.querySelectorAll(`.chapter-card[data-chapter-id="${chapterId}"] .assessment-item`).length;

  const data = await apiCall('POST', `/courses/${currentBuilderCourseId}/chapters/${chapterId}/assessments`, {
    title, type, passing_score
  });
  if (!data || !data.success) {
    showToast(data?.message || 'Failed to create assessment', 'error');
    return;
  }

  closeModal('newAssessment');
  showToast('Assessment created!', 'success');
  await openCourseBuilder(currentBuilderCourseId);
}

async function editAssessment(chapterId, assessmentId) {
  const assessmentItem = document.querySelector(`.assessment-item[data-assessment-id="${assessmentId}"]`);
  if (!assessmentItem) return;
  const titleElement = assessmentItem.querySelector('.lesson-title');
  const currentTitle = titleElement ? titleElement.textContent : '';

  const newTitle = prompt('Edit assessment title:', currentTitle);
  if (!newTitle || newTitle === currentTitle) return;

  const data = await apiCall('PATCH', `/courses/${currentBuilderCourseId}/chapters/${chapterId}/assessments/${assessmentId}`, { title: newTitle });
  if (!data || !data.success) {
    showToast(data?.message || 'Failed to update assessment', 'error');
    return;
  }

  if (titleElement) titleElement.textContent = newTitle;
  showToast('Assessment updated', 'success');
}

async function deleteAssessment(chapterId, assessmentId) {
  if (!confirm('Delete this assessment?')) return;

  const data = await apiCall('DELETE', `/courses/${currentBuilderCourseId}/chapters/${chapterId}/assessments/${assessmentId}`);
  if (!data || !data.success) {
    showToast(data?.message || 'Failed to delete assessment', 'error');
    return;
  }

  showToast('Assessment deleted', 'success');
  await openCourseBuilder(currentBuilderCourseId);
}

// ─────────────────────────────────────────────────────────────────
// Quiz Builder (كامل)
// ─────────────────────────────────────────────────────────────────
let _qbCounter = 0;
let _qbQuestionIds = [];

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function _qbOptionRowHTML(uid, idx) {
  const id = `qb-q-${uid}`;
  const letter = OPTION_LETTERS[idx] || `?`;
  return `
    <div class="qb-option-row" id="${id}-opt-row-${idx}" style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
      <label class="qb-radio-wrap">
        <input type="radio" name="${id}-correct" value="${idx}" id="${id}-correct-input-${idx}" onchange="_qbHandleRadioChange('${id}', ${idx})">
        <span class="qb-radio-custom"></span>
      </label>
      <span class="qb-option-letter" style="font-weight: bold; min-width: 20px;">${letter}</span>
      <input type="text" class="qb-option-input" id="${id}-opt-${idx}" placeholder="Option ${letter}" style="flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
      <button type="button" onclick="_qbRemoveOptionRow(${uid}, ${idx})" class="qb-opt-remove-btn" style="background: #ff4d4d; color: white; border: none; border-radius: 4px; width: 25px; height: 25px; cursor: pointer;">&times;</button>
    </div>
  `;
}

function _qbQuestionHTML(uid, display, isFirst) {
  const id = `qb-q-${uid}`;
  const optionsHTML = [0, 1, 2, 3].map(idx => _qbOptionRowHTML(uid, idx)).join('');
  const removeBtn = isFirst ? '' : `<button type="button" class="qb-remove-btn" onclick="_qbRemoveQuestion(${uid})">🗑 Remove Question</button>`;
  return `
    <div class="qb-question-card" id="${id}-card" data-quid="${uid}">
      <div class="qb-card-header">
        <div class="qb-card-header-left">
          <span class="qb-q-number" id="${id}-num">Q${display}</span>
          <span class="qb-card-label">Question ${display}</span>
        </div>
        ${removeBtn}
      </div>
      <div class="qb-card-body">
        <div class="form-group">
          <label class="form-label" for="${id}-text">Question Text <span style="color:var(--red)">*</span></label>
          <textarea class="form-textarea" id="${id}-text" placeholder="e.g. What does HTML stand for?" rows="2"></textarea>
        </div>
        <div>
          <div class="qb-options-label">Answer Options <span class="qb-options-hint">— select the radio button next to the correct answer</span></div>
          <div class="qb-options-list" id="${id}-options-list">${optionsHTML}</div>
          <button type="button" class="btn-add-opt" onclick="_qbAddOptionRow(${uid})" style="margin-top:8px; background:none; border:1px dashed var(--border-color); color:var(--blue); padding:5px 12px; border-radius:4px; cursor:pointer;">+ Add another option</button>
        </div>
        <div class="form-group" style="margin-top:15px">
          <label class="form-label" for="${id}-hint">Socratic Hint</label>
          <input class="form-input" id="${id}-hint" type="text" placeholder="Hint text...">
        </div>
        <div class="qb-meta-row">
          <div class="form-group"><label class="form-label">Difficulty</label><select class="form-select" id="${id}-difficulty"><option value="easy">🟢 Easy</option><option value="medium" selected>🟡 Medium</option><option value="hard">🔴 Hard</option></select></div>
          <div class="form-group"><label class="form-label">Points</label><input class="form-input" id="${id}-points" type="number" value="5"></div>
        </div>
      </div>
    </div>
  `;
}

function qbAddQuestion() {
  _qbCounter++;
  const uid = _qbCounter;
  _qbQuestionIds.push(uid);
  const display = _qbQuestionIds.length;
  const isFirst = display === 1;
  const container = document.getElementById('qb-questions-container');
  const wrapper = document.createElement('div');
  wrapper.innerHTML = _qbQuestionHTML(uid, display, isFirst);
  wrapper.firstElementChild.style.marginBottom = '16px';
  container.appendChild(wrapper.firstElementChild);
  _qbUpdateCount();
  const newCard = document.getElementById(`qb-q-${uid}-card`);
  if (newCard) setTimeout(() => newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
  return uid;
}

function _qbAddOptionRow(uid) {
  const container = document.getElementById(`qb-q-${uid}-options-list`);
  if (!container) return;
  const existingRows = container.querySelectorAll('.qb-option-row');
  let lastIdx = -1;
  existingRows.forEach(row => {
    const idParts = row.id.split('-');
    const idx = parseInt(idParts[idParts.length - 1]);
    if (idx > lastIdx) lastIdx = idx;
  });
  const nextIdx = lastIdx + 1;
  if (nextIdx >= OPTION_LETTERS.length) {
    showToast(`Maximum of ${OPTION_LETTERS.length} options reached.`, "info");
    return;
  }
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = _qbOptionRowHTML(uid, nextIdx);
  container.appendChild(tempDiv.firstElementChild);
}

function _qbRemoveOptionRow(uid, idx) {
  const container = document.getElementById(`qb-q-${uid}-options-list`);
  const row = document.getElementById(`qb-q-${uid}-opt-row-${idx}`);
  const currentRows = container.querySelectorAll('.qb-option-row');
  if (currentRows.length <= 2) {
    alert("You must have at least 2 options!");
    return;
  }
  if (row) {
    row.remove();
    _qbReindexLetters(uid);
  }
}

function _qbReindexLetters(uid) {
  const container = document.getElementById(`qb-q-${uid}-options-list`);
  const rows = container.querySelectorAll('.qb-option-row');
  rows.forEach((row, newIdx) => {
    const letter = OPTION_LETTERS[newIdx];
    const letterSpan = row.querySelector('.qb-option-letter');
    if (letterSpan) letterSpan.textContent = letter;
    const input = row.querySelector('.qb-option-input');
    if (input) input.placeholder = `Option ${letter}`;
  });
}

function _qbRemoveQuestion(uid) {
  const card = document.getElementById(`qb-q-${uid}-card`);
  if (!card) return;
  card.style.transition = 'opacity 0.2s, transform 0.2s, margin 0.2s, max-height 0.3s';
  card.style.opacity = '0';
  card.style.transform = 'translateX(-8px)';
  card.style.maxHeight = card.offsetHeight + 'px';
  setTimeout(() => { card.style.maxHeight = '0'; card.style.marginBottom = '0'; card.style.overflow = 'hidden'; }, 200);
  setTimeout(() => {
    card.remove();
    _qbQuestionIds = _qbQuestionIds.filter(id => id !== uid);
    _qbRenumber();
    _qbUpdateCount();
  }, 450);
}

function _qbRenumber() {
  _qbQuestionIds.forEach((uid, idx) => {
    const display = idx + 1;
    const numEl = document.getElementById(`qb-q-${uid}-num`);
    const labelEl = numEl?.nextElementSibling;
    if (numEl) numEl.textContent = `Q${display}`;
    if (labelEl) labelEl.textContent = `Question ${display}`;
  });
}

function _qbUpdateCount() {
  const el = document.getElementById('qb-q-count');
  if (el) el.textContent = _qbQuestionIds.length;
}

function _qbHandleRadioChange(qId, selectedIdx) {
  const container = document.getElementById(`${qId}-options-list`);
  if (!container) return;
  const rows = container.querySelectorAll('.qb-option-row');
  rows.forEach(row => {
    const idParts = row.id.split('-');
    const idx = parseInt(idParts[idParts.length - 1]);
    row.classList.toggle('qb-selected', idx === selectedIdx);
  });
}

function _qbReadQuestion(uid, orderIdx) {
  const id = `qb-q-${uid}`;
  const questionText = (document.getElementById(`${id}-text`)?.value || '').trim();
  if (!questionText) return { error: `Q${orderIdx}: Please enter the question text.` };
  const rawOptions = [0,1,2,3].map(i => (document.getElementById(`${id}-opt-${i}`)?.value || '').trim());
  const validOptions = rawOptions.filter(opt => opt !== "");
  if (validOptions.length < 2) return { error: `Q${orderIdx}: Please fill in at least 2 options.` };
  const checkedRadio = document.querySelector(`input[name="${id}-correct"]:checked`);
  if (!checkedRadio) return { error: `Q${orderIdx}: Please select which answer is correct.` };
  const selectedIdx = parseInt(checkedRadio.value, 10);
  const correctAnswerText = rawOptions[selectedIdx];
  if (!correctAnswerText) return { error: `Q${orderIdx}: The selected correct answer cannot be empty.` };
  return {
    data: {
      question_text: questionText,
      options: validOptions,
      correct_answer: correctAnswerText,
      socratic_hint: (document.getElementById(`${id}-hint`)?.value || '').trim(),
      difficulty_level: document.getElementById(`${id}-difficulty`)?.value || 'medium',
      points: parseInt(document.getElementById(`${id}-points`)?.value, 10) || 5,
      order_index: orderIdx
    }
  };
}

async function saveQuizAssessment() {
  const title = (document.getElementById('qb-title')?.value || '').trim();
  const type = document.getElementById('qb-type')?.value || 'quiz';
  const passing_score = currentQuizPassingScore;
  if (!title) { showToast('Please enter an assessment title.', 'error'); return; }
  if (_qbQuestionIds.length === 0) { showToast('Add at least one question before saving.', 'error'); return; }
  const questions = [];
  for (let i = 0; i < _qbQuestionIds.length; i++) {
    const uid = _qbQuestionIds[i];
    const result = _qbReadQuestion(uid, i+1);
    if (result.error) { showToast(result.error, 'error'); return; }
    questions.push(result.data);
  }
  const payload = { title, type, passing_score, questions };
  
  // ✅ إرسال lesson_id إذا تم اختيار درس
  if (currentLessonIdForQuiz) {
    payload.lesson_id = currentLessonIdForQuiz;
    console.log('Saving assessment with lesson_id:', currentLessonIdForQuiz);
  } else {
    console.log('Saving assessment without lesson_id');
  }
  
  let method = 'POST';
  let endpoint = `/courses/${currentBuilderCourseId}/chapters/${currentChapterIdForQuiz}/assessments`;
  if (currentEditAssessmentId) {
    method = 'PATCH';
    endpoint = `${endpoint}/${currentEditAssessmentId}`;
  }
  try {
    if (!currentBuilderCourseId || !currentChapterIdForQuiz) { showToast("Missing Course or Chapter ID", "error"); return; }
    const data = await apiCall(method, endpoint, payload);
    if (data && data.success) {
      closeModal('quizBuilder');
      _qbResetBuilder();
      showToast(`Assessment "${title}" ${currentEditAssessmentId ? "updated" : "saved"} successfully! ✅`, 'success');
      currentEditAssessmentId = null;
      currentLessonIdForQuiz = null;
      pendingEditAssessment = null;
      await openCourseBuilder(currentBuilderCourseId);
    } else showToast(data?.message || 'Failed to save assessment', 'error');
  } catch (err) { showToast("Server communication error", "error"); }
}

function _qbResetBuilder() {
  _qbCounter = 0;
  _qbQuestionIds = [];
  currentEditAssessmentId = null;
  currentLessonIdForQuiz = null;
  pendingEditAssessment = null;
  const container = document.getElementById('qb-questions-container');
  if (container) container.innerHTML = '';
  if (document.getElementById('qb-title')) document.getElementById('qb-title').value = '';
  if (document.getElementById('qb-type')) document.getElementById('qb-type').value = 'quiz';
  currentQuizPassingScore = 70;
}

// ─────────────────────────────────────────────────────────────────
// معاينة (Preview Mode)
// ─────────────────────────────────────────────────────────────────
async function togglePreview(isPreview) {
  const editBtn = document.getElementById('previewOffBtn');
  const previewBtn = document.getElementById('previewOnBtn');
  const previewPanel = document.getElementById('previewPanel');
  const chaptersContainer = document.getElementById('chaptersContainer');
  if (isPreview) {
    editBtn.classList.remove('active');
    previewBtn.classList.add('active');
    previewPanel.style.display = 'block';
    chaptersContainer.style.display = 'none';
    showToast('Loading preview data...', 'info');
    try {
      const data = await apiCall('GET', `/courses/${currentBuilderCourseId}`);
      if (!data || !data.success) throw new Error('Failed to fetch course data for preview.');
      const course = data.data.course || data.course;
      previewLessonsList = [];
      if (course.chapters) {
        const sortedChapters = [...course.chapters].sort((a,b) => (a.order_index||0)-(b.order_index||0));
        sortedChapters.forEach(chapter => {
          if (chapter.lessons) {
            const sortedLessons = [...chapter.lessons].sort((a,b) => (a.order_index||0)-(b.order_index||0));
            sortedLessons.forEach(lesson => { previewLessonsList.push({ ...lesson, chapterTitle: chapter.title }); });
          }
        });
      }
      if (previewLessonsList.length === 0) {
        document.getElementById('previewContent').innerHTML = '<div class="empty-state"><div class="empty-title">No lessons available to preview.</div></div>';
        updatePreviewNav();
        return;
      }
      currentPreviewIndex = 0;
      loadPreviewContent(currentPreviewIndex);
    } catch(err) { console.error("Preview mode error:", err); showToast('Error loading preview', 'error'); togglePreview(false); }
  } else {
    previewBtn.classList.remove('active');
    editBtn.classList.add('active');
    previewPanel.style.display = 'none';
    chaptersContainer.style.display = 'block';
  }
}

function loadPreviewContent(index) {
  const previewDiv = document.getElementById('previewContent');
  if (!previewDiv) return;
  const lesson = previewLessonsList[index];
  if (!lesson) { previewDiv.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-2);">Lesson data not found.</div>'; return; }
  let mediaHtml = '';
  let hasContent = false;
  const baseUrl = 'http://localhost:3000';
  if (lesson.video_url) {
    hasContent = true;
    const fullVideoUrl = lesson.video_url.startsWith('http') ? lesson.video_url : `${baseUrl}${lesson.video_url}`;
    mediaHtml += `<div style="background: #000; border-radius: var(--radius-md); overflow: hidden; position: relative; margin-bottom: 20px;"><video controls controlsList="nodownload" style="width: 100%; max-height: 500px; display: block;"><source src="${fullVideoUrl}" type="video/mp4">Your browser does not support the video tag.</video></div>`;
  }
  if (lesson.pdf_url) {
    hasContent = true;
    const fullPdfUrl = lesson.pdf_url.startsWith('http') ? lesson.pdf_url : `${baseUrl}${lesson.pdf_url}`;
    mediaHtml += `<div style="height: 600px; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; background: var(--bg-2); display: flex; flex-direction: column; margin-bottom: 20px;"><div style="padding: 10px; background: var(--bg-3); border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;"><span style="font-size: 14px; font-weight: 600;">📄 PDF Document</span><div><a href="${fullPdfUrl}" target="_blank" style="padding: 5px 10px; background: var(--primary); color: white; text-decoration: none; border-radius: var(--radius-sm); font-size: 12px; margin-right: 8px;">Open ↗</a><a href="${fullPdfUrl}" download style="padding: 5px 10px; background: var(--green, #22c55e); color: white; text-decoration: none; border-radius: var(--radius-sm); font-size: 12px;">Download ⬇</a></div></div><object data="${fullPdfUrl}" type="application/pdf" width="100%" height="100%" style="flex-grow: 1;"><div style="padding: 40px; text-align: center;"><p style="margin-bottom: 10px;">Your browser does not support inline PDFs.</p><a href="${fullPdfUrl}" download class="btn btn-primary">Download PDF ⬇</a></div></object></div>`;
  }
  if (!hasContent) mediaHtml = `<div style="background: var(--bg-2); padding: 40px; text-align: center; border-radius: var(--radius-md); color: var(--text-3);"><div style="font-size: 40px; margin-bottom: 10px;">🚧</div><div>No media content uploaded for this lesson yet.</div></div>`;
  previewDiv.innerHTML = `<div style="margin-bottom: 16px; font-size: 13px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px;">Chapter: ${escapeHtml(lesson.chapterTitle)}</div>${mediaHtml}<div style="padding: 16px; background: var(--bg-2); border-radius: var(--radius-sm); margin-top: 16px;"><h3 style="margin: 0 0 12px 0; font-size: 20px;">${escapeHtml(lesson.title)}</h3>${lesson.summary_text ? `<div style="color: var(--text-2); line-height: 1.6; white-space: pre-wrap; font-size: 15px;">${escapeHtml(lesson.summary_text)}</div>` : '<em style="color: var(--text-3); font-size: 14px;">No summary text provided.</em>'}</div>`;
  updatePreviewNav();
}

function updatePreviewNav() {
  const prevBtn = document.getElementById('prevLessonBtn');
  const nextBtn = document.getElementById('nextLessonBtn');
  const indexSpan = document.getElementById('previewIndex');
  if (!prevBtn || !nextBtn || !indexSpan) return;
  if (previewLessonsList.length === 0) { prevBtn.disabled = true; nextBtn.disabled = true; indexSpan.textContent = "0/0"; return; }
  indexSpan.textContent = `${currentPreviewIndex + 1} / ${previewLessonsList.length}`;
  prevBtn.disabled = currentPreviewIndex === 0;
  nextBtn.disabled = currentPreviewIndex === previewLessonsList.length - 1;
  prevBtn.onclick = () => { if (currentPreviewIndex > 0) { currentPreviewIndex--; loadPreviewContent(currentPreviewIndex); } };
  nextBtn.onclick = () => { if (currentPreviewIndex < previewLessonsList.length - 1) { currentPreviewIndex++; loadPreviewContent(currentPreviewIndex); } };
}

// ─────────────────────────────────────────────────────────────────
// ربط أزرار النوافذ المنبثقة
// ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const createChapterBtn = document.querySelector('#modal-newChapter .btn-primary');
  if (createChapterBtn) createChapterBtn.onclick = createChapter;
  const createLessonBtn = document.querySelector('#modal-newLesson .btn-primary');
  if (createLessonBtn) createLessonBtn.onclick = createLesson;
  const createAssessmentBtn = document.querySelector('#modal-newAssessment .btn-primary');
  if (createAssessmentBtn) createAssessmentBtn.onclick = createAssessment;
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('courseId');
  if (courseId) openCourseBuilder(courseId);
});