// ==================== student-courses.js ====================
// Initialises the My Courses page using MyCoursesModule from courses.js

document.addEventListener('DOMContentLoaded', () => {
    // Check if MyCoursesModule exists (from courses.js)
    if (typeof MyCoursesModule !== 'undefined' && MyCoursesModule.init) {
        MyCoursesModule.init();
    } else {
        console.error('MyCoursesModule not loaded. Make sure courses.js is included.');
        const grid = document.getElementById('studentCourseGrid');
        if (grid) {
            grid.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Courses module failed to load. Please refresh.</div></div>';
        }
    }

    // Setup filter and search listeners (using existing MyCoursesModule methods)
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

    // Browse Catalog button redirects to Explore page
    const browseBtn = document.getElementById('browseCatalogBtn');
    if (browseBtn) {
        browseBtn.addEventListener('click', () => {
            window.location.href = 'student-explore.html';
        });
    }
});