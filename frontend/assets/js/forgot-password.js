/**
 * BurudaniKiganjani - Forgot Password Page
 * Handles password reset request
 */

class ForgotPasswordPage {
    constructor() {
        this.init();
    }

    init() {
        // Check if already logged in - redirect to home
        if (auth.isAuthenticated) {
            window.location.href = 'index.html';
            return;
        }
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        const form = document.getElementById('forgotPasswordForm');
        const passwordToggle = document.getElementById('passwordToggle');
        const passwordInput = document.getElementById('password');

        // Form submission
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Password visibility toggle (if needed for future use)
        if (passwordToggle && passwordInput) {
            passwordToggle.addEventListener('click', () => {
                const type = passwordInput.type === 'password' ? 'text' : 'password';
                passwordInput.type = type;
                passwordToggle.innerHTML = `<i class="fas fa-${type === 'password' ? 'eye' : 'eye-slash'}"></i>`;
            });
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const submitBtn = document.getElementById('submitBtn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');

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

        // Show loading state
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-flex';

        try {
            const result = await auth.requestPasswordReset(email);

            if (result.success) {
                // Show success message
                document.getElementById('forgotPasswordForm').style.display = 'none';
                document.getElementById('successMessage').style.display = 'block';
                document.getElementById('submittedEmail').textContent = email;
            } else {
                this.showError('email', result.message || 'Failed to send reset instructions');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            this.showError('email', 'An error occurred. Please try again.');
        } finally {
            submitBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
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
}

// Initialize forgot password page
document.addEventListener('DOMContentLoaded', () => {
    new ForgotPasswordPage();
});

