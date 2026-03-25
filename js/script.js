// 
// index.js — Landing Page Scripts
// 


// ── 1. Navbar: add shadow when user scrolls down ──
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', function() {
    if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});


// ── 2. Mobile menu: open/close on hamburger click ──
const menuBtn   = document.getElementById('menuBtn');
const menuIcon  = document.getElementById('menuIcon');
const mobileNav = document.getElementById('mobileNav');

menuBtn.addEventListener('click', function() {
    // toggle() returns true if class was added, false if removed
    const isOpen = mobileNav.classList.toggle('open');
    menuIcon.className = isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
});

// Close mobile menu when a link is clicked
function closeMobile() {
    mobileNav.classList.remove('open');
    menuIcon.className = 'fa-solid fa-bars';
}


// ── 3. Scroll Reveal: fade in elements as they enter the viewport ──
const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

const revealObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target); // stop watching once visible
        }
    });
}, { threshold: 0.12 });

revealElements.forEach(function(el) {
    revealObserver.observe(el);
});


// ── 4. Counter Animation: count up numbers when they scroll into view ──
function animateCounter(el) {
    const target   = parseInt(el.dataset.target);  // get target number from HTML
    const suffix   = el.dataset.suffix || '';       // e.g. "%" or "+"
    const duration = 2000;                          // 2 seconds
    const steps    = duration / 16;                 // ~60fps
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(function() {
        current = current + increment;

        if (current >= target) {
            current = target;
            clearInterval(timer);
        }

        // Format numbers over 1000 with commas (e.g. 10,000)
        if (current >= 1000) {
            el.textContent = Math.floor(current).toLocaleString() + suffix;
        } else {
            el.textContent = Math.floor(current) + suffix;
        }
    }, 16);
}

const counterObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
        if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

// Watch all elements that have a data-target attribute
document.querySelectorAll('.stat-card-val[data-target]').forEach(function(el) {
    counterObserver.observe(el);
});