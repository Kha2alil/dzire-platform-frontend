/* teacher-students.js – المسار الصحيح /api/courses/my-progress */
let allStudents = [];         // البيانات الأصلية (غير مجمعة)
let groupedStudents = [];     // البيانات بعد التجميع حسب الطالب
let studentsCourses = [];

const API_URL = 'http://localhost:3000/api/courses/my-progress';

const token = localStorage.getItem('token');
if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// دالة ذكية لاستخراج القيمة مع تجاهل حالة الأحرف
function getField(obj, possibleKeys, defaultValue = '') {
    if (!obj || typeof obj !== 'object') return defaultValue;
    for (let key of possibleKeys) {
        if (obj.hasOwnProperty(key)) {
            const val = obj[key];
            if (val !== undefined && val !== null) return val;
        }
    }
    const lowerKeys = possibleKeys.map(k => k.toLowerCase());
    for (let [key, val] of Object.entries(obj)) {
        if (lowerKeys.includes(key.toLowerCase())) {
            if (val !== undefined && val !== null) return val;
        }
    }
    return defaultValue;
}

function parseProgress(value) {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return Math.min(100, Math.max(0, value));
    if (typeof value === 'string') {
        const match = value.match(/(\d+(?:\.\d+)?)/);
        if (match) return Math.min(100, Math.max(0, parseFloat(match[1])));
    }
    return 0;
}

// ====================== تجميع السجلات حسب الطالب ======================
function groupStudentsByUniqueId(studentsArray) {
    const map = new Map();
    
    for (const record of studentsArray) {
        // محاولة الحصول على معرف الطالب
        let studentId = getField(record, ['id', 'studentId', 'student_id', 'userId', 'user_id'], null);
        if (!studentId) {
            // إذا لم يكن هناك معرف، نستخدم الاسم + البريد (أو اسم فقط)
            const name = getField(record, ['studentName', 'Student', 'student_name', 'name', 'full_name'], '');
            const email = getField(record, ['email', 'student_email'], '');
            studentId = `${name}|${email}`; // مفتاح مركب
        }
        
        if (!map.has(studentId)) {
            // نسخة جديدة من السجل (سنعدلها لتصبح مجمعة)
            const groupedRecord = { ...record };
            // نضيف مصفوفة للكورسات
            groupedRecord.coursesList = [];
            groupedRecord.totalProgress = 0;
            groupedRecord.courseCount = 0;
            map.set(studentId, groupedRecord);
        }
        
        const grouped = map.get(studentId);
        
        // جمع الكورسات
        let courseName = getField(record, ['courseTitle', 'Course', 'course', 'course_name', 'title'], '');
        if (courseName && !grouped.coursesList.includes(courseName)) {
            grouped.coursesList.push(courseName);
        }
        
        // تجميع التقدم (سنحسب المتوسط لاحقاً)
        let progress = parseProgress(getField(record, ['progress', 'Progress', 'progress_percentage'], 0));
        grouped.totalProgress += progress;
        grouped.courseCount++;
    }
    
    // تحويل الخريطة إلى مصفوفة وحساب متوسط التقدم
    const result = [];
    for (let [_, grouped] of map.entries()) {
        if (grouped.courseCount > 0) {
            grouped.averageProgress = Math.round(grouped.totalProgress / grouped.courseCount);
        } else {
            grouped.averageProgress = 0;
        }
        // استبدال حقل progress المفرد بالمتوسط (أو يمكن الاحتفاظ بالأصل)
        grouped.progress = grouped.averageProgress;
        // دمج الكورسات في نص واحد
        grouped.coursesCombined = grouped.coursesList.join(', ');
        result.push(grouped);
    }
    
    return result;
}

