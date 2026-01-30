/**
 * BurudaniKiganjani - Register Page
 * Handles new user registration
 */

class RegisterPage {
    constructor() {
        this.init();
    }

    init() {
        // Check if already logged in
        auth.requireGuest('index.html');
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        const registerForm = document.getElementById('registerForm');
        const passwordToggle = document.getElementById('passwordToggle');
        const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');

        // Form submission
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Password visibility toggles
        this.setupPasswordToggle(passwordToggle, passwordInput);
        this.setupPasswordToggle(confirmPasswordToggle, confirmPasswordInput);

        // Social login buttons
        const googleBtn = document.getElementById('googleBtn');
        const facebookBtn = document.getElementById('facebookBtn');

        if (googleBtn) {
            googleBtn.addEventListener('click', () => this.handleGoogleLogin());
        }

        if (facebookBtn) {
            facebookBtn.addEventListener('click', () => this.handleFacebookLogin());
        }

        // Real-time validation
        const inputs = registerForm?.querySelectorAll('.form-input');
        inputs?.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
        });
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

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const submitBtn = document.getElementById('submitBtn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');

        // Clear previous errors
        this.clearErrors();

        // Validation
        if (!name) {
            this.showError('name', 'Full name is required');
            return;
        }

        if (name.length < 2) {
            this.showError('name', 'Please enter your full name');
            return;
        }

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
            const result = await auth.register(name, email, password, confirmPassword);

            if (result.success) {
                Toast.success('Account created successfully!');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                this.showError('email', result.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('email', 'An error occurred. Please try again.');
        } finally {
            submitBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    }

    validateField(input) {
        const field = input.id;
        const value = input.value.trim();

        switch (field) {
            case 'name':
                if (value && value.length < 2) {
                    this.showError(field, 'Name must be at least 2 characters');
                }
                break;
            case 'email':
                if (value && !this.isValidEmail(value)) {
                    this.showError(field, 'Please enter a valid email address');
                }
                break;
            case 'password':
                if (value && value.length < 8) {
                    this.showError(field, 'Password must be at least 8 characters');
                }
                break;
            case 'confirmPassword':
                const password = document.getElementById('password').value;
                if (value && value !== password) {
                    this.showError(field, 'Passwords do not match');
                }
                break;
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isStrongPassword(password) {
        // At least 8 characters, with letters, numbers, and symbols
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        return hasLetter && hasNumber && hasSymbol;
    }

    async handleGoogleLogin() {
        try {
            const result = await auth.loginWithGoogle();
            
            if (!result.success && !result.pending) {
                if (result.message && result.message.includes('SDK')) {
                    Toast.info('Google signup: Please configure OAuth credentials in config.php');
                }
            }
        } catch (error) {
            console.error('Google signup error:', error);
            Toast.error('Failed to initialize Google signup');
        }
    }

    async handleFacebookLogin() {
        try {
            const result = await auth.loginWithFacebook();
            
            if (!result.success && !result.pending) {
                if (result.message && result.message.includes('SDK')) {
                    Toast.info('Facebook signup: Please configure OAuth credentials in config.php');
                }
            }
        } catch (error) {
            console.error('Facebook signup error:', error);
            Toast.error('Failed to initialize Facebook signup');
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

// Initialize register page
document.addEventListener('DOMContentLoaded', () => {
    new RegisterPage();
});

