// ==================== student-settings.js ====================
// Initialises all settings toggles

function initSettingsToggles() {
    const toggles = document.querySelectorAll('.toggle');
    toggles.forEach(toggle => {
        // Remove any existing inline onclick to avoid conflicts
        toggle.removeAttribute('onclick');
        // Add click event listener
        toggle.addEventListener('click', function(e) {
            e.stopPropagation();
            // Toggle the 'on' class
            this.classList.toggle('on');

            const setting = this.dataset.setting;
            // Special handling for Compact Sidebar toggle
            if (setting === 'compact_sidebar') {
                const sidebar = document.getElementById('sidebar');
                const main = document.getElementById('main');
                if (sidebar && main) {
                    const isCollapsed = this.classList.contains('on');
                    if (isCollapsed) {
                        sidebar.classList.add('collapsed');
                        main.classList.add('expanded');
                        const toggleBtn = document.getElementById('sidebarToggle');
                        if (toggleBtn) toggleBtn.textContent = '▶';
                    } else {
                        sidebar.classList.remove('collapsed');
                        main.classList.remove('expanded');
                        const toggleBtn = document.getElementById('sidebarToggle');
                        if (toggleBtn) toggleBtn.textContent = '◀';
                    }
                }
            }

            // Optional: save setting to localStorage or API
            // For now just show a toast (optional)
            const state = this.classList.contains('on') ? 'enabled' : 'disabled';
            console.log(`Setting ${setting} changed to ${state}`);
            // Uncomment if you want a toast for every toggle:
            // showToast(`${setting.replace(/_/g, ' ')} ${state}`, 'success');
        });
    });
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initSettingsToggles();
});