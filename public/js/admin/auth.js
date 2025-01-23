// Authentication check for admin pages
class AdminAuth {
    constructor() {
        this.checkAuthentication();
        this.setupIntervalCheck();
        this.lastCheckTime = Date.now();
        this.retryDelay = 1000; // Start with 1 second delay
        this.maxRetryDelay = 30000; // Max 30 seconds
        this.checkInProgress = false;
    }

    async checkAuthentication() {
        // Prevent concurrent checks
        if (this.checkInProgress) {
            return;
        }

        // Prevent too frequent checks
        const now = Date.now();
        if (now - this.lastCheckTime < this.retryDelay) {
            return;
        }

        this.checkInProgress = true;
        this.lastCheckTime = now;

        try {
            const response = await fetch('/api/auth/check', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (response.status === 429) {
                // Rate limited - increase retry delay
                this.retryDelay = Math.min(this.retryDelay * 2, this.maxRetryDelay);
                console.log(`Rate limited. Next retry in ${this.retryDelay/1000} seconds`);
                return;
            }

            const data = await response.json();
            
            // Reset retry delay on successful request
            this.retryDelay = 1000;

            if (!response.ok) {
                throw new Error(data.error || 'Authentication check failed');
            }

            // Handle authentication state
            if (data.authenticated) {
                // If on login page, redirect to admin
                if (window.location.pathname.includes('/login.html')) {
                    window.location.href = '/admin/dashboard.html';
                }
            } else {
                // If not on login page, redirect to login
                if (!window.location.pathname.includes('/login.html')) {
                    window.location.href = '/admin/login.html';
                }
            }
        } catch (error) {
            console.error('Auth check error:', error);
            this.retryDelay = Math.min(this.retryDelay * 2, this.maxRetryDelay);
        } finally {
            this.checkInProgress = false;
        }
    }

    setupIntervalCheck() {
        // Check authentication every minute
        setInterval(() => this.checkAuthentication(), 60000);
    }
}

// Show alert message
function showAlert(type, message) {
    const alertElement = document.querySelector('.alert');
    if (alertElement) {
        alertElement.className = `alert alert-${type}`;
        alertElement.textContent = message;
        alertElement.style.display = 'block';
        
        setTimeout(() => {
            alertElement.style.display = 'none';
        }, 5000);
    }
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const username = form.querySelector('#username').value;
    const password = form.querySelector('#password').value;
    const errorElement = document.querySelector('.alert');

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            }),
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok && data.success) {
            window.location.href = data.redirect || '/admin/dashboard.html';
        } else {
            showAlert('danger', data.error || 'Login failed. Please try again.');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('danger', 'An error occurred. Please try again.');
    }
}

// Handle logout
async function handleLogout() {
    try {
        // Clear any client-side storage
        localStorage.removeItem('adminData');
        sessionStorage.clear();
        
        // Clear any auth-related cookies
        document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "")
                .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });

        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });

        if (response.ok) {
            // Force reload to home page
            window.location.replace('/');
        } else {
            const data = await response.json();
            showAlert('danger', data.error || 'Logout failed. Please try again.');
            // Even if there's an error, try to redirect
            setTimeout(() => window.location.replace('/'), 2000);
        }
    } catch (error) {
        console.error('Logout error:', error);
        showAlert('danger', 'An error occurred during logout.');
        // Fallback to home page even if error occurs
        setTimeout(() => window.location.replace('/'), 2000);
    }
}

// Initialize auth check when document is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize auth checker
    new AdminAuth();

    // Add form submit handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Add logout handler
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

// Make functions available globally
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
