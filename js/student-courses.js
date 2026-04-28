// ==================== student-courses.js ====================
// Boot script for the My Courses page – uses MyCoursesModule from courses.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialise the module that renders enrolled courses
    if (typeof MyCoursesModule !== 'undefined' && MyCoursesModule.init) {
        MyCoursesModule.init();
    } else {
        console.error('MyCoursesModule not loaded. Make sure courses.js is included before this script.');
        const grid = document.getElementById('studentCourseGrid');
        if (grid) {
            grid.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Courses module failed to load. Please refresh.</div></div>';
        }
    }

    // 2. Wire up search & filter (they call MyCoursesModule.filterCourses if available)
    const searchInput = document.getElementById('courseSearch');
    const statusFilter = document.getElementById('courseStatusFilter');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            if (typeof MyCoursesModule !== 'undefined' && MyCoursesModule.filterCourses) {
                MyCoursesModule.filterCourses();
            }
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            if (typeof MyCoursesModule !== 'undefined' && MyCoursesModule.filterCourses) {
                MyCoursesModule.filterCourses();
            }
        });
    }

    // 3. Browse Catalog button
    const browseBtn = document.getElementById('browseCatalogBtn');
    if (browseBtn) {
        browseBtn.addEventListener('click', () => {
            window.location.href = 'student-explore.html';
        });
    }
});