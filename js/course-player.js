// ========== CONFIGURATION & STATE ==========
const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('courseId');
const token = localStorage.getItem('token');
const API_BASE = 'http://localhost:3000/api/courses';

if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

let courseData = { title: "", chapters: [] };
let currentLesson = null;
let currentAssessment = null;      // التقييم الحالي الذي يعرضه الطالب
let assessmentsList = [];          // قائمة بجميع تقييمات الكورس

// ========== DATA FETCHING ==========

/**
 * جلب تفاصيل الكورس بالكامل (الفصول والدروس والتقييمات)
 */
async function fetchCourseDetails(shouldLoadFirst = false) {
    if (!courseId) {
        alert("Course ID not found");
        window.location.href = 'student-dashboard.html';
        return;
    }

    try {
        // 1. جلب الفصول
        const resChapters = await axios.get(`${API_BASE}/${courseId}/chapters`);
        const chapters = resChapters.data.data || resChapters.data;

        // 2. جلب الدروس لكل فصل
        const chaptersWithLessons = await Promise.all(chapters.map(async (chapter) => {
            try {
                const resLessons = await axios.get(`${API_BASE}/${courseId}/chapters/${chapter.id}/lessons`);
                return {
                    ...chapter,
                    lessons: resLessons.data.data || resLessons.data
                };
            } catch (err) {
                console.error(`خطأ في جلب دروس الفصل ${chapter.id}:`, err);
                return { ...chapter, lessons: [] };
            }
        }));
        courseData.chapters = chaptersWithLessons;

        // 3. جلب التقييمات الخاصة بالكورس (مع الأسئلة)
        await fetchAssessments();

        // 4. جلب التقدم (last_completed_order)
        try {
            const resProgress = await axios.get(`${API_BASE}/enrolled`);
            const enrolledCourses = resProgress.data.data.courses || [];
            const currentCourse = enrolledCourses.find(c => String(c.id) === String(courseId));
            courseData.last_completed_order = currentCourse ? Number(currentCourse.last_completed_order) : 0;
            console.log("📈 Student Progress (last_completed_order):", courseData.last_completed_order);
        } catch (progErr) {
            console.warn("تعذر جلب التقدم، سيتم ضبطه على 0", progErr);
            courseData.last_completed_order = 0;
        }

        const pageTitleElem = document.getElementById('pageTitle');
        if (pageTitleElem) pageTitleElem.innerText = "Dzire - Learning Space";

        // 5. تحميل أول درس تلقائياً إذا طُلب
        if (shouldLoadFirst && courseData.chapters.length > 0) {
            const firstChapter = courseData.chapters[0];
            if (firstChapter.lessons && firstChapter.lessons.length > 0) {
                const firstLesson = firstChapter.lessons[0];
                await loadLessonDetails(firstLesson.id, firstChapter.id);
            }
        }

        // 6. تحديث القائمة الجانبية
        renderSidebar();

    } catch (err) {
        console.error("Error fetching course architecture:", err);
    }
}

/**
 * جلب جميع التقييمات الخاصة بالكورس
 */
async function fetchAssessments() {
    try {
        const res = await axios.get(`${API_BASE}/${courseId}/assessments`);
        if (res.data.success) {
            assessmentsList = res.data.data || [];
            console.log("📝 Assessments loaded:", assessmentsList);
        } else {
            console.warn("No assessments found or API error");
            assessmentsList = [];
        }
    } catch (err) {
        console.error("Failed to fetch assessments:", err);
        assessmentsList = [];
    }
}

async function loadLessonDetails(lessonId, chapterId) {
    try {
        const res = await axios.get(`${API_BASE}/${courseId}/lessons/${lessonId}`);
        const lessonData = res.data.data || res.data;

        currentLesson = {
            ...lessonData,
            id: lessonId,
            chapterId: chapterId
        };
        currentAssessment = null;  // إخفاء أي تقييم كان مفتوحاً
        updateLessonDisplay();
        renderSidebar();
    } catch (err) {
        console.error("فشل جلب تفاصيل الدرس:", err);
    }
}

async function loadAssessment(assessmentId) {
    try {
        const res = await axios.get(`${API_BASE}/${courseId}/assessments/${assessmentId}`);
        if (res.data.success) {
            currentAssessment = res.data.data;
            currentLesson = null;
            displayAssessmentModal();
        } else {
            showToast("فشل تحميل التقييم", "error");
        }
    } catch (err) {
        console.error("Failed to load assessment:", err);
        showToast("خطأ في تحميل التقييم", "error");
    }
}

