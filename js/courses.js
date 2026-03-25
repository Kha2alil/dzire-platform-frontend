// ================================
// courses.js — Courses Page Scripts
// ================================


// ── 1. Course data ───────────────────────────────────────────────────────────
// All course info is stored here.
// When a card is clicked, we look up the course by its "key" (e.g. "html")
// and fill the modal with the matching data.
const courseData = {
    html: {
        title:       "HTML5 Foundations",
        level:       "beginner",       // used as CSS class
        levelLabel:  "Beginner",       // shown in the badge
        image:       "assets/images/HTML.png",
        description: "Master the skeleton of the web. Learn how to structure your websites perfectly for accessibility and SEO.",
        syllabus:    ["Web Page Structure", "Forms & Inputs", "Semantic HTML", "Media & Links"],
        outcomes:    ["Build full website structures", "Understand web standards", "Create interactive forms"]
    },
    css: {
        title:       "CSS3 Styling Mastery",
        level:       "beginner",
        levelLabel:  "Beginner",
        image:       "assets/images/CSS.png",
        description: "Bring your websites to life. Learn colors, typography, spacing, and how to make things look beautiful.",
        syllabus:    ["Box Model & Layouts", "Flexbox & Grid", "Animations & Transitions", "Responsive Design"],
        outcomes:    ["Style any web element", "Build complex layouts easily", "Create smooth animations"]
    },
    js: {
        title:       "JavaScript Dynamics",
        level:       "intermediate",
        levelLabel:  "Intermediate",
        image:       "assets/images/JS.png",
        description: "The logic of the web. Learn how to make your websites interactive, fetch data, and handle user events.",
        syllabus:    ["Variables & Functions", "DOM Manipulation", "Arrays & Objects", "Async & Fetch API"],
        outcomes:    ["Make websites interactive", "Talk to external APIs", "Build dynamic web apps"]
    },
    tailwind: {
        title:       "Tailwind CSS Rapid UI",
        level:       "intermediate",
        levelLabel:  "Intermediate",
        image:       "assets/images/Tailwind.png",
        description: "Build modern designs at lightning speed without ever leaving your HTML using utility classes.",
        syllabus:    ["Utility-First Concepts", "Responsive Design", "Custom Configurations", "Dark Mode"],
        outcomes:    ["Build UIs 10x faster", "Master responsive utilities", "Create dark/light themes easily"]
    },
    react: {
        title:       "React Modern Frontend",
        level:       "advanced",
        levelLabel:  "Advanced",
        image:       "assets/images/React.png",
        description: "Build powerful, scalable single-page applications using the most popular JavaScript library.",
        syllabus:    ["Components & Props", "State & Hooks", "Routing & Navigation", "Context API"],
        outcomes:    ["Build complex web apps", "Manage application state", "Think in React components"]
    }
};


// ── 2. Navbar scroll effect ──────────────────────────────────────────────────
window.addEventListener('scroll', function() {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});


// ── 3. Mobile menu ───────────────────────────────────────────────────────────
const menuBtn   = document.getElementById('menuBtn');
const menuIcon  = document.getElementById('menuIcon');
const mobileNav = document.getElementById('mobileNav');

menuBtn.addEventListener('click', function() {
    const isOpen = mobileNav.classList.toggle('open');
    menuIcon.className = isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
});

function closeMobile() {
    mobileNav.classList.remove('open');
    menuIcon.className = 'fa-solid fa-bars';
}


// ── 4. Scroll Reveal ─────────────────────────────────────────────────────────
const revealObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(function(el) {
    revealObserver.observe(el);
});


// ── 5. Filter pills ──────────────────────────────────────────────────────────
// Click a pill to show only cards with a matching data-level attribute
const filterPills = document.querySelectorAll('.filter-pill');

filterPills.forEach(function(pill) {
    pill.addEventListener('click', function() {

        // Remove "active" from all pills, then add to the clicked one
        filterPills.forEach(function(p) { p.classList.remove('active'); });
        pill.classList.add('active');

        const selectedFilter = pill.dataset.filter; // e.g. "beginner", "all"

        // Show or fade each course card based on its data-level
        document.querySelectorAll('.course-card').forEach(function(card) {
            const cardLevel = card.dataset.level; // e.g. "beginner"
            const isMatch   = selectedFilter === 'all' || cardLevel === selectedFilter;

            card.style.transition    = 'opacity 0.3s, transform 0.3s';

            if (isMatch) {
                card.style.opacity       = '1';
                card.style.transform     = '';
                card.style.pointerEvents = '';
            } else {
                card.style.opacity       = '0.2';
                card.style.transform     = 'scale(0.97)';
                card.style.pointerEvents = 'none';
            }
        });
    });
});


// ── 6. Modal ─────────────────────────────────────────────────────────────────
const modalOverlay = document.getElementById('modalOverlay');
const modalClose   = document.getElementById('modalClose');

// Open modal when a course card is clicked
document.querySelectorAll('.course-card').forEach(function(card) {
    card.addEventListener('click', function() {

        // Get the course key from the card's data-course attribute (e.g. "html")
        const courseKey  = card.dataset.course;
        const data       = courseData[courseKey];

        // Fill the modal with course data
        document.getElementById('modalImg').src              = data.image;
        document.getElementById('modalTitle').textContent    = data.title;
        document.getElementById('modalDesc').textContent     = data.description;

        // Set level badge text and CSS class
        const levelBadge      = document.getElementById('modalLevel');
        levelBadge.textContent = data.levelLabel;
        levelBadge.className   = 'modal-level-badge ' + data.level;

        // Build the syllabus list (each item becomes a <li>)
        document.getElementById('modalSyllabus').innerHTML =
            data.syllabus.map(function(item) {
                return '<li>' + item + '</li>';
            }).join('');

        // Build the outcomes list (each item gets a checkmark icon)
        document.getElementById('modalOutcomes').innerHTML =
            data.outcomes.map(function(item) {
                return '<li><i class="fa-solid fa-check"></i>' + item + '</li>';
            }).join('');

        // Show the modal
        modalOverlay.classList.add('open');
        document.body.style.overflow = 'hidden'; // prevent background scrolling
    });
});

// Close modal when X button is clicked
modalClose.addEventListener('click', closeModal);

// Close modal when clicking outside the modal box
modalOverlay.addEventListener('click', function(e) {
    if (e.target === modalOverlay) {
        closeModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

function closeModal() {
    modalOverlay.classList.remove('open');
    document.body.style.overflow = ''; // restore scrolling
}