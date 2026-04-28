/* ═══════════════════════════════════════════════════════════════
   onboarding.js – Dynamic Onboarding with Lockable Domains
   Relies on Axios (loaded in HTML) and variables.css for theming.
═══════════════════════════════════════════════════════════════ */

/* ── Configuration ────────────────────────────────────────── */
const API         = 'http://localhost:3000/api';
const getToken    = () => localStorage.getItem('token');
const authHeader  = () => ({ Authorization: `Bearer ${getToken()}` });
const DONE_KEY    = 'onboarding_done';

// ✅ Only these domain(s) are selectable – others appear locked with "Coming Soon"
const UNLOCKED_DOMAINS = ['Web Development'];

/* ── Global State ─────────────────────────────────────────── */
const state = {
    currentStep:       1,
    totalSteps:        3,
    selectedDomain:    null,
    selectedSubdomain: null,
    selectedLevel:     null,
    domains:           [],
    subdomains:        {},
    isSaving:          false,
};

const STEP_LABELS = ['Domain', 'Specialisation', 'Level', 'Ready!'];

/* Domain visual metadata */
const DOMAIN_META = {
    'Web Development':         { emoji:'🌐', accent:'#3B82F6', dim:'rgba(59,130,246,0.06)',  glow:'rgba(59,130,246,0.12)'  },
    'Data Science':            { emoji:'📊', accent:'#A78BFA', dim:'rgba(167,139,250,0.06)', glow:'rgba(167,139,250,0.12)' },
    'Mobile Development':      { emoji:'📱', accent:'#10B981', dim:'rgba(16,185,129,0.06)',  glow:'rgba(16,185,129,0.12)'  },
    'Cybersecurity':           { emoji:'🔐', accent:'#EF4444', dim:'rgba(239,68,68,0.06)',   glow:'rgba(239,68,68,0.12)'   },
    'DevOps & Cloud':          { emoji:'☁️',  accent:'#22D3EE', dim:'rgba(34,211,238,0.06)',  glow:'rgba(34,211,238,0.12)'  },
    'Artificial Intelligence': { emoji:'🤖', accent:'#F59E0B', dim:'rgba(245,158,11,0.06)',  glow:'rgba(245,158,11,0.12)'  },
    default:                   { emoji:'📚', accent:'#3B82F6', dim:'rgba(59,130,246,0.06)',  glow:'rgba(59,130,246,0.12)'  },
};

const SUBDOMAIN_ICONS = {
    'Full-Stack':'🌐','Frontend':'🎨','Backend':'⚙️',
    'React':'⚛️','Vue':'💚','Angular':'🔴',
    'Node.js':'🗄️','Python':'🐍','Data Analysis':'📈',
    'Machine Learning':'🧠','iOS':'🍎','Android':'🤖',
    'Ethical Hacking':'🛡️','AWS':'☁️','Docker':'🐳',
    default:'🔧',
};

/* ── Boot ─────────────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', async () => {
    if (!getToken()) {
        window.location.href = 'login.html';
        return;
    }

    if (localStorage.getItem(DONE_KEY) === 'true') {
        redirectToDashboard();
        return;
    }

    try {
        const res = await axios.get(`${API}/onboarding/status`, { headers: authHeader() });
        if (res.data?.onboardingDone) {
            localStorage.setItem(DONE_KEY, 'true');
            redirectToDashboard();
            return;
        } else {
            localStorage.removeItem(DONE_KEY);
        }
    } catch (e) {
        console.warn('[onboarding] status check failed — proceeding to UI:', e.message);
        localStorage.removeItem(DONE_KEY);
    }

    renderSteps();
    await fetchDomains();
});

function redirectToDashboard() {
    window.location.href = 'student-dashboard.html';
}

/* ── Step Header Renderer ────────────────────────────────── */
function renderSteps() {
    const row = document.getElementById('stepsRow');
    row.innerHTML = '';

    STEP_LABELS.slice(0, state.totalSteps + 1).forEach((label, i) => {
        const n       = i + 1;
        const dotCls  = n < state.currentStep ? 'done'   : n === state.currentStep ? 'active' : 'todo';
        const lblCls  = n < state.currentStep ? 'done'   : n === state.currentStep ? 'active' : 'todo';

        const div = document.createElement('div');
        div.className = 'step-item';
        div.innerHTML = `
            ${i > 0 ? `<div class="step-line ${n <= state.currentStep ? 'done' : ''}"></div>` : ''}
            <div class="step-dot ${dotCls}">
                ${n < state.currentStep ? '<i class="fa-solid fa-check" style="font-size:10px"></i>' : n}
            </div>
            <span class="step-label ${lblCls}">${label}</span>`;
        row.appendChild(div);
    });

    document.getElementById('stepCounter').textContent =
        state.currentStep <= state.totalSteps
            ? `Step ${state.currentStep} of ${state.totalSteps}`
            : '';

    document.getElementById('btnBack').disabled = state.currentStep === 1;
}

