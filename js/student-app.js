/* ══════════════════════════════════════
   CONFIG & AUTH
══════════════════════════════════════ */
const API = 'http://localhost:3000/api';

const getToken = () => localStorage.getItem('token');
const getUser  = () => { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; };

function requireAuth() {
    if (!getToken()) window.location.href = 'login.html';
}

async function apiCall(method, endpoint, body = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${getToken()}`
            }
        };
        if (body) options.body = JSON.stringify(body);
        const res  = await fetch(`${API}${endpoint}`, options);
        const data = await res.json();
        return data;
    } catch (err) {
        console.error('API error:', err);
        return null;
    }
}

async function apiUpload(endpoint, formData) {
    try {
        const res = await fetch(`${API}${endpoint}`, {
            method:  'POST',
            headers: { 'Authorization': `Bearer ${getToken()}` },
            body:    formData
        });
        return await res.json();
    } catch (err) {
        console.error('Upload error:', err);
        return null;
    }
}

/* ══════════════════════════════════════
   STATIC DATA
══════════════════════════════════════ */
const STUDENT_COURSES = [
    { id:1, emoji:'🌐', title:'Full-Stack Web Development',   teacher:'Khalil Khalfi', lessons:24, doneLessons:19, progress:78,  status:'In Progress', level:'Intermediate', color:'rgba(59,130,246,0.15)',  xp:320 },
    { id:2, emoji:'⚛️', title:'JavaScript Advanced Concepts', teacher:'Khalil Khalfi', lessons:18, doneLessons:12, progress:65,  status:'In Progress', level:'Advanced',     color:'rgba(167,139,250,0.15)', xp:250 },
    { id:3, emoji:'🗄️', title:'Node.js & PostgreSQL Mastery', teacher:'Khalil Khalfi', lessons:20, doneLessons:4,  progress:20,  status:'In Progress', level:'Intermediate', color:'rgba(16,185,129,0.15)',  xp:150 },
    { id:4, emoji:'🎨', title:'CSS & Tailwind Deep Dive',     teacher:'Khalil Khalfi', lessons:12, doneLessons:12, progress:100, status:'Completed',   level:'Beginner',     color:'rgba(245,158,11,0.15)',  xp:180 },
    { id:5, emoji:'🚀', title:'React from Zero to Hero',      teacher:'Khalil Khalfi', lessons:22, doneLessons:0,  progress:0,   status:'Not Started', level:'Intermediate', color:'rgba(34,211,238,0.12)',  xp:0   },
];

const QUESTS = [
    { id:1, emoji:'⚔️', title:'Build a REST API with Node.js',  desc:'Create a full CRUD API with Express and connect it to your PostgreSQL database.',       type:'Boss Quest', status:'active',    xp:150, tasks:5,  done:3  },
    { id:2, emoji:'🧩', title:'JavaScript Closures Challenge',   desc:'Solve 5 advanced closure problems and explain your solutions.',                          type:'Challenge',  status:'active',    xp:80,  tasks:5,  done:5  },
    { id:3, emoji:'🎨', title:'Responsive Landing Page',         desc:'Build a mobile-first landing page using CSS Grid and Flexbox only.',                     type:'Project',    status:'active',    xp:120, tasks:4,  done:1  },
    { id:4, emoji:'🏆', title:'Full-Stack Boss Exam - Level 3',  desc:'Prove your full-stack skills in this timed comprehensive exam.',                         type:'Boss Exam',  status:'locked',    xp:300, tasks:1,  done:0  },
    { id:5, emoji:'🔍', title:'Debug the Broken App',            desc:'Find and fix all 8 bugs in the provided Express application.',                           type:'Debug',      status:'completed', xp:100, tasks:8,  done:8  },
    { id:6, emoji:'📦', title:'NPM Package Creator',             desc:'Publish your own utility npm package and write full documentation.',                     type:'Project',    status:'completed', xp:90,  tasks:3,  done:3  },
    { id:7, emoji:'🌐', title:'Deploy to Production',            desc:'Deploy your Node.js app to a cloud provider with CI/CD pipeline.',                       type:'DevOps',     status:'locked',    xp:200, tasks:6,  done:0  },
    { id:8, emoji:'🔐', title:'Secure the API',                  desc:'Add JWT authentication, rate limiting, and input validation to your API.',                type:'Security',   status:'locked',    xp:180, tasks:5,  done:0  },
    { id:9, emoji:'⚡', title:'Async Mastery Sprint',            desc:'Complete 10 async/await exercises to master asynchronous JavaScript.',                    type:'Challenge',  status:'completed', xp:70,  tasks:10, done:10 },
];

const SKILL_TREE = [
    { tier:'Foundation', skills:[
        { name:'HTML & CSS Basics',       icon:'🌐', xp:200, status:'unlocked' },
        { name:'JavaScript Fundamentals', icon:'⚡', xp:300, status:'unlocked' },
        { name:'Git & Version Control',   icon:'🔀', xp:150, status:'unlocked' },
    ]},
    { tier:'Core Skills', skills:[
        { name:'CSS Flexbox & Grid',      icon:'🎨', xp:250, status:'unlocked' },
        { name:'DOM Manipulation',        icon:'🖱️', xp:200, status:'unlocked' },
        { name:'Async JavaScript',        icon:'🔄', xp:350, status:'active'   },
        { name:'REST API Concepts',       icon:'🔗', xp:300, status:'active'   },
    ]},
    { tier:'Advanced', skills:[
        { name:'Node.js & Express',       icon:'🗄️', xp:400, status:'active'   },
        { name:'React Framework',         icon:'⚛️', xp:450, status:'locked'   },
        { name:'PostgreSQL & SQL',        icon:'🗃️', xp:380, status:'locked'   },
        { name:'Authentication & JWT',    icon:'🔐', xp:320, status:'locked'   },
    ]},
    { tier:'Mastery', skills:[
        { name:'Full-Stack Architecture', icon:'🏗️', xp:500, status:'locked'   },
        { name:'Deployment & DevOps',     icon:'🚀', xp:480, status:'locked'   },
        { name:'Testing & TDD',           icon:'🧪', xp:420, status:'locked'   },
    ]},
];

const ASSESSMENTS_DATA = [
    { title:'CSS Grid & Flexbox Quiz',    course:'CSS & Tailwind',       type:'Quiz',      score:92,   status:'Passed',   date:'Mar 1'  },
    { title:'JS Closures & Scope',        course:'JavaScript Advanced',  type:'Quiz',      score:78,   status:'Passed',   date:'Mar 3'  },
    { title:'Node.js REST API Quiz',      course:'Node.js & PostgreSQL', type:'Quiz',      score:null, status:'Upcoming', date:'Mar 12' },
    { title:'Full-Stack Boss Exam Lv.3',  course:'Full-Stack',           type:'Boss Exam', score:null, status:'Locked',   date:'TBD'    },
    { title:'Async JavaScript Deep Dive', course:'JavaScript Advanced',  type:'Quiz',      score:65,   status:'Passed',   date:'Feb 28' },
    { title:'Web Dev Placement Test',     course:'General',              type:'Placement', score:82,   status:'Passed',   date:'Feb 15' },
    { title:'Node.js Boss Exam Lv.1',     course:'Node.js & PostgreSQL', type:'Boss Exam', score:71,   status:'Passed',   date:'Feb 20' },
];

const LEADERBOARD_DATA = [
    { name:'Nour Aissaoui',  initials:'NA', color:'rgba(34,211,238,0.2)',  tcolor:'var(--cyan)',     level:9, xp:3400, quests:22, streak:35, rank:1, isMe:false },
    { name:'Ahmed Mansouri', initials:'AM', color:'rgba(59,130,246,0.2)',  tcolor:'var(--blue-400)', level:8, xp:2840, quests:17, streak:28, rank:2, isMe:true  },
    { name:'Sara Benali',    initials:'SB', color:'rgba(167,139,250,0.2)', tcolor:'var(--purple)',   level:7, xp:2600, quests:15, streak:20, rank:3, isMe:false },
    { name:'Rami Tahir',     initials:'RT', color:'rgba(245,158,11,0.2)',  tcolor:'var(--amber)',    level:6, xp:2100, quests:13, streak:14, rank:4, isMe:false },
    { name:'Amira Saad',     initials:'AS', color:'rgba(167,139,250,0.2)', tcolor:'var(--purple)',   level:6, xp:1980, quests:12, streak:10, rank:5, isMe:false },
    { name:'Yacine Merad',   initials:'YM', color:'rgba(16,185,129,0.2)',  tcolor:'var(--green)',    level:5, xp:1650, quests:10, streak:7,  rank:6, isMe:false },
    { name:'Karim Bouzid',   initials:'KB', color:'rgba(59,130,246,0.2)',  tcolor:'var(--blue-400)', level:4, xp:1200, quests:8,  streak:5,  rank:7, isMe:false },
    { name:'Lina Khelifi',   initials:'LK', color:'rgba(239,68,68,0.2)',   tcolor:'var(--red)',      level:3, xp:890,  quests:5,  streak:3,  rank:8, isMe:false },
];

const BADGES_DATA = [
    { name:'First Steps',       icon:'👶', desc:'Complete your first lesson',        color:'rgba(59,130,246,0.15)',  earned:true,  date:'Feb 10' },
    { name:'Code Warrior',      icon:'⚔️', desc:'Complete 10 quests',                color:'rgba(239,68,68,0.15)',   earned:true,  date:'Feb 18' },
    { name:'CSS Wizard',        icon:'🎨', desc:'Score 90%+ on a CSS quiz',          color:'rgba(167,139,250,0.15)', earned:true,  date:'Mar 1'  },
    { name:'Streak Master',     icon:'🔥', desc:'Maintain a 14-day streak',          color:'rgba(245,158,11,0.15)',  earned:true,  date:'Feb 25' },
    { name:'Quiz Champion',     icon:'🏆', desc:'Pass 5 quizzes in a row',           color:'rgba(16,185,129,0.15)',  earned:true,  date:'Mar 3'  },
    { name:'OSS Contributor',   icon:'📦', desc:'Publish an npm package',            color:'rgba(34,211,238,0.12)',  earned:true,  date:'Mar 5'  },
    { name:'Night Owl',         icon:'🦉', desc:'Study past midnight 3 times',       color:'rgba(99,102,241,0.15)',  earned:true,  date:'Feb 22' },
    { name:'Speed Runner',      icon:'⚡', desc:'Complete a quiz in under 5 min',     color:'rgba(251,191,36,0.15)',  earned:true,  date:'Feb 28' },
    { name:'Perfect Score',     icon:'💯', desc:'Score 100% on any assessment',      color:'rgba(16,185,129,0.15)',  earned:true,  date:'Mar 1'  },
    { name:'Bookworm',          icon:'📚', desc:'Read 20 lessons in a week',         color:'rgba(59,130,246,0.15)',  earned:true,  date:'Feb 16' },
    { name:'Team Player',       icon:'🤝', desc:'Help 3 students in forums',         color:'rgba(245,158,11,0.15)',  earned:true,  date:'Mar 4'  },
    { name:'API Master',        icon:'🔗', desc:'Complete the REST API quest',       color:'rgba(167,139,250,0.15)', earned:false, date:null     },
    { name:'Full-Stack Knight', icon:'🛡️', desc:'Pass the Full-Stack Boss Exam',     color:'rgba(239,68,68,0.15)',   earned:false, date:null     },
    { name:'Security Guard',    icon:'🔐', desc:'Complete the Secure the API quest', color:'rgba(34,211,238,0.12)',  earned:false, date:null     },
    { name:'DevOps Initiate',   icon:'🚀', desc:'Deploy an app to production',       color:'rgba(99,102,241,0.15)',  earned:false, date:null     },
    { name:'React Master',      icon:'⚛️', desc:'Complete the React course 100%',    color:'rgba(34,211,238,0.12)',  earned:false, date:null     },
];

const ACTIVITY_DATA = [
    { dot:'var(--green)',    text:'You earned the <strong>Quiz Champion</strong> badge 🏆',                       time:'2 hr ago'   },
    { dot:'var(--blue-400)', text:'Completed lesson: <strong>Express Middleware Deep Dive</strong>',              time:'3 hr ago'   },
    { dot:'var(--amber)',    text:'Gained <strong>+80 XP</strong> from JS Closures Challenge quest',              time:'Yesterday'  },
    { dot:'var(--purple)',   text:'Reached <strong>Level 8</strong> — Code Warrior rank unlocked!',               time:'Yesterday'  },
    { dot:'var(--red)',      text:'Failed the Async/Await quiz — remedial session started automatically',          time:'2 days ago' },
];

const NOTIFICATIONS_DATA = [
    { dot:'var(--amber)',    msg:'Your streak is at <strong>28 days</strong>! Keep it up 🔥',             time:'1 hr ago',   unread:true  },
    { dot:'var(--green)',    msg:'You earned the <strong>Quiz Champion</strong> badge!',                  time:'2 hr ago',   unread:true  },
    { dot:'var(--blue-400)', msg:'New lesson: <strong>JWT Authentication with Node.js</strong>',          time:'5 hr ago',   unread:true  },
    { dot:'var(--purple)',   msg:'<strong>Khalil K.</strong> posted feedback on your REST API quest',     time:'Yesterday',  unread:false },
    { dot:'var(--red)',      msg:'Boss Exam <strong>Full-Stack Lv.3</strong> unlocks in 2 more quests',   time:'2 days ago', unread:false },
];

const UPCOMING_DATA = [
    { emoji:'📝', title:'Node.js REST API Quiz',      course:'Node.js & PostgreSQL', due:'Mar 12', color:'rgba(16,185,129,0.15)', urgency:'badge-blue' },
    { emoji:'⚔️', title:'Full-Stack Boss Exam Lv.3', course:'Full-Stack',           due:'TBD',    color:'rgba(239,68,68,0.15)',  urgency:'badge-red'  },
    { emoji:'📝', title:'React Hooks Quiz',           course:'React from Zero',      due:'Mar 20', color:'rgba(34,211,238,0.12)', urgency:'badge-blue' },
];

const DAILY_GOALS = [
    { text:'Watch 1 lesson video',  xp:'+10 XP', done:true  },
    { text:'Complete a quiz',       xp:'+20 XP', done:true  },
    { text:'Work on active quest',  xp:'+15 XP', done:false },
];

const PATH_DATA = [
    { title:'HTML & CSS Fundamentals',             desc:'Master the building blocks of the web.',                                      done:true,   lessons:['HTML structure','CSS selectors','Flexbox','Grid layout','Responsive design']    },
    { title:'JavaScript Core',                     desc:'Dive deep into JavaScript closures, async/await, and modern ES6+ syntax.',    done:true,   lessons:['Variables & types','Functions','Closures','Async/Await','DOM API']              },
    { title:'Node.js & Express Backend',           desc:'Build REST APIs, middleware, authentication and database connections.',        active:true, lessons:['Node.js basics','Express routing','Middleware','JWT Auth','Error handling']    },
    { title:'PostgreSQL & Databases',              desc:'Design and query relational databases. SQL, joins, indexing, Node.js.',        locked:true, lessons:['SQL basics','JOINs','Indexes','Node-postgres','Schema design']               },
    { title:'React Frontend Framework',            desc:'Build modern UIs with hooks, state management and API integration.',           locked:true, lessons:['JSX basics','useState','useEffect','Context API','Fetch & Axios']            },
    { title:'Full-Stack Integration & Deployment', desc:'Combine everything. Build and deploy a complete full-stack application.',      locked:true, lessons:['Project structure','Docker basics','CI/CD','Cloud deploy','Boss Exam']       },
];

/* ══════════════════════════════════════
   HELPERS
══════════════════════════════════════ */
function getRankTitle(level) {
    if (level >= 10) return 'Master';
    if (level >= 8)  return 'Code Warrior';
    if (level >= 6)  return 'Developer';
    if (level >= 4)  return 'Apprentice';
    return 'Beginner';
}

function getInitials(fullName) {
    return (fullName || '')
        .split(' ')
        .filter(Boolean)
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// get profile input by data-field attribute
function profileInput(field) {
    return document.querySelector(`#page-profile input[data-field="${field}"]`);
}

