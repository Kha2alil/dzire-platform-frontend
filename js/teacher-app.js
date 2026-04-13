/* ═════════════════════════════════════════════════════════════════
   TEACHER DASHBOARD — COMPLETE
   Integrates: Dashboard, Courses, Students, Analytics, Failure Points,
   Profile, Settings, and Course Content Builder (Chapters, Lessons, Assessments)
═════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────
// GLOBAL STATE
// ─────────────────────────────────────────────────────────────────
let currentBuilderCourseId = null;   // ID of the course being edited in the builder
let allCourses = [];                 // Store fetched courses for filtering
let subdomainsList = [];             // Store fetched subdomains for dropdown
let currentChapterIdForQuiz = null;
let currentQuizPassingScore = 65;
let currentEditAssessmentId = null; 

// ─────────────────────────────────────────────────────────────────
// API HELPERS (reusable)
// ─────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:3000/api';

async function apiCall(method, endpoint, body = null) {
  try {
    const token = localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json'
    };

    if (token) {
      const cleanToken = token.replace(/['"]+/g, '');
      headers['Authorization'] = `Bearer ${cleanToken}`;
    }

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('API error:', err);
    return { success: false, message: err.message };
  }
}

async function apiUpload(endpoint, formData) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: formData
    });
    return await res.json();
  } catch (err) {
    console.error('Upload error:', err);
    return { success: false, message: err.message };
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// ─────────────────────────────────────────────────────────────────
// STATIC DATA (Mock — only for non-course pages)
// ─────────────────────────────────────────────────────────────────
const STUDENTS = [
  { name:'Ahmed Mansouri', initials:'AM', color:'rgba(59,130,246,0.2)', tcolor:'var(--blue-400)', email:'ahmed@mail.com', course:'Full-Stack', progress:92, xp:2840, level:8, lastActive:'2 min ago', status:'Active' },
  { name:'Sara Benali', initials:'SB', color:'rgba(167,139,250,0.2)', tcolor:'var(--purple)', email:'sara@mail.com', course:'JavaScript', progress:75, xp:1920, level:6, lastActive:'1 hr ago', status:'Active' },
  { name:'Yacine Merad', initials:'YM', color:'rgba(16,185,129,0.2)', tcolor:'var(--green)', email:'yacine@mail.com', course:'Node.js', progress:45, xp:980, level:4, lastActive:'3 hr ago', status:'Active' },
  { name:'Lina Khelifi', initials:'LK', color:'rgba(239,68,68,0.2)', tcolor:'var(--red)', email:'lina@mail.com', course:'Full-Stack', progress:28, xp:420, level:2, lastActive:'1 day ago', status:'At Risk' },
  { name:'Rami Tahir', initials:'RT', color:'rgba(245,158,11,0.2)', tcolor:'var(--amber)', email:'rami@mail.com', course:'CSS', progress:60, xp:1340, level:5, lastActive:'5 hr ago', status:'Active' },
  { name:'Nour Aissaoui', initials:'NA', color:'rgba(34,211,238,0.12)', tcolor:'var(--cyan)', email:'nour@mail.com', course:'JavaScript', progress:88, xp:2200, level:7, lastActive:'30 min ago', status:'Active' },
  { name:'Karim Bouzid', initials:'KB', color:'rgba(59,130,246,0.2)', tcolor:'var(--blue-400)', email:'karim@mail.com', course:'Node.js', progress:15, xp:180, level:1, lastActive:'3 days ago', status:'Inactive' },
  { name:'Amira Saad', initials:'AS', color:'rgba(167,139,250,0.2)', tcolor:'var(--purple)', email:'amira@mail.com', course:'Full-Stack', progress:70, xp:1760, level:6, lastActive:'2 hr ago', status:'Active' },
];

const FAILURE_POINTS = [
  { rank:1, topic:'Async / Await Logic', pct:88, color:'var(--red)', fillClass:'fill-red' },
  { rank:2, topic:'REST API Design Patterns', pct:71, color:'var(--amber)', fillClass:'fill-amber' },
  { rank:3, topic:'CSS Flexbox & Grid', pct:59, color:'var(--blue-500)', fillClass:'fill-blue' },
  { rank:4, topic:'SQL JOIN Queries', pct:44, color:'var(--text-3)', fillClass:'fill-muted' },
  { rank:5, topic:'JWT Authentication', pct:38, color:'var(--text-3)', fillClass:'fill-muted' },
  { rank:6, topic:'DOM Manipulation', pct:29, color:'var(--text-3)', fillClass:'fill-muted' },
];

const ASSESSMENTS = [
  { title:'JS Promises & Async/Await', course:'JavaScript Advanced', type:'Quiz', questions:15, avgScore:64, status:'Active' },
  { title:'Full-Stack Boss Exam — Level 3', course:'Full-Stack Web Dev', type:'Boss Exam', questions:20, avgScore:71, status:'Active' },
  { title:'Web Dev Placement Test', course:'General', type:'Placement Test', questions:30, avgScore:58, status:'Active' },
  { title:'CSS Grid & Flexbox Quiz', course:'CSS & Tailwind', type:'Quiz', questions:12, avgScore:82, status:'Active' },
  { title:'Node.js REST API Quiz', course:'Node.js & PostgreSQL', type:'Quiz', questions:18, avgScore:61, status:'Draft' },
  { title:'Security Boss Exam — Level 2', course:'Web Security', type:'Boss Exam', questions:25, avgScore:55, status:'Pending' },
];

const ACTIVITY = [
  { dot:'var(--green)', text:'<strong>Ahmed M.</strong> passed the Boss Exam in Full-Stack Level 3', time:'2 min ago' },
  { dot:'var(--red)', text:'<strong>Lina K.</strong> triggered a remedial session on Async/Await', time:'14 min ago' },
  { dot:'var(--blue-400)', text:'<strong>Sara B.</strong> completed the JavaScript Promises quiz', time:'1 hr ago' },
  { dot:'var(--purple)', text:'<strong>Yacine M.</strong> enrolled in Node.js & PostgreSQL Mastery', time:'3 hr ago' },
  { dot:'var(--amber)', text:'<strong>Rami T.</strong> failed the CSS Flexbox quiz 3× — remedial triggered', time:'5 hr ago' },
];

const NOTIFICATIONS = [
  { dot:'var(--green)', msg:'<strong>Ahmed M.</strong> passed the Full-Stack Boss Exam', time:'2 min ago', unread:true },
  { dot:'var(--red)', msg:'<strong>Lina K.</strong> has failed Async/Await 3 times — remedial needed', time:'14 min ago', unread:true },
  { dot:'var(--blue-400)', msg:'Your course <strong>Node.js & PostgreSQL</strong> is awaiting approval', time:'1 hr ago', unread:true },
  { dot:'var(--amber)', msg:'New enrollment in <strong>CSS & Tailwind Deep Dive</strong>', time:'3 hr ago', unread:false },
  { dot:'var(--purple)', msg:'Weekly analytics report is ready to view', time:'Yesterday', unread:false },
];

const FP_STUDENTS = [
  { name:'Lina Khelifi', initials:'LK', color:'rgba(239,68,68,0.2)', tcolor:'var(--red)', topic:'Async/Await Logic', attempts:5, lastTry:'2 hr ago', remedial:'Pending' },
  { name:'Karim Bouzid', initials:'KB', color:'rgba(59,130,246,0.2)', tcolor:'var(--blue-400)', topic:'REST API Design', attempts:4, lastTry:'1 day ago', remedial:'In Progress' },
  { name:'Yacine Merad', initials:'YM', color:'rgba(16,185,129,0.2)', tcolor:'var(--green)', topic:'SQL JOIN Queries', attempts:3, lastTry:'3 hr ago', remedial:'Not Started' },
  { name:'Rami Tahir', initials:'RT', color:'rgba(245,158,11,0.2)', tcolor:'var(--amber)', topic:'CSS Flexbox', attempts:3, lastTry:'5 hr ago', remedial:'Completed' },
];

// ─────────────────────────────────────────────────────────────────
// FETCH REAL COURSES FROM BACKEND
// ─────────────────────────────────────────────────────────────────
async function fetchCourses() {
  try {
    const data = await apiCall('GET', '/courses');
    console.log("البيانات القادمة من السيرفر:", data);
    if (data && data.success) {
      allCourses = data.data.courses || [];
      updateDashboardStats();
      renderCourseCards(allCourses);
      renderDashCourses();
      renderAnalyticsTable();
      return allCourses;
    } else {
      console.error('Failed to fetch courses:', data?.message);
      showToast('Failed to load courses', 'error');
      return [];
    }
  } catch (err) {
    console.error('Error fetching courses:', err);
    showToast('Failed to load courses', 'error');
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────
// FETCH SUBDOMAINS FOR DROPDOWN
// ─────────────────────────────────────────────────────────────────
async function fetchSubdomains() {
  try {
    const data = await apiCall('GET', '/subdomains');
    if (data && data.success) {
      subdomainsList = data.subdomains || [];
      populateSubdomainDropdown();
      return subdomainsList;
    } else {
      console.error('Failed to fetch subdomains:', data?.message);
      return [];
    }
  } catch (err) {
    console.error('Error fetching subdomains:', err);
    return [];
  }
}

function populateSubdomainDropdown() {
  const subdomainSelect = document.getElementById('newCourseSubdomain');
  if (!subdomainSelect) return;
  subdomainSelect.innerHTML = '<option value="">Select a subdomain</option>';
  subdomainsList.forEach(sd => {
    const option = document.createElement('option');
    option.value = sd.id;
    option.textContent = sd.name;
    subdomainSelect.appendChild(option);
  });
}

// ─────────────────────────────────────────────────────────────────
// UPDATE DASHBOARD STATS (from real courses)
// ─────────────────────────────────────────────────────────────────
function updateDashboardStats() {
  const activeCourses = allCourses.filter(c => c.is_published === true).length;
  const totalStudents = allCourses.reduce((sum, c) => sum + (c.students_count || 0), 0);
  const avgRating = allCourses.length > 0 
    ? (allCourses.reduce((sum, c) => sum + (c.rating || 4.5), 0) / allCourses.length).toFixed(1)
    : 4.8;
  const failurePoints = 67; // Static for now

  const statValues = document.querySelectorAll('.stat-value');
  if (statValues[0]) statValues[0].textContent = activeCourses;
  if (statValues[1]) statValues[1].textContent = totalStudents;
  if (statValues[2]) statValues[2].textContent = avgRating;
  if (statValues[3]) statValues[3].textContent = failurePoints;
}

// ─────────────────────────────────────────────────────────────────
// NAVIGATION & UI HELPERS
// ─────────────────────────────────────────────────────────────────
const pageTitles = {
  dashboard: 'Dashboard',
  courses: 'My Courses',
  assessments: 'Assessments',
  students: 'Students',
  analytics: 'Analytics',
  failure: 'Failure Points',
  profile: 'My Profile',
  settings: 'Settings',
};

// ------------------------------------------------------------------
// PROFILE FUNCTIONS (load and update)
// ------------------------------------------------------------------

/// ------------------------------------------------------------------
// PROFILE FUNCTIONS (load and update) — FIXED
// ------------------------------------------------------------------

/**
 * Loads the current user's profile data from the backend and populates the form.
 * Called when the profile page is opened or on initial load.
 */
