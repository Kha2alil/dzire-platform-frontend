/* ═══════════════════════════════════════════
   DATA STORE
═══════════════════════════════════════════ */
let USERS = [
  {id:1, name:'Ahmed Mansouri',    username:'ahmed_m',   email:'ahmed@dzire.dz',    role:'student', status:'active',  joined:'Jan 15, 2025'},
  {id:2, name:'Sara Benali',       username:'sara_b',    email:'sara@dzire.dz',     role:'student', status:'active',  joined:'Jan 22, 2025'},
  {id:3, name:'Khalil Khalfi',     username:'khalil_k',  email:'khalil@dzire.dz',   role:'teacher', status:'active',  joined:'Dec 10, 2024'},
  {id:4, name:'Yacine Merad',      username:'yacine_m',  email:'yacine@dzire.dz',   role:'student', status:'active',  joined:'Feb 3, 2025'},
  {id:5, name:'Lina Khelifi',      username:'lina_k',    email:'lina@dzire.dz',     role:'student', status:'banned',  joined:'Feb 8, 2025'},
  {id:6, name:'Rami Tahir',        username:'rami_t',    email:'rami@dzire.dz',     role:'student', status:'active',  joined:'Feb 14, 2025'},
  {id:7, name:'Nour Aissaoui',     username:'nour_a',    email:'nour@dzire.dz',     role:'student', status:'active',  joined:'Feb 19, 2025'},
  {id:8, name:'Karim Bouzid',      username:'karim_b',   email:'karim@dzire.dz',    role:'student', status:'active',  joined:'Feb 25, 2025'},
  {id:9, name:'Amira Saad',        username:'amira_s',   email:'amira@dzire.dz',    role:'student', status:'active',  joined:'Mar 1, 2025'},
  {id:10,name:'Tarek Boumediene',  username:'tarek_bm',  email:'tarek@dzire.dz',    role:'teacher', status:'active',  joined:'Nov 5, 2024'},
  {id:11,name:'Wissem Hamdi',      username:'wissem_h',  email:'wissem@dzire.dz',   role:'student', status:'banned',  joined:'Mar 10, 2025'},
  {id:12,name:'Samira Ferhat',     username:'samira_f',  email:'samira@dzire.dz',   role:'teacher', status:'active',  joined:'Oct 20, 2024'},
];

let COURSES = [
  {id:1, title:'Full-Stack Web Development',    instructor:'Khalil Khalfi',    level:'Intermediate', category:'Web Dev',    students:142, status:'Published'},
  {id:2, title:'JavaScript Advanced Concepts',  instructor:'Khalil Khalfi',    level:'Advanced',     category:'Web Dev',    students:98,  status:'Published'},
  {id:3, title:'Node.js & PostgreSQL Mastery',  instructor:'Tarek Boumediene', level:'Intermediate', category:'Backend',    students:76,  status:'Published'},
  {id:4, title:'CSS & Tailwind Deep Dive',       instructor:'Samira Ferhat',    level:'Beginner',     category:'Frontend',   students:115, status:'Published'},
  {id:5, title:'React from Zero to Hero',        instructor:'Khalil Khalfi',    level:'Intermediate', category:'Frontend',   students:88,  status:'Draft'},
  {id:6, title:'Python for Data Science',        instructor:'Tarek Boumediene', level:'Beginner',     category:'Data Science',students:64, status:'Published'},
  {id:7, title:'DevOps & Docker Fundamentals',   instructor:'Samira Ferhat',    level:'Advanced',     category:'DevOps',     students:42,  status:'Published'},
  {id:8, title:'UI/UX Design Principles',        instructor:'Khalil Khalfi',    level:'Beginner',     category:'Design',     students:55,  status:'Draft'},
];

const ACTIVITY_LOG = [
  {dot:'var(--green)',        text:'<strong>Ahmed Mansouri</strong> enrolled in Full-Stack Web Development', time:'2 min ago'},
  {dot:'var(--blue-400)',     text:'<strong>Khalil Khalfi</strong> added a new lesson to Node.js Mastery',  time:'14 min ago'},
  {dot:'var(--amber)',        text:'<strong>Nour Aissaoui</strong> completed JavaScript Advanced Concepts',  time:'31 min ago'},
  {dot:'var(--admin-accent)', text:'<strong>Samira Ferhat</strong> published CSS & Tailwind Deep Dive',     time:'1 hr ago'},
  {dot:'var(--red)',          text:'<strong>Lina Khelifi</strong> was banned for policy violation',          time:'2 hr ago'},
  {dot:'var(--green)',        text:'<strong>Rami Tahir</strong> earned the Quiz Champion badge 🏆',          time:'3 hr ago'},
  {dot:'var(--cyan)',         text:'<strong>Tarek Boumediene</strong> added Python for Data Science course', time:'5 hr ago'},
  {dot:'var(--purple)',       text:'New user <strong>Amira Saad</strong> registered and verified email',     time:'Yesterday'},
];

