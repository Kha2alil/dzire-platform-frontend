/* teacher-profile.js */
async function loadProfile() {
  try {
    const userData = await apiCall('GET', '/auth/me');
    if (!userData?.success) { showToast('Failed to load user data', 'error'); return; }
    const user = userData.user;
    const profileData = await apiCall('GET', '/profile/me');
    if (!profileData?.success) { showToast('Failed to load profile data', 'error'); return; }
    const profile = profileData.profile;

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

    if (avatarDiv) {
      if (profile.avatar_url) {
        avatarDiv.innerHTML = '';
        const img = document.createElement('img');
        img.src = `http://localhost:3000/${profile.avatar_url}`;
        img.style.cssText = 'width:72px;height:72px;border-radius:50%;object-fit:cover';
        avatarDiv.appendChild(img);
      } else {
        avatarDiv.textContent = getInitials(user.full_name);
        avatarDiv.style.cssText = 'width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,var(--blue-800),var(--blue-500));display:flex;align-items:center;justify-content:center;font-family:Syne,sans-serif;font-weight:800;font-size:24px;border:3px solid var(--border-md)';
      }
    }
  } catch (err) { showToast('Network error', 'error'); }
}

async function updateProfile() {
  const saveBtn = document.querySelector('#page-profile .btn-primary');
  if (!saveBtn) return;
  const originalText = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.textContent = '💾 Saving...';

  const fullName = document.getElementById('profileFullName')?.value.trim();
  const bio = document.getElementById('profileBio')?.value.trim();
  const specialization = document.getElementById('profileSpecialization')?.value.trim();
  const experienceYears = parseInt(document.getElementById('profileExperienceYears')?.value, 10);

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

  const response = await apiCall('PATCH', '/profile/me', payload);
  if (response?.success) {
    const sidebarName = document.querySelector('.sidebar-profile .profile-name');
    if (sidebarName && fullName) sidebarName.textContent = fullName;
    showToast('Profile updated! ✅', 'success');
  } else showToast(response?.message || 'Failed', 'error');
  saveBtn.disabled = false;
  saveBtn.textContent = originalText;
}

async function uploadAvatar() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/jpeg,image/png';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2*1024*1024) { showToast('Image must be <2MB', 'error'); return; }
    const formData = new FormData();
    formData.append('avatar', file);
    showToast('Uploading...', 'info');
    const response = await apiUpload('/profile/avatar', formData);
    if (response?.success) {
      showToast('Avatar updated! 📷', 'success');
      await loadProfile();
    } else showToast(response?.message || 'Upload failed', 'error');
  };
  input.click();
}

async function changePassword() {
  const inputs = document.querySelectorAll('#page-profile input[type="password"]');
  const current = inputs[0]?.value?.trim();
  const newPass = inputs[1]?.value?.trim();
  const confirm = inputs[2]?.value?.trim();
  if (!current || !newPass || !confirm) { showToast('Fill all fields', 'error'); return; }
  if (newPass !== confirm) { showToast('Passwords do not match', 'error'); return; }
  if (newPass.length < 8) { showToast('Min 8 characters', 'error'); return; }
  const res = await apiCall('PATCH', '/auth/change-password', { current_password: current, new_password: newPass });
  if (res?.success) {
    showToast('Password updated! 🔒', 'success');
    inputs.forEach(i => i.value = '');
  } else showToast(res?.message || 'Failed', 'error');
}

function initProfile() {
  loadProfile();
  renderNotifications();
  // wire photo button
  const photoBtn = document.querySelector('#page-profile .btn-ghost.btn-sm');
  if (photoBtn) photoBtn.onclick = uploadAvatar;
  // wire update profile button if not already wired in HTML
  const saveBtn = document.querySelector('#page-profile .btn-primary');
  if (saveBtn && !saveBtn.getAttribute('data-wired')) {
    saveBtn.setAttribute('data-wired', 'true');
    saveBtn.onclick = updateProfile;
  }
}
initProfile();