/* ── Data Fetch: Domains ─────────────────────────────────── */
async function fetchDomains() {
    try {
        const res     = await axios.get(`${API}/onboarding/domains`, { headers: authHeader() });
        const domains = res.data?.domains || [];
        if (!domains.length) throw new Error('Server returned an empty domains list.');
        state.domains = domains;
        renderDomains();
    } catch (e) {
        console.error('[onboarding] fetchDomains failed:', e.response?.data || e.message);
        showMsg(`Could not load domains: ${e.response?.data?.errors?.[0] || e.message}. Please refresh the page.`, 'error');
        document.getElementById('domainGrid').innerHTML =
            '<p style="color:var(--text-3);font-size:13px;grid-column:1/-1;padding:8px 0">Failed to load. Please refresh.</p>';
    }
}

/* ── Data Fetch: Subdomains (with cache) ──────────────────── */
async function fetchSubdomains(domainId) {
    if (state.subdomains[domainId]) {
        renderSubdomains(state.subdomains[domainId]);
        return;
    }

    document.getElementById('subdomainGrid').innerHTML =
        '<div class="skeleton" style="height:60px"></div><div class="skeleton" style="height:60px"></div>';

    try {
        const res  = await axios.get(`${API}/onboarding/subdomains?domain_id=${domainId}`, { headers: authHeader() });
        const list = res.data?.subdomains || [];
        state.subdomains[domainId] = list;
        renderSubdomains(list);
    } catch (e) {
        console.error('[onboarding] fetchSubdomains failed:', e.response?.data || e.message);
        showMsg(`Could not load specialisations: ${e.message}`, 'error');
        document.getElementById('subdomainGrid').innerHTML =
            '<p style="color:var(--text-3);font-size:13px;grid-column:1/-1;padding:8px 0">Failed to load. Please go back and try again.</p>';
    }
}

/* ── Render Helpers ──────────────────────────────────────── */

/**
 * Renders domain cards with locked/unlocked state.
 * Only domains listed in UNLOCKED_DOMAINS are selectable.
 */
function renderDomains() {
    const grid = document.getElementById('domainGrid');
    grid.innerHTML = '';

    state.domains.forEach(d => {
        const meta = DOMAIN_META[d.name] || DOMAIN_META.default;
        const isUnlocked = UNLOCKED_DOMAINS.includes(d.name);

        const card = document.createElement('div');
        card.className     = 'domain-card';
        if (!isUnlocked) card.classList.add('locked');
        card.dataset.id    = d.id;
        card.dataset.name  = d.name;
        card.style.setProperty('--domain-accent', meta.accent);
        card.style.setProperty('--domain-dim',    meta.dim);
        card.style.setProperty('--domain-glow',   meta.glow);

        card.innerHTML = `
            <div class="coming-soon-badge">Soon</div>
            <div class="selected-check"><i class="fa-solid fa-check" style="font-size:8px"></i></div>
            <div class="domain-icon">${meta.emoji}</div>
            <div class="domain-name">${d.name}</div>
            <div class="domain-desc">${isUnlocked ? `Master ${d.name.toLowerCase()} with quests & boss exams` : 'This domain will be available soon!'}</div>`;

        if (isUnlocked) {
            card.addEventListener('click', () => selectDomain(card, d, meta));
        }

        grid.appendChild(card);
    });
}

