// ==================== student-quests.js ====================
// Renders the Quests page with filtering tabs

// QUESTS data – copied exactly from original student-app.js
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

// Render function – identical to original renderQuests()
function renderQuests(filterStatus = 'all') {
    const container = document.getElementById('questGrid');
    if (!container) return;

    const statusMap = {
        active:    { cls:'q-active',    badge:'badge-blue',  label:'Active'      },
        completed: { cls:'q-completed', badge:'badge-green', label:'Completed ✓' },
        locked:    { cls:'q-locked',    badge:'badge-red',   label:'🔒 Locked'   },
    };

    let filteredQuests = QUESTS;
    if (filterStatus !== 'all') {
        filteredQuests = QUESTS.filter(q => q.status === filterStatus);
    }

    if (filteredQuests.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">⚔️</div><div class="empty-title">No quests found in this category</div></div>';
        return;
    }

    container.innerHTML = filteredQuests.map(q => {
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

// Tab switching
function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active tab UI
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            // Get filter value
            const filter = tab.dataset.tab || 'all';
            renderQuests(filter);
        });
    });
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    renderQuests('all');
    initTabs();
});