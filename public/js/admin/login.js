document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    // Handle login form if it exists
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Clear previous error
            errorMessage.style.display = 'none';
            errorMessage.textContent = '';
            
            const formData = new FormData(loginForm);
            const username = formData.get('username');
            const password = formData.get('password');

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        username: encodeURIComponent(username),
                        password: encodeURIComponent(password)
                    }),
                    credentials: 'same-origin'
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    // Redirect to the specified URL or dashboard
                    window.location.href = data.redirect || '/admin/dashboard.html';
                } else {
                    // Show error message
                    errorMessage.textContent = data.error || 'Login failed. Please try again.';
                    errorMessage.style.display = 'block';
                }
            } catch (error) {
                console.error('Login error:', error);
                errorMessage.textContent = 'An error occurred. Please try again.';
                errorMessage.style.display = 'block';
            }
        });
    }

    // Add logout handler if logout button exists
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            try {
                const response = await fetch('http://localhost:3000/api/logout', {
                    method: 'POST'
                });
                const data = await response.json();
                
                if (data.success) {
                    window.location.href = '/admin';
                }
            } catch (error) {
                console.error('Logout error:', error);
            }
        });
    }
});

// Show alert function
function showAlert(type, message) {
    const alertElement = document.querySelector('.alert');
    if (alertElement) {
        alertElement.className = `alert alert-${type}`;
        alertElement.textContent = message;
        alertElement.style.display = 'block';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            alertElement.style.display = 'none';
        }, 5000);
    }
}