async function loadProfile() {
  try {
    // 1. Fetch user data (full_name, email) from /auth/me
    const userData = await apiCall('GET', '/auth/me');
    if (!userData || !userData.success) {
      showToast('Failed to load user data', 'error');
      return;
    }
    const user = userData.user; // Adjust based on your backend response

    // 2. Fetch profile data (bio, specialization, experience_years, avatar_url) from /profile/me
    const profileData = await apiCall('GET', '/profile/me');
    if (!profileData || !profileData.success) {
      showToast('Failed to load profile data', 'error');
      return;
    }
    const profile = profileData.profile;

    // 3. Populate form fields
    const fullNameInput = document.getElementById('profileFullName');
    const emailInput = document.getElementById('profileEmail');
    const bioTextarea = document.getElementById('profileBio');
    const specializationInput = document.getElementById('profileSpecialization');
    const expYearsInput = document.getElementById('profileExperienceYears');
    const avatarDiv = document.getElementById('profileAvatar');

    if (fullNameInput) fullNameInput.value = user.full_name || '';
    if (emailInput) emailInput.value = user.email || '';
    if (bioTextarea) bioTextarea.value = profile.bio || '';
    if (specializationInput) specializationInput.value = profile.specialization || '';
    if (expYearsInput) expYearsInput.value = profile.experience_years || 0;

    // 4. Update avatar (initials or image)
    if (avatarDiv) {
      if (profile.avatar_url) {
        avatarDiv.innerHTML = '';
        const avatarImg = document.createElement('img');
        avatarImg.src = `http://localhost:3000/${profile.avatar_url}`;
        avatarImg.style.width = '72px';
        avatarImg.style.height = '72px';
        avatarImg.style.borderRadius = '50%';
        avatarImg.style.objectFit = 'cover';
        avatarDiv.appendChild(avatarImg);
      } else {
        const fullName = user.full_name || '';
        const initials = getInitials(fullName);
        avatarDiv.textContent = initials;
        avatarDiv.style.background = 'linear-gradient(135deg, var(--blue-800), var(--blue-500))';
        avatarDiv.style.display = 'flex';
        avatarDiv.style.alignItems = 'center';
        avatarDiv.style.justifyContent = 'center';
        avatarDiv.style.fontFamily = "'Syne', sans-serif";
        avatarDiv.style.fontWeight = '800';
        avatarDiv.style.fontSize = '24px';
        avatarDiv.style.border = '3px solid var(--border-md)';
      }
    }
  } catch (err) {
    console.error('Error loading profile:', err);
    showToast('Network error while loading profile', 'error');
  }
}

/**
 * Updates the teacher's profile via PATCH /api/profile/me.
 * Handles loading state and toast messages.
 * Added console.log to verify button click.
 */
async function updateProfile() {
  console.log('updateProfile() called'); // <-- Added for debugging
  const saveBtn = document.querySelector('#page-profile .btn-primary');
  if (!saveBtn) return;

  // Disable button and show loading state
  const originalText = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.textContent = '💾 Saving...';

  // Gather form data
  const fullName = document.getElementById('profileFullName')?.value.trim();
  const bio = document.getElementById('profileBio')?.value.trim();
  const specialization = document.getElementById('profileSpecialization')?.value.trim();
  const experienceYears = parseInt(document.getElementById('profileExperienceYears')?.value, 10);

  // Build payload (only send fields that have changed)
  const payload = {};
  if (fullName) payload.full_name = fullName;
  if (bio) payload.bio = bio;
  if (specialization) payload.specialization = specialization;
  if (!isNaN(experienceYears)) payload.experience_years = experienceYears;

  if (Object.keys(payload).length === 0) {
    showToast('No changes to save', 'info');
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
    return;
  }

  try {
    const response = await apiCall('PATCH', '/profile/me', payload);

    if (response && response.success) {
      // Update sidebar name and welcome message
      const sidebarName = document.querySelector('.sidebar-profile .profile-name');
      if (sidebarName && fullName) sidebarName.textContent = fullName;

      const welcomeSpan = document.querySelector('.welcome-title span');
      if (welcomeSpan && fullName) {
        const firstName = fullName.split(' ')[0];
        welcomeSpan.textContent = firstName;
      }

      showToast('Profile updated successfully! ✅', 'success');
    } else {
      showToast(response?.message || 'Failed to update profile', 'error');
    }
  } catch (err) {
    console.error('Profile update error:', err);
    showToast('Network error. Please try again.', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
  }
}

// ------------------------------------------------------------------
// AVATAR UPLOAD (FormData)
// ------------------------------------------------------------------
/**
 * Opens a file picker and uploads the selected avatar image.
 * Uses FormData and the apiUpload helper.
 */
async function uploadAvatar() {
  // Create a hidden file input
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/jpeg,image/png';
  fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be less than 2MB', 'error');
      return;
    }

    // Create FormData
    const formData = new FormData();
    formData.append('avatar', file); // Key must match backend (usually 'avatar')

    showToast('Uploading avatar...', 'info');

    try {
      const response = await apiUpload('/profile/avatar', formData);
      if (response && response.success) {
        showToast('Avatar updated successfully! 📷', 'success');
        // Refresh profile data to show the new avatar
        await loadProfile();
      } else {
        showToast(response?.message || 'Upload failed', 'error');
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      showToast('Network error while uploading', 'error');
    }
  };
  fileInput.click();
}

// Helper to get initials from full name
function getInitials(fullName) {
  if (!fullName) return '';
  return fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ------------------------------------------------------------------
// Update topbarActions to call updateProfile instead of dummy toast
// ------------------------------------------------------------------
const topbarActions = {
  dashboard: { label:'＋ New Course', action:"openModal('newCourse')" },
  courses:   { label:'＋ New Course', action:"openModal('newCourse')" },
  assessments:{ label:'＋ New Assessment', action:"openModal('newQuiz')" },
  students:  { label:'📤 Export', action:"showToast('Exported!','success')" },
  analytics: { label:'📥 Download Report', action:"showToast('Downloading...','success')" },
  failure:   { label:'📤 Export List', action:"showToast('Exported!','success')" },
  profile:   { label:'💾 Save Changes', action:"updateProfile()" },        // <-- changed
  settings:  { label:'💾 Save Settings', action:"showToast('Settings saved!','success')" },
};

function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');

  document.querySelectorAll('.nav-item[data-page="' + page + '"]').forEach(n => n.classList.add('active'));

  document.getElementById('pageTitle').textContent = pageTitles[page] || page;

  // Load profile data when profile page becomes active
  if (page === 'profile') {
    loadProfile();
  }

  const action = topbarActions[page];
  if (action) {
    const btn = document.getElementById('topbarAction');
    btn.textContent = action.label;
    btn.setAttribute('onclick', action.action);
  }
}