let nextUserId   = 13;
let nextCourseId = 9;
let activeUserTab = 'all';
let confirmCallback = null;

/* ═══════════════════════════════════════════
   UTILS
═══════════════════════════════════════════ */
function getInitials(name){
  return name.trim().split(' ').filter(Boolean).map(w=>w[0]).join('').toUpperCase().slice(0,2);
}
function getAvatarColor(name){
  const colors=[
    ['rgba(59,130,246,0.25)','var(--blue-400)'],
    ['rgba(124,58,237,0.25)','var(--admin-accent)'],
    ['rgba(16,185,129,0.25)','var(--green)'],
    ['rgba(245,158,11,0.25)','var(--amber)'],
    ['rgba(239,68,68,0.25)','var(--red)'],
    ['rgba(34,211,238,0.25)','var(--cyan)'],
    ['rgba(167,139,250,0.25)','var(--purple)'],
  ];
  const i=name.charCodeAt(0)%colors.length;
  return colors[i];
}

/* ═══════════════════════════════════════════
   TOAST
═══════════════════════════════════════════ */
function showToast(msg,type='success'){
  const c=document.getElementById('toastContainer');
  const t=document.createElement('div');
  const icons={success:'✅',error:'❌',info:'🔔'};
  t.className=`toast ${type}`;
  t.innerHTML=`<span class="toast-icon">${icons[type]||'ℹ️'}</span><span class="toast-msg">${msg}</span>`;
  c.appendChild(t);
  setTimeout(()=>{t.style.opacity='0';t.style.transition='opacity 0.3s';setTimeout(()=>t.remove(),300);},3200);
}

/* ═══════════════════════════════════════════
   CONFIRM DIALOG
═══════════════════════════════════════════ */
function openConfirm(title,msg,icon,cb){
  document.getElementById('confirmTitle').textContent=title;
  document.getElementById('confirmMsg').textContent=msg;
  document.getElementById('confirmIcon').textContent=icon||'⚠️';
  confirmCallback=cb;
  document.getElementById('confirmOverlay').classList.add('open');
}
function closeConfirm(){
  document.getElementById('confirmOverlay').classList.remove('open');
  confirmCallback=null;
}
document.getElementById('confirmBtn').onclick=function(){
  if(confirmCallback) confirmCallback();
  closeConfirm();
};

