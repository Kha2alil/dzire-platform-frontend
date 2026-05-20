// ==================== student-profile.js ====================
// Handles profile page: save profile, change password, upload avatar,
// and display live stats (XP, level, quests, badges, leaderboard rank).

function profileInput(field) {
    return document.querySelector(`#page-profile input[data-field="${field}"]`);
}

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

async function uploadAvatar(file) {
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    showToast('Uploading photo…', 'info');
    const res = await apiUpload('/profile/avatar', formData);
    if (res && res.success) {
        showToast('Photo updated! 📷', 'success');
        if (res.profile?.avatar_url) {
            setAvatarImage(res.profile.avatar_url);
        }
        setTimeout(loadProfileStats, 500);
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

function updateTrack() {
    const domain    = document.getElementById('profileDomain')?.value;
    const subdomain = document.getElementById('profileSubdomain')?.value;
    showToast(`Track updated to ${domain} › ${subdomain}`, 'success');
}

async function fetchQuestsDone() {
    try {
        const res = await apiCall('GET', '/api/quests/me');
        let count = 0;
        if (res && res.success) {
            count = res.completed_count ?? res.data?.completed_count ?? res.quests_completed ?? 0;
        }
        document.getElementById('statQuestsDone').textContent = count;
    } catch (err) {
        console.error('Failed to fetch quests count:', err);
        document.getElementById('statQuestsDone').textContent = '—';
    }
}

async function fetchLeaderboardRank() {
    const rankEl = document.getElementById('statLeaderboardRank');
    if (!rankEl) return;
    
    try {
        // Try dedicated rank endpoint
        let res = await apiCall('GET', '/api/leaderboard/rank');
        console.log('Leaderboard rank response:', res);
        
        if (res && res.success && typeof res.rank === 'number') {
            rankEl.textContent = `#${res.rank}`;
            return;
        }
        
        // Fallback: fetch full leaderboard and find user
        const boardRes = await apiCall('GET', '/api/leaderboard');
        console.log('Leaderboard list response:', boardRes);
        
        if (boardRes && boardRes.success && Array.isArray(boardRes.leaderboard)) {
            let userId = null;
            try {
                const userMe = await apiCall('GET', '/auth/me');
                userId = userMe?.user?.id;
                console.log('Current user ID from /auth/me:', userId);
            } catch (e) {
                console.warn('Could not fetch /auth/me', e);
            }
            
            if (!userId) {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    try {
                        const parsed = JSON.parse(storedUser);
                        userId = parsed.id;
                        console.log('User ID from localStorage:', userId);
                    } catch(e) {}
                }
            }
            
            if (userId) {
                const index = boardRes.leaderboard.findIndex(entry => 
                    entry.user_id === userId || entry.id === userId || entry.student_id === userId
                );
                if (index !== -1) {
                    rankEl.textContent = `#${index + 1}`;
                    return;
                } else {
                    console.warn('User not found in leaderboard list');
                }
            } else {
                console.warn('No user ID available to find rank');
            }
        }
        
        rankEl.textContent = 'N/A';
        console.error('Unable to determine leaderboard rank');
        
    } catch (err) {
        console.error('Failed to fetch leaderboard rank:', err);
        rankEl.textContent = 'N/A';
    }
}

async function fetchBadgesCount() {
    try {
        const res = await apiCall('GET', '/badges/me');
        let count = 0;
        if (res && res.success) {
            count = res.badges ? res.badges.length : 0;
        }
        document.getElementById('statBadgesEarned').textContent = count;
    } catch (err) {
        console.error('Failed to fetch badges:', err);
        document.getElementById('statBadgesEarned').textContent = '0';
    }
}

async function fetchGamificationStats() {
    try {
        const res = await apiCall('GET', '/gamification/me');
        if (res && res.success) {
            const stats = res.stats;
            document.getElementById('statTotalXp').textContent = stats.total_xp?.toLocaleString() || '0';
            document.getElementById('statCurrentLevel').textContent = stats.current_level || '1';
            const xpLabel = document.querySelector('.xp-label strong');
            if (xpLabel) xpLabel.textContent = stats.total_xp?.toLocaleString() || '0';
        }
    } catch (err) {
        console.error('Failed to fetch gamification stats:', err);
    }
}

async function loadProfileStats() {
    await Promise.all([
        fetchGamificationStats(),
        fetchQuestsDone(),
        fetchBadgesCount(),
        fetchLeaderboardRank()
    ]);
}

document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('saveProfileBtn');
    if (saveBtn) saveBtn.addEventListener('click', saveProfile);

    const photoBtn = document.getElementById('changePhotoBtn');
    if (photoBtn) photoBtn.addEventListener('click', triggerAvatarUpload);

    const passBtn = document.getElementById('updatePasswordBtn');
    if (passBtn) passBtn.addEventListener('click', changePassword);

    const trackBtn = document.getElementById('updateTrackBtn');
    if (trackBtn) trackBtn.addEventListener('click', updateTrack);

    setTimeout(loadProfileStats, 500);
});