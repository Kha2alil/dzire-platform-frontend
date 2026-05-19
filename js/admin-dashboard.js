// ====================== تكوين Axios ======================
axios.defaults.baseURL = 'http://localhost:3000/api/admin';
const token = localStorage.getItem('token');
if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// ====================== المتغيرات العامة ======================
let allUsers = [];
let allCourses = [];
let allSkills = [];
let activeUserTab = 'all';
let confirmCallback = null;
let currentCourseIdForStatus = null;

// بيانات وهمية للنشاطات
const ACTIVITY_LOG = [
    { dot: 'var(--green)', text: '<strong>Ahmed Mansouri</strong> enrolled in Full-Stack Web Development', time: '2 min ago' },
    { dot: 'var(--blue-400)', text: '<strong>Khalil Khalfi</strong> added a new lesson to Node.js Mastery', time: '14 min ago' },
    { dot: 'var(--amber)', text: '<strong>Nour Aissaoui</strong> completed JavaScript Advanced Concepts', time: '31 min ago' },
    { dot: 'var(--admin-accent)', text: '<strong>Samira Ferhat</strong> published CSS & Tailwind Deep Dive', time: '1 hr ago' },
    { dot: 'var(--red)', text: '<strong>Lina Khelifi</strong> was banned for policy violation', time: '2 hr ago' },
    { dot: 'var(--cyan)', text: '<strong>Tarek Boumediene</strong> added Python for Data Science course', time: '5 hr ago' },
    { dot: 'var(--purple)', text: 'New user <strong>Amira Saad</strong> registered and verified email', time: 'Yesterday' },
];

// ====================== دوال مساعدة ======================
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function getInitials(name) {
    if (!name) return '??';
    return name.trim().split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name) {
    const colors = [
        ['rgba(59,130,246,0.25)', 'var(--blue-400)'],
        ['rgba(124,58,237,0.25)', 'var(--admin-accent)'],
        ['rgba(16,185,129,0.25)', 'var(--green)'],
        ['rgba(245,158,11,0.25)', 'var(--amber)'],
        ['rgba(239,68,68,0.25)', 'var(--red)'],
        ['rgba(34,211,238,0.25)', 'var(--cyan)'],
        ['rgba(167,139,250,0.25)', 'var(--purple)'],
    ];
    const i = name.charCodeAt(0) % colors.length;
    return colors[i];
}

function showToast(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    const icons = { success: '✅', error: '❌', info: '🔔' };
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span class="toast-msg">${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

// ====================== Confirm Dialog ======================
function openConfirm(title, msg, icon, cb) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMsg').textContent = msg;
    document.getElementById('confirmIcon').textContent = icon || '⚠️';
    confirmCallback = cb;
    document.getElementById('confirmOverlay').classList.add('open');
}
function closeConfirm() {
    document.getElementById('confirmOverlay').classList.remove('open');
    confirmCallback = null;
}
document.getElementById('confirmBtn').onclick = function() {
    if (confirmCallback) confirmCallback();
    closeConfirm();
};

// ====================== Modals ======================
function openModal(id) { document.getElementById('modal-' + id).classList.add('open'); }
function closeModal(id) { document.getElementById('modal-' + id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.classList.remove('open');
    });
});

// ====================== Navigation ======================
function navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const targetPage = document.getElementById('page-' + page);
    if (targetPage) targetPage.classList.add('active');
    document.querySelectorAll(`.nav-item[data-page="${page}"]`).forEach(n => n.classList.add('active'));
    let title = '';
    if (page === 'dashboard') title = 'Dashboard';
    else if (page === 'users') title = 'User Management';
    else if (page === 'courses') title = 'Course Management';
    else if (page === 'skills') title = 'Skill Management';
    else if (page === 'settings') title = 'Platform Settings';
    document.getElementById('pageTitle').textContent = title;
    if (page === 'users') fetchUsers();
    if (page === 'courses') fetchCourses();
    if (page === 'skills') fetchSkills();
    closeSidebar();
}
document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => navigate(item.dataset.page));
});