/* ═══════════════════════════════════════════
   MODALS
═══════════════════════════════════════════ */
function openModal(id){document.getElementById('modal-'+id).classList.add('open')}
function closeModal(id){document.getElementById('modal-'+id).classList.remove('open')}
document.querySelectorAll('.modal-overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('open')}));

/* ═══════════════════════════════════════════
   NAVIGATION
═══════════════════════════════════════════ */
const PAGE_TITLES={dashboard:'Dashboard',users:'User Management',courses:'Course Management',settings:'Platform Settings'};
const TOPBAR_ACTIONS={
  dashboard:{label:'＋ Add User',fn:'openAddUserModal()'},
  users:    {label:'＋ Add User',fn:'openAddUserModal()'},
  courses:  {label:'＋ Add Course',fn:'openAddCourseModal()'},
  settings: {label:'💾 Save Settings',fn:'saveSettings()'},
};

function navigate(page){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const pg=document.getElementById('page-'+page);
  if(pg) pg.classList.add('active');
  document.querySelectorAll(`.nav-item[data-page="${page}"]`).forEach(n=>n.classList.add('active'));
  document.getElementById('pageTitle').textContent=PAGE_TITLES[page]||page;
  const act=TOPBAR_ACTIONS[page];
  if(act){
    document.getElementById('topbarActionBtn').textContent=act.label;
    document.getElementById('topbarActionBtn').setAttribute('onclick',act.fn);
  }
  closeSidebar();
}

document.querySelectorAll('.nav-item[data-page]').forEach(item=>{
  item.addEventListener('click',()=>navigate(item.dataset.page));
});

/* ═══════════════════════════════════════════
   SIDEBAR TOGGLE
═══════════════════════════════════════════ */
const sidebarEl=document.getElementById('sidebar');
const mainEl=document.getElementById('main');
const toggleBtn=document.getElementById('sidebarToggle');
let collapsed=false;

toggleBtn.addEventListener('click',()=>{
  collapsed=!collapsed;
  sidebarEl.classList.toggle('collapsed',collapsed);
  mainEl.classList.toggle('expanded',collapsed);
  toggleBtn.textContent=collapsed?'▶':'◀';
});

function openSidebar(){
  sidebarEl.classList.add('mobile-open');
  document.getElementById('sidebarOverlay').classList.add('visible');
}
function closeSidebar(){
  sidebarEl.classList.remove('mobile-open');
  document.getElementById('sidebarOverlay').classList.remove('visible');
}

/* ═══════════════════════════════════════════
   STATS
═══════════════════════════════════════════ */
function updateStats(){
  const students=USERS.filter(u=>u.role==='student').length;
  const teachers=USERS.filter(u=>u.role==='teacher').length;
  const active=USERS.filter(u=>u.status==='active').length;
  const banned=USERS.filter(u=>u.status==='banned').length;

  document.getElementById('statStudents').textContent=students;
  document.getElementById('statTeachers').textContent=teachers;
  document.getElementById('statCourses').textContent=COURSES.length;
  document.getElementById('statActive').textContent=active;
  document.getElementById('heroActiveCount').textContent=active;
  document.getElementById('statStudentTrend').textContent=`${students} total`;
  document.getElementById('statTeacherTrend').textContent=`${teachers} total`;
  document.getElementById('statCourseTrend').textContent=`${COURSES.filter(c=>c.status==='Published').length} live`;
  document.getElementById('statActiveTrend').textContent=`${banned} banned`;
  document.getElementById('navUserCount').textContent=USERS.length;
  document.getElementById('navCourseCount').textContent=COURSES.length;

  // Legend
  document.getElementById('legendStudents').textContent=students;
  document.getElementById('legendTeachers').textContent=teachers;
  document.getElementById('legendBanned').textContent=banned;
  document.getElementById('donutTotal').textContent=USERS.length;

  // Donut
  const total=USERS.length;
  const sPct=Math.round((students/total)*100);
  const tPct=Math.round((teachers/total)*100);
  const bPct=100-sPct-tPct;
  document.getElementById('donutChart').style.background=
    `conic-gradient(var(--blue-500) 0% ${sPct}%, var(--admin-accent) ${sPct}% ${sPct+tPct}%, var(--red) ${sPct+tPct}% 100%)`;

  // Settings stats
  document.getElementById('settingsUserCount').textContent=USERS.length;
  document.getElementById('settingsCourseCount').textContent=COURSES.length;
}

/* ═══════════════════════════════════════════
   CHARTS
═══════════════════════════════════════════ */
function renderRegChart(){
  const vals=[24,38,31,52,45,61];
  const max=Math.max(...vals);
  const el=document.getElementById('regChart');
  el.innerHTML=vals.map((v,i)=>`
    <div class="bar-col">
      <div class="bar" style="height:${Math.max(6,(v/max)*100)}%">
        <div class="bar-tip">${v}</div>
      </div>
    </div>`).join('');
}

/* ═══════════════════════════════════════════
   ACTIVITY
═══════════════════════════════════════════ */
function renderActivity(){
  document.getElementById('dashActivity').innerHTML=ACTIVITY_LOG.map(a=>`
    <div class="activity-item">
      <div class="act-dot" style="background:${a.dot}"></div>
      <div class="act-body">
        <div class="act-text">${a.text}</div>
        <div class="act-time">${a.time}</div>
      </div>
    </div>`).join('');
}

/* ═══════════════════════════════════════════
   DASHBOARD MINI TABLES
═══════════════════════════════════════════ */
function renderDashTables(){
  // Recent 5 users
  const recentUsers=[...USERS].slice(-5).reverse();
  document.getElementById('dashUsersTable').innerHTML=recentUsers.map(u=>{
    const [bg,col]=getAvatarColor(u.name);
    return `<tr onclick="navigate('users')">
      <td><div class="user-cell">
        <div class="user-avatar" style="background:${bg};color:${col}">${getInitials(u.name)}</div>
        <div><div class="user-name">${u.name}</div><div class="user-email">${u.email}</div></div>
      </div></td>
      <td>${roleBadge(u.role)}</td>
      <td>${statusBadge(u.status)}</td>
    </tr>`;
  }).join('');

  // Recent 4 courses
  const recentCourses=[...COURSES].slice(-4).reverse();
  document.getElementById('dashCoursesTable').innerHTML=recentCourses.map(c=>`
    <tr onclick="navigate('courses')">
      <td><div style="font-weight:500;font-size:13px">${c.title}</div></td>
      <td style="color:var(--text-2);font-size:12px">${c.instructor}</td>
      <td><span style="font-family:'Syne',sans-serif;font-weight:700;color:var(--admin-accent)">${c.students}</span></td>
    </tr>`).join('');
}

/* ═══════════════════════════════════════════
   BADGE HELPERS
═══════════════════════════════════════════ */
function roleBadge(role){
  if(role==='teacher') return `<div class="badge badge-admin">🎓 Teacher</div>`;
  return `<div class="badge badge-blue">👤 Student</div>`;
}
function statusBadge(status){
  if(status==='banned') return `<div class="badge badge-red">🚫 Banned</div>`;
  return `<div class="badge badge-green">✓ Active</div>`;
}
function levelBadge(level){
  if(level==='Beginner') return `<div class="badge badge-green">${level}</div>`;
  if(level==='Advanced') return `<div class="badge badge-red">${level}</div>`;
  return `<div class="badge badge-blue">${level}</div>`;
}
function courseSatusB(s){
  if(s==='Draft') return `<div class="badge badge-neutral">${s}</div>`;
  return `<div class="badge badge-green">${s}</div>`;
}

/* ═══════════════════════════════════════════
   USERS TABLE
═══════════════════════════════════════════ */
function getFilteredUsers(){
  const search=(document.getElementById('userSearch')?.value||'').toLowerCase();
  const roleF=document.getElementById('userRoleFilter')?.value||'';
  const statusF=document.getElementById('userStatusFilter')?.value||'';
  return USERS.filter(u=>{
    const matchSearch=!search||(u.name.toLowerCase().includes(search)||u.email.toLowerCase().includes(search));
    const matchRole=!roleF||u.role===roleF;
    const matchStatus=!statusF||u.status===statusF;
    const matchTab=activeUserTab==='all'||u.role===activeUserTab;
    return matchSearch&&matchRole&&matchStatus&&matchTab;
  });
}

function renderUsersTable(){
  const users=getFilteredUsers();
  const tbody=document.getElementById('usersTable');
  if(!users.length){
    tbody.innerHTML=`<td><td colspan="5"><div class="empty-state"><div class="empty-icon">👥</div><div class="empty-title">No users found</div><div class="empty-sub">Try adjusting your search filters</div></div></td></tr>`;
    return;
  }
  tbody.innerHTML=users.map(u=>{
    const [bg,col]=getAvatarColor(u.name);
    const banLabel=u.status==='banned'?'✅ Unban':'🚫 Ban';
    return `<tr>
      <td><div class="user-cell">
        <div class="user-avatar" style="background:${bg};color:${col}">${getInitials(u.name)}</div>
        <div><div class="user-name">${u.name}</div><div class="user-email">${u.email}</div></div>
      </div></td>
      <td>${roleBadge(u.role)}</td>
      <td>${statusBadge(u.status)}</td>
      <td style="color:var(--text-3);font-size:12px">${u.joined}</td>
      <td>
        <div style="display:flex;gap:6px;align-items:center">
          <button class="btn btn-ghost btn-xs" onclick="editUser(${u.id})">✎ Edit</button>
          <button class="btn btn-xs ${u.status==='banned'?'btn-ghost':'btn-danger'}" onclick="toggleBan(${u.id})">${banLabel}</button>
          <button class="btn btn-danger btn-xs" onclick="deleteUser(${u.id})">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function filterUsers(){renderUsersTable()}

function switchUserTab(el){
  document.querySelectorAll('#page-users .tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  activeUserTab=el.dataset.tab;
  const rf=document.getElementById('userRoleFilter');
  if(activeUserTab==='all') rf.value='';
  else rf.value=activeUserTab;
  renderUsersTable();
}

/* ═══════════════════════════════════════════
   USER CRUD
═══════════════════════════════════════════ */
function openAddUserModal(){
  document.getElementById('editUserId').value='';
  document.getElementById('uFullName').value='';
  document.getElementById('uUsername').value='';
  document.getElementById('uEmail').value='';
  document.getElementById('uRole').value='student';
  document.getElementById('uStatus').value='active';
  document.getElementById('userModalTitle').textContent='Add New User';
  document.getElementById('userModalSubmitBtn').textContent='Add User';
  openModal('user');
}

function editUser(id){
  const u=USERS.find(x=>x.id===id);
  if(!u) return;
  document.getElementById('editUserId').value=id;
  document.getElementById('uFullName').value=u.name;
  document.getElementById('uUsername').value=u.username||'';
  document.getElementById('uEmail').value=u.email;
  document.getElementById('uRole').value=u.role;
  document.getElementById('uStatus').value=u.status;
  document.getElementById('userModalTitle').textContent='Edit User';
  document.getElementById('userModalSubmitBtn').textContent='Save Changes';
  openModal('user');
}

function submitUserModal(){
  const name=document.getElementById('uFullName').value.trim();
  const email=document.getElementById('uEmail').value.trim();
  const username=document.getElementById('uUsername').value.trim();
  const role=document.getElementById('uRole').value;
  const status=document.getElementById('uStatus').value;
  const editId=document.getElementById('editUserId').value;

  if(!name||!email){showToast('Name and email are required','error');return;}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){showToast('Please enter a valid email','error');return;}

  if(editId){
    const u=USERS.find(x=>x.id===+editId);
    if(u){u.name=name;u.username=username;u.email=email;u.role=role;u.status=status;}
    showToast('User updated successfully ✅','success');
  } else {
    const existing=USERS.find(u=>u.email===email);
    if(existing){showToast('Email already exists','error');return;}
    USERS.push({id:nextUserId++,name,username,email,role,status,joined:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})});
    showToast('User added successfully 🎉','success');
  }
  closeModal('user');
  updateStats();
  renderUsersTable();
  renderDashTables();
}

function toggleBan(id){
  const u=USERS.find(x=>x.id===id);
  if(!u) return;
  const action=u.status==='banned'?'unban':'ban';
  openConfirm(
    `${action==='ban'?'Ban':'Unban'} User`,
    `Are you sure you want to ${action} ${u.name}? ${action==='ban'?'They will lose platform access.':'They will regain platform access.'}`,
    action==='ban'?'🚫':'✅',
    ()=>{
      u.status=u.status==='banned'?'active':'banned';
      showToast(`${u.name} has been ${u.status==='banned'?'banned':'unbanned'}`,'info');
      updateStats();renderUsersTable();renderDashTables();
    }
  );
}

function deleteUser(id){
  const u=USERS.find(x=>x.id===id);
  if(!u) return;
  openConfirm('Delete User',`Permanently delete ${u.name}? This cannot be undone.`,'🗑️',()=>{
    USERS=USERS.filter(x=>x.id!==id);
    showToast(`${u.name} has been deleted`,'error');
    updateStats();renderUsersTable();renderDashTables();
  });
}

/* ═══════════════════════════════════════════
   COURSES TABLE
═══════════════════════════════════════════ */
function getFilteredCourses(){
  const search=(document.getElementById('courseSearch')?.value||'').toLowerCase();
  const levelF=document.getElementById('courseLevelFilter')?.value||'';
  return COURSES.filter(c=>{
    const ms=!search||(c.title.toLowerCase().includes(search)||c.instructor.toLowerCase().includes(search));
    const ml=!levelF||c.level===levelF;
    return ms&&ml;
  });
}

function renderCoursesTable(){
  const courses=getFilteredCourses();
  const tbody=document.getElementById('coursesTable');
  if(!courses.length){
    tbody.innerHTML=`<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">📚</div><div class="empty-title">No courses found</div><div class="empty-sub">Try adjusting your search</div></div></td></tr>`;
    return;
  }
  const emojis={'Web Dev':'🌐','Frontend':'🎨','Backend':'⚙️','Data Science':'📊','DevOps':'☁️','Design':'🖌️'};
  tbody.innerHTML=courses.map(c=>{
    const ico=emojis[c.category]||'📚';
    return `<tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="font-size:20px;width:32px;text-align:center">${ico}</div>
          <div>
            <div style="font-weight:500;font-size:13px">${c.title}</div>
            <div style="font-size:11px;color:var(--text-3)">${c.category}</div>
          </div>
        </div>
      </td>
      <td style="color:var(--text-2);font-size:12px">${c.instructor}</td>
      <td>${levelBadge(c.level)}</td>
      <td><span style="font-family:'Syne',sans-serif;font-weight:700;color:var(--admin-accent)">${c.students}</span></td>
      <td>${courseSatusB(c.status)}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-xs" onclick="editCourse(${c.id})">✎ Edit</button>
          <button class="btn btn-danger btn-xs" onclick="deleteCourse(${c.id})">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function filterCourses(){renderCoursesTable()}

/* ═══════════════════════════════════════════
   COURSE CRUD
═══════════════════════════════════════════ */
function openAddCourseModal(){
  document.getElementById('editCourseId').value='';
  document.getElementById('cTitle').value='';
  document.getElementById('cInstructor').value='';
  document.getElementById('cLevel').value='Beginner';
  document.getElementById('cCategory').value='';
  document.getElementById('cStudents').value='0';
  document.getElementById('cStatus').value='Draft';
  document.getElementById('courseModalTitle').textContent='Add New Course';
  document.getElementById('courseModalSubmitBtn').textContent='Add Course';
  openModal('course');
}

function editCourse(id){
  const c=COURSES.find(x=>x.id===id);
  if(!c) return;
  document.getElementById('editCourseId').value=id;
  document.getElementById('cTitle').value=c.title;
  document.getElementById('cInstructor').value=c.instructor;
  document.getElementById('cLevel').value=c.level;
  document.getElementById('cCategory').value=c.category;
  document.getElementById('cStudents').value=c.students;
  document.getElementById('cStatus').value=c.status;
  document.getElementById('courseModalTitle').textContent='Edit Course';
  document.getElementById('courseModalSubmitBtn').textContent='Save Changes';
  openModal('course');
}

function submitCourseModal(){
  const title=document.getElementById('cTitle').value.trim();
  const instructor=document.getElementById('cInstructor').value.trim();
  const level=document.getElementById('cLevel').value;
  const category=document.getElementById('cCategory').value.trim()||'General';
  const students=parseInt(document.getElementById('cStudents').value)||0;
  const status=document.getElementById('cStatus').value;
  const editId=document.getElementById('editCourseId').value;

  if(!title||!instructor){showToast('Title and instructor are required','error');return;}

  if(editId){
    const c=COURSES.find(x=>x.id===+editId);
    if(c){c.title=title;c.instructor=instructor;c.level=level;c.category=category;c.students=students;c.status=status;}
    showToast('Course updated successfully ✅','success');
  } else {
    COURSES.push({id:nextCourseId++,title,instructor,level,category,students,status});
    showToast('Course added successfully 🎉','success');
  }
  closeModal('course');
  updateStats();renderCoursesTable();renderDashTables();
}

function deleteCourse(id){
  const c=COURSES.find(x=>x.id===id);
  if(!c) return;
  openConfirm('Delete Course',`Permanently delete "${c.title}"? All enrolled students will lose access.`,'🗑️',()=>{
    COURSES=COURSES.filter(x=>x.id!==id);
    showToast(`"${c.title}" has been deleted`,'error');
    updateStats();renderCoursesTable();renderDashTables();
  });
}

/* ═══════════════════════════════════════════
   SETTINGS
═══════════════════════════════════════════ */
function saveSettings(){
  const name=document.getElementById('siteName').value.trim();
  const email=document.getElementById('contactEmail').value.trim();
  if(!name){showToast('Platform name cannot be empty','error');return;}
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){showToast('Invalid contact email','error');return;}
  showToast('Settings saved successfully 💾','success');
}

/* ═══════════════════════════════════════════
   GLOBAL SEARCH
═══════════════════════════════════════════ */
function handleGlobalSearch(val){
  const q=val.toLowerCase().trim();
  if(!q) return;
  const userMatch=USERS.find(u=>u.name.toLowerCase().includes(q)||u.email.toLowerCase().includes(q));
  if(userMatch){navigate('users');document.getElementById('userSearch').value=val;filterUsers();return;}
  const courseMatch=COURSES.find(c=>c.title.toLowerCase().includes(q));
  if(courseMatch){navigate('courses');document.getElementById('courseSearch').value=val;filterCourses();}
}

/* ═══════════════════════════════════════════
   NOTIFICATION BELL (placeholder)
═══════════════════════════════════════════ */
document.getElementById('notifBtn').addEventListener('click',()=>{
  showToast('3 new notifications 🔔','info');
});

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
function init(){
  updateStats();
  renderActivity();
  renderRegChart();
  renderDashTables();
  renderUsersTable();
  renderCoursesTable();
}

init();