// ========== UI RENDERING ==========

function renderSidebar() {
    const sidebar = document.getElementById('playerSidebar');
    if (!sidebar) return;

    let html = '';
    const maxProgress = Number(courseData.last_completed_order || 0);

    courseData.chapters.forEach(chapter => {
        // عرض الدروس
        html += `<div class="chapter-block"><div class="chapter-title">${escapeHtml(chapter.title)}</div><div class="lessons-list">`;
        if (chapter.lessons) {
            chapter.lessons.forEach(lesson => {
                const lessonOrder = Number(lesson.order_index || 0);
                const isLocked = (lessonOrder > 1) && (lessonOrder > (maxProgress + 1));
                const isDone = (lessonOrder <= maxProgress) && maxProgress > 0;
                const isActive = (currentLesson && String(currentLesson.id) === String(lesson.id));

                html += `
                    <div class="lesson-item ${isLocked ? 'locked' : ''} ${isActive ? 'active' : ''}"
                         onclick="${isLocked ? '' : `window.handleLessonClick('${lesson.id}', '${chapter.id}', false)`}"
                         style="cursor: ${isLocked ? 'not-allowed' : 'pointer'}; opacity: ${isLocked ? '0.5' : '1'};">
                        <span>${isLocked ? '🔒' : (isDone ? '✅' : (isActive ? '▶️' : '📄'))}</span>
                        <span style="flex:1">${escapeHtml(lesson.title)}</span>
                    </div>`;
            });
        }
        html += `</div>`;

        // عرض التقييمات المرتبطة بهذا الفصل (إن وجدت)
        const chapterAssessments = assessmentsList.filter(a => a.chapter_id === chapter.id);
        if (chapterAssessments.length) {
            html += `<div class="assessments-list" style="margin-top: 12px; padding-left: 20px;">`;
            chapterAssessments.forEach(ass => {
                html += `
                    <div class="assessment-item" onclick="window.loadAssessment('${ass.id}')" style="cursor: pointer; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                        <span>📝</span>
                        <span>${escapeHtml(ass.title)}</span>
                        <span class="badge badge-purple">${ass.type === 'quiz' ? 'Quiz' : 'Exam'}</span>
                    </div>`;
            });
            html += `</div>`;
        }

        html += `</div>`;
    });

    sidebar.innerHTML = html;
}

window.handleLessonClick = async function(lessonId, chapterId, isLocked) {
    if (isLocked) {
        alert("🔒 هذا الدرس مغلق حالياً.");
        return;
    }
    await loadLessonDetails(lessonId, chapterId);
};

window.loadAssessment = async function(assessmentId) {
    await loadAssessment(assessmentId);
};