function setAvatarImage(url) {
    const fullUrl = `http://localhost:3000/${url}`;

    // sidebar small avatar
    const smallAvatar = document.querySelector('.sidebar-profile .profile-avatar');
    if (smallAvatar) {
        smallAvatar.style.backgroundImage    = `url(${fullUrl})`;
        smallAvatar.style.backgroundSize     = 'cover';
        smallAvatar.style.backgroundPosition = 'center';
        smallAvatar.textContent = '';
    }

    // profile big avatar — preserve child elements (level badge)
    const bigAvatar = document.querySelector('.big-avatar');
    if (bigAvatar) {
        bigAvatar.style.backgroundImage    = `url(${fullUrl})`;
        bigAvatar.style.backgroundSize     = 'cover';
        bigAvatar.style.backgroundPosition = 'center';
        bigAvatar.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) node.textContent = '';
        });
    }
}

/* ══════════════════════════════════════
   BACKEND — LOAD USER DATA
══════════════════════════════════════ */
async function loadUserData() {
    requireAuth();

    // GET /api/auth/me
    const meRes = await apiCall('GET', '/auth/me');
    if (meRes && meRes.success) {
        const user      = meRes.user;
        const initials  = getInitials(user.full_name);
        const firstName = user.full_name.split(' ')[0];

        document.querySelector('.sidebar-profile .profile-name').textContent   = user.full_name;
        document.querySelector('.sidebar-profile .profile-avatar').textContent = initials;
        document.querySelector('.welcome-title span').textContent              = firstName;

        // big avatar initials
        const bigAvatar = document.querySelector('.big-avatar');
        if (bigAvatar) {
            bigAvatar.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) node.textContent = initials;
            });
        }

        // fill profile inputs using data-field
        if (profileInput('full_name')) profileInput('full_name').value = user.full_name || '';
        if (profileInput('username'))  profileInput('username').value  = user.username  || '';
        if (profileInput('email'))     profileInput('email').value     = user.email     || '';

        localStorage.setItem('user', JSON.stringify(user));
    }

    // GET /api/gamification/me
    const statsRes = await apiCall('GET', '/gamification/me');
    if (statsRes && statsRes.success) {
        const s            = statsRes.stats;
        const XP_PER_LEVEL = 1000;
        const xpInLevel    = s.total_xp % XP_PER_LEVEL;
        const xpToNext     = XP_PER_LEVEL - xpInLevel;
        const pct          = Math.round((xpInLevel / XP_PER_LEVEL) * 100);
        const rankTitle    = getRankTitle(s.current_level);
        const el           = (sel) => document.querySelector(sel);

        if (el('.xp-label strong'))               el('.xp-label strong').textContent               = s.total_xp.toLocaleString();
        if (el('.xp-fill'))                       el('.xp-fill').style.width                       = `${pct}%`;
        if (el('.xp-level'))                      el('.xp-level').textContent                      = `Lv.${s.current_level}`;
        if (el('.level-num'))                     el('.level-num').textContent                     = s.current_level;
        if (el('.level-xp'))                      el('.level-xp').textContent                      = `${s.total_xp.toLocaleString()} XP`;
        if (el('.level-next'))                    el('.level-next').textContent                    = `${xpToNext} XP to Level ${s.current_level + 1}`;
        if (el('.sidebar-profile .profile-role')) el('.sidebar-profile .profile-role').textContent = `Level ${s.current_level} · ${rankTitle}`;

        const statVals = document.querySelectorAll('.profile-stat-val');
        if (statVals[0]) statVals[0].textContent = s.total_xp.toLocaleString();
        if (statVals[1]) statVals[1].textContent = s.current_level;
    }

    // GET /api/profile/me
    const profileRes = await apiCall('GET', '/profile/me');
    if (profileRes && profileRes.success) {
        const p     = profileRes.profile;
        const bioEl = document.querySelector('#page-profile .form-textarea');
        if (p.bio && bioEl)   bioEl.value = p.bio;
        if (p.avatar_url)     setAvatarImage(p.avatar_url);
    }
}

