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

// ========== DATA FETCHING ==========

/**
 * جلب تفاصيل الكورس بالكامل (الفصول والدروس)
 */
async function fetchCourseDetails(shouldLoadFirst = false) {
    if (!courseId) {
        alert("Course ID not found");
        window.location.href = 'student-dashboard.html';
        return;
    }

    try {
        // 1. جلب قائمة الفصول (هنا عرفنا resChapters)
        const resChapters = await axios.get(`${API_BASE}/${courseId}/chapters`);
        const chapters = resChapters.data.data || resChapters.data;

        // 2. جلب الدروس لكل فصل بالتوازي
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

        // 3. تحديث مخزن البيانات العالمي
        courseData.chapters = chaptersWithLessons;

        // --- الجزء المهم والمعدل هنا ---
        // 4. جلب التقدم الخاص بالطالب (last_completed_order)
        // ملاحظة: يجب أن يكون لديك API يعيد تفاصيل التسجيل أو التقدم
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
        // ------------------------------

        const pageTitleElem = document.getElementById('pageTitle');
        if (pageTitleElem) pageTitleElem.innerText = "Dzire - Learning Space";

        // 5. منطق التحميل التلقائي
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

async function loadLessonDetails(lessonId, chapterId) {
    try {
        const res = await axios.get(`${API_BASE}/${courseId}/lessons/${lessonId}`);
        const lessonData = res.data.data || res.data;

        // إصلاح الربط: ندمج المعرفات يدوياً لأن السيرفر يعيد بيانات المحتوى فقط
        currentLesson = {
            ...lessonData,
            id: lessonId,
            chapterId: chapterId
        };

        updateLessonDisplay();
        renderSidebar();
    } catch (err) {
        console.error("فشل جلب تفاصيل الدرس:", err);
    }
}

// ========== UI RENDERING ==========

function renderSidebar() {
    const sidebar = document.getElementById('playerSidebar');
    if (!sidebar) return;

    let html = '';
    
    // تأكد من جلب التقدم، إذا لم ينجح نعتبره 0
    const maxProgress = Number(courseData.last_completed_order || 0);
    
    console.log("--- فحص السايدبار ---");
    console.log("تقدم الطالب الحالي (Max Progress):", maxProgress);

    courseData.chapters.forEach(chapter => {
        html += `
            <div class="chapter-block">
                <div class="chapter-title" style="color: #60A5FA; font-weight: bold; margin: 10px 0;">${chapter.title}</div>
                <div class="lessons-list">`;

        if (chapter.lessons) {
            chapter.lessons.forEach(lesson => {
                // الفحص الجوهري: تأكد من اسم الحقل القادم من السيرفر
                // جرب تغيير order_index إلى التسمية التي تظهر في الـ Network (مثلاً: order)
                const lessonOrder = Number(lesson.order_index || 0);

                // طباعة فحص لكل درس في الكونسول لتعرف لماذا هو مغلق
                console.log(`درس: ${lesson.title} | ترتيبه: ${lessonOrder} | هل هو أكبر من ${maxProgress + 1}؟`);

                // القاعدة الذهبية: الدرس الأول (1) يفتح دائماً. 
                // بقية الدروس تفتح إذا كان ترتيبها أقل أو يساوي (تقدم الطالب + 1)
                const isLocked = (lessonOrder > 1) && (lessonOrder > (maxProgress + 1));
                const isDone = (lessonOrder <= maxProgress) && maxProgress > 0;
                
                const isActive = (currentLesson && String(currentLesson.id) === String(lesson.id));

                html += `
                    <div class="lesson-item ${isLocked ? 'locked' : ''} ${isActive ? 'active' : ''}" 
                         style="padding: 10px; cursor: ${isLocked ? 'not-allowed' : 'pointer'}; border-radius: 8px; margin-bottom: 5px; display: flex; align-items: center; gap: 10px; 
                                opacity: ${isLocked ? '0.5' : '1'};
                                background: ${isActive ? 'rgba(59,130,246,0.2)' : 'transparent'};"
                         onclick="window.handleLessonClick('${lesson.id}', '${chapter.id}', ${isLocked})">
                        
                        <span>${isLocked ? '🔒' : (isDone ? '✅' : (isActive ? '▶️' : '📄'))}</span>
                        
                        <span style="flex: 1;">${lesson.title}</span>
                    </div>`;
            });
        }
        html += `</div></div>`;
    });
    sidebar.innerHTML = html;
}
window.handleLessonClick = async function (lessonId, chapterId, isLocked) {
    if (isLocked) {
        alert("🔒 هذا الدرس مغلق حالياً.");
        return;
    }
    await loadLessonDetails(lessonId, chapterId);
};

function updateLessonDisplay() {
    if (!currentLesson) return;

    document.getElementById('lessonTitle').innerText = currentLesson.title || "بدون عنوان";
    document.getElementById('lessonDesc').innerText = currentLesson.description || "لا يوجد وصف للدرس.";
    document.getElementById('xpReward').innerText = currentLesson.xp || 0;

    // تحديث الفيديو
    const videoPlayer = document.getElementById('mainVideoPlayer');
    const videoSource = document.getElementById('videoSource');

    if (videoPlayer && videoSource && currentLesson.video) {
        let vUrl = currentLesson.video;
        if (vUrl.startsWith('/') && !vUrl.startsWith('http')) vUrl = `http://localhost:3000${vUrl}`;
        videoSource.src = vUrl;
        videoPlayer.load();
    }

    // تحديث الـ PDF
    const pdfFrame = document.getElementById('mainPdfFrame');
    if (pdfFrame) {
        let pUrl = currentLesson.pdf || "";
        if (pUrl && pUrl.startsWith('/') && !pUrl.startsWith('http')) pUrl = `http://localhost:3000${pUrl}`;
        pdfFrame.src = pUrl;
    }

    const completeBtn = document.getElementById('completeLessonBtn');
    if (completeBtn) {
        // نفحص هل الدرس الحالي مكتمل من خلال بيانات الكورس
        const isCompleted = checkIfLessonDone(currentLesson.id);

        if (isCompleted) {
            completeBtn.innerText = "COMPLETED";
            completeBtn.disabled = true;
            completeBtn.style.background = "#10B981"; // اللون الأخضر
        } else {
            completeBtn.innerText = "MARK AS COMPLETED";
            completeBtn.disabled = false;
            completeBtn.style.background = ""; // يعود للون الأصلي (مثلاً الأزرق)
        }
    }

    // الوضع الافتراضي عند التحميل هو الفيديو
    setStudyMode('video');
}
function checkIfLessonDone(lessonId) {
    // 1. استخراج ترتيب الدرس الحالي من بيانات الكورس
    let currentOrder = 0;
    for (const chapter of courseData.chapters) {
        const lesson = chapter.lessons.find(l => String(l.id) === String(lessonId));
        if (lesson) {
            currentOrder = lesson.order_index;
            break;
        }
    }

    // 2. المقارنة مع أقصى تقدم مسجل للطالب (القادم من السيرفر)
    const maxProgress = courseData.last_completed_order || 0;
    
    // إذا كان ترتيب الدرس الحالي أقل أو يساوي ما تم إنجازه سابقاً
    return Number(currentOrder) <= Number(maxProgress);
}

// دالة تغيير نمط الدراسة (مستقلة)
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

// ربط أزرار النمط بالدالة
document.getElementById('modeVideoBtn').onclick = () => setStudyMode('video');
document.getElementById('modePdfBtn').onclick = () => setStudyMode('pdf');

// ========== MARK AS COMPLETE LOGIC ==========

const completeBtn = document.getElementById('completeLessonBtn');

completeBtn.onclick = async () => {
    // التأكد من أن البيانات محقونة وجاهزة
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

        // تحديث الواجهة لجلب الدروس الجديدة التي قد تكون فتحت
        await fetchCourseDetails();

    } catch (err) {
        console.error("خطأ في الربط:", err);
        alert("فشل حفظ التقدم، تأكد من اتصالك بالشبكة.");
        completeBtn.innerText = "MARK AS COMPLETED";
        completeBtn.disabled = false;
    }
};
fetchCourseDetails(true);