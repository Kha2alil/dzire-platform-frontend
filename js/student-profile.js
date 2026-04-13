// ==================== student-profile.js ====================
// Handles profile page interactions: save profile, change password, upload avatar, update track

// Helper: get input by data-field
function profileInput(field) {
    return document.querySelector(`#page-profile input[data-field="${field}"]`);
}

// Save profile (full_name, username, bio)
async function saveProfile() {
    const full_name = profileInput('full_name')?.value?.trim();
    const username = profileInput('username')?.value?.trim();
    const bio = document.getElementById('profileBio')?.value?.trim();

    if (!full_name && !username && !bio) {
        showToast('Nothing to save!', 'error');
        return;
    }

    const body = {};
    if (full_name) body.full_name = full_name;
    if (username) body.username = username;
    if (bio) body.bio = bio;

    const res = await apiCall('PATCH', '/profile/me', body);

    if (res && res.success) {
        showToast('Profile saved! ✅', 'success');
        if (full_name) {
            // Update sidebar name and avatar initials
            const nameEl = document.querySelector('.sidebar-profile .profile-name');
            if (nameEl) nameEl.textContent = full_name;
            const avatarEl = document.querySelector('.sidebar-profile .profile-avatar');
            if (avatarEl) avatarEl.textContent = getInitials(full_name);
            // Update welcome banner (if present on dashboard)
            const welcomeSpan = document.querySelector('.welcome-title span');
            if (welcomeSpan) welcomeSpan.textContent = full_name.split(' ')[0];
        }
    } else {
        showToast(res?.message || 'Failed to save profile', 'error');
    }
}

// Change password
async function changePassword() {
    const current = document.getElementById('currentPassword')?.value.trim();
    const newPass = document.getElementById('newPassword')?.value.trim();
    const confirm = document.getElementById('confirmPassword')?.value.trim();

    if (!current || !newPass || !confirm) {
        showToast('Please fill all password fields', 'error');
        return;
    }
    if (newPass !== confirm) {
        showToast('New passwords do not match', 'error');
        return;
    }
    if (newPass.length < 8) {
        showToast('Password must be at least 8 characters', 'error');
        return;
    }

    const res = await apiCall('PATCH', '/auth/change-password', { current_password: current, new_password: newPass });

    if (res && res.success) {
        showToast('Password updated! 🔒', 'success');
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
    } else {
        showToast(res?.message || 'Failed to update password', 'error');
    }
}

// Upload avatar
async function uploadAvatar(file) {
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    showToast('Uploading photo...', 'success');
    const res = await apiUpload('/profile/avatar', formData);
    if (res && res.success) {
        showToast('Photo updated! 📷', 'success');
        if (res.profile?.avatar_url) {
            setAvatarImage(res.profile.avatar_url);
        }
    } else {
        showToast(res?.message || 'Upload failed', 'error');
    }
}

// Trigger file input for avatar
function triggerAvatarUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png';
    input.onchange = (e) => uploadAvatar(e.target.files[0]);
    input.click();
}

// Update track (domain/subdomain) – just shows toast for now (can be extended)
function updateTrack() {
    const domain = document.getElementById('profileDomain')?.value;
    const subdomain = document.getElementById('profileSubdomain')?.value;
    showToast(`Track updated to ${domain} › ${subdomain}`, 'success');
    // In the future, call API to save student's domain/subdomain preferences
}

// Fetch total quests completed
async function fetchQuestsCompleted() {
    try {
        const res = await apiCall('GET', '/gamification/me');
        if (res && res.success && res.stats.quests_completed !== undefined) {
            document.getElementById('statQuestsDone').textContent = res.stats.quests_completed;
        } else {
            // Fallback: try another endpoint if needed
            const questRes = await apiCall('GET', '/students/me/quests/completed');
            if (questRes && questRes.success) {
                document.getElementById('statQuestsDone').textContent = questRes.count;
            }
        }
    } catch (err) {
        console.error('Failed to load quests completed:', err);
    }
}

// Fetch badges earned count
async function fetchBadgesCount() {
    try {
        const res = await apiCall('GET', '/badges/me');
        if (res && res.success) {
            const earnedCount = res.badges.filter(b => b.earned).length;
            document.getElementById('statBadgesEarned').textContent = earnedCount;
        }
    } catch (err) {
        console.error('Failed to load badges count:', err);
    }
}

// Fetch leaderboard rank
async function fetchLeaderboardRank() {
    try {
        const res = await apiCall('GET', '/leaderboard/me');
        if (res && res.success) {
            const rank = res.rank;
            document.getElementById('statLeaderboardRank').textContent = `#${rank}`;
        }
    } catch (err) {
        console.error('Failed to load leaderboard rank:', err);
    }
}

// Initialisation: load existing profile data (already handled by student-common.js loadSharedUserData)
// But we also need to wire up event listeners after DOM is ready.
document.addEventListener('DOMContentLoaded', () => {
    // Save profile button
    const saveBtn = document.getElementById('saveProfileBtn');
    if (saveBtn) saveBtn.addEventListener('click', saveProfile);

    // Change photo button
    const photoBtn = document.getElementById('changePhotoBtn');
    if (photoBtn) photoBtn.addEventListener('click', triggerAvatarUpload);

    // Update password button
    const passBtn = document.getElementById('updatePasswordBtn');
    if (passBtn) passBtn.addEventListener('click', changePassword);

    // Update track button
    const trackBtn = document.getElementById('updateTrackBtn');
    if (trackBtn) trackBtn.addEventListener('click', updateTrack);

    // to be safe, wait a short moment or use setTimeout
    setTimeout(() => {
        fetchQuestsCompleted();
        fetchBadgesCount();
        fetchLeaderboardRank();
    }, 500);
});