// ====================== Sidebar Toggle ======================
const sidebarEl = document.getElementById('sidebar');
const mainEl = document.getElementById('main');
const toggleBtn = document.getElementById('sidebarToggle');
let collapsed = false;
if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        collapsed = !collapsed;
        sidebarEl.classList.toggle('collapsed', collapsed);
        mainEl.classList.toggle('expanded', collapsed);
        toggleBtn.textContent = collapsed ? '▶' : '◀';
    });
}
function openSidebar() { sidebarEl.classList.add('mobile-open'); document.getElementById('sidebarOverlay').classList.add('visible'); }
function closeSidebar() { sidebarEl.classList.remove('mobile-open'); document.getElementById('sidebarOverlay').classList.remove('visible'); }

// ====================== المستخدمون ======================
async function fetchUsers() {
    try {
        const response = await axios.get('/profiles');
        if (response.data.success) {
            allUsers = response.data.data;
            document.getElementById('navUserCount').textContent = allUsers.length;
            renderUsersTable();
            updateStats();
            renderDashUsers();
        } else { showToast('فشل تحميل المستخدمين', 'error'); }
    } catch (err) {
        console.error(err);
        if (err.response && (err.response.status === 403 || err.response.status === 401)) {
            showToast('غير مصرح لك. سيتم إعادة التوجيه.', 'error');
            setTimeout(() => { localStorage.removeItem('token'); window.location.href = 'login.html'; }, 2000);
        } else { showToast('خطأ في تحميل المستخدمين', 'error'); }
    }
}
function roleBadge(role) {
    if (role === 'teacher') return `<div class="badge badge-admin">🎓 Teacher</div>`;
    if (role === 'admin') return `<div class="badge badge-danger">👑 Admin</div>`;
    return `<div class="badge badge-blue">👤 Student</div>`;
}
function statusBadge(status) {
    if (status === 'banned') return `<div class="badge badge-red">🚫 Banned</div>`;
    return `<div class="badge badge-green">✓ Active</div>`;
}
function getFilteredUsers() {
    const search = (document.getElementById('userSearch')?.value || '').toLowerCase();
    const roleF = document.getElementById('userRoleFilter')?.value || '';
    const statusF = document.getElementById('userStatusFilter')?.value || '';
    return allUsers.filter(u => {
        const matchSearch = !search || (u.full_name?.toLowerCase().includes(search) || u.email?.toLowerCase().includes(search));
        const matchRole = !roleF || u.role === roleF;
        const matchStatus = !statusF || u.status === statusF;
        const matchTab = activeUserTab === 'all' || u.role === activeUserTab;
        return matchSearch && matchRole && matchStatus && matchTab;
    });
}
function renderUsersTable() {
    const users = getFilteredUsers();
    const tbody = document.getElementById('usersTable');
    if (!tbody) return;
    if (!users.length) { tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state">لا يوجد مستخدمون</div></td></tr>'; return; }
    tbody.innerHTML = users.map(u => {
        const [bg, col] = getAvatarColor(u.full_name);
        const banLabel = u.status === 'banned' ? '✅ Unban' : '🚫 Ban';
        const joinedDate = u.created_at ? new Date(u.created_at).toLocaleDateString() : '—';
        return `<tr>
            <td><div class="user-cell"><div class="user-avatar" style="background:${bg}; color:${col}">${getInitials(u.full_name)}</div><div><div class="user-name">${escapeHtml(u.full_name)}</div><div class="user-email">${escapeHtml(u.email)}</div></div></div></td>
            <td>${roleBadge(u.role)}</td>
            <td>${statusBadge(u.status)}</td>
            <td style="color:var(--text-3); font-size:12px">${joinedDate}</td>
            <td><div style="display:flex; gap:6px"><button class="btn btn-ghost btn-xs" onclick="editUser('${u.id}')">✎ Edit</button><button class="btn btn-xs ${u.status === 'banned' ? 'btn-ghost' : 'btn-danger'}" onclick="toggleBan('${u.id}')">${banLabel}</button><button class="btn btn-danger btn-xs" onclick="deleteUser('${u.id}')">🗑️</button></div></td>
        </tr>`;
    }).join('');
}
function filterUsers() { renderUsersTable(); }
function switchUserTab(el) {
    document.querySelectorAll('#page-users .tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    activeUserTab = el.dataset.tab;
    const roleFilter = document.getElementById('userRoleFilter');
    if (activeUserTab === 'all') roleFilter.value = '';
    else roleFilter.value = activeUserTab;
    renderUsersTable();
}
function openAddUserModal() {
    document.getElementById('editUserId').value = '';
    document.getElementById('uFullName').value = '';
    document.getElementById('uUsername').value = '';
    document.getElementById('uEmail').value = '';
    document.getElementById('uPassword').value = '';
    document.getElementById('uRole').value = 'student';
    document.getElementById('uStatus').value = 'active';
    document.getElementById('userModalTitle').textContent = 'إضافة مستخدم جديد';
    document.getElementById('userModalSubmitBtn').textContent = 'إضافة';
    const pwdGroup = document.getElementById('passwordFieldGroup');
    if (pwdGroup) pwdGroup.style.display = 'block';
    openModal('user');
}
async function editUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    document.getElementById('editUserId').value = user.id;
    document.getElementById('uFullName').value = user.full_name;
    document.getElementById('uUsername').value = user.username || '';
    document.getElementById('uEmail').value = user.email;
    document.getElementById('uRole').value = user.role;
    document.getElementById('uStatus').value = user.status;
    document.getElementById('userModalTitle').textContent = 'تعديل المستخدم';
    document.getElementById('userModalSubmitBtn').textContent = 'حفظ التغييرات';
    const pwdGroup = document.getElementById('passwordFieldGroup');
    if (pwdGroup) pwdGroup.style.display = 'none';
    openModal('user');
}
async function submitUserModal() {
    const userId = document.getElementById('editUserId').value;
    const full_name = document.getElementById('uFullName').value.trim();
    const username = document.getElementById('uUsername').value.trim();
    const email = document.getElementById('uEmail').value.trim();
    const role = document.getElementById('uRole').value;
    const status = document.getElementById('uStatus').value;
    const password = document.getElementById('uPassword')?.value.trim();
    if (!full_name || !email) { showToast('الاسم والبريد الإلكتروني مطلوبان', 'error'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('البريد الإلكتروني غير صالح', 'error'); return; }
    try {
        if (userId) {
            await axios.put(`/edit-user/${userId}`, { full_name, username, email, role, status });
            showToast('تم تحديث المستخدم بنجاح', 'success');
        } else {
            if (!password) { showToast('كلمة المرور مطلوبة للمستخدم الجديد', 'error'); return; }
            if (password.length < 6) { showToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error'); return; }
            await axios.post('/add-user', { full_name, username, email, role, status, password });
            showToast('تم إضافة المستخدم بنجاح', 'success');
        }
        closeModal('user');
        await fetchUsers();
    } catch (err) { showToast(err.response?.data?.message || 'حدث خطأ أثناء العملية', 'error'); }
}
async function toggleBan(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    const newStatus = user.status === 'banned' ? 'active' : 'banned';
    const action = newStatus === 'banned' ? 'حظر' : 'إلغاء الحظر';
    openConfirm(`${action} المستخدم`, `هل أنت متأكد من ${action} "${user.full_name}"؟`, newStatus === 'banned' ? '🚫' : '✅', async () => {
        try {
            await axios.patch(`/ban-user/${userId}`, { status: newStatus });
            showToast(`تم ${action} المستخدم بنجاح`, 'info');
            await fetchUsers();
        } catch (err) { showToast('فشل تغيير الحالة', 'error'); }
    });
}
async function deleteUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    openConfirm('حذف المستخدم', `هل أنت متأكد من حذف "${user.full_name}"؟ لا يمكن التراجع.`, '🗑️', async () => {
        try { await axios.delete(`/delete-user/${userId}`); showToast(`تم حذف المستخدم ${user.full_name}`, 'error'); await fetchUsers(); }
        catch (err) { showToast('فشل الحذف', 'error'); }
    });
}

// ====================== الكورسات ======================
async function fetchCourses() {
    try {
        const response = await axios.get('/courses');
        if (response.data.success) {
            allCourses = response.data.data;
            document.getElementById('navCourseCount').textContent = allCourses.length;
            renderCoursesTable();
            renderDashCourses();
            updateStats();
        } else { showToast('فشل تحميل الكورسات', 'error'); }
    } catch (err) { showToast('خطأ في تحميل الكورسات', 'error'); }
}
async function updateCourseStatus(courseId, newStatus) {
    try {
        await axios.patch(`/courses/${courseId}/status`, { status: newStatus });
        showToast(`تم تحديث حالة الكورس إلى ${newStatus}`, 'success');
        await fetchCourses();
    } catch (err) { showToast('فشل تحديث الحالة', 'error'); }
}
function openCourseStatusModal(courseId) { currentCourseIdForStatus = courseId; openModal('courseStatus'); }
async function setCourseStatus(newStatus) { if (!currentCourseIdForStatus) return; await updateCourseStatus(currentCourseIdForStatus, newStatus); closeModal('courseStatus'); currentCourseIdForStatus = null; }
async function deleteCourse(courseId) {
    const course = allCourses.find(c => c.id === courseId);
    if (!course) return;
    openConfirm('حذف الكورس', `هل أنت متأكد من حذف "${course.Course || course.title}"؟ لا يمكن التراجع.`, '🗑️', async () => {
        try { await axios.delete(`/courses/${courseId}`); showToast(`تم حذف الكورس "${course.Course || course.title}"`, 'error'); await fetchCourses(); }
        catch (err) { showToast('فشل الحذف', 'error'); }
    });
}
function renderCoursesTable() {
    const courses = getFilteredCourses();
    const tbody = document.getElementById('coursesTable');
    if (!tbody) return;
    if (!courses.length) { tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state">لا توجد كورسات</div></td></table>'; return; }
    const emojis = { 'Web Dev': '🌐', 'Frontend': '🎨', 'Backend': '⚙️', 'Data Science': '📊', 'DevOps': '☁️', 'Design': '🖌️' };
    tbody.innerHTML = courses.map(c => {
        const title = c.Course || c.title || 'بدون عنوان';
        const instructor = c.Instructor || c.teacher_name || 'غير معروف';
        let level = c.Level || c.difficulty_level || 'beginner';
        const students = c.Students !== undefined ? c.Students : (c.students_count || 0);
        let status = 'Draft';
        if (c.is_published === 1 || c.is_published === true) status = 'Published';
        else if (c.status) status = c.status;
        const category = c.category || 'General';
        const ico = emojis[category] || '📚';
        return `<tr>
            <td><div style="display:flex;align-items:center;gap:10px"><div style="font-size:20px;width:32px;text-align:center">${ico}</div><div><div style="font-weight:500;font-size:13px">${escapeHtml(title)}</div><div style="font-size:11px;color:var(--text-3)">${escapeHtml(category)}</div></div></div></td>
            <td style="color:var(--text-2);font-size:12px">${escapeHtml(instructor)}</td>
            <td>${levelBadge(level)}</td>
            <td><span style="font-family:'Syne',sans-serif;font-weight:700;color:var(--admin-accent)">${students}</span></td>
            <td>${courseStatusBadge(status)}</td>
            <td><div style="display:flex;gap:6px"><button class="btn btn-ghost btn-xs" onclick="openCourseStatusModal('${c.id}')">✎ Change Status</button><button class="btn btn-danger btn-xs" onclick="deleteCourse('${c.id}')">🗑️</button></div></td>
        </tr>`;
    }).join('');
}
function getFilteredCourses() {
    const search = (document.getElementById('courseSearch')?.value || '').toLowerCase();
    const levelF = document.getElementById('courseLevelFilter')?.value || '';
    return allCourses.filter(c => {
        const title = c.Course || c.title || '';
        const instructor = c.Instructor || c.teacher_name || '';
        const level = c.Level || c.difficulty_level || '';
        const matchSearch = !search || title.toLowerCase().includes(search) || instructor.toLowerCase().includes(search);
        const matchLevel = !levelF || level.toLowerCase() === levelF.toLowerCase();
        return matchSearch && matchLevel;
    });
}
function filterCourses() { renderCoursesTable(); }
function levelBadge(level) {
    const l = level.toLowerCase();
    if (l === 'beginner') return `<div class="badge badge-green">Beginner</div>`;
    if (l === 'advanced') return `<div class="badge badge-red">Advanced</div>`;
    if (l === 'intermediate') return `<div class="badge badge-blue">Intermediate</div>`;
    return `<div class="badge badge-neutral">${escapeHtml(level)}</div>`;
}
function courseStatusBadge(status) {
    if (status === 'Draft') return `<div class="badge badge-neutral">${status}</div>`;
    return `<div class="badge badge-green">${status}</div>`;
}
function openAddCourseModal() { showToast('إضافة كورس جديدة غير متاحة حالياً عبر API، سيتم إضافتها محلياً فقط.', 'info'); }
function submitCourseModal() { showToast('يرجى استخدام واجهة المدير المخصصة لإضافة كورسات.', 'error'); }

// ====================== المهارات (Skills) ======================
async function fetchSkills() {
    console.log("🔍 Fetching skills...");
    try {
        const response = await axios.get('/skills');
        console.log("✅ Skills API response:", response.data);
        if (response.data.success) {
            allSkills = response.data.data;
            const countSpan = document.getElementById('navSkillCount');
            if (countSpan) countSpan.textContent = allSkills.length;
            renderSkillsTable();
        } else { showToast('Failed to load skills', 'error'); }
    } catch (err) {
        console.error("❌ Error fetching skills:", err);
        showToast('Error loading skills', 'error');
    }
}

function renderSkillsTable() {
    const tbody = document.getElementById('skillsTable');
    if (!tbody) return;
    const skills = getFilteredSkills();
    if (!skills.length) {
        tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state">No skills found</div></td></tr>';
        return;
    }
    tbody.innerHTML = skills.map(s => {
        const created = s.created_at ? new Date(s.created_at).toLocaleDateString() : '—';
        return `<tr>
            <td><code style="background:var(--bg-3); padding:2px 6px; border-radius:4px">${escapeHtml(s.code)}</code></td>
            <td><strong>${escapeHtml(s.name)}</strong></td>
            <td>${escapeHtml(s.category || '—')}</td>
            <td style="text-align:center">${s.display_order || 0}</td>
            <td style="color:var(--text-3); font-size:12px">${created}</td>
            <td><div style="display:flex; gap:6px"><button class="btn btn-ghost btn-xs" onclick="editSkill('${s.id}')">✎ Edit</button><button class="btn btn-danger btn-xs" onclick="deleteSkill('${s.id}')">🗑️</button></div></td>
        </tr>`;
    }).join('');
}

function getFilteredSkills() {
    const search = (document.getElementById('skillSearch')?.value || '').toLowerCase();
    if (!search) return allSkills;
    return allSkills.filter(s => s.name?.toLowerCase().includes(search) || s.code?.toLowerCase().includes(search));
}
function filterSkills() { renderSkillsTable(); }

function openAddSkillModal() {
    document.getElementById('editSkillId').value = '';
    document.getElementById('skillCode').value = '';
    document.getElementById('skillName').value = '';
    document.getElementById('skillDescription').value = '';
    document.getElementById('skillCategory').value = '';
    document.getElementById('skillDisplayOrder').value = '0';
    document.getElementById('skillIconUrl').value = '';
    document.getElementById('skillModalTitle').innerText = 'Add New Skill';
    document.getElementById('skillModalSubmitBtn').innerText = 'Create Skill';
    openModal('skill');
}
async function editSkill(skillId) {
    const skill = allSkills.find(s => s.id === skillId);
    if (!skill) return;
    document.getElementById('editSkillId').value = skill.id;
    document.getElementById('skillCode').value = skill.code;
    document.getElementById('skillName').value = skill.name;
    document.getElementById('skillDescription').value = skill.description || '';
    document.getElementById('skillCategory').value = skill.category || '';
    document.getElementById('skillDisplayOrder').value = skill.display_order || 0;
    document.getElementById('skillIconUrl').value = skill.icon_url || '';
    document.getElementById('skillModalTitle').innerText = 'Edit Skill';
    document.getElementById('skillModalSubmitBtn').innerText = 'Update Skill';
    openModal('skill');
}
async function submitSkillModal() {
    const skillId = document.getElementById('editSkillId').value;
    const code = document.getElementById('skillCode').value.trim();
    const name = document.getElementById('skillName').value.trim();
    const description = document.getElementById('skillDescription').value.trim();
    const category = document.getElementById('skillCategory').value.trim();
    const display_order = parseInt(document.getElementById('skillDisplayOrder').value) || 0;
    const icon_url = document.getElementById('skillIconUrl').value.trim();
    if (!code || !name) { showToast('Code and Name are required', 'error'); return; }
    if (/\s/.test(code)) { showToast('Code must not contain spaces', 'error'); return; }
    const payload = { code, name, description, category, display_order, icon_url };
    try {
        if (skillId) {
            await axios.put(`/skills/${skillId}`, payload);
            showToast('Skill updated successfully', 'success');
        } else {
            await axios.post('/skills', payload);
            showToast('Skill created successfully', 'success');
        }
        closeModal('skill');
        await fetchSkills();
    } catch (err) {
        console.error(err);
        showToast(err.response?.data?.message || 'Operation failed', 'error');
    }
}
async function deleteSkill(skillId) {
    const skill = allSkills.find(s => s.id === skillId);
    if (!skill) return;
    openConfirm('Delete Skill', `Are you sure you want to delete "${skill.name}"? This may affect courses that use this skill.`, '🗑️', async () => {
        try {
            await axios.delete(`/skills/${skillId}`);
            showToast(`Skill "${skill.name}" deleted`, 'error');
            await fetchSkills();
        } catch (err) {
            showToast(err.response?.data?.message || 'Delete failed', 'error');
        }
    });
}

// ====================== الإحصائيات ======================
function updateStats() {
    const students = allUsers.filter(u => u.role === 'student').length;
    const teachers = allUsers.filter(u => u.role === 'teacher').length;
    const active = allUsers.filter(u => u.status === 'active').length;
    const banned = allUsers.filter(u => u.status === 'banned').length;
    const coursesCount = allCourses.length;

    document.getElementById('statStudents').textContent = students;
    document.getElementById('statTeachers').textContent = teachers;
    document.getElementById('statCourses').textContent = coursesCount;
    document.getElementById('statActive').textContent = active;
    document.getElementById('heroActiveCount').textContent = active;
    document.getElementById('legendStudents').textContent = students;
    document.getElementById('legendTeachers').textContent = teachers;
    document.getElementById('legendBanned').textContent = banned;
    document.getElementById('donutTotal').textContent = allUsers.length;

    const total = allUsers.length || 1;
    const sPct = Math.round((students / total) * 100);
    const tPct = Math.round((teachers / total) * 100);
    const bPct = 100 - sPct - tPct;
    const donut = document.getElementById('donutChart');
    if (donut) donut.style.background = `conic-gradient(var(--blue-500) 0% ${sPct}%, var(--admin-accent) ${sPct}% ${sPct+tPct}%, var(--red) ${sPct+tPct}% 100%)`;

    document.getElementById('settingsUserCount').textContent = allUsers.length;
    document.getElementById('settingsCourseCount').textContent = coursesCount;
}

// ====================== جداول Dashboard المصغرة ======================
function renderDashUsers() {
    const container = document.getElementById('dashUsersTable');
    if (!container) return;
    const recentUsers = [...allUsers].slice(-5).reverse();
    if (!recentUsers.length) { container.innerHTML = '<td><td colspan="3">لا يوجد مستخدمون</td></tr>'; return; }
    container.innerHTML = recentUsers.map(u => {
        const [bg, col] = getAvatarColor(u.full_name);
        return `<tr onclick="navigate('users')">
            <td><div class="user-cell"><div class="user-avatar" style="background:${bg}; color:${col}">${getInitials(u.full_name)}</div><div><div class="user-name">${escapeHtml(u.full_name)}</div><div class="user-email">${escapeHtml(u.email)}</div></div></div></td>
            <td>${roleBadge(u.role)}</td>
            <td>${statusBadge(u.status)}</td>
        </tr>`;
    }).join('');
}
function renderDashCourses() {
    const container = document.getElementById('dashCoursesTable');
    if (!container) return;
    const recentCourses = [...allCourses].slice(-4).reverse();
    container.innerHTML = recentCourses.map(c => {
        let statusDisplay = 'Published';
        if (c.is_published === 0 || c.is_published === false) statusDisplay = 'Draft';
        else if (c.status) statusDisplay = c.status;
        return `
        <tr onclick="navigate('courses')">
            <td><div style="font-weight:500;font-size:13px">${escapeHtml(c.Course || c.title)}</div></td>
            <td style="color:var(--text-2);font-size:12px">${escapeHtml(c.Instructor || c.teacher_name)}</td>
            <td><span style="font-family:'Syne',sans-serif;font-weight:700;color:var(--admin-accent)">${c.Students !== undefined ? c.Students : (c.students_count || 0)}</span></td>
        </tr>`;
    }).join('');
}

// ====================== النشاطات والرسوم البيانية ======================
function renderActivity() {
    const container = document.getElementById('dashActivity');
    if (!container) return;
    container.innerHTML = ACTIVITY_LOG.map(a => `
        <div class="activity-item">
            <div class="act-dot" style="background:${a.dot}"></div>
            <div class="act-body">
                <div class="act-text">${a.text}</div>
                <div class="act-time">${a.time}</div>
            </div>
        </div>
    `).join('');
}
function renderRegChart() {
    const vals = [24, 38, 31, 52, 45, 61];
    const max = Math.max(...vals);
    const el = document.getElementById('regChart');
    if (!el) return;
    el.innerHTML = vals.map(v => `
        <div class="bar-col">
            <div class="bar" style="height:${Math.max(6, (v / max) * 100)}%">
                <div class="bar-tip">${v}</div>
            </div>
        </div>
    `).join('');
}

// ====================== الإعدادات ======================
function saveSettings() {
    const name = document.getElementById('siteName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    if (!name) { showToast('Platform name cannot be empty', 'error'); return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('Invalid contact email', 'error'); return; }
    showToast('Settings saved successfully 💾', 'success');
}

// ====================== البحث العام ======================
function handleGlobalSearch(val) {
    const q = val.toLowerCase().trim();
    if (!q) return;
    const userMatch = allUsers.find(u => u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
    if (userMatch) {
        navigate('users');
        document.getElementById('userSearch').value = val;
        filterUsers();
        return;
    }
    const courseMatch = allCourses.find(c => (c.Course || c.title)?.toLowerCase().includes(q));
    if (courseMatch) {
        navigate('courses');
        document.getElementById('courseSearch').value = val;
        filterCourses();
    }
}

// ====================== زر الإشعارات ======================
document.getElementById('notifBtn')?.addEventListener('click', () => { showToast('3 new notifications 🔔', 'info'); });

// ====================== ربط الأحداث ======================
function bindUserEvents() {
    const search = document.getElementById('userSearch');
    const roleFilter = document.getElementById('userRoleFilter');
    const statusFilter = document.getElementById('userStatusFilter');
    if (search) search.addEventListener('input', filterUsers);
    if (roleFilter) roleFilter.addEventListener('change', filterUsers);
    if (statusFilter) statusFilter.addEventListener('change', filterUsers);
    document.querySelectorAll('#page-users .tab').forEach(tab => {
        tab.removeEventListener('click', switchUserTab);
        tab.addEventListener('click', () => switchUserTab(tab));
    });
}
function bindCourseEvents() {
    const search = document.getElementById('courseSearch');
    const levelFilter = document.getElementById('courseLevelFilter');
    if (search) search.addEventListener('input', filterCourses);
    if (levelFilter) levelFilter.addEventListener('change', filterCourses);
}
function bindSkillEvents() {
    const search = document.getElementById('skillSearch');
    if (search) search.addEventListener('input', filterSkills);
}

// ====================== التهيئة ======================
async function init() {
    await fetchUsers();
    await fetchCourses();
    await fetchSkills();
    bindUserEvents();
    bindCourseEvents();
    bindSkillEvents();
    renderActivity();
    renderRegChart();
}

init();