function updateLessonDisplay() {
    if (!currentLesson) return;

    document.getElementById('lessonTitle').innerText = currentLesson.title || "بدون عنوان";
    document.getElementById('lessonDesc').innerText = currentLesson.description || "لا يوجد وصف للدرس.";
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
    if (pdfFrame) {
        let pUrl = currentLesson.pdf || "";
        if (pUrl && pUrl.startsWith('/') && !pUrl.startsWith('http')) pUrl = `http://localhost:3000${pUrl}`;
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

    setStudyMode('video');
}

function checkIfLessonDone(lessonId) {
    let currentOrder = 0;
    for (const chapter of courseData.chapters) {
        const lesson = chapter.lessons.find(l => String(l.id) === String(lessonId));
        if (lesson) {
            currentOrder = lesson.order_index;
            break;
        }
    }
    const maxProgress = courseData.last_completed_order || 0;
    return Number(currentOrder) <= Number(maxProgress);
}

function setStudyMode(mode) {
    const vContent = document.getElementById('videoContent');
    const pContent = document.getElementById('pdfContent');
    const vBtn = document.getElementById('modeVideoBtn');
    const pBtn = document.getElementById('modePdfBtn');

    if (mode === 'video') {
        if(vContent) vContent.style.display = 'block';
        if(pContent) pContent.style.display = 'none';
        if(vBtn) vBtn.classList.add('active');
        if(pBtn) pBtn.classList.remove('active');
    } else {
        if (!currentLesson || !currentLesson.pdf) {
            alert("⚠️ لا يوجد ملف PDF متاح لهذا الدرس.");
            return;
        }
        if(vContent) vContent.style.display = 'none';
        if(pContent) pContent.style.display = 'block';
        if(pBtn) pBtn.classList.add('active');
        if(vBtn) vBtn.classList.remove('active');
    }
}

// ربط أزرار النمط
document.getElementById('modeVideoBtn').onclick = () => setStudyMode('video');
document.getElementById('modePdfBtn').onclick = () => setStudyMode('pdf');

// ========== MARK AS COMPLETE ==========
const completeBtn = document.getElementById('completeLessonBtn');
completeBtn.onclick = async () => {
    const cId = courseId;
    const chapId = currentLesson?.chapterId;
    const lesId = currentLesson?.id;

    if (!lesId || !cId || !chapId) {
        alert("بيانات الدرس غير مكتملة في المتصفح، جرب إعادة تحميل الصفحة.");
        return;
    }

    try {
        completeBtn.innerText = "SAVING...";
        completeBtn.disabled = true;

        await axios.post(`${API_BASE}/complete-lesson`, {
            courseId: cId, 
            chapterId: chapId,
            lessonId: lesId,
            xp_reward: Number(currentLesson.xp || 0)
        });

        alert("🎉 أحسنت! تم حفظ تقدمك وزيادة نقاط الخبرة.");
        completeBtn.innerText = "COMPLETED";
        completeBtn.style.background = "#10B981";

        await fetchCourseDetails(); // تحديث التقدم والقائمة الجانبية

    } catch (err) {
        console.error("خطأ في الربط:", err);
        alert("فشل حفظ التقدم، تأكد من اتصالك بالشبكة.");
        completeBtn.innerText = "MARK AS COMPLETED";
        completeBtn.disabled = false;
    }
};

// ========== ASSESSMENT MODAL ==========
function displayAssessmentModal() {
    if (!currentAssessment) return;

    // إنشاء مودال التقييم إذا لم يكن موجوداً
    let modal = document.getElementById('assessmentModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'assessmentModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" style="max-width: 700px;">
                <div class="modal-header">
                    <div class="modal-title" id="assessmentModalTitle">Assessment</div>
                    <div class="modal-close" onclick="closeAssessmentModal()">✕</div>
                </div>
                <div class="modal-body" id="assessmentModalBody"></div>
                <div class="modal-footer">
                    <button class="btn btn-ghost" onclick="closeAssessmentModal()">Close</button>
                    <button class="btn btn-primary" id="submitAssessmentBtn">Submit</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    document.getElementById('assessmentModalTitle').innerText = currentAssessment.title;
    const body = document.getElementById('assessmentModalBody');
    body.innerHTML = generateAssessmentHTML(currentAssessment);
    modal.classList.add('open');

    // ربط زر الإرسال
    document.getElementById('submitAssessmentBtn').onclick = () => submitAssessment();
}

function generateAssessmentHTML(assessment) {
    let html = `<p><strong>Passing Score:</strong> ${assessment.passing_score}%</p><div class="assessment-questions">`;
    assessment.questions.forEach((q, idx) => {
        html += `
            <div class="assessment-question" style="margin-bottom: 20px; padding: 15px; background: var(--bg-2); border-radius: 8px;">
                <p><strong>Q${idx+1}:</strong> ${escapeHtml(q.question_text)}</p>
                <div class="options">`;
        q.options.forEach((opt, optIdx) => {
            html += `
                <label style="display: block; margin: 8px 0;">
                    <input type="radio" name="q_${q.id}" value="${escapeAttr(opt)}"> 
                    ${escapeHtml(opt)}
                </label>`;
        });
        html += `</div></div>`;
    });
    html += `</div>`;
    return html;
}

async function submitAssessment() {
    const answers = [];
    currentAssessment.questions.forEach(q => {
        const selected = document.querySelector(`input[name="q_${q.id}"]:checked`);
        if (selected) {
            answers.push({
                questionId: q.id,
                answer: selected.value
            });
        } else {
            answers.push({
                questionId: q.id,
                answer: null
            });
        }
    });

    try {
        const res = await axios.post(`${API_BASE}/${courseId}/assessments/${currentAssessment.id}/submit`, { answers });
        if (res.data.success) {
            const score = res.data.score;
            const passed = res.data.passed;
            showToast(`Score: ${score}% - ${passed ? 'Passed ✅' : 'Failed ❌'}`, passed ? 'success' : 'error');
            closeAssessmentModal();
            // يمكن تحديث التقدم أو إعادة فتح التقييم إذا رسب
        } else {
            showToast(res.data.message || 'Submission failed', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Error submitting assessment', 'error');
    }
}

function closeAssessmentModal() {
    const modal = document.getElementById('assessmentModal');
    if (modal) modal.classList.remove('open');
    currentAssessment = null;
}

function showToast(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
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

// بدء التحميل
fetchCourseDetails(true);