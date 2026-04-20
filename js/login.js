// ================================
// login.js — Login Page Scripts
// ================================


// ── 1. Password show/hide toggle ─────────────────────────────────────────────
const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');

togglePassword.addEventListener('click', function () {
    // Switch between "password" (hidden) and "text" (visible)
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';

    // Swap the eye icon
    togglePassword.classList.toggle('fa-eye');
    togglePassword.classList.toggle('fa-eye-slash');
});


// ── 2. XP counter animation ───────────────────────────────────────────────────
// This just plays a fun XP animation in the background widget — it's decorative
const XP_BASE = 2840; // starting XP shown
const XP_LEVEL = 3000; // XP needed for next level
const xpEl = document.getElementById('xpValue');
const xpFill = document.getElementById('xpBarFill');
const xpPopEl = document.getElementById('xpPop');

let xpCurrent = 0;

// Step 1: count up from 0 to the base XP value
function countUp() {
    const steps = 70;
    const totalTime = 2000; // 2 seconds
    const interval = totalTime / steps;
    let step = 0;

    const timer = setInterval(function () {
        step++;
        xpCurrent = Math.min(Math.round((XP_BASE / steps) * step), XP_BASE);

        xpEl.textContent = xpCurrent.toLocaleString();
        xpFill.style.width = ((xpCurrent / XP_LEVEL) * 100).toFixed(1) + '%';

        if (xpCurrent >= XP_BASE) {
            clearInterval(timer);
            setTimeout(xpLoop, 1200); // start the loop after count-up finishes
        }
    }, interval);
}

// Step 2: keep gaining XP with a bounce + floating "+XP" particle
function xpLoop() {
    const gains = [25, 50, 75, 100, 150]; // random XP gains

    function tick() {
        const gain = gains[Math.floor(Math.random() * gains.length)];
        xpCurrent += gain;

        // Update number
        xpEl.textContent = xpCurrent.toLocaleString();

        // Bounce animation (remove then re-add to restart it)
        xpEl.classList.remove('bounce');
        void xpEl.offsetWidth; // forces browser to reset the animation
        xpEl.classList.add('bounce');

        // Update progress bar (cap at 100%)
        const percent = Math.min((xpCurrent / XP_LEVEL) * 100, 100);
        xpFill.style.width = percent.toFixed(1) + '%';

        // Show floating "+XP" text
        xpPopEl.textContent = '+' + gain + ' XP';
        xpPopEl.style.animation = 'none';
        void xpPopEl.offsetWidth;  // reset animation
        xpPopEl.style.animation = 'popUp 0.9s ease forwards';

        // Schedule next tick at a random interval (1.8s – 3.5s)
        setTimeout(tick, 1800 + Math.random() * 1700);
    }

    tick();
}

// Start the XP animation after a short delay
setTimeout(countUp, 700);


// ── 3. Floating badge chips ───────────────────────────────────────────────────
// Each chip fades in at a random position, stays briefly, then fades out
// and reappears somewhere else — creating a lively background effect
const chips = [
    { id: 'chip1', positions: [{ x: '8%', y: '28%' }, { x: '6%', y: '55%' }, { x: '10%', y: '70%' }] },
    { id: 'chip2', positions: [{ x: '78%', y: '32%' }, { x: '75%', y: '60%' }, { x: '80%', y: '20%' }] },
    { id: 'chip3', positions: [{ x: '5%', y: '42%' }, { x: '9%', y: '65%' }, { x: '7%', y: '20%' }] },
    { id: 'chip4', positions: [{ x: '76%', y: '50%' }, { x: '82%', y: '72%' }, { x: '78%', y: '40%' }] },
];

chips.forEach(function (chip, i) {
    const el = document.getElementById(chip.id);
    let posIndex = 0;

    function showChip() {
        // Pick the next position in the list (loop back when exhausted)
        const pos = chip.positions[posIndex % chip.positions.length];
        posIndex++;

        // Move the chip to the new position (invisible at first)
        el.style.left = pos.x;
        el.style.top = pos.y;
        el.style.opacity = '0';
        el.style.transform = 'translateY(12px)';
        el.style.transition = 'opacity 0.5s, transform 0.5s';

        // Fade in on the next animation frame
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            });
        });

        // After a random visible duration, fade it out then show again
        const visibleDuration = 2800 + Math.random() * 2000;

        setTimeout(function () {
            el.style.opacity = '0';
            el.style.transform = 'translateY(-14px)';

            // Wait before showing chip again
            setTimeout(showChip, 3000 + Math.random() * 3000);
        }, visibleDuration);
    }

    // Stagger start times so chips don't all appear at once
    setTimeout(showChip, 2000 + i * 1400);
});


// ── 4. Show error / success message ──────────────────────────────────────────
function showMsg(text, type) {
    const el = document.getElementById('msg');
    el.className = 'msg ' + type; // applies the right color style
    const icon = type === 'error'
        ? 'fa-circle-xmark'
        : 'fa-circle-check';
    el.innerHTML = `<i class="fa-solid ${icon}"></i> ` + text;
}


// ── 5. Form submit — send login request to the backend ────────────────────────
const form = document.getElementById('login-form');
const submitBtn = document.getElementById('submit-btn');

form.addEventListener('submit', async function (e) {
    e.preventDefault(); // stop default form submit (page reload)

    const email = document.getElementById('email').value.trim();
    const password = passwordInput.value;

    // Basic validation
    if (!email || !password) {
        showMsg('Please fill in all fields.', 'error');
        return;
    }

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Logging in... <i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        // Send POST request to the backend
        const response = await axios.post('http://localhost:3000/api/auth/login', {
            email,
            password
        });

        // Save token + user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Redirect based on role
        if (response.data.user.role === 'student') {
            window.location.href = 'student-dashboard.html';
        } else if (response.data.user.role === 'teacher') {
            window.location.href = 'teacher-dashboard.html';
        } else if (response.data.user.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        }

    } catch (err) {
        // Show the error message from the server (or a fallback)
        const message = err.response
            ? err.response.data.message || 'Invalid credentials.'
            : 'Cannot connect to server.';
        showMsg(message, 'error');

    } finally {
        // Always re-enable the button when done
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Login Now <i class="fa-solid fa-right-to-bracket"></i>';
    }

});