// ====================== جلب الطلاب ======================
async function fetchStudents() {
    try {
        console.log('🔄 جاري الاتصال بـ:', API_URL);
        const response = await axios.get(API_URL);
        console.log('📥 Full Response:', response.data);
        
        if (response.data && response.data.success) {
            allStudents = response.data.data || [];
            console.log(`✅ تم جلب ${allStudents.length} سجل (قبل التجميع)`);
            
            // تجميع السجلات حسب الطالب
            groupedStudents = groupStudentsByUniqueId(allStudents);
            console.log(`✅ بعد التجميع: ${groupedStudents.length} طالب فريد`);
            
            if (groupedStudents.length) {
                console.log('🔍 عينة من أول طالب بعد التجميع:', groupedStudents[0]);
            }
            
            updateStudentCountBadge(groupedStudents.length);
            extractCoursesList();
            populateCourseFilter();
            renderStudentTable(groupedStudents);
            return groupedStudents;
        } else {
            console.error('فشل جلب الطلاب');
            showToast('Failed to load students', 'error');
            return [];
        }
    } catch (err) {
        console.error('❌ Error fetching students:', err);
        if (err.response) {
            if (err.response.status === 404) {
                showToast(`المسار ${API_URL} غير موجود. تأكد من تشغيل الخادم.`, 'error');
            } else if (err.response.status === 401) {
                showToast('غير مصرح: يرجى تسجيل الدخول مرة أخرى', 'error');
            } else {
                showToast(`خطأ ${err.response.status}: ${err.response.data?.message || 'خطأ في الخادم'}`, 'error');
            }
        } else if (err.request) {
            showToast('لا استجابة من الخادم. تأكد من تشغيل الخادم على المنفذ 3000', 'error');
        } else {
            showToast('خطأ في الطلب: ' + err.message, 'error');
        }
        return [];
    }
}

// استخراج قائمة الكورسات (من البيانات المجمعة)
function extractCoursesList() {
    const coursesSet = new Set();
    groupedStudents.forEach(s => {
        if (s.coursesList && s.coursesList.length) {
            s.coursesList.forEach(c => coursesSet.add(c));
        } else {
            let course = getField(s, ['courseTitle', 'Course', 'course', 'course_name', 'title'], '');
            if (course) coursesSet.add(course);
        }
    });
    studentsCourses = Array.from(coursesSet).sort();
}

function populateCourseFilter() {
    const select = document.getElementById('studentCourseFilter');
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = '<option value="">All Courses</option>';
    studentsCourses.forEach(course => {
        const option = document.createElement('option');
        option.value = course;
        option.textContent = course;
        if (course === currentValue) option.selected = true;
        select.appendChild(option);
    });
}

// عرض الجدول (باستخدام البيانات المجمعة)
function renderStudentTable(students) {
    const tbody = document.getElementById('studentTable');
    if (!tbody) return;
    
    if (!students.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:40px;">No students found</td></tr>';
        return;
    }
    
    tbody.innerHTML = students.map(student => {
        let studentName = getField(student, ['studentName', 'Student', 'student_name', 'name', 'full_name'], 'Unknown');
        // عرض الكورسات بشكل نصي (قائمة مفصولة بفواصل)
        let coursesDisplay = student.coursesCombined || getField(student, ['courseTitle', 'Course', 'course', 'course_name'], '—');
        if (coursesDisplay === '—' && student.coursesList && student.coursesList.length) {
            coursesDisplay = student.coursesList.join(', ');
        }
        let progress = student.averageProgress !== undefined ? student.averageProgress : parseProgress(getField(student, ['progress', 'Progress'], 0));
        let xp = getField(student, ['xp', 'XP', 'total_xp'], 0);
        xp = Number(xp) || 0;
        let level = getField(student, ['level', 'Level', 'current_level'], 1);
        level = Number(level) || 1;
        let lastActive = getField(student, ['lastActive', 'Last_Active', 'last_active', 'last_activity', 'updated_at'], '—');
        if (lastActive !== '—' && typeof lastActive !== 'string') {
            lastActive = new Date(lastActive).toLocaleString();
        } else if (typeof lastActive === 'string' && lastActive.includes('T')) {
            lastActive = new Date(lastActive).toLocaleString();
        }
        let status = getField(student, ['status', 'Status', 'enrollment_status'], 'Active');
        
        let progressColorClass = '';
        if (progress >= 75) progressColorClass = 'green';
        else if (progress >= 40) progressColorClass = '';
        else progressColorClass = 'red';
        
        let statusBadgeClass = 'badge-green';
        let statusText = 'Active';
        const s = String(status).toLowerCase();
        if (s === 'at risk') { statusBadgeClass = 'badge-red'; statusText = 'At Risk'; }
        else if (s === 'inactive' || s === 'suspended') { statusBadgeClass = 'badge-blue'; statusText = 'Inactive'; }
        else if (s === 'completed') { statusBadgeClass = 'badge-purple'; statusText = 'Completed'; }
        
        const initials = String(studentName).split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
        const avatarColor = 'rgba(59,130,246,0.2)';
        const avatarTextColor = 'var(--blue-400)';
        
        return `
            <tr>
                <td>
                    <div class="user-cell">
                        <div class="avatar" style="background:${avatarColor}; color:${avatarTextColor}">
                            ${initials}
                        </div>
                        <div>
                            <div class="user-name">${escapeHtml(studentName)}</div>
                            <div class="user-sub"></div>
                        </div>
                    </div>
                 </td>
                <td style="color:var(--text-2)">${escapeHtml(coursesDisplay)}</td>
                <td>
                    <div style="display:flex;align-items:center;gap:10px">
                        <div class="progress-bar" style="width:80px">
                            <div class="progress-fill ${progressColorClass}" style="width:${progress}%"></div>
                        </div>
                        <span style="font-size:12px;color:var(--text-3)">${progress}%</span>
                    </div>
                  </td>
                <td><span style="font-family:'Syne',sans-serif;font-weight:700;color:var(--purple)">${xp.toLocaleString()}</span></td>
                <td><span class="badge badge-blue">Lv. ${level}</span></td>
                <td style="color:var(--text-3);font-size:12px">${escapeHtml(lastActive)}</td>
                <td><div class="badge ${statusBadgeClass}">${statusText}</div></td>
            </table>
        `;
    }).join('');
}

