// ==================== student-profile.js ====================
// Handles profile page: save profile, change password, upload avatar,
// and display live stats (XP, level, badges, quests placeholder).

// Helper: get input by data-field
function profileInput(field) {
    return document.querySelector(`#page-profile input[data-field="${field}"]`);
}

// ── Save profile (full_name, username, bio) ────────────────
async function saveProfile() {
    const full_name = profileInput('full_name')?.value?.trim();
    const username  = profileInput('username')?.value?.trim();
    const bio       = document.getElementById('profileBio')?.value?.trim();

    if (!full_name && !username && !bio) {
        showToast('Nothing to save!', 'error');
        return;
    }

    const body = {};
    if (full_name) body.full_name = full_name;
    if (username)  body.username  = username;
    if (bio)       body.bio       = bio;

    const res = await apiCall('PATCH', '/profile/me', body);

    if (res && res.success) {
        showToast('Profile saved! ✅', 'success');
        if (full_name) {
            const nameEl = document.querySelector('.sidebar-profile .profile-name');
            if (nameEl) nameEl.textContent = full_name;
            const avatarEl = document.querySelector('.sidebar-profile .profile-avatar');
            if (avatarEl) avatarEl.textContent = getInitials(full_name);
            const welcomeSpan = document.querySelector('.welcome-title span');
            if (welcomeSpan) welcomeSpan.textContent = full_name.split(' ')[0];
        }
    } else {
        showToast(res?.message || 'Failed to save profile', 'error');
    }
}

// ── Change password ────────────────────────────────────────
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

// ── Avatar upload ──────────────────────────────────────────
async function uploadAvatar(file) {
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    showToast('Uploading photo…', 'success');
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

function triggerAvatarUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png';
    input.onchange = (e) => uploadAvatar(e.target.files[0]);
    input.click();
}

// ── Update track (domain/subdomain) – placeholder ──────────
function updateTrack() {
    const domain    = document.getElementById('profileDomain')?.value;
    const subdomain = document.getElementById('profileSubdomain')?.value;
    showToast(`Track updated to ${domain} › ${subdomain}`, 'success');
}

// ── Fetch live profile statistics ──────────────────────────
async function loadProfileStats() {
    try {
        const [gamifRes, badgesRes] = await Promise.all([
            apiCall('GET', '/gamification/me'),
            apiCall('GET', '/badges/me'),
        ]);

        // 1. Quests completed – not yet tracked, show placeholder
        const questsEl = document.getElementById('statQuestsDone');
        if (questsEl) questsEl.textContent = '—';

        // 2. Badges earned count (all returned badges are earned)
        const badgesCountEl = document.getElementById('statBadgesEarned');
        if (badgesCountEl && badgesRes && badgesRes.success) {
            const badgeCount = badgesRes.badges ? badgesRes.badges.length : 0;
            badgesCountEl.textContent = badgeCount;
        }

        // 3. Leaderboard rank – no dedicated endpoint yet
        const rankEl = document.getElementById('statLeaderboardRank');
        if (rankEl) rankEl.textContent = 'N/A';

        // 4. Gamification stats (XP / Level) – already displayed by student-common.js,
        //    but we also have profile page specific elements if they exist.
        if (gamifRes && gamifRes.success) {
            const stats = gamifRes.stats;
            const levelEl = document.getElementById('statCurrentLevel');
            if (levelEl) levelEl.textContent = stats.current_level;
            const xpEl = document.getElementById('statTotalXp');
            if (xpEl) xpEl.textContent = stats.total_xp.toLocaleString();
            const streakEl = document.getElementById('statStreak');
            if (streakEl) streakEl.textContent = stats.current_streak ?? '—';
        }
    } catch (err) {
        console.error('Failed to load profile stats:', err);
    }
}

// ── Initialisation ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Wire up buttons (identical to original)
    const saveBtn = document.getElementById('saveProfileBtn');
    if (saveBtn) saveBtn.addEventListener('click', saveProfile);

    const photoBtn = document.getElementById('changePhotoBtn');
    if (photoBtn) photoBtn.addEventListener('click', triggerAvatarUpload);

    const passBtn = document.getElementById('updatePasswordBtn');
    if (passBtn) passBtn.addEventListener('click', changePassword);

    const trackBtn = document.getElementById('updateTrackBtn');
    if (trackBtn) trackBtn.addEventListener('click', updateTrack);

    // Load profile stats after a short delay to ensure common data is ready
    setTimeout(loadProfileStats, 300);
});