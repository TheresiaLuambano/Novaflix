/**
 * BurudaniKiganjani - Login Page
 * Handles user authentication
 */

class LoginPage {
    constructor() {
        this.init();
    }

    init() {
        // Setup immediately without any blocking operations
        // Check auth asynchronously but don't block UI
        this.checkAuthAsync();
        
        // Setup event listeners
        this.setupEventListeners();
    }

    async checkAuthAsync() {
        try {
            const userData = api.getStoredUser();
            const token = api.getAuthToken();
            
            if (userData && token) {
                // User is already logged in, redirect
                const redirectUrl = sessionStorage.getItem('postLoginRedirect') || 'index.html';
                sessionStorage.removeItem('postLoginRedirect');
                window.location.href = redirectUrl;
            }
        } catch (error) {
            console.log('Auth check completed');
        }
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        const passwordToggle = document.getElementById('passwordToggle');
        const passwordInput = document.getElementById('password');

        // Form submission
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Password visibility toggle
        if (passwordToggle && passwordInput) {
            passwordToggle.addEventListener('click', () => {
                const type = passwordInput.type === 'password' ? 'text' : 'password';
                passwordInput.type = type;
                passwordToggle.innerHTML = `<i class="fas fa-${type === 'password' ? 'eye' : 'eye-slash'}"></i>`;
            });
        }

        // Social login buttons
        const googleBtn = document.getElementById('googleBtn');
        const facebookBtn = document.getElementById('facebookBtn');

        if (googleBtn) {
            googleBtn.addEventListener('click', () => this.handleGoogleLogin());
        }

        if (facebookBtn) {
            facebookBtn.addEventListener('click', () => this.handleFacebookLogin());
        }
    }

    async handleGoogleLogin() {
        try {
            const googleBtn = document.getElementById('googleBtn');
            this.setButtonLoading(googleBtn, true);
            
            const result = await auth.loginWithGoogle();
            
            if (!result.success && !result.pending) {
                if (result.message && result.message.includes('SDK')) {
                    this.showToast('Google login: Please configure OAuth credentials', 'info');
                }
            }
        } catch (error) {
            console.error('Google login error:', error);
            this.showToast('Failed to initialize Google login', 'error');
        } finally {
            const googleBtn = document.getElementById('googleBtn');
            this.setButtonLoading(googleBtn, false);
        }
    }

    async handleFacebookLogin() {
        try {
            const facebookBtn = document.getElementById('facebookBtn');
            this.setButtonLoading(facebookBtn, true);
            
            const result = await auth.loginWithFacebook();
            
            if (!result.success && !result.pending) {
                if (result.message && result.message.includes('SDK')) {
                    this.showToast('Facebook login: Please configure OAuth credentials', 'info');
                }
            }
        } catch (error) {
            console.error('Facebook login error:', error);
            this.showToast('Failed to initialize Facebook login', 'error');
        } finally {
            const facebookBtn = document.getElementById('facebookBtn');
            this.setButtonLoading(facebookBtn, false);
        }
    }

    setButtonLoading(button, loading) {
        if (!button) return;
        
        if (loading) {
            const originalContent = button.innerHTML;
            button.setAttribute('data-original-content', originalContent);
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
            button.disabled = true;
        } else {
            const originalContent = button.getAttribute('data-original-content');
            if (originalContent) {
                button.innerHTML = originalContent;
                button.removeAttribute('data-original-content');
            }
            button.disabled = false;
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const submitBtn = document.getElementById('submitBtn');

        // Clear previous errors
        this.clearErrors();

        // Validation
        if (!email) {
            this.showError('email', 'Email is required');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showError('email', 'Please enter a valid email address');
            return;
        }

        if (!password) {
            this.showError('password', 'Password is required');
            return;
        }

        // Show loading state
        if (submitBtn) {
            submitBtn.disabled = true;
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoading = submitBtn.querySelector('.btn-loading');
            if (btnText) btnText.style.display = 'none';
            if (btnLoading) btnLoading.style.display = 'inline-flex';
        }

        try {
            const result = await auth.login(email, password);

            if (result.success) {
                this.showToast('Login successful!', 'success');
                
                // Redirect based on role or stored redirect URL
                const redirectUrl = result.redirect_url || sessionStorage.getItem('postLoginRedirect') || 'index.html';
                sessionStorage.removeItem('postLoginRedirect');
                
                // Redirect after brief delay to show success message
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 1000);
            } else {
                // Show error in password field for security
                this.showError('password', result.message || 'Invalid credentials');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('password', 'An error occurred. Please try again.');
        } finally {
            // Reset button state
            if (submitBtn) {
                submitBtn.disabled = false;
                const btnText = submitBtn.querySelector('.btn-text');
                const btnLoading = submitBtn.querySelector('.btn-loading');
                if (btnText) btnText.style.display = 'inline';
                if (btnLoading) btnLoading.style.display = 'none';
            }
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showError(field, message) {
        const errorEl = document.getElementById(`${field}Error`);
        const inputEl = document.getElementById(field);

        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'flex';
        }

        if (inputEl) {
            inputEl.classList.add('error');
        }
    }

    clearErrors() {
        const errorEls = document.querySelectorAll('.form-error');
        const inputEls = document.querySelectorAll('.form-input');

        errorEls.forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });

        inputEls.forEach(el => el.classList.remove('error'));
    }

    // Toast notification helper
    showToast(message, type = 'info') {
        // Ensure toast container exists
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-times-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="${icons[type] || icons.info} toast-icon"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
}

// Initialize login page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LoginPage();
});

