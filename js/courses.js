const MyCoursesModule = {
    API_BASE: 'http://localhost:3000/api/courses',

    init: async function() {
        await this.fetchEnrolledCourses();
    },

    fetchEnrolledCourses: async function() {
        const grid = document.getElementById('studentCourseGrid');
        const token = localStorage.getItem('token');
        if (!grid) return;

        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px;">جاري استخراج بياناتك...</div>';

        try {
            const res = await axios.get(`${this.API_BASE}/enrolled`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log("📥 Raw Data from Server:", res.data);

            let coursesArray = [];

            let source = res.data.data || res.data;

            if (source && typeof source === 'object' && !Array.isArray(source)) {
                console.log("⚠️ Data is an Object, searching for arrays inside...");
                const possibleArrayKey = Object.keys(source).find(key => Array.isArray(source[key]));
                if (possibleArrayKey) {
                    coursesArray = source[possibleArrayKey];
                    console.log(`✅ Found array in key: "${possibleArrayKey}"`);
                } else {
                    coursesArray = Object.values(source);
                    console.log("✅ Converted Object values to Array");
                }
            } else if (Array.isArray(source)) {
                coursesArray = source;
                console.log("✅ Data is already an Array");
            }

            coursesArray = coursesArray.filter(item => item && typeof item === 'object' && (item._id || item.courseId || item.title));

            console.log("📊 Final Processed Array:", coursesArray);

            if (coursesArray.length === 0) {
                this.renderEmptyState(grid);
                return;
            }

            // Fetch real progress for each course
            const enriched = await Promise.all(coursesArray.map(async (item) => {
                const core = item.courseId || item;
                const cId = core._id || core.id || core.course_id;

                try {
                    const pRes = await axios.get(`${this.API_BASE}/${cId}/progress`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const realValue = pRes.data.progress;
                    console.log(`📊 التقدم الحقيقي للكورس ${core.title}:`, realValue);
                    return { ...core, realProgress: realValue };
                } catch (e) {
                    console.error(`Error fetching progress for ${cId}:`, e);
                    return { ...core, realProgress: 0 };
                }
            }));

            this.render(grid, enriched);

        } catch (err) {
            console.error("❌ Fetch Error:", err);
            grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:red;">⚠️ خطأ في الاتصال بالسيرفر.</div>';
        }
    },

    render: function(container, courses) {
        const SERVER_URL = 'http://localhost:3000';

        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
        container.style.gap = '20px';

        container.innerHTML = courses.map(course => {
            const id = course.id || course._id;
            const title = course.title || 'بدون عنوان';
            const instructor = course.teacher_name || 'خبير Dzire';
            const progress = course.progress_percentage || 0;
            const level = course.difficulty_level || 'Beginner';

            // Image with fallback – no external placeholder service needed
            let imageHtml = '';
            if (course.thumbnail_url) {
                const imageUrl = course.thumbnail_url.startsWith('http')
                    ? course.thumbnail_url
                    : `${SERVER_URL}${course.thumbnail_url}`;
                imageHtml = `<img src="${imageUrl}" style="width:100%; height:100%; object-fit:cover;"
                             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                             <div style="display:none; width:100%; height:100%; align-items:center; justify-content:center; font-size:2.5rem; background:linear-gradient(135deg, #1e3a5f, #0f1b35);">
                                 📚
                             </div>`;
            } else {
                imageHtml = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:2.5rem; background:linear-gradient(135deg, #1e3a5f, #0f1b35);">
                                 📚
                             </div>`;
            }

            return `
                <div class="card course-card-animate"
                     style="padding:0; overflow:hidden; display:flex; flex-direction:column; height:400px;
                            border-radius:15px; background:var(--bg-2); border:1px solid var(--border-md);
                            transition: transform 0.3s ease, box-shadow 0.3s ease;">

                    <div style="height:200px; min-height:200px; background:var(--blue-dim); position:relative; overflow:hidden;">
                        ${imageHtml}
                        <div style="position:absolute; bottom:12px; right:12px; background:var(--blue-400); color:white; padding:4px 10px; border-radius:6px; font-size:12px; font-weight:bold; box-shadow:0 4px 10px rgba(0,0,0,0.2);">
                            ${progress}%
                        </div>
                    </div>

                    <div style="padding:18px; flex:1; display:flex; flex-direction:column; justify-content:space-between;">
                        <div>
                            <h3 style="font-family:'Syne', sans-serif; font-size:17px; margin-bottom:8px; color:var(--text-1); line-height:1.3;
                                display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; font-weight:700;">
                                ${title}
                            </h3>
                            <p style="font-size:13px; color:var(--text-2); margin-bottom:12px;">Pr. ${instructor}</p>
                        </div>

                        <div style="margin-top:auto;">
                            <div style="width:100%; height:5px; background:var(--bg-3); border-radius:10px; margin-bottom:12px; overflow:hidden;">
                                <div style="width:${progress}%; height:100%; background:linear-gradient(90deg, #3b82f6, #60a5fa); border-radius:10px;"></div>
                            </div>

                            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-md); padding-top:12px;">
                                <div style="display:flex; flex-direction:column;">
                                    <span style="color:var(--text-3); font-size:10px;">Level</span>
                                    <span style="color:var(--blue-400); font-weight:800; font-size:14px;">${level}</span>
                                </div>
                                <button class="btn btn-primary btn-sm"
                                        style="border-radius:8px; padding:10px 20px; font-weight:600; font-size:13px;"
                                        onclick="window.location.href='course-player.html?courseId=${id}'">
                                    ${progress > 0 ? 'Resume' : 'Start'} ➔
                                </button>
                            </div>
                        </div>
                    </div>
                </div>`;
        }).join('');
    },

    renderEmptyState: function(container) {
        container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:60px; color:var(--text-3);">لا توجد كورسات نشطة حالياً.</div>`;
    }
};