document.querySelectorAll('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', () => navigate(item.dataset.page));
});

// ─────────────────────────────────────────────────────────────────
// SIDEBAR TOGGLE
// ─────────────────────────────────────────────────────────────────
const sidebar = document.getElementById('sidebar');
const mainEl  = document.getElementById('main');
const toggleBtn = document.getElementById('sidebarToggle');
let collapsed = false;

toggleBtn.addEventListener('click', () => {
  collapsed = !collapsed;
  sidebar.classList.toggle('collapsed', collapsed);
  mainEl.classList.toggle('expanded', collapsed);
  toggleBtn.textContent = collapsed ? '▶' : '◀';
});

// ─────────────────────────────────────────────────────────────────
// MODALS
// ─────────────────────────────────────────────────────────────────
function openModal(id) {
  const modal = document.getElementById('modal-' + id);
  if (modal) modal.classList.add('open');
  
  if (id === 'newCourse') {
    populateSubdomainDropdown();
  }
}

function closeModal(id) {
  const modal = document.getElementById('modal-' + id);
  if (modal) modal.classList.remove('open');
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ─────────────────────────────────────────────────────────────────
// CREATE COURSE (with dynamic subdomain)
// ─────────────────────────────────────────────────────────────────
async function createCourse() {
  const title = document.getElementById('newCourseTitle')?.value?.trim();
  const description = document.getElementById('newCourseDescription')?.value?.trim();
  const subdomainId = document.getElementById('newCourseSubdomain')?.value;
  const difficultyLevel = document.getElementById('newCourseDifficulty')?.value;
  const xpReward = parseInt(document.getElementById('newCourseXpReward')?.value) || 10;

  if (!title) {
    showToast('Please enter a course title', 'error');
    return;
  }
  if (!description) {
    showToast('Please enter a course description', 'error');
    return;
  }
  if (!subdomainId) {
    showToast('Please select a subdomain', 'error');
    return;
  }
  if (!difficultyLevel) {
    showToast('Please select a difficulty level', 'error');
    return;
  }

  const body = {
    title,
    description,
    subdomain_id: subdomainId,
    difficulty_level: difficultyLevel,
  };

  const data = await apiCall('POST', '/courses', body);
  if (!data || !data.success) {
    showToast(data?.message || 'Failed to create course', 'error');
    return;
  }

  closeModal('newCourse');
  showToast('Course created successfully! 🚀', 'success');
  
  await fetchCourses();
  
  if (document.getElementById('newCourseTitle')) document.getElementById('newCourseTitle').value = '';
  if (document.getElementById('newCourseDescription')) document.getElementById('newCourseDescription').value = '';
  if (document.getElementById('newCourseSubdomain')) document.getElementById('newCourseSubdomain').value = '';
  if (document.getElementById('newCourseDifficulty')) document.getElementById('newCourseDifficulty').value = 'Beginner';
  if (document.getElementById('newCourseXpReward')) document.getElementById('newCourseXpReward').value = '10';
}

// ─────────────────────────────────────────────────────────────────
// TOGGLE COURSE PUBLISH STATUS
// ─────────────────────────────────────────────────────────────────
async function toggleCoursePublish(courseId, currentStatus) {
  const newStatus = !currentStatus;
  const data = await apiCall('PATCH', `/courses/${courseId}/publish`, { is_published: newStatus });
  if (!data || !data.success) {
    showToast(data?.message || 'Failed to update course status', 'error');
    return;
  }
  
  showToast(`Course ${newStatus ? 'published' : 'unpublished'}!`, 'success');
  await fetchCourses();
}

function createQuiz() {
  closeModal('newQuiz');
  showToast('Assessment created successfully! 📝', 'success');
}

// ─────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.innerHTML = `<span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span><span class="toast-msg">${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'none';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ─────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────
const notifBtn = document.getElementById('notifBtn');
const notifPanel = document.getElementById('notifPanel');
const notifBadge = document.getElementById('notifBadge');

function renderNotifications() {
  const list = document.getElementById('notifList');
  list.innerHTML = NOTIFICATIONS.map(n => `
    <div class="notif-item ${n.unread ? 'unread' : ''}" onclick="markRead(this)">
      <div class="notif-dot-small" style="background:${n.dot}"></div>
      <div class="notif-content">
        <div class="notif-msg">${n.msg}</div>
        <div class="notif-ts">${n.time}</div>
      </div>
    </div>
  `).join('');
  updateBadge();
}

function updateBadge() {
  const unread = NOTIFICATIONS.filter(n => n.unread).length;
  notifBadge.style.display = unread > 0 ? 'block' : 'none';
}

function markRead(el) {
  el.classList.remove('unread');
  const idx = [...document.getElementById('notifList').children].indexOf(el);
  if (NOTIFICATIONS[idx]) NOTIFICATIONS[idx].unread = false;
  updateBadge();
}

document.getElementById('clearNotif').addEventListener('click', () => {
  NOTIFICATIONS.forEach(n => n.unread = false);
  document.querySelectorAll('.notif-item').forEach(el => el.classList.remove('unread'));
  updateBadge();
});

notifBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  notifPanel.classList.toggle('open');
});

document.addEventListener('click', (e) => {
  if (!notifBtn.contains(e.target)) notifPanel.classList.remove('open');
});

// ─────────────────────────────────────────────────────────────────
// RENDER DASHBOARD COURSES (first 4 from real data)
// ─────────────────────────────────────────────────────────────────
function renderDashCourses() {
  const el = document.getElementById('dashCourseList');
  const recentCourses = allCourses.slice(0, 4);
  if (!recentCourses.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">📚</div><div class="empty-title">No courses yet</div><div class="empty-sub">Click "New Course" to get started</div></div>';
    return;
  }
  
  el.innerHTML = recentCourses.map(c => {
    const emoji = getCourseEmoji(c.title);
    const color = getCourseColor(c.difficulty_level);
    const statusBadge = c.is_published ? 'badge-green' : 'badge-blue';
    const statusText = c.is_published ? 'Published' : 'Draft';
    const progress = c.progress || 0;
    
    return `
      <div style="display:flex;align-items:center;gap:14px;padding:13px 0;border-bottom:1px solid var(--border);cursor:pointer;transition:padding-left 0.2s" onclick="openCourseBuilder('${c.id}')" onmouseover="this.style.paddingLeft='8px'" onmouseout="this.style.paddingLeft='0'">
        <div style="width:42px;height:42px;border-radius:10px;background:${color};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${emoji}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px">${escapeHtml(c.title)}</div>
          <div style="font-size:11px;color:var(--text-3);margin-bottom:7px">👥 ${c.students_count || 0} · 📹 ${c.lessons_count || 0} lessons</div>
          <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
        </div>
        <div class="badge ${statusBadge}">${statusText}</div>
      </div>
    `;
  }).join('');
}

function getCourseEmoji(title) {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('react')) return '⚛️';
  if (lowerTitle.includes('node')) return '🗄️';
  if (lowerTitle.includes('css') || lowerTitle.includes('tailwind')) return '🎨';
  if (lowerTitle.includes('security')) return '🔒';
  if (lowerTitle.includes('full-stack')) return '🌐';
  return '📚';
}

function getCourseColor(level) {
  if (level === 'Beginner') return 'rgba(16,185,129,0.15)';
  if (level === 'Advanced') return 'rgba(239,68,68,0.15)';
  return 'rgba(59,130,246,0.15)';
}

// ─────────────────────────────────────────────────────────────────
// RENDER FAILURE POINTS (both dashboard and full page)
// ─────────────────────────────────────────────────────────────────
function renderFpList(containerId, limit = 999) {
  const el = document.getElementById(containerId);
  const rankClass = ['','r1','r2','r3'];
  el.innerHTML = FAILURE_POINTS.slice(0, limit).map((fp, i) => `
    <div class="fp-item">
      <div class="fp-rank ${rankClass[fp.rank] || ''}">#${fp.rank}</div>
      <div class="fp-info">
        <div class="fp-topic">${fp.topic}</div>
        <div class="fp-bar"><div class="fp-fill" style="width:${fp.pct}%;background:${fp.color}"></div></div>
      </div>
      <div class="fp-pct" style="color:${fp.color}">${fp.pct}%</div>
    </div>
  `).join('');
}

