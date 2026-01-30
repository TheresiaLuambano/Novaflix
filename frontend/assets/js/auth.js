/**
 * BurudaniKiganjani - Authentication Manager
 * Handles user authentication state and session management
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        this.currentUser = api.getStoredUser();
        if (this.currentUser && api.token) {
            this.isAuthenticated = true;
            this.updateUI();
        }
    }

    _showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.add('active');
    }

    _hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.remove('active');
    }

    _showToast(message, type = 'info') {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icons = { success: 'fas fa-check-circle', error: 'fas fa-times-circle', warning: 'fas fa-exclamation-triangle', info: 'fas fa-info-circle' };
        toast.innerHTML = `<i class="${icons[type]} toast-icon"></i><span class="toast-message">${message}</span><button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>`;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 5000);
    }

    async login(email, password) {
        try {
            this._showLoading();
            const response = await api.login(email, password);
            if (response.status === 'success') {
                this.currentUser = response.data.user;
                this.isAuthenticated = true;
                this.updateUI();
                this._showToast('Welcome back!', 'success');
                const redirectUrl = response.data.redirect_url || this.getDefaultRedirect();
                setTimeout(() => { window.location.href = redirectUrl; }, 1000);
                return { success: true, redirect_url: redirectUrl, role: response.data.role };
            } else {
                this._showToast(response.message || 'Login failed', 'error');
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error('Login error:', error);
            this._showToast(error.message || 'Login failed', 'error');
            return { success: false, message: error.message };
        } finally {
            this._hideLoading();
        }
    }

    async register(name, email, password, confirmPassword) {
        if (password !== confirmPassword) {
            this._showToast('Passwords do not match', 'error');
            return { success: false };
        }
        if (password.length < 8) {
            this._showToast('Password must be at least 8 characters', 'error');
            return { success: false };
        }
        try {
            this._showLoading();
            const response = await api.register({ name, email, password });
            if (response.status === 'success') {
                this.currentUser = response.data.user;
                this.isAuthenticated = true;
                this.updateUI();
                this._showToast('Account created!', 'success');
                return { success: true };
            } else {
                this._showToast(response.message || 'Registration failed', 'error');
                return { success: false };
            }
        } catch (error) {
            console.error('Registration error:', error);
            this._showToast(error.message || 'Registration failed', 'error');
            return { success: false };
        } finally {
            this._hideLoading();
        }
    }

    async logout(redirect = true) {
        await api.logout();
        this.currentUser = null;
        this.isAuthenticated = false;
        this.updateUI();
        if (redirect) {
            this._showToast('You have been signed out', 'info');
            setTimeout(() => { window.location.href = 'index.html'; }, 1000);
        }
    }

    async loginWithGoogle() {
        try {
            this._showLoading();
            const response = await this.loginWithDemoProvider('google');
            this._hideLoading();
            return response;
        } catch (error) {
            this._hideLoading();
            return await this.loginWithDemoProvider('google');
        }
    }

    async loginWithFacebook() {
        try {
            this._showLoading();
            const response = await this.loginWithDemoProvider('facebook');
            this._hideLoading();
            return response;
        } catch (error) {
            this._hideLoading();
            return await this.loginWithDemoProvider('facebook');
        }
    }

    async loginWithDemoProvider(provider) {
        try {
            const response = await fetch('/BurudaniKiganjani/api/auth/demo-social-login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: provider })
            });
            const data = await response.json();
            if (data.status === 'success') {
                api.setAuthToken(data.data.token);
                api.setStoredUser(data.data.user);
                this.currentUser = data.data.user;
                this.isAuthenticated = true;
                this.updateUI();
                this._showToast('Welcome!', 'success');
                setTimeout(() => { window.location.href = 'index.html'; }, 1500);
                return { success: true };
            } else {
                this._showToast(data.message || 'Login failed', 'error');
                return { success: false };
            }
        } catch (error) {
            this._showToast('Login failed', 'error');
            return { success: false };
        }
    }

    async handleSocialLogin(provider, accessToken) {
        try {
            const response = await api.socialLogin(provider, accessToken);
            if (response.status === 'success') {
                this.currentUser = response.data.user;
                this.isAuthenticated = true;
                this.updateUI();
                this._showToast('Welcome!', 'success');
                setTimeout(() => { window.location.href = 'index.html'; }, 1000);
                return { success: true };
            }
            this._showToast('Login failed', 'error');
            return { success: false };
        } catch (error) {
            this._showToast('Login failed', 'error');
            return { success: false };
        }
    }

    updateUI() {
        const userAvatar = document.getElementById('userAvatar');
        const dropdownAvatar = document.getElementById('dropdownAvatar');
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        const authButtons = document.getElementById('authButtons');
        const userMenu = document.getElementById('userMenu');
        if (this.isAuthenticated && this.currentUser) {
            if (userName) userName.textContent = this.currentUser.name || 'User';
            if (userEmail) userEmail.textContent = this.currentUser.email || '';
            const avatarUrl = this.currentUser.avatar_url || this.currentUser.avatar || 'assets/images/default-avatar.png';
            if (userAvatar) userAvatar.src = avatarUrl;
            if (dropdownAvatar) dropdownAvatar.src = avatarUrl;
            if (authButtons) authButtons.style.display = 'none';
            if (userMenu) userMenu.style.display = '';
            document.querySelectorAll('.auth-required').forEach(el => el.style.display = '');
            document.querySelectorAll('.guest-only').forEach(el => el.style.display = 'none');
        } else {
            if (authButtons) authButtons.style.display = '';
            if (userMenu) userMenu.style.display = 'none';
            document.querySelectorAll('.guest-only').forEach(el => el.style.display = '');
            document.querySelectorAll('.auth-required').forEach(el => el.style.display = 'none');
        }
    }

    requireAuth(redirectUrl = 'login.html') {
        if (!this.isAuthenticated) {
            if (redirectUrl) window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    getDefaultRedirect() {
        if (!this.currentUser) return 'index.html';
        return this.currentUser.role === 'admin' ? 'admin/index.html' : 'index.html';
    }

    hasRole(roles) {
        if (!this.isAuthenticated || !this.currentUser) return false;
        const roleArray = Array.isArray(roles) ? roles : [roles];
        return roleArray.includes(this.currentUser.role);
    }

    isAdmin() { return this.hasRole('admin'); }
    isUser() { return this.hasRole('user'); }

    isPremium() { return this.currentUser?.subscription_plan === 'premium'; }

    canAccessContent(content) {
        if (content.is_premium === 0 || content.access_level === 'free') return true;
        return this.isPremium();
    }

    async updateProfile(profileData) {
        try {
            this._showLoading();
            const response = await api.updateProfile(profileData);
            if (response.status === 'success') {
                this.currentUser = { ...this.currentUser, ...response.data };
                api.setStoredUser(this.currentUser);
                this.updateUI();
                this._showToast('Profile updated', 'success');
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            this._showToast('Failed to update', 'error');
            return { success: false };
        } finally {
            this._hideLoading();
        }
    }
}

const auth = new AuthManager();
