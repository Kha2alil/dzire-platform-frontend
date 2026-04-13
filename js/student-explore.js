// ==================== student-explore.js ====================
// Initialises the Explore Catalog page
// Uses the existing ExploreModule from explore.js

document.addEventListener('DOMContentLoaded', () => {
    // Check if ExploreModule exists (from explore.js)
    if (typeof ExploreModule !== 'undefined' && ExploreModule.init) {
        ExploreModule.init();
    } else {
        console.error('ExploreModule not loaded. Make sure explore.js is included.');
        // Fallback: show a message
        const grid = document.getElementById('exploreCourseGrid');
        if (grid) {
            grid.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Explore module failed to load. Please refresh.</div></div>';
        }
    }
});