// ─────────────────────────────────────────────────────────────────
// RENDER ACTIVITY (dashboard)
// ─────────────────────────────────────────────────────────────────
function renderActivity(containerId, limit = 5) {
  const el = document.getElementById(containerId);
  el.innerHTML = ACTIVITY.slice(0, limit).map(a => `
    <div class="activity-item">
      <div class="activity-dot" style="background:${a.dot}"></div>
      <div class="activity-body">
        <div class="activity-text">${a.text}</div>
        <div class="activity-time">${a.time}</div>
      </div>
    </div>
  `).join('');
}

// ─────────────────────────────────────────────────────────────────
// RENDER CHART (generic)
// ─────────────────────────────────────────────────────────────────
function renderChart(containerId, values, labels) {
  const el = document.getElementById(containerId);
  const max = Math.max(...values);
  el.innerHTML = values.map((v, i) => `
    <div class="bar-col">
      <div class="bar" style="height:${Math.max(6, (v/max)*100)}%">
        <div class="bar-tip">${v}</div>
      </div>
      <div class="bar-lbl">${labels[i]}</div>
    </div>
  `).join('');
}

// ─────────────────────────────────────────────────────────────────
// RENDER COURSE CARDS (clickable → open builder, with publish toggle)
// ─────────────────────────────────────────────────────────────────
function renderCourseCards(data) {
  const el = document.getElementById('courseGrid');
  if (!data.length) {
    el.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">📚</div><div class="empty-title">No courses found</div><div class="empty-sub">Click "New Course" to get started</div></div>`;
    return;
  }
  
  el.innerHTML = data.map(c => {
    const emoji = getCourseEmoji(c.title);
    const levelClass = c.difficulty_level === 'Beginner' ? 'badge-green' : c.difficulty_level === 'Intermediate' ? 'badge-blue' : 'badge-purple';
    const publishClass = c.is_published ? 'badge-green' : 'badge-blue';
    const publishText = c.is_published ? 'Published ✓' : 'Draft';
    const progress = c.progress || 0;
    const students = c.students_count || 0;
    const lessons = c.lessons_count || 0;
    const rating = c.rating || 4.5;
    
    return `
      <div class="course-card" onclick="openCourseBuilder('${c.id}')" style="cursor: pointer; transition: transform 0.2s;">
        <div class="course-card-top" style="background:${getCourseColor(c.difficulty_level)}">${emoji}</div>
        <div class="course-card-body">
          <div class="course-card-title">${escapeHtml(c.title)}</div>
          <div class="course-card-meta">
            <span>👥 ${students}</span>
            <span>📹 ${lessons} lessons</span>
            <span>⭐ ${rating}</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
          <div class="course-card-footer">
            <div class="badge ${levelClass}">${c.difficulty_level || 'Intermediate'}</div>
            <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation(); toggleCoursePublish('${c.id}', ${c.is_published})">
              ${c.is_published ? '📘 Unpublish' : '📗 Publish'}
            </button>
            <button class="btn btn-primary btn-xs" onclick="openCourseBuilder('${c.id}')">✎ Edit</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function filterCourses() {
  const search = document.getElementById('courseSearch')?.value?.toLowerCase() || '';
  const status = document.getElementById('courseFilter')?.value || '';
  const diff   = document.getElementById('diffFilter')?.value || '';
  
  const filtered = allCourses.filter(c => {
    const matchSearch = !search || c.title.toLowerCase().includes(search);
    const matchStatus = !status || 
      (status === 'Active' && c.is_published === true) ||
      (status === 'Pending' && c.is_published === false);
    const matchDiff = !diff || c.difficulty_level === diff;
    return matchSearch && matchStatus && matchDiff;
  });
  renderCourseCards(filtered);
}

// ─────────────────────────────────────────────────────────────────
// RENDER STUDENT TABLE
// ─────────────────────────────────────────────────────────────────
function renderStudentTable(data) {
  const el = document.getElementById('studentTable');
  el.innerHTML = data.map(s => {
    const progColor = s.progress >= 75 ? 'green' : s.progress >= 40 ? '' : 'red';
    const statusClass = s.status === 'Active' ? 'badge-green' : s.status === 'At Risk' ? 'badge-red' : 'badge-blue';
    return `
      <tr>
        <td>
          <div class="user-cell">
            <div class="avatar" style="background:${s.color};color:${s.tcolor}">${s.initials}</div>
            <div><div class="user-name">${s.name}</div><div class="user-sub">${s.email}</div></div>
          </div>
        </td>
        <td style="color:var(--text-2)">${s.course}</td>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="progress-bar" style="width:80px"><div class="progress-fill ${progColor}" style="width:${s.progress}%"></div></div>
            <span style="font-size:12px;color:var(--text-3)">${s.progress}%</span>
          </div>
        </td>
        <td><span style="font-family:'Syne',sans-serif;font-weight:700;color:var(--purple)">${s.xp.toLocaleString()}</span></td>
        <td><span class="badge badge-blue">Lv. ${s.level}</span></td>
        <td style="color:var(--text-3);font-size:12px">${s.lastActive}</td>
        <td><div class="badge ${statusClass}">${s.status}</div></td>
      </tr>
    `;
  }).join('');
}

function filterStudents() {
  const search = document.getElementById('studentSearch')?.value?.toLowerCase() || '';
  const course = document.getElementById('studentCourseFilter')?.value || '';
  const status = document.getElementById('studentStatusFilter')?.value || '';
  const filtered = STUDENTS.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search) || s.email.toLowerCase().includes(search);
    const matchCourse = !course || s.course.includes(course);
    const matchStatus = !status ||
      (status === 'high' && s.progress >= 75) ||
      (status === 'mid'  && s.progress >= 40 && s.progress < 75) ||
      (status === 'low'  && s.progress < 40);
    return matchSearch && matchCourse && matchStatus;
  });
  renderStudentTable(filtered);
}

// ─────────────────────────────────────────────────────────────────
// RENDER ASSESSMENTS TABLE
// ─────────────────────────────────────────────────────────────────
function renderAssessments() {
  const el = document.getElementById('assessmentTable');
  el.innerHTML = ASSESSMENTS.map(a => {
    const typeClass = a.type === 'Boss Exam' ? 'badge-red' : a.type === 'Placement Test' ? 'badge-purple' : 'badge-blue';
    const statusClass = a.status === 'Active' ? 'badge-green' : a.status === 'Draft' ? 'badge-blue' : 'badge-amber';
    const scoreColor = a.avgScore >= 75 ? 'var(--green)' : a.avgScore >= 50 ? 'var(--amber)' : 'var(--red)';
    return `
      <tr>
        <td><div style="font-weight:500">${a.title}</div></td>
        <td style="color:var(--text-2);font-size:12px">${a.course}</td>
        <td><div class="badge ${typeClass}">${a.type}</div></td>
        <td style="color:var(--text-2)">${a.questions} Qs</td>
        <td><span style="font-family:'Syne',sans-serif;font-weight:700;color:${scoreColor}">${a.avgScore}%</span></td>
        <td><div class="badge ${statusClass}">${a.status}</div></td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn btn-ghost" style="padding:5px 10px;font-size:11px" onclick="showToast('Opening editor...','success')">✏️ Edit</button>
            <button class="btn btn-ghost" style="padding:5px 10px;font-size:11px;border-color:var(--red-dim);color:var(--red)" onclick="showToast('Deleted!','success')">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ─────────────────────────────────────────────────────────────────
// RENDER ANALYTICS TABLE (from real courses)
// ─────────────────────────────────────────────────────────────────
function renderAnalyticsTable() {
  const el = document.getElementById('analyticsTable');
  if (!el) return;
  
  if (!allCourses.length) {
    el.innerHTML = '<tr><td colspan="6" style="text-align:center">No courses yet</td></tr>';
    return;
  }
  
  el.innerHTML = allCourses.map(c => {
    const emoji = getCourseEmoji(c.title);
    const score = c.avg_score || 70;
    const scoreColor = score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--amber)' : 'var(--red)';
    const trend = c.trend || '→';
    const trendColor = trend === '↑' ? 'var(--green)' : trend === '↓' ? 'var(--red)' : 'var(--text-3)';
    
    return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="font-size:18px">${emoji}</div>
            <div style="font-weight:500;font-size:13px">${escapeHtml(c.title)}</div>
          </div>
        </td>
        <td style="color:var(--text-2)">${c.students_count || 0}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="progress-bar" style="width:70px"><div class="progress-fill" style="width:${c.progress || 0}%"></div></div>
            <span style="font-size:12px;color:var(--text-3)">${c.progress || 0}%</span>
          </div>
        </td>
        <td><span style="font-weight:700;color:${scoreColor};font-family:'Syne',sans-serif">${score}%</span></td>
        <td><span style="color:var(--amber)">★</span> ${c.rating || 4.5}</td>
        <td><span style="font-size:16px;color:${trendColor}">${trend}</span></td>
      </tr>
    `;
  }).join('');
}

// ─────────────────────────────────────────────────────────────────
// RENDER FP STUDENT TABLE
// ─────────────────────────────────────────────────────────────────
function renderFpStudentTable() {
  const el = document.getElementById('fpStudentTable');
  el.innerHTML = FP_STUDENTS.map(s => {
    const remClass = s.remedial === 'Completed' ? 'badge-green' : s.remedial === 'In Progress' ? 'badge-blue' : s.remedial === 'Pending' ? 'badge-amber' : 'badge-red';
    return `
      <tr>
        <td>
          <div class="user-cell">
            <div class="avatar" style="background:${s.color};color:${s.tcolor}">${s.initials}</div>
            <div class="user-name">${s.name}</div>
          </div>
        </td>
        <td><span style="color:var(--red)">${s.topic}</span></td>
        <td><span style="font-family:'Syne',sans-serif;font-weight:700">${s.attempts}×</span></td>
        <td style="color:var(--text-3);font-size:12px">${s.lastTry}</td>
        <td><div class="badge ${remClass}">${s.remedial}</div></td>
      </tr>
    `;
  }).join('');
}

// ─────────────────────────────────────────────────────────────────
// TABS (generic)
// ─────────────────────────────────────────────────────────────────
function switchTab(el, tabId) {
  el.closest('.tabs').querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

// ─────────────────────────────────────────────────────────────────
// GLOBAL SEARCH (simple)
// ─────────────────────────────────────────────────────────────────
document.getElementById('globalSearch')?.addEventListener('input', function() {
  const q = this.value.toLowerCase().trim();
  if (!q) return;
  const found = STUDENTS.find(s => s.name.toLowerCase().includes(q));
  if (found) {
    navigate('students');
    const studentSearch = document.getElementById('studentSearch');
    if (studentSearch) studentSearch.value = q;
    filterStudents();
  }
});

// ─────────────────────────────────────────────────────────────────
// INITIAL RENDER
// ─────────────────────────────────────────────────────────────────
async function init() {
  await fetchSubdomains();
  await fetchCourses();
  
  renderFpList('dashFpList', 4);
  renderFpList('fullFpList');
  renderActivity('dashActivity');
  renderStudentTable(STUDENTS);
  renderAssessments();
  renderFpStudentTable();
  renderNotifications();
  
  renderChart('weekChart',
    [42, 68, 55, 91, 73, 28, 18],
    ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  );
  renderChart('monthChart',
    [60, 75, 50, 90, 80, 110, 95, 130],
    ['J','F','M','A','M','J','J','A']
  );
  renderChart('fpChart',
    [88, 71, 59, 44, 38, 29],
    ['A','R','C','S','J','D']
  );
}

// ─────────────────────────────────────────────────────────────────
// COURSE CONTENT BUILDER (TEACHER SIDE)
// ─────────────────────────────────────────────────────────────────

// ------------------------------------------------------------------
// 1. Open Course Builder
// ------------------------------------------------------------------
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
    if (courseTitleEl) courseTitleEl.textContent = course.title;
    if (courseSubtitleEl) {
      const level = course.difficulty_level || 'Intermediate';
      const students = course.students_count || 0;
      const lessons = course.total_lessons || 0;
      courseSubtitleEl.textContent = `${level} · ${students} students · ${lessons} lessons`;
    }

    renderChapters(course.chapters || []);
  } catch (err) {
    console.error('Error loading course:', err);
    showToast(err.message, 'error');
    if (chaptersContainer) chaptersContainer.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Failed to load course content</div></div>';
  }
}

// ------------------------------------------------------------------
// 2. Render Chapters & Lessons
// ------------------------------------------------------------------
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
                openCourseBuilder(currentBuilderCourseId);
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

// ------------------------------------------------------------------
// 3. Chapter CRUD
// ------------------------------------------------------------------
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

  const chaptersCount = document.querySelectorAll('.chapter-card').length;
  const order_index = chaptersCount + 1;

  const data = await apiCall('POST', `/courses/${currentBuilderCourseId}/chapters`, { title, order_index });
  if (!data || !data.success) {
    showToast(data?.message || 'Failed to create chapter', 'error');
    return;
  }

  const newChapter = data.chapter;
  closeModal('newChapter');

  const container = document.getElementById('chaptersContainer');
  if (container) {
    if (container.innerHTML.includes('empty-state')) container.innerHTML = '';
    const newChapterHtml = `
      <div class="chapter-card" data-chapter-id="${newChapter.id}">
        <div class="chapter-header">
          <div class="chapter-title">
            <span class="chapter-expand">▼</span>
            <span>${escapeHtml(title)}</span>
          </div>
          <div class="chapter-actions">
            <button class="icon-btn-sm" onclick="editChapter('${newChapter.id}')">✎</button>
            <button class="icon-btn-sm" onclick="deleteChapter('${newChapter.id}')">🗑️</button>
          </div>
        </div>
        <div class="chapter-content">
          <div class="lessons-list"></div>
          <div class="chapter-buttons">
            <button class="btn btn-ghost add-lesson-btn" onclick="openLessonModal('${newChapter.id}')">＋ Add Lesson</button>
            <button class="btn btn-ghost add-assessment-btn" onclick="openAddQuizModal('${newChapter.id}')">📝 Add Assessment</button>
          </div>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', newChapterHtml);
    const newHeader = container.lastElementChild.querySelector('.chapter-header');
    newHeader.addEventListener('click', (e) => {
      if (e.target.closest('.chapter-actions')) return;
      const card = newHeader.closest('.chapter-card');
      if (card) card.classList.toggle('collapsed');
    });
  }

  showToast('Chapter created!', 'success');
  titleInput.value = '';
}

async function deleteChapter(chapterId) {
  if (!confirm('Are you sure you want to delete this chapter and all its content?')) return;

  const data = await apiCall('DELETE', `/courses/${currentBuilderCourseId}/chapters/${chapterId}`);
  if (!data || !data.success) {
    showToast(data?.message || 'Failed to delete chapter', 'error');
    return;
  }

  const chapterCard = document.querySelector(`.chapter-card[data-chapter-id="${chapterId}"]`);
  if (chapterCard) chapterCard.remove();
  showToast('Chapter deleted', 'success');
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

// ------------------------------------------------------------------
// 4. Lesson CRUD
// ------------------------------------------------------------------
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

  if (!title) {
    showToast('Lesson title is required', 'error');
    return;
  }

  const lessonsCount = document.querySelectorAll(`.chapter-card[data-chapter-id="${chapterId}"] .lesson-item`).length;
  const order_index = lessonsCount + 1;

  const data = await apiCall('POST', `/courses/${currentBuilderCourseId}/chapters/${chapterId}/lessons`, {
    title, content_type: contentType, duration, is_free: isFree, order_index
  });
  if (!data || !data.success) {
    showToast(data?.message || 'Failed to create lesson', 'error');
    return;
  }

  const newLesson = data.lesson;
  closeModal('newLesson');

  const chapterContent = document.querySelector(`.chapter-card[data-chapter-id="${chapterId}"] .chapter-content .lessons-list`);
  if (chapterContent) {
    const lessonHtml = renderLessonItem(newLesson, chapterId);
    chapterContent.insertAdjacentHTML('beforeend', lessonHtml);
  } else {
    const chapterCard = document.querySelector(`.chapter-card[data-chapter-id="${chapterId}"] .chapter-content`);
    if (chapterCard) {
      chapterCard.querySelector('.lessons-list')?.remove();
      const newDiv = document.createElement('div');
      newDiv.className = 'lessons-list';
      newDiv.innerHTML = renderLessonItem(newLesson, chapterId);
      chapterCard.insertBefore(newDiv, chapterCard.querySelector('.chapter-buttons'));
    }
  }

  showToast('Lesson created!', 'success');
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

  const lessonItem = document.querySelector(`.lesson-item[data-lesson-id="${lessonId}"]`);
  if (lessonItem) lessonItem.remove();
  showToast('Lesson deleted', 'success');
}

// ------------------------------------------------------------------
// 5. Content Upload
// ------------------------------------------------------------------
function uploadLessonContent(chapterId, lessonId) {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'video/*,application/pdf'; 
  
  fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('content', file); 

    showToast('Uploading content...', 'info');

    try {
      const endpoint = `/courses/${currentBuilderCourseId}/chapters/${chapterId}/lessons/${lessonId}/content`;
      const data = await apiUpload(endpoint, formData);
      
      if (!data || !data.success) throw new Error(data?.message || 'Upload failed');

      const lessonItem = document.querySelector(`.lesson-item[data-lesson-id="${lessonId}"]`);
      if (lessonItem) {
        const oldRedBadge = lessonItem.querySelector('.badge-red');
        if (oldRedBadge) oldRedBadge.remove();
        
        if (!lessonItem.querySelector('.badge-green')) {
            const metaDiv = lessonItem.querySelector('.lesson-meta');
            const newBadge = document.createElement('span');
            newBadge.className = 'badge badge-green';
            newBadge.textContent = '✓ Content uploaded';
            metaDiv.appendChild(newBadge);
        }
      }
      
      showToast('Content uploaded successfully! 🎉', 'success');
      
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error during upload', 'error');
    }
  };
  fileInput.click();
}

// ------------------------------------------------------------------
// 6. Assessment CRUD
// ------------------------------------------------------------------
function openAssessmentModal(chapterId) {
  window.currentAssessmentChapterId = chapterId;
  openModal('newAssessment');
  const titleInput = document.getElementById('newAssessmentTitle');
  if (titleInput) titleInput.value = '';
  const typeSelect = document.getElementById('newAssessmentType');
  if (typeSelect) typeSelect.value = 'quiz';
  const scoreInput = document.getElementById('newAssessmentPassingScore');
  if (scoreInput) scoreInput.value = '70';
}

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
  const order_index = assessmentsCount + 1;

  const data = await apiCall('POST', `/courses/${currentBuilderCourseId}/chapters/${chapterId}/assessments`, {
    title, type, passing_score, order_index
  });
  if (!data || !data.success) {
    showToast(data?.message || 'Failed to create assessment', 'error');
    return;
  }

  const newAssessment = data.assessment;
  closeModal('newAssessment');

  const chapterContent = document.querySelector(`.chapter-card[data-chapter-id="${chapterId}"] .chapter-content .lessons-list`);
  if (chapterContent) {
    const assessmentHtml = renderAssessmentItem(newAssessment, chapterId);
    chapterContent.insertAdjacentHTML('beforeend', assessmentHtml);
  } else {
    const chapterCard = document.querySelector(`.chapter-card[data-chapter-id="${chapterId}"] .chapter-content`);
    if (chapterCard) {
      chapterCard.querySelector('.lessons-list')?.remove();
      const newDiv = document.createElement('div');
      newDiv.className = 'lessons-list';
      newDiv.innerHTML = assessmentHtml;
      chapterCard.insertBefore(newDiv, chapterCard.querySelector('.chapter-buttons'));
    }
  }

  showToast('Assessment created!', 'success');
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

  const assessmentItem = document.querySelector(`.assessment-item[data-assessment-id="${assessmentId}"]`);
  if (assessmentItem) assessmentItem.remove();
  showToast('Assessment deleted', 'success');
}

// ------------------------------------------------------------------
// 7. Preview Mode (Dynamic W3Schools Style Player)
// ------------------------------------------------------------------
let previewLessonsList = [];
let currentPreviewIndex = 0;

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
            const sortedChapters = [...course.chapters].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
            sortedChapters.forEach(chapter => {
                if (chapter.lessons) {
                    const sortedLessons = [...chapter.lessons].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
                    sortedLessons.forEach(lesson => {
                        previewLessonsList.push({
                            ...lesson,
                            chapterTitle: chapter.title
                        });
                    });
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

    } catch(err) {
        console.error("Preview mode error:", err);
        showToast('Error loading preview', 'error');
        togglePreview(false);
    }

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
  if (!lesson) {
      previewDiv.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-2);">Lesson data not found.</div>';
      return;
  }

  let mediaHtml = '';
  let hasContent = false; 
  
  const baseUrl = 'http://localhost:3000'; 
  
  if (lesson.video_url) {
      hasContent = true;
      const fullVideoUrl = lesson.video_url.startsWith('http') ? lesson.video_url : `${baseUrl}${lesson.video_url}`;
      
      mediaHtml += `
        <div style="background: #000; border-radius: var(--radius-md); overflow: hidden; position: relative; margin-bottom: 20px;">
          <video controls controlsList="nodownload" style="width: 100%; max-height: 500px; display: block;">
            <source src="${fullVideoUrl}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        </div>
      `;
  }
  
  if (lesson.pdf_url) {
       hasContent = true;
       const fullPdfUrl = lesson.pdf_url.startsWith('http') ? lesson.pdf_url : `${baseUrl}${lesson.pdf_url}`;
       
       mediaHtml += `
        <div style="height: 600px; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; background: var(--bg-2); display: flex; flex-direction: column; margin-bottom: 20px;">
            <div style="padding: 10px; background: var(--bg-3); border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 14px; font-weight: 600;">📄 PDF Document</span>
                <div>
                    <a href="${fullPdfUrl}" target="_blank" style="padding: 5px 10px; background: var(--primary); color: white; text-decoration: none; border-radius: var(--radius-sm); font-size: 12px; margin-right: 8px;">Open ↗</a>
                    <a href="${fullPdfUrl}" download style="padding: 5px 10px; background: var(--green, #22c55e); color: white; text-decoration: none; border-radius: var(--radius-sm); font-size: 12px;">Download ⬇</a>
                </div>
            </div>
            
            <object data="${fullPdfUrl}" type="application/pdf" width="100%" height="100%" style="flex-grow: 1;">
                <div style="padding: 40px; text-align: center;">
                    <p style="margin-bottom: 10px;">Your browser does not support inline PDFs.</p>
                    <a href="${fullPdfUrl}" download class="btn btn-primary">Download PDF ⬇</a>
                </div>
            </object>
        </div>
      `;
  } 
  
  if (!hasContent) {
      mediaHtml = `
        <div style="background: var(--bg-2); padding: 40px; text-align: center; border-radius: var(--radius-md); color: var(--text-3);">
            <div style="font-size: 40px; margin-bottom: 10px;">🚧</div>
            <div>No media content uploaded for this lesson yet.</div>
        </div>
      `;
  }

  previewDiv.innerHTML = `
    <div style="margin-bottom: 16px; font-size: 13px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px;">
        Chapter: ${escapeHtml(lesson.chapterTitle)}
    </div>
    
    ${mediaHtml}
    
    <div style="padding: 16px; background: var(--bg-2); border-radius: var(--radius-sm); margin-top: 16px;">
      <h3 style="margin: 0 0 12px 0; font-size: 20px;">${escapeHtml(lesson.title)}</h3>
      
      ${lesson.summary_text ? 
        `<div style="color: var(--text-2); line-height: 1.6; white-space: pre-wrap; font-size: 15px;">${escapeHtml(lesson.summary_text)}</div>` 
        : '<em style="color: var(--text-3); font-size: 14px;">No summary text provided.</em>'
      }
    </div>
  `;

  updatePreviewNav();
}

function updatePreviewNav() {
    const prevBtn = document.getElementById('prevLessonBtn');
    const nextBtn = document.getElementById('nextLessonBtn');
    const indexSpan = document.getElementById('previewIndex');

    if (!prevBtn || !nextBtn || !indexSpan) return;

    if (previewLessonsList.length === 0) {
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        indexSpan.textContent = "0/0";
        return;
    }

    indexSpan.textContent = `${currentPreviewIndex + 1} / ${previewLessonsList.length}`;
    
    prevBtn.disabled = currentPreviewIndex === 0;
    nextBtn.disabled = currentPreviewIndex === previewLessonsList.length - 1;

    prevBtn.onclick = () => {
        if (currentPreviewIndex > 0) {
            currentPreviewIndex--;
            loadPreviewContent(currentPreviewIndex);
        }
    };

    nextBtn.onclick = () => {
        if (currentPreviewIndex < previewLessonsList.length - 1) {
            currentPreviewIndex++;
            loadPreviewContent(currentPreviewIndex);
        }
    };
}

// ------------------------------------------------------------------
// 8. Wire up modal submit buttons (run after DOM is ready)
// ------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const createChapterBtn = document.querySelector('#modal-newChapter .btn-primary');
  if (createChapterBtn) createChapterBtn.onclick = createChapter;

  const createLessonBtn = document.querySelector('#modal-newLesson .btn-primary');
  if (createLessonBtn) createLessonBtn.onclick = createLesson;

  const createAssessmentBtn = document.querySelector('#modal-newAssessment .btn-primary');
  if (createAssessmentBtn) createAssessmentBtn.onclick = createAssessment;
});

