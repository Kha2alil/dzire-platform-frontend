// ================================
// login.js — Login Page Scripts
// ================================


// ── 1. Password show/hide toggle ─────────────────────────────────────────────
const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');

togglePassword.addEventListener('click', function () {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';

    togglePassword.classList.toggle('fa-eye');
    togglePassword.classList.toggle('fa-eye-slash');
});


// ── 2. XP counter animation ───────────────────────────────────────────────────
const XP_BASE = 2840;
const XP_LEVEL = 3000;
const xpEl = document.getElementById('xpValue');
const xpFill = document.getElementById('xpBarFill');
const xpPopEl = document.getElementById('xpPop');

let xpCurrent = 0;

function countUp() {
    const steps = 70;
    const totalTime = 2000;
    const interval = totalTime / steps;
    let step = 0;

    const timer = setInterval(function () {
        step++;
        xpCurrent = Math.min(Math.round((XP_BASE / steps) * step), XP_BASE);

        xpEl.textContent = xpCurrent.toLocaleString();
        xpFill.style.width = ((xpCurrent / XP_LEVEL) * 100).toFixed(1) + '%';

        if (xpCurrent >= XP_BASE) {
            clearInterval(timer);
            setTimeout(xpLoop, 1200);
        }
    }, interval);
}

function xpLoop() {
    const gains = [25, 50, 75, 100, 150];

    function tick() {
        const gain = gains[Math.floor(Math.random() * gains.length)];
        xpCurrent += gain;

        xpEl.textContent = xpCurrent.toLocaleString();

        xpEl.classList.remove('bounce');
        void xpEl.offsetWidth;
        xpEl.classList.add('bounce');

        const percent = Math.min((xpCurrent / XP_LEVEL) * 100, 100);
        xpFill.style.width = percent.toFixed(1) + '%';

        xpPopEl.textContent = '+' + gain + ' XP';
        xpPopEl.style.animation = 'none';
        void xpPopEl.offsetWidth;
        xpPopEl.style.animation = 'popUp 0.9s ease forwards';

        setTimeout(tick, 1800 + Math.random() * 1700);
    }

    tick();
}

setTimeout(countUp, 700);


// ── 3. Floating badge chips ───────────────────────────────────────────────────
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
        const pos = chip.positions[posIndex % chip.positions.length];
        posIndex++;

        el.style.left = pos.x;
        el.style.top = pos.y;
        el.style.opacity = '0';
        el.style.transform = 'translateY(12px)';
        el.style.transition = 'opacity 0.5s, transform 0.5s';

        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            });
        });

        const visibleDuration = 2800 + Math.random() * 2000;

        setTimeout(function () {
            el.style.opacity = '0';
            el.style.transform = 'translateY(-14px)';
            setTimeout(showChip, 3000 + Math.random() * 3000);
        }, visibleDuration);
    }

    setTimeout(showChip, 2000 + i * 1400);
});


// ── 4. Show error / success message ──────────────────────────────────────────
function showMsg(text, type) {
    const el = document.getElementById('msg');
    el.className = 'msg ' + type;
    const icon = type === 'error'
        ? 'fa-circle-xmark'
        : 'fa-circle-check';
    el.innerHTML = `<i class="fa-solid ${icon}"></i> ` + text;
}


// ── 5. Form submit — send login request to the backend ────────────────────────
const form = document.getElementById('login-form');
const submitBtn = document.getElementById('submit-btn');

form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showMsg('Please fill in all fields.', 'error');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Logging in... <i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        const response = await axios.post('http://localhost:3000/api/auth/login', {
            email,
            password
        });

        // Save token + user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // 🚦 NEW: Onboarding check for students BEFORE redirecting
        if (response.data.user.role === 'student') {
            try {
                const statusRes = await axios.get(
                    'http://localhost:3000/api/onboarding/status',
                    { headers: { Authorization: `Bearer ${response.data.token}` } }
                );
                if (statusRes.data.onboardingDone === false) {
                    window.location.href = 'onboarding.html';
                    return;
                }
            } catch (err) {
                console.warn('Could not check onboarding status, proceeding to dashboard:', err);
            }
        }

        // Redirect based on role (only if the student check didn't redirect)
        if (response.data.user.role === 'student') {
            window.location.href = 'student-dashboard.html';
        } else if (response.data.user.role === 'teacher') {
            window.location.href = 'teacher-dashboard.html';
        } else if (response.data.user.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        }

    } catch (err) {
        const message = err.response
            ? err.response.data.message || 'Invalid credentials.'
            : 'Cannot connect to server.';
        showMsg(message, 'error');

    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Login Now <i class="fa-solid fa-right-to-bracket"></i>';
    }
});