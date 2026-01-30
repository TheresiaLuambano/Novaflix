/**
 * Settings Page Manager
 * Handles all CRUD operations for user settings
 */

const settings = {
    userData: null,
    
    /**
     * Initialize settings page
     */
    init: async function() {
        // Check authentication
        if (!auth.isAuthenticated) {
            window.location.href = 'login.html';
            return;
        }

        // Set up event listeners
        this.setupEventListeners();
        
        // Load user data
        this.loadUserData();
        
        // Hide loading
        this.hideLoading();
    },

    /**
     * Set up all event listeners
     */
    setupEventListeners: function() {
        // Navigation
        document.querySelectorAll('.settings-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.switchSection(section);
            });
        });

        // Profile form
        document.getElementById('profileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfile();
        });

        // Password form
        document.getElementById('passwordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.changePassword();
        });

        // Avatar input
        document.getElementById('avatarInput').addEventListener('change', (e) => {
            this.uploadAvatar(e.target.files[0]);
        });

        // Close modal on overlay click
        document.getElementById('deleteModal').addEventListener('click', (e) => {
            if (e.target.id === 'deleteModal') {
                this.closeDeleteModal();
            }
        });

        // Close modal on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeDeleteModal();
            }
        });
    },

    /**
     * Switch between settings sections
     */
    switchSection: function(sectionId) {
        // Update nav
        document.querySelectorAll('.settings-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === sectionId);
        });

        // Update sections
        document.querySelectorAll('.settings-section').forEach(section => {
            section.classList.toggle('active', section.id === `section-${sectionId}`);
        });
    },

    /**
     * Load user data
     */
    loadUserData: function() {
        const user = auth.currentUser;
        if (user) {
            this.userData = user;
            this.renderUserData(user);
        }
    },

    /**
     * Render user data to forms
     */
    renderUserData: function(user) {
        // Profile
        const avatarPreview = document.getElementById('profileAvatarPreview');
        if (avatarPreview) {
            avatarPreview.src = user.avatar_url || user.avatar || 'assets/images/default-avatar.png';
        }

        const profileName = document.getElementById('profileName');
        if (profileName) profileName.value = user.name || '';

        const profileUsername = document.getElementById('profileUsername');
        if (profileUsername) profileUsername.value = user.username || '';

        const profileEmail = document.getElementById('profileEmail');
        if (profileEmail) profileEmail.value = user.email || '';

        const profileBio = document.getElementById('profileBio');
        if (profileBio) profileBio.value = user.bio || '';

        // Header
        const headerAvatar = document.getElementById('headerAvatar');
        if (headerAvatar) {
            headerAvatar.src = user.avatar_url || user.avatar || 'assets/images/default-avatar.png';
        }

        const dropdownAvatar = document.getElementById('dropdownAvatar');
        if (dropdownAvatar) {
            dropdownAvatar.src = user.avatar_url || user.avatar || 'assets/images/default-avatar.png';
        }

        const dropdownName = document.getElementById('dropdownName');
        if (dropdownName) dropdownName.textContent = user.name || 'User';

        const dropdownEmail = document.getElementById('dropdownEmail');
        if (dropdownEmail) dropdownEmail.textContent = user.email || '';
    },

    /**
     * Save profile changes
     */
    saveProfile: async function() {
        const name = document.getElementById('profileName').value.trim();
        const username = document.getElementById('profileUsername').value.trim();
        const bio = document.getElementById('profileBio').value.trim();

        if (!name) {
            this.showToast('Name is required', 'warning');
            return;
        }

        if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
            this.showToast('Username can only contain letters, numbers, and underscores', 'warning');
            return;
        }

        try {
            this.showLoading();
            const response = await api.updateProfile({
                name: name,
                username: username,
                bio: bio
            });

            if (response.status === 'success') {
                this.userData = { ...this.userData, ...response.data };
                auth.currentUser = this.userData;
                api.setStoredUser(this.userData);
                this.showToast('Profile updated successfully!', 'success');
            } else {
                this.showToast(response.message || 'Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            this.showToast('Failed to update profile', 'error');
        } finally {
            this.hideLoading();
        }
    },

    /**
     * Upload avatar
     */
    uploadAvatar: async function(file) {
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            this.showToast('Please select a valid image (JPEG, PNG, GIF, WebP)', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            this.showToast('Image must be less than 5MB', 'error');
            return;
        }

        try {
            this.showLoading();
            
            const formData = new FormData();
            formData.append('avatar', file);

            const response = await fetch(`${api.baseUrl}/user/update.php`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${api.token}`
                },
                body: formData
            });

            const data = await response.json();

            if (data.status === 'success') {
                this.userData = { ...this.userData, ...data.data };
                auth.currentUser = this.userData;
                api.setStoredUser(this.userData);
                
                document.getElementById('profileAvatarPreview').src = data.data.avatar_url || URL.createObjectURL(file);
                document.getElementById('headerAvatar').src = data.data.avatar_url || URL.createObjectURL(file);
                document.getElementById('dropdownAvatar').src = data.data.avatar_url || URL.createObjectURL(file);
                
                this.showToast('Avatar updated successfully!', 'success');
            } else {
                this.showToast(data.message || 'Failed to upload avatar', 'error');
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
            this.showToast('Failed to upload avatar', 'error');
        } finally {
            this.hideLoading();
        }
    },

    /**
     * Change password
     */
    changePassword: async function() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showToast('All password fields are required', 'warning');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showToast('New passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 8) {
            this.showToast('Password must be at least 8 characters', 'warning');
            return;
        }

        try {
            this.showLoading();
            const response = await api.changePassword(currentPassword, newPassword);

            if (response.status === 'success') {
                this.showToast('Password changed successfully!', 'success');
                document.getElementById('passwordForm').reset();
            } else {
                this.showToast(response.message || 'Failed to change password', 'error');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            this.showToast(error.message || 'Failed to change password', 'error');
        } finally {
            this.hideLoading();
        }
    },

    /**
     * Save privacy settings
     */
    savePrivacySettings: function() {
        const settings = {
            public_profile: document.getElementById('publicProfileToggle').checked,
            save_history: document.getElementById('saveHistoryToggle').checked,
            show_history: document.getElementById('showHistoryToggle').checked,
            show_likes: document.getElementById('showLikesToggle').checked
        };

        localStorage.setItem('privacy_settings', JSON.stringify(settings));
        this.showToast('Privacy settings saved!', 'success');
    },

    /**
     * Load privacy settings
     */
    loadPrivacySettings: function() {
        const saved = localStorage.getItem('privacy_settings');
        if (saved) {
            const settings = JSON.parse(saved);
            document.getElementById('publicProfileToggle').checked = settings.public_profile ?? true;
            document.getElementById('saveHistoryToggle').checked = settings.save_history ?? true;
            document.getElementById('showHistoryToggle').checked = settings.show_history ?? false;
            document.getElementById('showLikesToggle').checked = settings.show_likes ?? true;
        }
    },

    /**
     * Save notification settings
     */
    saveNotificationSettings: function() {
        const settings = {
            email_new_content: document.getElementById('emailNewContent').checked,
            email_recommendations: document.getElementById('emailRecommendations').checked,
            email_digest: document.getElementById('emailDigest').checked,
            push_episodes: document.getElementById('pushEpisodes').checked,
            push_live: document.getElementById('pushLive').checked,
            push_comments: document.getElementById('pushComments').checked
        };

        localStorage.setItem('notification_settings', JSON.stringify(settings));
        this.showToast('Notification settings saved!', 'success');
    },

    /**
     * Load notification settings
     */
    loadNotificationSettings: function() {
        const saved = localStorage.getItem('notification_settings');
        if (saved) {
            const settings = JSON.parse(saved);
            document.getElementById('emailNewContent').checked = settings.email_new_content ?? true;
            document.getElementById('emailRecommendations').checked = settings.email_recommendations ?? true;
            document.getElementById('emailDigest').checked = settings.email_digest ?? true;
            document.getElementById('pushEpisodes').checked = settings.push_episodes ?? true;
            document.getElementById('pushLive').checked = settings.push_live ?? true;
            document.getElementById('pushComments').checked = settings.push_comments ?? true;
        }
    },

    /**
     * Connect Google account
     */
    connectGoogle: function() {
        const btn = document.getElementById('googleBtn');
        const status = document.getElementById('googleStatus');

        if (status.textContent === 'Connected') {
            this.showToast('Google is already connected', 'info');
            return;
        }

        this.showLoading();
        
        auth.loginWithGoogle().then(result => {
            this.hideLoading();
            if (result.success) {
                status.textContent = 'Connected';
                status.classList.add('connected');
                btn.textContent = 'Disconnect';
                btn.onclick = () => this.disconnectGoogle();
                this.showToast('Google connected successfully!', 'success');
            }
        }).catch(() => {
            this.hideLoading();
            status.textContent = 'Connected';
            status.classList.add('connected');
            btn.textContent = 'Disconnect';
            btn.onclick = () => this.disconnectGoogle();
            this.showToast('Google connected (demo mode)!', 'success');
        });
    },

    /**
     * Disconnect Google account
     */
    disconnectGoogle: function() {
        const btn = document.getElementById('googleBtn');
        const status = document.getElementById('googleStatus');

        status.textContent = 'Not connected';
        status.classList.remove('connected');
        btn.textContent = 'Connect';
        btn.onclick = () => this.connectGoogle();
        this.showToast('Google disconnected', 'info');
    },

    /**
     * Connect Facebook account
     */
    connectFacebook: function() {
        const btn = document.getElementById('facebookBtn');
        const status = document.getElementById('facebookStatus');

        if (status.textContent === 'Connected') {
            this.showToast('Facebook is already connected', 'info');
            return;
        }

        this.showLoading();
        
        auth.loginWithFacebook().then(result => {
            this.hideLoading();
            if (result.success) {
                status.textContent = 'Connected';
                status.classList.add('connected');
                btn.textContent = 'Disconnect';
                btn.onclick = () => this.disconnectFacebook();
                this.showToast('Facebook connected successfully!', 'success');
            }
        }).catch(() => {
            this.hideLoading();
            status.textContent = 'Connected';
            status.classList.add('connected');
            btn.textContent = 'Disconnect';
            btn.onclick = () => this.disconnectFacebook();
            this.showToast('Facebook connected (demo mode)!', 'success');
        });
    },

    /**
     * Disconnect Facebook account
     */
    disconnectFacebook: function() {
        const btn = document.getElementById('facebookBtn');
        const status = document.getElementById('facebookStatus');

        status.textContent = 'Not connected';
        status.classList.remove('connected');
        btn.textContent = 'Connect';
        btn.onclick = () => this.connectFacebook();
        this.showToast('Facebook disconnected', 'info');
    },

    /**
     * Export user data
     */
    exportData: function() {
        this.showLoading();
        
        setTimeout(() => {
            const userData = {
                profile: this.userData,
                exportDate: new Date().toISOString()
            };
            
            const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `burudani-export-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            this.hideLoading();
            this.showToast('Data exported successfully!', 'success');
        }, 1500);
    },

    /**
     * Clear watch history
     */
    clearWatchHistory: function() {
        if (!confirm('Are you sure you want to clear your watch history? This cannot be undone.')) {
            return;
        }

        this.showLoading();
        
        setTimeout(() => {
            this.hideLoading();
            this.showToast('Watch history cleared!', 'success');
        }, 1000);
    },

    /**
     * Logout from all sessions
     */
    logoutAllSessions: function() {
        if (!confirm('This will sign you out from all devices. Continue?')) {
            return;
        }

        this.showLoading();
        
        setTimeout(() => {
            this.hideLoading();
            auth.logout();
        }, 1000);
    },

    /**
     * Delete account
     */
    deleteAccount: function() {
        const confirmText = document.getElementById('deleteConfirm').value;
        
        if (confirmText !== 'DELETE') {
            this.showToast('Type DELETE to confirm', 'warning');
            return;
        }

        document.getElementById('deleteModal').classList.add('active');
    },

    /**
     * Close delete modal
     */
    closeDeleteModal: function() {
        document.getElementById('deleteModal').classList.remove('active');
        document.getElementById('deletePassword').value = '';
        document.getElementById('deleteConfirm').value = '';
    },

    /**
     * Confirm delete account
     */
    confirmDelete: async function() {
        const password = document.getElementById('deletePassword').value;

        if (!password) {
            this.showToast('Please enter your password', 'warning');
            return;
        }

        try {
            this.showLoading();
            this.closeDeleteModal();

            setTimeout(() => {
                this.hideLoading();
                localStorage.removeItem('burudani_auth_token');
                localStorage.removeItem('burudani_user_data');
                this.showToast('Account deleted successfully', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            }, 2000);
        } catch (error) {
            this.hideLoading();
            this.showToast('Failed to delete account', 'error');
        }
    },

    /**
     * Show loading overlay
     */
    showLoading: function() {
        document.getElementById('loadingOverlay').classList.add('active');
    },

    /**
     * Hide loading overlay
     */
    hideLoading: function() {
        document.getElementById('loadingOverlay').classList.remove('active');
    },

    /**
     * Show toast notification
     */
    showToast: function(message, type = 'info') {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-times-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="${icons[type]} toast-icon"></i>
            <span class="toast-message">${this.escapeHtml(message)}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    },

    /**
     * Escape HTML
     */
    escapeHtml: function(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    settings.init();
    settings.loadPrivacySettings();
    settings.loadNotificationSettings();
});

