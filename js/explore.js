/**
 * Explore Module - Dzire Adaptive Learning System
 * Final Integrated Version (Fixed 404 & Defined Errors)
 */
const ExploreModule = {
    // الإعدادات الأساسية
    COURSES_API: 'http://localhost:3000/api/courses',
    STUDENTS_API: 'http://localhost:3000/api/students', // المسار المتوقع لـ studentController

    // تشغيل الموديول
    init: function () {
        console.log("Explore Module Initialized 🌍");
        this.loadCourses();
        this.setupEventListeners();
    },

    // 1. جلب الكورسات المتاحة
    loadCourses: async function () {
        const grid = document.getElementById('exploreCourseGrid');
        if (!grid) return;

        grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:50px;">
                <div class="loader" style="margin: 0 auto 10px; border: 3px solid var(--border-md); border-top: 3px solid var(--blue-400); border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite;"></div>
                <p style="color:var(--text-3)">جاري جلب الكورسات المتاحة... 🚀</p>
            </div>`;

        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${this.COURSES_API}/available`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log("Courses API Response:", response.data);

            let courses = [];
            if (response.data && response.data.data && Array.isArray(response.data.data.courses)) {
                courses = response.data.data.courses;
            } else if (response.data && Array.isArray(response.data.data)) {
                courses = response.data.data;
            }

            this.renderCourses(courses);
        } catch (error) {
            console.error('Fetch Error:', error);
            this.handleError(error);
        }
    },

    // 2. عرض الكورسات في الشبكة
    renderCourses: function (courses) {
        const grid = document.getElementById('exploreCourseGrid');
        if (!grid) return;

        if (!courses || courses.length === 0) {
            grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:50px; color:var(--text-3);">لا توجد كورسات جديدة حالياً 🌌</div>`;
            return;
        }

        grid.innerHTML = '';
        courses.forEach(course => {
            grid.insertAdjacentHTML('beforeend', this.createCourseCard(course));
        });
    },

    // 3. بناء تصميم كارت الكورس
    // 3. بناء تصميم كارت الكورس (معدل لدعم الصور)
   createCourseCard: function(course) {
    const id = course.id; 
    const title = course.title; 
    const instructor = course.teacher_name; 
    const xp = course.xp_reward || 150;
    // جلب المستوى الحقيقي من قاعدة البيانات (أو افتراض 'Beginner' إذا كان فارغاً)
    const level = course.difficulty_level || 'Beginner'; 

    const SERVER_URL = 'http://localhost:3000';
    let finalImageUrl = course.thumbnail_url 
        ? (course.thumbnail_url.startsWith('http') ? course.thumbnail_url : `${SERVER_URL}${course.thumbnail_url}`)
        : 'https://via.placeholder.com/400x225?text=Dzire+Learning';

    return `
        <div class="card course-card-animate" style="padding:0; overflow:hidden; display:flex; flex-direction:column; height: 360px; border-radius:15px; background:var(--bg-2); border:1px solid var(--border-md);">
            <div style="height:200px; min-height:200px; background:var(--blue-dim); position:relative; overflow:hidden;">
                <img src="${finalImageUrl}" style="width:100%; height:100%; object-fit:cover;" class="course-img-hover">
                <div style="position:absolute; top:12px; left:12px; background:rgba(0,0,0,0.6); backdrop-filter:blur(4px); color:#fbbf24; padding:3px 10px; border-radius:6px; font-size:11px; font-weight:bold;">
                    ⚡ +${xp} XP
                </div>
            </div>

            <div style="padding:15px; flex:1; display:flex; flex-direction:column; justify-content:space-between;">
                <div>
                    <p style="font-size:11px; color:var(--text-3); text-transform:uppercase; margin-bottom:4px;">Pr. ${instructor}</p>
                    <h3 style="font-family:'Syne', sans-serif; font-size:16px; color:var(--text-1); line-height:1.2; font-weight:700; margin:0; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
                        ${title}
                    </h3>
                </div>
                
                <div style="margin-top:auto; display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-md); padding-top:12px;">
                    <div style="display:flex; flex-direction:column;">
                        <span style="color:var(--text-3); font-size:10px;">Difficulty</span>
                        <span style="color:var(--blue-400); font-weight:800; font-size:13px;">${level}</span>
                    </div>
                    <button class="btn btn-primary btn-sm" style="border-radius:10px; padding:8px 18px; font-weight:600;" onclick="ExploreModule.enroll('${id}')">Enroll Now</button>
                </div>
            </div>
        </div>`;
},

    // 4. دالة التسجيل (تم تعديل المسار ليتوافق مع السيرفر)
    enroll: async function (courseId) {
        if (!courseId) return;
        const token = localStorage.getItem('token');

        try {
            if (typeof showToast === 'function') showToast("جاري تسجيلك... ⏳", "info");

            // نستخدم STUDENTS_API لأن الـ Controller في السيرفر هو studentController
            const response = await axios.post(`${this.STUDENTS_API}/enroll`,
                { courseId: courseId },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                if (typeof showToast === 'function') showToast("تم التسجيل بنجاح! 🎓", "success");
                setTimeout(() => {
                    if (typeof navigate === 'function') navigate('courses');
                }, 1500);
            }
        } catch (err) {
            console.error('Enrollment Error:', err.response || err);
            const msg = err.response?.data?.message || "فشل التسجيل (404 أو خطأ سيرفر)";
            if (typeof showToast === 'function') showToast(msg, "error");
        }
    },

    // 5. معالجة أخطاء الواجهة
    handleError: function (err) {
        const grid = document.getElementById('exploreCourseGrid');
        if (grid) {
            grid.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding:40px;">
                    <p style="color:var(--red-400);">⚠️ تعذر الاتصال بالسيرفر حالياً.</p>
                    <button class="btn btn-ghost btn-sm" onclick="ExploreModule.loadCourses()">إعادة المحاولة</button>
                </div>`;
        }
    },

    // 6. مراقبة المدخلات
    setupEventListeners: function () {
        const searchInput = document.getElementById('exploreSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => console.log("Filtering..."));
        }
    }
};

// ستايل إضافي للتحسين البصري
if (!document.getElementById('explore-styles')) {
    const style = document.createElement('style');
    style.id = 'explore-styles';
    style.innerHTML = `
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .course-card-animate { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .course-card-animate:hover { transform: translateY(-5px); box-shadow: 0 12px 24px rgba(0,0,0,0.2); }
    `;
    document.head.appendChild(style);
}