function updateStudentCountBadge(count) {
    const badge = document.querySelector('.sidebar-nav .nav-item.active .nav-badge');
    if (badge) badge.textContent = count;
}

// وظيفة الفلترة تعتمد على البيانات المجمعة
function filterStudents() {
    const searchTerm = document.getElementById('studentSearch')?.value.toLowerCase().trim() || '';
    const courseFilter = document.getElementById('studentCourseFilter')?.value || '';
    const progressFilter = document.getElementById('studentStatusFilter')?.value || '';
    
    const filtered = groupedStudents.filter(student => {
        let studentName = getField(student, ['studentName', 'Student', 'student_name', 'name'], '').toLowerCase();
        const matchSearch = !searchTerm || studentName.includes(searchTerm);
        let courses = student.coursesList || [];
        let matchCourse = !courseFilter || courses.includes(courseFilter);
        let progress = student.averageProgress !== undefined ? student.averageProgress : parseProgress(getField(student, ['progress', 'Progress'], 0));
        let matchProgress = true;
        if (progressFilter === 'high') matchProgress = progress >= 75;
        else if (progressFilter === 'mid') matchProgress = progress >= 40 && progress < 75;
        else if (progressFilter === 'low') matchProgress = progress < 40;
        return matchSearch && matchCourse && matchProgress;
    });
    renderStudentTable(filtered);
}

function bindStudentEvents() {
    const searchInput = document.getElementById('studentSearch');
    const courseSelect = document.getElementById('studentCourseFilter');
    const progressSelect = document.getElementById('studentStatusFilter');
    if (searchInput) searchInput.addEventListener('input', filterStudents);
    if (courseSelect) courseSelect.addEventListener('change', filterStudents);
    if (progressSelect) progressSelect.addEventListener('change', filterStudents);
}

function exportStudentsToCSV() {
    if (!groupedStudents.length) {
        showToast('No data to export', 'error');
        return;
    }
    const headers = ['Student', 'Courses', 'Average Progress (%)', 'XP', 'Level', 'Last Active', 'Status'];
    const rows = groupedStudents.map(s => [
        getField(s, ['studentName', 'Student', 'name'], ''),
        s.coursesCombined || '',
        s.averageProgress || parseProgress(getField(s, ['progress', 'Progress'], 0)),
        getField(s, ['xp', 'XP'], 0),
        getField(s, ['level', 'Level'], 1),
        getField(s, ['lastActive', 'Last_Active', 'last_active'], ''),
        getField(s, ['status', 'Status'], 'Active')
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `students_${new Date().toISOString().slice(0,19)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Exported successfully!', 'success');
}

async function initStudents() {
    await fetchStudents();
    bindStudentEvents();
    const exportBtn = document.querySelector('#page-students .btn-ghost');
    if (exportBtn) exportBtn.onclick = exportStudentsToCSV;
    if (typeof renderNotifications === 'function') renderNotifications();
}

initStudents();