/* teacher-settings.js */
function initSettingsToggles() {
  document.querySelectorAll('.toggle').forEach(toggle => {
    toggle.addEventListener('click', () => toggle.classList.toggle('on'));
  });
  // compact sidebar toggle – link to actual sidebar
  const compactToggle = document.querySelector('.settings-section .toggle');
  if (compactToggle) {
    compactToggle.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('collapsed');
      document.getElementById('main').classList.toggle('expanded');
    });
  }
}

function initSettings() {
  initSettingsToggles();
  renderNotifications();
}
initSettings();