/* ══════════════════════════════════════
   BACKEND — SAVE PROFILE
══════════════════════════════════════ */
async function saveProfile() {
    const full_name = profileInput('full_name')?.value?.trim();
    const username  = profileInput('username')?.value?.trim();
    const bio       = document.querySelector('#page-profile .form-textarea')?.value?.trim();

    if (!full_name && !username && !bio) {
        showToast('Nothing to save!', 'error');
        return;
    }

    const body = {};
    if (full_name) body.full_name = full_name;
    if (username)  body.username  = username;
    if (bio)       body.bio       = bio;

    const res = await apiCall('PATCH', '/profile/me', body);

    if (res && res.success) {
        showToast('Profile saved! ✅', 'success');
        if (full_name) {
            document.querySelector('.sidebar-profile .profile-name').textContent   = full_name;
            document.querySelector('.sidebar-profile .profile-avatar').textContent = getInitials(full_name);
            document.querySelector('.welcome-title span').textContent              = full_name.split(' ')[0];
        }
    } else {
        showToast(res?.message || 'Failed to save profile', 'error');
    }
}

/* ══════════════════════════════════════
   BACKEND — CHANGE PASSWORD
══════════════════════════════════════ */
async function changePassword() {
    const inputs           = document.querySelectorAll('#page-profile input[type="password"]');
    const current_password = inputs[0]?.value?.trim();
    const new_password     = inputs[1]?.value?.trim();
    const confirm          = inputs[2]?.value?.trim();

    if (!current_password || !new_password || !confirm) { showToast('Please fill all password fields', 'error'); return; }
    if (new_password !== confirm)                        { showToast('New passwords do not match', 'error');     return; }
    if (new_password.length < 8)                        { showToast('Password must be at least 8 characters', 'error'); return; }

    const res = await apiCall('PATCH', '/auth/change-password', { current_password, new_password });

    if (res && res.success) {
        showToast('Password updated! 🔒', 'success');
        inputs.forEach(i => i.value = '');
    } else {
        showToast(res?.message || 'Failed to update password', 'error');
    }
}

