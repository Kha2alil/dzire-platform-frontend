// js/auth-guard.js
(function() {
    // Use the same API base URL as your other frontend scripts
    const API_BASE = window.API_BASE || 'http://localhost:3000/api';
    const token = localStorage.getItem('token');
    const requiredRole = document.body.getAttribute('data-required-role');

    if (!requiredRole) return;

    if (!token) {
        window.location.replace('/login.html');
        return;
    }

    fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
        if (!res.ok) throw new Error('Token invalid');
        return res.json();
    })
    .then(data => {
        if (data.user.role !== requiredRole) {
            throw new Error('Role mismatch');
        }
        // All good – page will render
    })
    .catch(err => {
        console.error('Auth guard error:', err);
        localStorage.removeItem('token');
        window.location.replace('/login.html');
    });
})();