// Start everything
init();

/* ═══════════════════════════════════════════════════════
   QUIZ BUILDER — Vanilla JS
   (Remains unchanged; already present in your code)
═══════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────
let _qbCounter = 0;          // Ever-incrementing uid (never reused)
let _qbQuestionIds = [];     // Ordered list of active question uids

// ─────────────────────────────────────────────────────
// OPEN / CLOSE helpers
// ─────────────────────────────────────────────────────

/**
 * Call this instead of openModal('quizBuilder') so the
 * builder is always reset to one blank question.
 */
function openQuizBuilder() {
  // Reset state
  _qbCounter = 0;
  _qbQuestionIds = [];
  document.getElementById('qb-questions-container').innerHTML = '';
  document.getElementById('qb-title').value = '';

  // Seed with first question (cannot be removed)
  qbAddQuestion();

  openModal('quizBuilder');
}


// ─────────────────────────────────────────────────────
// QUESTION TEMPLATE
// ─────────────────────────────────────────────────────
const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']; 


/**
 * Generates the full HTML string for one question card.
 * @param {number} uid      – Unique identifier, never recycled
 * @param {number} display  – Visual question number (1-based)
 * @param {boolean} isFirst – First question cannot be removed
 */


// 1. ضع هذه الدالة أولاً (The Factory)
function _qbOptionRowHTML(uid, idx) {
  const id = `qb-q-${uid}`;
  const letter = OPTION_LETTERS[idx] || `?`;

  return `
    <div class="qb-option-row" id="${id}-opt-row-${idx}" style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
      <label class="qb-radio-wrap">
        <input
          type="radio"
          name="${id}-correct"
          value="${idx}"
          id="${id}-correct-input-${idx}"
          onchange="_qbHandleRadioChange('${id}', ${idx})"
        >
        <span class="qb-radio-custom"></span>
      </label>

      <span class="qb-option-letter" style="font-weight: bold; min-width: 20px;">${letter}</span>

      <input
        type="text"
        class="qb-option-input"
        id="${id}-opt-${idx}"
        placeholder="Option ${letter}"
        style="flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"
      >

      <button type="button" 
              onclick="_qbRemoveOptionRow(${uid}, ${idx})" 
              class="qb-opt-remove-btn"
              style="background: #ff4d4d; color: white; border: none; border-radius: 4px; width: 25px; height: 25px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; line-height: 1;">
        &times;
      </button>
    </div>
  `;
}