/* ══════════════════════════════════════
   BACKEND — UPLOAD AVATAR
══════════════════════════════════════ */
async function uploadAvatar(file) {
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    showToast('Uploading photo...', 'success');
    const res = await apiUpload('/profile/avatar', formData);
    if (res && res.success) {
        showToast('Photo updated! 📷', 'success');
        setAvatarImage(res.profile.avatar_url);
    } else {
        showToast(res?.message || 'Upload failed', 'error');
    }
}

/* ══════════════════════════════════════
   LOGOUT
══════════════════════════════════════ */
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

/* ══════════════════════════════════════
   PAGE NAVIGATION
══════════════════════════════════════ */
const pageTitles = {
    dashboard:    'Dashboard',
    'my-path':    'My Learning Path',
    courses:      'My Courses',
    quests:       'Quests',
    'skill-tree': 'Skill Tree',
    assessments:  'Assessments',
    leaderboard:  'Leaderboard',
    badges:       'Badges',
    profile:      'My Profile',
    settings:     'Settings',
};

function navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const pageEl = document.getElementById('page-' + page);
    if (pageEl) pageEl.classList.add('active');
    document.querySelectorAll(`.nav-item[data-page="${page}"]`).forEach(n => n.classList.add('active'));
    document.getElementById('pageTitle').textContent = pageTitles[page] || page;
}

