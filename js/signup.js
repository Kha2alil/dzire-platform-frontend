// ================================
// signup.js — Signup Page Scripts
// ================================


// ── 1. XP counter animation (same decorative animation as login) ──────────────
const XP_BASE  = 2840;
const XP_LEVEL = 3000;
const xpEl     = document.getElementById('xpValue');
const xpFill   = document.getElementById('xpBarFill');
const xpPopEl  = document.getElementById('xpPop');
let xpCurrent  = 0;

function countUp() {
    const steps = 70, totalTime = 2000;
    let step = 0;

    const timer = setInterval(function() {
        step++;
        xpCurrent = Math.min(Math.round((XP_BASE / steps) * step), XP_BASE);
        xpEl.textContent   = xpCurrent.toLocaleString();
        xpFill.style.width = ((xpCurrent / XP_LEVEL) * 100).toFixed(1) + '%';

        if (xpCurrent >= XP_BASE) {
            clearInterval(timer);
            setTimeout(xpLoop, 1200);
        }
    }, totalTime / steps);
}

function xpLoop() {
    const gains = [25, 50, 75, 100, 150];

    function tick() {
        const gain = gains[Math.floor(Math.random() * gains.length)];
        xpCurrent += gain;

        xpEl.textContent = xpCurrent.toLocaleString();

        // Restart bounce animation
        xpEl.classList.remove('bounce');
        void xpEl.offsetWidth;
        xpEl.classList.add('bounce');

        xpFill.style.width = Math.min((xpCurrent / XP_LEVEL) * 100, 100).toFixed(1) + '%';

        // Show floating "+XP" text
        xpPopEl.textContent     = '+' + gain + ' XP';
        xpPopEl.style.animation = 'none';
        void xpPopEl.offsetWidth;
        xpPopEl.style.animation = 'popUp 0.9s ease forwards';

        setTimeout(tick, 1800 + Math.random() * 1700);
    }

    tick();
}

setTimeout(countUp, 700);


// ── 2. Floating badge chips ───────────────────────────────────────────────────
const chips = [
    { id: 'chip1', positions: [{ x: '7%',  y: '30%' }, { x: '5%',  y: '55%' }, { x: '9%',  y: '72%' }] },
    { id: 'chip2', positions: [{ x: '79%', y: '35%' }, { x: '76%', y: '62%' }, { x: '81%', y: '22%' }] },
    { id: 'chip3', positions: [{ x: '4%',  y: '45%' }, { x: '8%',  y: '65%' }, { x: '6%',  y: '22%' }] },
    { id: 'chip4', positions: [{ x: '77%', y: '52%' }, { x: '80%', y: '74%' }, { x: '78%', y: '42%' }] },
];

chips.forEach(function(chip, i) {
    const el = document.getElementById(chip.id);
    let posIndex = 0;

    function showChip() {
        const pos = chip.positions[posIndex++ % chip.positions.length];

        el.style.left       = pos.x;
        el.style.top        = pos.y;
        el.style.opacity    = '0';
        el.style.transform  = 'translateY(12px)';
        el.style.transition = 'opacity 0.5s, transform 0.5s';

        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                el.style.opacity   = '1';
                el.style.transform = 'translateY(0)';
            });
        });

        const visibleDuration = 2800 + Math.random() * 2000;
        setTimeout(function() {
            el.style.opacity   = '0';
            el.style.transform = 'translateY(-14px)';
            setTimeout(showChip, 3000 + Math.random() * 3000);
        }, visibleDuration);
    }

    setTimeout(showChip, 2000 + i * 1400);
});


// ── 3. Role toggle (Student / Teacher) ───────────────────────────────────────
const roleButtons = document.querySelectorAll('.role-btn');
let selectedRole  = 'student'; // default role

roleButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
        // Remove active from all, then set it on the clicked one
        roleButtons.forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        selectedRole = btn.dataset.role; // "student" or "teacher"
    });
});


// ── 4. Password toggle ───────────────────────────────────────────────────────
const passwordInput  = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');

togglePassword.addEventListener('click', function() {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    togglePassword.classList.toggle('fa-eye');
    togglePassword.classList.toggle('fa-eye-slash');
});


// ── 5. Real-time form validation ──────────────────────────────────────────────
const form      = document.getElementById('signup-form');
const submitBtn = document.getElementById('submit-btn');
const passHint  = document.getElementById('pass-hint');
const termsBox  = document.getElementById('terms');

// Password is valid if it's 8+ characters with at least one letter and one number
function isPasswordValid(value) {
    return value.length >= 8 && /[a-zA-Z]/.test(value) && /[0-9]/.test(value);
}

function checkForm() {
    const name  = document.getElementById('full-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const pass  = passwordInput.value;
    const valid = isPasswordValid(pass);

    // Update the password hint message below the input
    if (pass.length > 0) {
        passHint.className = 'pass-hint ' + (valid ? 'valid' : 'invalid');
        passHint.innerHTML = valid
            ? '<i class="fa-solid fa-circle-check"></i> Password looks good!'
            : '<i class="fa-solid fa-circle-xmark"></i> Min. 8 characters with letters and numbers';
    } else {
        // Reset to neutral hint when field is empty
        passHint.className = 'pass-hint';
        passHint.innerHTML = '<i class="fa-solid fa-circle-info"></i> Min. 8 characters with letters and numbers';
    }

    // Enable submit only when ALL conditions are met
    submitBtn.disabled = !(name && email && valid && termsBox.checked);
}

// Run validation whenever any field changes
form.addEventListener('input', checkForm);
termsBox.addEventListener('change', checkForm);


// ── 6. Show message banner ────────────────────────────────────────────────────
function showMsg(text, type, icon) {
    const el = document.getElementById('msg');
    el.className = 'msg ' + type;
    el.innerHTML = '<i class="fa-solid fa-' + icon + '"></i> ' + text;
}


// ── 7. Form submit — send signup request to backend ───────────────────────────
form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const userData = {
        full_name: document.getElementById('full-name').value.trim(),
        email:     document.getElementById('email').value.trim(),
        password:  passwordInput.value,
        role:      selectedRole
    };

    // Show loading state
    submitBtn.disabled  = true;
    submitBtn.innerHTML = 'Creating account... <i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        const response = await axios.post('http://localhost:3000/api/auth/signup', userData);
        // Show success message with the email that was used
        showMsg(
            'Check your email! Verification link sent to ' + response.data.email,
            'success',
            'circle-check'
        );

        // Reset the form after success
        form.reset();
        passHint.className = 'pass-hint';
        passHint.innerHTML = '<i class="fa-solid fa-circle-info"></i> Min. 8 characters with letters and numbers';

    } catch (err) {
        // Handle validation errors (array) or single message
        const errorMsg = err.response
            ? err.response.data.messages
                ? err.response.data.messages.join(' · ')
                : err.response.data.message
            : 'Cannot connect to server.';

        showMsg(errorMsg, 'error', 'circle-xmark');

    } finally {
        submitBtn.disabled  = false;
        submitBtn.innerHTML = 'Enroll Today <i class="fa-solid fa-arrow-right"></i>';
        checkForm(); // re-evaluate button state
    }
});