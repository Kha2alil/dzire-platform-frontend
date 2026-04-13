// ==================== student-my-path.js ====================
// Renders the My Learning Path page
// PATH_DATA – copied exactly from original student-app.js
const PATH_DATA = [
    { title:'HTML & CSS Fundamentals',             desc:'Master the building blocks of the web.',                                      done:true,   lessons:['HTML structure','CSS selectors','Flexbox','Grid layout','Responsive design']    },
    { title:'JavaScript Core',                     desc:'Dive deep into JavaScript closures, async/await, and modern ES6+ syntax.',    done:true,   lessons:['Variables & types','Functions','Closures','Async/Await','DOM API']              },
    { title:'Node.js & Express Backend',           desc:'Build REST APIs, middleware, authentication and database connections.',        active:true, lessons:['Node.js basics','Express routing','Middleware','JWT Auth','Error handling']    },
    { title:'PostgreSQL & Databases',              desc:'Design and query relational databases. SQL, joins, indexing, Node.js.',        locked:true, lessons:['SQL basics','JOINs','Indexes','Node-postgres','Schema design']               },
    { title:'React Frontend Framework',            desc:'Build modern UIs with hooks, state management and API integration.',           locked:true, lessons:['JSX basics','useState','useEffect','Context API','Fetch & Axios']            },
    { title:'Full-Stack Integration & Deployment', desc:'Combine everything. Build and deploy a complete full-stack application.',      locked:true, lessons:['Project structure','Docker basics','CI/CD','Cloud deploy','Boss Exam']       },
];

// Render function – identical to original
function renderPath() {
    const container = document.getElementById('pathTrack');
    if (!container) return;

    container.innerHTML = PATH_DATA.map((node, i) => {
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

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    renderPath();

    // Change Track button – show toast (as in original)
    const changeBtn = document.getElementById('changeTrackBtn');
    if (changeBtn) {
        changeBtn.addEventListener('click', () => {
            showToast('Track change feature coming soon!', 'success');
        });
    }
});