document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => navigate(item.dataset.page));
});

/* ══════════════════════════════════════
   SIDEBAR TOGGLE
══════════════════════════════════════ */
const sidebarEl = document.getElementById('sidebar');
const mainEl    = document.getElementById('main');
const toggleBtn = document.getElementById('sidebarToggle');
let   collapsed = false;

toggleBtn.addEventListener('click', () => {
    collapsed = !collapsed;
    sidebarEl.classList.toggle('collapsed', collapsed);
    mainEl.classList.toggle('expanded',     collapsed);
    toggleBtn.textContent = collapsed ? '▶' : '◀';
});

/* ══════════════════════════════════════
   MODALS
══════════════════════════════════════ */
function openModal(id)  { document.getElementById('modal-' + id).classList.add('open');    }
function closeModal(id) { document.getElementById('modal-' + id).classList.remove('open'); }

document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
});

/* ══════════════════════════════════════
   TOAST
══════════════════════════════════════ */
function showToast(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast     = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span><span class="toast-msg">${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/* ══════════════════════════════════════
   NOTIFICATIONS
══════════════════════════════════════ */
const notifBtn   = document.getElementById('notifBtn');
const notifPanel = document.getElementById('notifPanel');
const notifBadge = document.getElementById('notifBadge');

function renderNotifications() {
    document.getElementById('notifList').innerHTML = NOTIFICATIONS_DATA.map(n => `
        <div class="notif-item ${n.unread ? 'unread' : ''}" onclick="markNotifRead(this)">
            <div class="notif-dot-small" style="background:${n.dot}"></div>
            <div class="notif-content">
                <div class="notif-msg">${n.msg}</div>
                <div class="notif-ts">${n.time}</div>
            </div>
        </div>
    `).join('');
    updateNotifBadge();
}

function updateNotifBadge() {
    notifBadge.style.display = NOTIFICATIONS_DATA.some(n => n.unread) ? 'block' : 'none';
}

function markNotifRead(el) {
    el.classList.remove('unread');
    const idx = [...document.getElementById('notifList').children].indexOf(el);
    if (NOTIFICATIONS_DATA[idx]) NOTIFICATIONS_DATA[idx].unread = false;
    updateNotifBadge();
}

document.getElementById('clearNotif').addEventListener('click', () => {
    NOTIFICATIONS_DATA.forEach(n => n.unread = false);
    document.querySelectorAll('.notif-item').forEach(el => el.classList.remove('unread'));
    updateNotifBadge();
});

notifBtn.addEventListener('click', e => { e.stopPropagation(); notifPanel.classList.toggle('open'); });
document.addEventListener('click', e => { if (!notifBtn.contains(e.target)) notifPanel.classList.remove('open'); });

/* ══════════════════════════════════════
   TABS
══════════════════════════════════════ */
function switchTab(el) {
    el.closest('.tabs').querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
}

/* ══════════════════════════════════════
   RENDER: DASHBOARD
══════════════════════════════════════ */
function renderDashCourses() {
    document.getElementById('dashCourseList').innerHTML = STUDENT_COURSES
        .filter(c => c.status !== 'Completed')
        .slice(0, 3)
        .map(c => `
            <div class="dash-course-item" onclick="navigate('courses')">
                <div class="dash-course-icon" style="background:${c.color}">${c.emoji}</div>
                <div class="dash-course-info">
                    <div class="dash-course-title">${c.title}</div>
                    <div class="dash-course-meta">📹 ${c.doneLessons}/${c.lessons} lessons done</div>
                    <div class="progress-bar"><div class="progress-fill" style="width:${c.progress}%"></div></div>
                </div>
                <div class="dash-course-pct">${c.progress}%</div>
            </div>
        `).join('');
}

function renderDailyGoals() {
    document.getElementById('dailyGoals').innerHTML = DAILY_GOALS.map((g, i) => `
        <div class="daily-goal-item ${g.done ? 'done' : ''}" onclick="toggleGoal(${i})">
            <div class="goal-check">${g.done ? '✓' : ''}</div>
            <div class="goal-text">${g.text}</div>
            <div class="goal-xp">${g.xp}</div>
        </div>
    `).join('');
}

function toggleGoal(i) {
    DAILY_GOALS[i].done = !DAILY_GOALS[i].done;
    renderDailyGoals();
    if (DAILY_GOALS[i].done) showToast(`Goal complete! ${DAILY_GOALS[i].xp} earned 🎉`, 'success');
}

function renderActivity() {
    document.getElementById('dashActivity').innerHTML = ACTIVITY_DATA.map(a => `
        <div class="activity-item">
            <div class="activity-dot" style="background:${a.dot}"></div>
            <div class="activity-body">
                <div class="activity-text">${a.text}</div>
                <div class="activity-time">${a.time}</div>
            </div>
        </div>
    `).join('');
}

function renderUpcoming() {
    document.getElementById('upcomingAssessments').innerHTML = UPCOMING_DATA.map(u => `
        <div class="upcoming-item" onclick="navigate('assessments')">
            <div class="upcoming-icon" style="background:${u.color}">${u.emoji}</div>
            <div class="upcoming-info">
                <div class="upcoming-title">${u.title}</div>
                <div class="upcoming-meta">${u.course}</div>
            </div>
            <div class="badge ${u.urgency}">${u.due}</div>
        </div>
    `).join('');
}

/* ══════════════════════════════════════
   RENDER: LEARNING PATH
══════════════════════════════════════ */
function renderPath() {
    document.getElementById('pathTrack').innerHTML = PATH_DATA.map((node, i) => {
        const dotClass    = node.done ? 'done' : node.active ? 'active' : 'locked';
        const cardClass   = node.active ? 'active-node' : node.locked ? 'locked-node' : '';
        const statusBadge = node.done
            ? '<div class="badge badge-green">Completed ✓</div>'
            : node.active
            ? '<div class="badge badge-blue">In Progress</div>'
            : '<div class="badge badge-neutral">🔒 Locked</div>';
        return `
            <div class="path-node">
                <div class="path-dot ${dotClass}">${node.done ? '✓' : i + 1}</div>
                <div class="path-content ${cardClass}">
                    <div class="path-content-top">
                        <div class="path-node-title">${node.title}</div>
                        ${statusBadge}
                    </div>
                    <div class="path-node-desc">${node.desc}</div>
                    <div class="path-lessons">
                        ${node.lessons.map((l, j) => `
                            <div class="path-lesson-chip ${node.done || (node.active && j < 3) ? 'done' : ''}">${l}</div>
                        `).join('')}
                    </div>
                    ${node.active ? '<button class="btn btn-primary btn-mt" onclick="showToast(\'Continuing lesson...\',\'success\')">▶ Continue</button>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

/* ══════════════════════════════════════
   RENDER: COURSES
══════════════════════════════════════ */
function renderStudentCourses(data) {
    const el = document.getElementById('studentCourseGrid');
    if (!data.length) {
        el.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">📚</div><div class="empty-title">No courses found</div></div>';
        return;
    }
    el.innerHTML = data.map(c => {
        const statusClass = c.status === 'Completed'   ? 'badge-green' :
                            c.status === 'In Progress' ? 'badge-blue'  : 'badge-amber';
        const progClass   = c.progress === 100 ? 'green' : c.progress > 0 ? '' : 'amber';
        const actionBtn   = c.status === 'In Progress'
            ? '<button class="btn btn-primary btn-xs" onclick="showToast(\'Resuming...\',\'success\')">▶ Resume</button>'
            : c.status === 'Completed'
            ? '<div class="badge badge-green">✓ Done</div>'
            : '<button class="btn btn-ghost btn-xs" onclick="showToast(\'Starting...\',\'success\')">Start</button>';
        return `
            <div class="course-card">
                <div class="course-card-top" style="background:${c.color}">${c.emoji}</div>
                <div class="course-card-body">
                    <div class="course-card-title">${c.title}</div>
                    <div class="course-card-meta"><span>👨‍🏫 ${c.teacher}</span><span>📹 ${c.doneLessons}/${c.lessons}</span></div>
                    <div class="progress-bar"><div class="progress-fill ${progClass}" style="width:${c.progress}%"></div></div>
                    <div class="course-card-footer">
                        <div class="badge ${statusClass}">${c.status}</div>
                        <div class="course-pct">${c.progress}%</div>
                        ${actionBtn}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function filterStudentCourses() {
    const search   = document.getElementById('courseSearch').value.toLowerCase();
    const status   = document.getElementById('courseStatusFilter').value;
    const filtered = STUDENT_COURSES.filter(c =>
        (!search || c.title.toLowerCase().includes(search)) &&
        (!status || c.status === status)
    );
    renderStudentCourses(filtered);
}

/* ══════════════════════════════════════
   RENDER: QUESTS
══════════════════════════════════════ */
function renderQuests() {
    const statusMap = {
        active:    { cls:'q-active',    badge:'badge-blue',  label:'Active'      },
        completed: { cls:'q-completed', badge:'badge-green', label:'Completed ✓' },
        locked:    { cls:'q-locked',    badge:'badge-red',   label:'🔒 Locked'   },
    };
    document.getElementById('questGrid').innerHTML = QUESTS.map(q => {
        const s      = statusMap[q.status];
        const isBoss = q.type === 'Boss Exam' || q.type === 'Boss Quest';
        const pct    = Math.round((q.done / q.tasks) * 100);
        const progressHtml = q.status !== 'locked' ? `
            <div class="quest-progress-wrap">
                <div class="quest-progress-meta"><span>Progress</span><span>${q.done}/${q.tasks} tasks</span></div>
                <div class="progress-bar"><div class="progress-fill ${q.status === 'completed' ? 'green' : ''}" style="width:${pct}%"></div></div>
            </div>` : '';
        return `
            <div class="quest-card ${s.cls} ${isBoss ? 'q-boss' : ''}" ${q.status !== 'locked' ? 'onclick="showToast(\'Quest opened!\',\'success\')"' : ''}>
                <div class="quest-card-top">
                    <div class="quest-emoji">${q.emoji}</div>
                    <div class="badge ${s.badge}">${s.label}</div>
                </div>
                <div class="quest-card-title">${q.title}</div>
                <div class="quest-card-desc">${q.desc}</div>
                ${progressHtml}
                <div class="quest-card-footer">
                    <span class="quest-type-label">${q.type}</span>
                    <span class="quest-xp">⚡ +${q.xp} XP</span>
                </div>
            </div>
        `;
    }).join('');
}

/* ══════════════════════════════════════
   RENDER: SKILL TREE
══════════════════════════════════════ */
function renderSkillTree() {
    const bgMap = { unlocked:'rgba(16,185,129,0.15)', active:'rgba(59,130,246,0.15)', locked:'rgba(255,255,255,0.04)' };
    document.getElementById('skillTreeWrap').innerHTML = SKILL_TREE.map(tier => `
        <div class="skill-tier">
            <div class="skill-tier-label">${tier.tier}</div>
            <div class="skill-row">
                ${tier.skills.map(s => `
                    <div class="skill-node skill-${s.status}" ${s.status !== 'locked' ? 'onclick="showToast(\'Skill selected!\',\'success\')"' : ''}>
                        ${s.status === 'unlocked' ? '<div class="skill-check">✓</div>' : ''}
                        <div class="skill-node-icon" style="background:${bgMap[s.status]}">${s.icon}</div>
                        <div>
                            <div class="skill-node-name">${s.name}</div>
                            <div class="skill-node-xp">${s.status === 'unlocked' ? '✓ ' : ''}${s.xp} XP</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

/* ══════════════════════════════════════
   RENDER: ASSESSMENTS
══════════════════════════════════════ */
function renderAssessments() {
    document.getElementById('assessmentTable').innerHTML = ASSESSMENTS_DATA.map(a => {
        const typeClass   = a.type === 'Boss Exam' ? 'badge-red'    :
                            a.type === 'Placement' ? 'badge-purple' : 'badge-blue';
        const statusClass = a.status === 'Passed'   ? 'badge-green' :
                            a.status === 'Upcoming' ? 'badge-amber' : 'badge-blue';
        const scoreColor  = !a.score ? 'var(--text-3)' : a.score >= 75 ? 'var(--green)' : a.score >= 50 ? 'var(--amber)' : 'var(--red)';
        const action      = a.status === 'Upcoming'
            ? '<button class="btn btn-primary btn-xs" onclick="showToast(\'Starting...\',\'success\')">Start</button>'
            : a.status === 'Passed'
            ? '<button class="btn btn-ghost btn-xs" onclick="openModal(\'aiHint\')">Review</button>'
            : '<span class="locked-label">🔒 Locked</span>';
        return `
            <tr>
                <td><div class="assessment-title">${a.title}</div></td>
                <td class="assessment-course">${a.course}</td>
                <td><div class="badge ${typeClass}">${a.type}</div></td>
                <td><span class="assessment-score" style="color:${scoreColor}">${a.score ? a.score + '%' : '—'}</span></td>
                <td><div class="badge ${statusClass}">${a.status}</div></td>
                <td>${action}</td>
            </tr>
        `;
    }).join('');
}

/* ══════════════════════════════════════
   RENDER: LEADERBOARD
══════════════════════════════════════ */
function renderLeaderboard() {
    const top3        = LEADERBOARD_DATA.slice(0, 3);
    const podiumOrder = [top3[1], top3[0], top3[2]];
    const podiumClass = ['p2', 'p1', 'p3'];
    const podiumRanks = ['2', '1', '3'];
    const crowns      = [null, '👑', null];

    document.getElementById('podium').innerHTML = podiumOrder.map((p, i) => `
        <div class="podium-slot ${podiumClass[i]}">
            <div class="podium-avatar" style="background:${p.color};color:${p.tcolor}">
                ${crowns[i] ? `<div class="podium-crown">${crowns[i]}</div>` : ''}
                ${p.initials}
            </div>
            <div class="podium-name">${p.name.split(' ')[0]}</div>
            <div class="podium-xp">${p.xp.toLocaleString()} XP</div>
            <div class="podium-block">${podiumRanks[i]}</div>
        </div>
    `).join('');

    document.getElementById('leaderboardTable').innerHTML = LEADERBOARD_DATA.map(p => {
        const rankIcon = p.rank <= 3
            ? ['🥇','🥈','🥉'][p.rank - 1]
            : `<span class="rank-num">#${p.rank}</span>`;
        return `
            <tr class="${p.isMe ? 'me-row' : ''}">
                <td><div class="rank-cell">${rankIcon}${p.isMe ? '<div class="badge badge-blue">You</div>' : ''}</div></td>
                <td><div class="user-cell"><div class="avatar" style="background:${p.color};color:${p.tcolor}">${p.initials}</div><div class="user-name">${p.name}</div></div></td>
                <td><span class="badge badge-amber">Lv. ${p.level}</span></td>
                <td><span class="lb-xp">${p.xp.toLocaleString()}</span></td>
                <td class="lb-quests">${p.quests}</td>
                <td><span class="lb-streak">🔥 ${p.streak}d</span></td>
            </tr>
        `;
    }).join('');
}

/* ══════════════════════════════════════
   RENDER: BADGES
══════════════════════════════════════ */
function renderBadges() {
    document.getElementById('badgeGrid').innerHTML = BADGES_DATA.map(b => `
        <div class="badge-card ${b.earned ? '' : 'badge-locked'}">
            <div class="badge-icon" style="background:${b.color}">${b.icon}</div>
            <div class="badge-name">${b.name}</div>
            <div class="badge-desc">${b.desc}</div>
            ${b.earned ? `<div class="badge-earned-date">✓ Earned ${b.date}</div>` : '<div class="badge-not-earned">Not earned yet</div>'}
        </div>
    `).join('');
}

/* ══════════════════════════════════════
   RENDER: AI HINTS
══════════════════════════════════════ */
function renderAiHints() {
    const hints = [
        'What does it mean for code to run "asynchronously"? Think about a restaurant — what happens while you wait for your food?',
        'In Node.js, what is the difference between a callback, a Promise, and async/await? They all solve the same problem — can you describe that problem?',
        'When an async function throws an error, where does that error go if you don\'t use try/catch? How would you catch it?',
    ];
    document.getElementById('aiHintSteps').innerHTML = hints.map((h, i) => `
        <div class="hint-step">
            <div class="hint-step-num">${i + 1}</div>
            <div class="hint-step-text">${h}</div>
        </div>
    `).join('');
}

/* ══════════════════════════════════════
   GLOBAL SEARCH
══════════════════════════════════════ */
document.getElementById('globalSearch').addEventListener('input', function () {
    const q = this.value.toLowerCase().trim();
    if (!q) return;
    if (STUDENT_COURSES.find(c => c.title.toLowerCase().includes(q))) { navigate('courses'); return; }
    if (QUESTS.find(quest => quest.title.toLowerCase().includes(q)))  { navigate('quests');  return; }
});

/* ══════════════════════════════════════
   WIRE PHOTO BUTTON
   (needs dynamic file input — can't use onclick in HTML)
══════════════════════════════════════ */
function wirePhotoButton() {
    const photoBtn = document.querySelector('#page-profile .btn-ghost.btn-sm');
    if (!photoBtn) return;
    photoBtn.onclick = () => {
        const input    = document.createElement('input');
        input.type     = 'file';
        input.accept   = 'image/jpeg,image/png';
        input.onchange = e => uploadAvatar(e.target.files[0]);
        input.click();
    };
}

function renderLessonView(lesson) {
  return `
    <div class="lesson-viewer">
      <h2>${escapeHtml(lesson.title)}</h2>
      
      <div class="lesson-tabs">
        ${lesson.video_url ? `<button class="tab-btn active" onclick="switchTab('video')">🎥 Watch</button>` : ''}
        ${lesson.summary_text ? `<button class="tab-btn" onclick="switchTab('summary')">📝 Read</button>` : ''}
        ${lesson.pdf_url ? `<button class="tab-btn" onclick="switchTab('pdf')">📄 Resources</button>` : ''}
      </div>

      <div class="tab-content" id="lessonContent">
        ${lesson.video_url ? `
            <video controls class="main-video">
                <source src="${lesson.video_url}" type="video/mp4">
            </video>
        ` : 'Please select a tab above'}
      </div>
    </div>
  `;
}

// دالة التنقل بين المحتويات دون إعادة تحميل الصفحة
function switchTab(type, lesson) {
    const container = document.getElementById('lessonContent');
    if (type === 'video') {
        container.innerHTML = `<video controls src="${lesson.video_url}"></video>`;
    } else if (type === 'summary') {
        container.innerHTML = `<div class="summary-body">${lesson.summary_text}</div>`;
    } else if (type === 'pdf') {
        container.innerHTML = `
            <div class="pdf-viewer">
                <p>Download or view the lesson resource:</p>
                <a href="${lesson.pdf_url}" target="_blank" class="btn">📕 Open PDF</a>
                <iframe src="${lesson.pdf_url}" width="100%" height="500px"></iframe>
            </div>`;
    }
}

/* ══════════════════════════════════════
   INIT
══════════════════════════════════════ */
async function init() {
    await loadUserData();
    renderDashCourses();
    renderDailyGoals();
    renderActivity();
    renderUpcoming();
    renderNotifications();
    renderPath();
    renderStudentCourses(STUDENT_COURSES);
    renderQuests();
    renderSkillTree();
    renderAssessments();
    renderLeaderboard();
    renderBadges();
    renderAiHints();
    wirePhotoButton();
}

init();