function renderSubdomains(list) {
    const grid = document.getElementById('subdomainGrid');
    grid.innerHTML = '';

    if (!list.length) {
        grid.innerHTML = '<p style="color:var(--text-3);font-size:13px;padding:8px 0;grid-column:1/-1">No specialisations found for this domain.</p>';
        return;
    }

    list.forEach(s => {
        const icon = SUBDOMAIN_ICONS[s.name] || SUBDOMAIN_ICONS.default;
        const chip = document.createElement('div');
        chip.className    = 'subdomain-chip';
        chip.dataset.id   = s.id;
        chip.dataset.name = s.name;
        chip.innerHTML = `
            <div class="subdomain-chip-icon">${icon}</div>
            <div>
                <div class="subdomain-chip-name">${s.name}</div>
                <div class="subdomain-chip-pop">Specialisation track</div>
            </div>
            <div class="subdomain-chip-radio"></div>`;
        chip.addEventListener('click', () => selectSubdomain(chip, s, icon));
        grid.appendChild(chip);
    });
}

/* ── Selection Handlers ──────────────────────────────────── */
function selectDomain(card, domain, meta) {
    // Only unlocked domains are clickable, but we keep the guard just in case
    if (!UNLOCKED_DOMAINS.includes(domain.name)) return;

    document.querySelectorAll('.domain-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    state.selectedDomain    = { ...domain, ...meta };
    state.selectedSubdomain = null;
    document.getElementById('btnNext').disabled = false;
}

function selectSubdomain(chip, sub, icon) {
    document.querySelectorAll('.subdomain-chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    state.selectedSubdomain = { ...sub, emoji: icon };
    document.getElementById('btnNext').disabled = false;
}

function selectLevel(el) {
    document.querySelectorAll('.level-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    state.selectedLevel = el.dataset.level;
    document.getElementById('btnNext').disabled = false;
}

/* ── Navigation ──────────────────────────────────────────── */
function goNext() {
    if (state.isSaving) return;

    if (state.currentStep === 1) {
        if (!state.selectedDomain) return;
        populateSubdomainHeader();
        fetchSubdomains(state.selectedDomain.id);
        showStep(2);
    } else if (state.currentStep === 2) {
        if (!state.selectedSubdomain) return;
        showStep(3);
    } else if (state.currentStep === 3) {
        if (!state.selectedLevel) return;
        buildSummary();
        showStep(4, true);
        submitOnboarding();
    } else if (state.currentStep === 4) {
        redirectToDashboard();
    }
}

function goBack() {
    if (state.currentStep > 1) showStep(state.currentStep - 1);
}

function showStep(n, isFinal = false) {
    document.querySelector('.step-panel.active')?.classList.remove('active');
    document.getElementById(`step-${n}`)?.classList.add('active');
    state.currentStep = n;
    renderSteps();

    const btn = document.getElementById('btnNext');

    if (isFinal) {
        btn.innerHTML = '<div class="spinner"></div> Saving…';
        btn.disabled  = true;
    } else {
        btn.innerHTML = 'Continue <i class="fa-solid fa-arrow-right"></i>';
        const enabled =
            (n === 1 && !!state.selectedDomain)    ||
            (n === 2 && !!state.selectedSubdomain) ||
            (n === 3 && !!state.selectedLevel)     ||
            n === 4;
        btn.disabled = !enabled;
    }

    document.getElementById('btnBack').disabled = n === 1;
}

function populateSubdomainHeader() {
    const d   = state.selectedDomain;
    const hdr = document.getElementById('subdomainHeader');
    hdr.querySelector('.subdomain-header-icon').textContent = d.emoji;
    hdr.querySelector('.subdomain-header-name').textContent = d.name;
}

function buildSummary() {
    const lvlMap = {
        beginner:     '🌱 Beginner',
        intermediate: '🔥 Intermediate',
        pro:          '⚔️ Advanced',
    };
    document.getElementById('sumDomain').innerHTML    = `<span>${state.selectedDomain.emoji}</span>${state.selectedDomain.name}`;
    document.getElementById('sumSubdomain').innerHTML = `<span>${state.selectedSubdomain.emoji}</span>${state.selectedSubdomain.name}`;
    document.getElementById('sumLevel').innerHTML     = lvlMap[state.selectedLevel] || state.selectedLevel;
}

/* ── Placement Test Shortcut ──────────────────────────────── */
function goPlacementTest() {
    if (!state.selectedDomain || !state.selectedSubdomain) {
        showMsg('Please select a domain and specialisation first.', 'error');
        if (!state.selectedDomain)    showStep(1);
        else if (!state.selectedSubdomain) showStep(2);
        return;
    }
    const p = new URLSearchParams({
        domain_id:    state.selectedDomain.id,
        subdomain_id: state.selectedSubdomain.id,
        level:        state.selectedLevel || 'beginner',
    });
    window.location.href = `placement-test.html?${p}`;
}

/* ── API Submit ───────────────────────────────────────────── */
async function submitOnboarding() {
    state.isSaving = true;
    const btn = document.getElementById('btnNext');

    if (!state.selectedDomain || !state.selectedSubdomain || !state.selectedLevel) {
        showMsg('Something went wrong — please go back and complete all steps.', 'error');
        btn.innerHTML = 'Continue <i class="fa-solid fa-arrow-right"></i>';
        btn.disabled  = false;
        state.isSaving = false;
        return;
    }

    const payload = {
        domain_id:    state.selectedDomain.id,
        subdomain_id: state.selectedSubdomain.id,
        level:        state.selectedLevel,
    };

    console.log('[onboarding] submitting payload:', payload);

    try {
        const res = await axios.post(`${API}/onboarding/skip`, payload, { headers: authHeader() });
        console.log('[onboarding] skip response:', res.data);

        localStorage.setItem(DONE_KEY, 'true');
        localStorage.setItem('onboarding', JSON.stringify({
            domain:      state.selectedDomain.name,
            subdomain:   state.selectedSubdomain.name,
            level:       state.selectedLevel,
            domain_id:   state.selectedDomain.id,
            subdomain_id:state.selectedSubdomain.id,
            saved_at:    new Date().toISOString(),
        }));

        redirectToDashboard();
    } catch (e) {
        state.isSaving = false;

        if (e.response?.status === 409) {
            console.warn('[onboarding] already completed on server — redirecting.');
            localStorage.setItem(DONE_KEY, 'true');
            redirectToDashboard();
            return;
        }

        const errMsg =
            e.response?.data?.errors?.[0] ||
            e.response?.data?.message     ||
            e.message                     ||
            'Could not save your setup. Please try again.';

        console.error('[onboarding] skip failed:', e.response?.data || e.message);
        showMsg(errMsg, 'error');

        btn.innerHTML = '🚀 Try Again <i class="fa-solid fa-arrow-right"></i>';
        btn.disabled  = false;
    }
}

/* ── Message Helper ──────────────────────────────────────── */
function showMsg(text, type = 'error') {
    const el = document.getElementById('msg');
    const iconMap = { error: 'circle-xmark', success: 'circle-check', warning: 'triangle-exclamation' };
    el.className  = `msg ${type}`;
    el.innerHTML  = `<i class="fa-solid fa-${iconMap[type] || 'circle-info'}"></i> ${text}`;
    if (type !== 'error') {
        setTimeout(() => { el.className = 'msg'; }, 6000);
    }
}