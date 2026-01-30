/**
 * BurudaniKiganjani - Reset Password Page
 * Handles password reset with token from URL
 */

class ResetPasswordPage {
    constructor() {
        this.token = null;
        this.init();
    }

    init() {
        // Check if already logged in - redirect to home
        if (auth.isAuthenticated) {
            window.location.href = 'index.html';
            return;
        }
        
        // Get token from URL
        this.token = this.getTokenFromUrl();
        
        if (!this.token) {
            this.showInvalidTokenMessage();
            return;
        }
        
        this.setupEventListeners();
    }

    getTokenFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('token');
    }

    showInvalidTokenMessage() {
        // Hide form and show invalid token message
        const form = document.getElementById('resetPasswordForm');
        const successMsg = document.getElementById('successMessage');
        
        if (form) form.style.display = 'none';
        if (successMsg) {
            successMsg.style.display = 'block';
            successMsg.innerHTML = `
                <div class="error-icon">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <h2>Invalid Reset Link</h2>
                <p>This password reset link is invalid or has expired.</p>
                <p>Please request a new password reset link.</p>
                <a href="forgot-password.html" class="btn btn-primary btn-full">Request New Link</a>
            `;
        }
    }

    setupEventListeners() {
        const form = document.getElementById('resetPasswordForm');
        const passwordToggle = document.getElementById('passwordToggle');
        const passwordInput = document.getElementById('password');
        const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
        const confirmPasswordInput = document.getElementById('confirmPassword');

        // Form submission
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Password visibility toggles
        this.setupPasswordToggle(passwordToggle, passwordInput);
        this.setupPasswordToggle(confirmPasswordToggle, confirmPasswordInput);

        // Real-time password validation
        const passwordField = document.getElementById('password');
        if (passwordField) {
            passwordField.addEventListener('input', () => this.validatePassword(passwordField.value));
        }

        const confirmPasswordField = document.getElementById('confirmPassword');
        if (confirmPasswordField) {
            confirmPasswordField.addEventListener('input', () => this.validatePasswordMatch());
        }
    }

    setupPasswordToggle(button, input) {
        if (button && input) {
            button.addEventListener('click', () => {
                const type = input.type === 'password' ? 'text' : 'password';
                input.type = type;
                button.innerHTML = `<i class="fas fa-${type === 'password' ? 'eye' : 'eye-slash'}"></i>`;
            });
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const submitBtn = document.getElementById('submitBtn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');

        // Clear previous errors
        this.clearErrors();

        // Validation
        if (!password) {
            this.showError('password', 'New password is required');
            return;
        }

        if (password.length < 8) {
            this.showError('password', 'Password must be at least 8 characters');
            return;
        }

        if (!this.isStrongPassword(password)) {
            this.showError('password', 'Password must include letters, numbers, and symbols');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('confirmPassword', 'Passwords do not match');
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-flex';

        try {
            const result = await auth.resetPassword(this.token, password);

            if (result.success) {
                // Show success message
                document.getElementById('resetPasswordForm').style.display = 'none';
                document.getElementById('successMessage').style.display = 'block';
            } else {
                this.showError('password', result.message || 'Failed to reset password');
                
                // If token is invalid, show proper message
                if (result.message && result.message.includes('invalid')) {
                    this.showInvalidTokenMessage();
                }
            }
        } catch (error) {
            console.error('Reset password error:', error);
            
            // Handle token expiration
            if (error.message && error.message.includes('expired')) {
                this.showInvalidTokenMessage();
            } else {
                this.showError('password', 'An error occurred. Please try again.');
            }
        } finally {
            submitBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    }

    isStrongPassword(password) {
        // At least 8 characters, with letters, numbers, and symbols
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        return hasLetter && hasNumber && hasSymbol;
    }

    validatePassword(password) {
        const strengthEl = document.getElementById('passwordStrength');
        if (!strengthEl) return;

        let strength = 0;
        let message = '';
        let className = '';

        // Length check
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;

        // Complexity checks
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

        // Determine strength level
        if (password.length === 0) {
            message = '';
            className = '';
        } else if (strength <= 2) {
            message = 'Weak';
            className = 'strength-weak';
        } else if (strength <= 3) {
            message = 'Medium';
            className = 'strength-medium';
        } else {
            message = 'Strong';
            className = 'strength-strong';
        }

        if (message) {
            strengthEl.textContent = message;
            strengthEl.className = 'password-strength ' + className;
            strengthEl.style.display = 'block';
        } else {
            strengthEl.style.display = 'none';
        }
    }

    validatePasswordMatch() {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorEl = document.getElementById('confirmPasswordError');

        if (confirmPassword && password !== confirmPassword) {
            if (errorEl) {
                errorEl.textContent = 'Passwords do not match';
                errorEl.style.display = 'flex';
            }
        } else if (errorEl) {
            errorEl.textContent = '';
            errorEl.style.display = 'none';
        }
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

// Initialize reset password page
document.addEventListener('DOMContentLoaded', () => {
    new ResetPasswordPage();
});