function _qbQuestionHTML(uid, display, isFirst) {
  const id = `qb-q-${uid}`;

  // Start with 4 default options
  const optionsHTML = [0, 1, 2, 3].map(idx => _qbOptionRowHTML(uid, idx)).join('');

  const removeBtn = isFirst ? '' : `
      <button type="button" class="qb-remove-btn" onclick="_qbRemoveQuestion(${uid})">
        🗑 Remove Question
      </button>
    `;

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
          <div class="qb-options-label">
            Answer Options
            <span class="qb-options-hint">— select the radio button next to the correct answer</span>
          </div>
          
          <div class="qb-options-list" id="${id}-options-list">
            ${optionsHTML}
          </div>

          <button type="button" class="btn-add-opt" onclick="_qbAddOptionRow(${uid})" 
                  style="margin-top:8px; background:none; border:1px dashed var(--border-color); color:var(--blue); padding:5px 12px; border-radius:4px; cursor:pointer; font-size:0.85rem;">
            + Add another option
          </button>
        </div>

        <div class="form-group" style="margin-top:15px">
          <label class="form-label" for="${id}-hint">Socratic Hint</label>
          <input class="form-input" id="${id}-hint" type="text" placeholder="Hint text...">
        </div>

        <div class="qb-meta-row">
          <div class="form-group"><label class="form-label">Difficulty</label>
            <select class="form-select" id="${id}-difficulty">
              <option value="easy">🟢 Easy</option>
              <option value="medium" selected>🟡 Medium</option>
              <option value="hard">🔴 Hard</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">Points</label>
            <input class="form-input" id="${id}-points" type="number" value="5">
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 2. The Add Logic - Use this ONE version only.
 */
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

    // Count how many rows are currently in the list
    const currentRows = container.querySelectorAll('.qb-option-row');

    if (currentRows.length <= 2) {
        alert("You must have at least 2 options!"); // Simple alert to be 100% sure you see it
        return;
    }

    if (row) {
        row.remove();
        // After removing, we fix the letters (A, B, C)
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


// ─────────────────────────────────────────────────────
// ADD A QUESTION
// ─────────────────────────────────────────────────────
function qbAddQuestion() {
  _qbCounter++;
  const uid = _qbCounter;
  _qbQuestionIds.push(uid);

  const display   = _qbQuestionIds.length;
  const isFirst   = display === 1;
  const container = document.getElementById('qb-questions-container');

  // Inject HTML
  const wrapper = document.createElement('div');
  wrapper.innerHTML = _qbQuestionHTML(uid, display, isFirst);
  // Add bottom margin spacer between cards
  wrapper.firstElementChild.style.marginBottom = '16px';
  container.appendChild(wrapper.firstElementChild);

  _qbUpdateCount();

  // Scroll new card into view smoothly
  const newCard = document.getElementById(`qb-q-${uid}-card`);
  if (newCard) {
    setTimeout(() => newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
  }

  return uid;
}

// ─────────────────────────────────────────────────────
// REMOVE A QUESTION
// ─────────────────────────────────────────────────────
function _qbRemoveQuestion(uid) {
  const card = document.getElementById(`qb-q-${uid}-card`);
  if (!card) return;

  // Slide-out animation
  card.style.transition = 'opacity 0.2s, transform 0.2s, margin 0.2s, max-height 0.3s';
  card.style.opacity    = '0';
  card.style.transform  = 'translateX(-8px)';
  card.style.maxHeight  = card.offsetHeight + 'px';

  setTimeout(() => {
    card.style.maxHeight  = '0';
    card.style.marginBottom = '0';
    card.style.overflow   = 'hidden';
  }, 200);

  setTimeout(() => {
    card.remove();
    _qbQuestionIds = _qbQuestionIds.filter(id => id !== uid);
    _qbRenumber();
    _qbUpdateCount();
  }, 450);
}

// ─────────────────────────────────────────────────────
// RENUMBER ALL VISIBLE QUESTIONS
// ─────────────────────────────────────────────────────
function _qbRenumber() {
  _qbQuestionIds.forEach((uid, idx) => {
    const display  = idx + 1;
    const numEl    = document.getElementById(`qb-q-${uid}-num`);
    const labelEl  = numEl?.nextElementSibling;
    if (numEl)   numEl.textContent   = `Q${display}`;
    if (labelEl) labelEl.textContent = `Question ${display}`;
  });
}

// ─────────────────────────────────────────────────────
// UPDATE COUNT BADGE
// ─────────────────────────────────────────────────────
function _qbUpdateCount() {
  const el = document.getElementById('qb-q-count');
  if (el) el.textContent = _qbQuestionIds.length;
}

// ─────────────────────────────────────────────────────
// HANDLE RADIO CHANGE (visual highlight)
// ─────────────────────────────────────────────────────
function _qbHandleRadioChange(qId, selectedIdx) {
  // Find the container for this specific question
  const container = document.getElementById(`${qId}-options-list`);
  if (!container) return;

  // Find all rows inside THIS question only
  const rows = container.querySelectorAll('.qb-option-row');
  
  rows.forEach(row => {
    const idParts = row.id.split('-');
    const idx = parseInt(idParts[idParts.length - 1]);
    
    // Toggle the 'qb-selected' class based on the radio value
    row.classList.toggle('qb-selected', idx === selectedIdx);
  });
}

// ─────────────────────────────────────────────────────
// COLLECT DATA & VALIDATE
// ─────────────────────────────────────────────────────

/**
 * Reads one question card and returns its data object,
 * or null + shows a toast if invalid.
 *
 * @param {number} uid      – Question uid
 * @param {number} orderIdx – 1-based position
 * @returns {{ data: object }|{ error: string }}
 */
function _qbReadQuestion(uid, orderIdx) {
    const id = `qb-q-${uid}`;

    // 1. Get Question Text
    const questionText = (document.getElementById(`${id}-text`)?.value || '').trim();
    if (!questionText) {
        return { error: `Q${orderIdx}: Please enter the question text.` };
    }

    // 2. Get Options (Filter out empty ones to allow 2, 3, or 4 options)
    const rawOptions = [0, 1, 2, 3].map(i => 
        (document.getElementById(`${id}-opt-${i}`)?.value || '').trim()
    );
    
    const validOptions = rawOptions.filter(opt => opt !== "");

    if (validOptions.length < 2) {
        return { error: `Q${orderIdx}: Please fill in at least 2 options.` };
    }

    // 3. Handle Correct Answer
    const checkedRadio = document.querySelector(`input[name="${id}-correct"]:checked`);
    if (!checkedRadio) {
        return { error: `Q${orderIdx}: Please select which answer is correct.` };
    }

    const selectedIdx = parseInt(checkedRadio.value, 10);
    const correctAnswerText = rawOptions[selectedIdx]; // Get the text of the checked option

    if (!correctAnswerText) {
        return { error: `Q${orderIdx}: The selected correct answer cannot be empty.` };
    }

    // 4. Return the Clean Data Object
    return {
        data: {
            question_text: questionText,
            options: validOptions, 
            correct_answer: correctAnswerText, // Saving the TEXT, not the index
            socratic_hint: (document.getElementById(`${id}-hint`)?.value || '').trim(),
            difficulty_level: document.getElementById(`${id}-difficulty`)?.value || 'medium',
            points: parseInt(document.getElementById(`${id}-points`)?.value, 10) || 5,
            order_index: orderIdx
        }
    };
}

// ─────────────────────────────────────────────────────
// SAVE ASSESSMENT  ← triggered by "Save Assessment" btn
// ─────────────────────────────────────────────────────

/**
 * Collects the full form, validates, builds the JSON payload,
 * then either sends it to the API or logs it to the console.
 *
 * Wire the API call to your existing apiCall() helper:
 *   apiCall('POST', `/courses/${currentBuilderCourseId}/chapters/${chapterId}/assessments/full`, payload)
 */
async function saveQuizAssessment() {
  const title = (document.getElementById('qb-title')?.value || '').trim();
  const type = document.getElementById('qb-type')?.value || 'quiz';
  const passing_score = currentQuizPassingScore;

  // 1. Basic Validation
  if (!title) {
    showToast('Please enter an assessment title.', 'error');
    document.getElementById('qb-title')?.focus();
    return;
  }

  if (_qbQuestionIds.length === 0) {
    showToast('Add at least one question before saving.', 'error');
    return;
  }

  // 2. Read and Validate each question
  const questions = [];
  for (let i = 0; i < _qbQuestionIds.length; i++) {
    const uid = _qbQuestionIds[i];
    const result = _qbReadQuestion(uid, i + 1);

    if (result.error) {
      showToast(result.error, 'error');
      const card = document.getElementById(`qb-q-${uid}-card`);
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    questions.push(result.data);
  }

  // 3. Build Payload
  const payload = { title, type, passing_score, questions };

  // 4. Determine Method & Endpoint
  let method = 'POST';
  let endpoint = `/courses/${currentBuilderCourseId}/chapters/${currentChapterIdForQuiz}/assessments`;

  if (currentEditAssessmentId) {
    method = 'PATCH'; 
    endpoint = `${endpoint}/${currentEditAssessmentId}`;
  }

  // 5. Send to API
  try {
    if (!currentBuilderCourseId || !currentChapterIdForQuiz) {
        showToast("Missing Course or Chapter ID", "error");
        return;
    }

    const data = await apiCall(method, endpoint, payload);

    if (data && data.success) {
      closeModal('quizBuilder');

      _qbResetBuilder(); // Clear the builder for next time
      
      const msg = currentEditAssessmentId ? "updated" : "saved";
      showToast(`Assessment "${title}" ${msg} successfully! ✅`, 'success');
      
      // --- CLEANUP BLOCK START ---
      currentEditAssessmentId = null; 
      _qbQuestionIds = []; // Clear the ID tracker
      _qbCounter = 0;      // Reset the counter for next time
      const container = document.getElementById('qb-questions-container');
      if (container) container.innerHTML = ''; // Empty the UI
      // --- CLEANUP BLOCK END ---

      if (typeof openCourseBuilder === 'function') {
          openCourseBuilder(currentBuilderCourseId);
      }
    } else {
      showToast(data?.message || 'Failed to save assessment', 'error');
    }
  } catch (err) {
    console.error("Save Error:", err);
    showToast("Server communication error", "error");
  }
}
// ─────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────
// 🚀 SMART WIZARD: Small Modal ➡️ Big Builder ➡️ Backend
// ─────────────────────────────────────────────────────

// 1. فتح المودال الصغير عند الضغط على "Add Assessment"
function openAddQuizModal(chapterId) {
    currentChapterIdForQuiz = chapterId; // حفظ رقم الشابتر الحالي
    
    // تصفير الحقول في المودال الصغير
    const titleInput = document.getElementById('quiz_title_input');
    const typeInput = document.getElementById('quiz_type_input');
    const scoreInput = document.getElementById('quiz_passing_score_input');
    
    if(titleInput) titleInput.value = '';
    if(typeInput) typeInput.value = 'quiz';
    if(scoreInput) scoreInput.value = '70';
    
    openModal('newQuiz');
}

// 2. الانتقال من المودال الصغير إلى المودال الكبير (الـ Builder)
function proceedToQuizBuilder() {
    const title = document.getElementById('quiz_title_input')?.value.trim();
    const type = document.getElementById('quiz_type_input')?.value || 'quiz';
    
    // 💡 حفظ درجة النجاح في المتغير العالمي بدلاً من الحقل المخفي
    const scoreInput = document.getElementById('quiz_passing_score_input')?.value;
    currentQuizPassingScore = parseInt(scoreInput) || 70;

    if (!title) {
        showToast('Please enter an assessment title', 'error');
        return;
    }

    closeModal('newQuiz');
    openQuizBuilder(title, type); // لم نعد بحاجة لتمرير الدرجة هنا
}

// 3. فتح وتجهيز الـ Quiz Builder الكبير
// (تأكد من استبدال الدالة القديمة openQuizBuilder بهذه)
function openQuizBuilder(title = '', type = 'quiz', passingScore = '70') {
    // تصفير الـ State للأسئلة
    _qbCounter = 0;
    _qbQuestionIds = [];
    document.getElementById('qb-questions-container').innerHTML = '';
    
    // تعبئة البيانات القادمة من المودال الصغير
    document.getElementById('qb-title').value = title;
    
    // حفظ النوع ودرجة النجاح في حقول مخفية (Hidden Inputs)
    const typeField = document.getElementById('qb-type');
    if(typeField) typeField.value = type;
    
    const scoreField = document.getElementById('qb-passing-score');
    if(scoreField) scoreField.value = passingScore;

    // إضافة أول سؤال فارغ إجبارياً
    qbAddQuestion();

    // فتح المودال الكبير
    openModal('quizBuilder');
}

function openEditQuizModal(assessment, chapterId) {
    _qbResetBuilder();
    currentEditAssessmentId = assessment.id;
    currentChapterIdForQuiz = chapterId;
    
    const container = document.getElementById('qb-questions-container');
    if (container) container.innerHTML = '';
    _qbQuestionIds = []; 
    _qbCounter = 0; 

    try {
        if (document.getElementById('qb-title')) document.getElementById('qb-title').value = assessment.title;
        
        if (assessment.questions && assessment.questions.length > 0) {
            assessment.questions.forEach((q) => {
                const uid = qbAddQuestion(); // This initially creates 4 rows
                
                setTimeout(() => {
                    const qInput = document.getElementById(`qb-q-${uid}-text`);
                    if (qInput) qInput.value = q.question_text || '';
                    
                    let opts = q.options;
                    if (typeof opts === 'string') try { opts = JSON.parse(opts); } catch(e) { opts = []; }

                    if (Array.isArray(opts)) {
                        const optContainer = document.getElementById(`qb-q-${uid}-options-list`);
                        // 🔥 Clear the default 4 so we don't have "ghost" options
                        if (optContainer) optContainer.innerHTML = ''; 

                        opts.forEach((optValue, idx) => {
                            // Only load if it's within our 4-option limit
                            if (idx < 4) {
                                const tempDiv = document.createElement('div');
                                tempDiv.innerHTML = _qbOptionRowHTML(uid, idx);
                                optContainer.appendChild(tempDiv.firstElementChild);

                                document.getElementById(`qb-q-${uid}-opt-${idx}`).value = optValue;

                                if (optValue === q.correct_answer && q.correct_answer !== "") {
                                    const radio = document.getElementById(`qb-q-${uid}-correct-input-${idx}`);
                                    if (radio) {
                                        radio.checked = true;
                                        _qbHandleRadioChange(`qb-q-${uid}`, idx);
                                    }
                                }
                            }
                        });
                    }
                    
                    // Fill Meta
                    if (document.getElementById(`qb-q-${uid}-hint`)) document.getElementById(`qb-q-${uid}-hint`).value = q.socratic_hint || '';
                    if (document.getElementById(`qb-q-${uid}-difficulty`)) document.getElementById(`qb-q-${uid}-difficulty`).value = q.difficulty_level || 'medium';
                    if (document.getElementById(`qb-q-${uid}-points`)) document.getElementById(`qb-q-${uid}-points`).value = q.points || 5;
                }, 50);
            });
        }
        openModal('quizBuilder');
    } catch (error) {
        console.error("Error:", error);
    }
}

function _qbResetBuilder() {
    // 1. تصفير العدادات والمعرفات
    _qbCounter = 0;
    _qbQuestionIds = [];
    currentEditAssessmentId = null;

    // 2. مسح محتوى الحاويات في الواجهة
    const container = document.getElementById('qb-questions-container');
    if (container) container.innerHTML = '';

    // 3. تصفير الحقول النصية الأساسية
    if (document.getElementById('qb-title')) document.getElementById('qb-title').value = '';
    if (document.getElementById('qb-type')) document.getElementById('qb-type').value = 'quiz';
    
    // 4. إعادة قيمة النجاح للوضع الافتراضي
    currentQuizPassingScore = 70;
    const scoreDisplay = document.getElementById('passing_score_display');
    if (scoreDisplay) scoreDisplay.innerText = '70%';
}