// ================================
// verify-email.js — Verify Email Scripts
// ================================


// ── 1. Switch between loading / success / error states ───────────────────────
// The page has 3 "states" (divs). Only one is visible at a time.
// We switch by adding the "active" class to the right one.
function showState(stateName) {
    // Hide all states first
    document.querySelectorAll('.state').forEach(function(el) {
        el.classList.remove('active');
    });

    // Show only the requested state
    document.getElementById('state-' + stateName).classList.add('active');
}


// ── 2. Read the token from the URL ───────────────────────────────────────────
// When the user clicks the email link, the URL looks like:
// verify-email.html?token=abc123
// We extract "abc123" using URLSearchParams
const params = new URLSearchParams(window.location.search);
const token  = params.get('token');


// ── 3. Call the backend to verify the token ───────────────────────────────────
async function verifyEmail() {

    // If there's no token in the URL, show an error immediately
    if (!token) {
        document.getElementById('error-message').textContent =
            'No verification token found. Please check your email link.';
        showState('error');
        return;
    }

    try {
        // Send the token to the backend
        await axios.get('http://localhost:3000/api/auth/verify-email?token=' + token);

        // If successful, show the success screen
        showState('success');

    } catch (err) {
        // If failed, show an error message
        const message = err.response
            ? err.response.data.message
            : 'Cannot connect to server. Make sure the backend is running.';

        document.getElementById('error-message').textContent = message;
        showState('error');
    }
}

// Run the verification as soon as the page loads
verifyEmail();