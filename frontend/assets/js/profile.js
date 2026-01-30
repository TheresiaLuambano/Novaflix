/**
 * Profile Page Manager - Fixed avatar upload and display
 */

const profile = {
    userData: null,
    playlists: [],
    currentTab: 'for-you',
    
    init: async function() {
        if (!auth.isAuthenticated) {
            window.location.href = 'login.html';
            return;
        }

        this.setupEventListeners();
        await this.loadProfile();
        await this.loadPlaylists();
        this.hideLoading();
    },

    setupEventListeners: function() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.currentTarget.dataset.tab;
                this.switchTab(tabId);
            });
        });

        // Edit form
        const editForm = document.getElementById('editProfileForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProfile();
            });
        }

        // Avatar file input
        const avatarInput = document.getElementById('avatarFileInput');
        if (avatarInput) {
            avatarInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    // Preview the image first
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        document.getElementById('editAvatarPreview').src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                    
                    // Upload
                    this.uploadAvatar(file);
                }
            });
        }

        // Create playlist form
        const createForm = document.getElementById('createPlaylistForm');
        if (createForm) {
            createForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.savePlaylist();
            });
        }

        // Modal close on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeAllModals();
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    },

    loadProfile: async function() {
        try {
            this.showLoading();
            
            // Get user from localStorage or auth
            const user = auth.currentUser || api.getStoredUser();
            
            if (user && Object.keys(user).length > 0) {
                this.userData = user;
                this.renderProfile(user);
            } else {
                // Fetch from API
                try {
                    const response = await api.getProfile();
                    if (response.status === 'success' && response.data) {
                        const userData = response.data.user || response.data;
                        this.userData = userData;
                        auth.currentUser = userData;
                        api.setStoredUser(userData);
                        this.renderProfile(userData);
                    } else {
                        this.renderDemoProfile();
                    }
                } catch (apiError) {
                    console.warn('API not available, using demo profile');
                    this.renderDemoProfile();
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            this.renderDemoProfile();
        } finally {
            this.hideLoading();
        }
    },

    renderDemoProfile: function() {
        const demoUser = {
            id: 0,
            name: 'Demo User',
            username: 'demouser',
            email: 'demo@example.com',
            bio: 'Welcome to my channel!',
            avatar_url: 'assets/images/default-avatar.png',
            avatar: 'assets/images/default-avatar.png',
            banner_url: '',
            location: '',
            website: '',
            date_of_birth: '',
            subscription_plan: 'free',
            role: 'user'
        };
        
        this.userData = demoUser;
        this.renderProfile(demoUser);
    },

    renderProfile: function(user) {
        console.log('Rendering profile:', user);
        
        // Profile avatar
        const profileAvatar = document.getElementById('profileAvatar');
        if (profileAvatar) {
            const avatarSrc = user.avatar_url || user.avatar || 'assets/images/default-avatar.png';
            profileAvatar.src = avatarSrc;
        }

        // Header avatar
        const headerAvatar = document.getElementById('headerAvatar');
        if (headerAvatar) {
            const avatarSrc = user.avatar_url || user.avatar || 'assets/images/default-avatar.png';
            headerAvatar.src = avatarSrc;
        }

        // Dropdown avatar
        const dropdownAvatar = document.getElementById('dropdownAvatar');
        if (dropdownAvatar) {
            const avatarSrc = user.avatar_url || user.avatar || 'assets/images/default-avatar.png';
            dropdownAvatar.src = avatarSrc;
        }

        // Edit modal avatar preview
        const editAvatarPreview = document.getElementById('editAvatarPreview');
        if (editAvatarPreview) {
            const avatarSrc = user.avatar_url || user.avatar || 'assets/images/default-avatar.png';
            editAvatarPreview.src = avatarSrc;
        }

        // Profile banner
        const profileBanner = document.getElementById('profileBanner');
        if (profileBanner && user.banner_url) {
            profileBanner.style.backgroundImage = `url(${user.banner_url})`;
        }

        // Name
        const profileName = document.getElementById('profileName');
        if (profileName) {
            profileName.textContent = user.name || 'User Name';
        }

        // Dropdown name
        const dropdownName = document.getElementById('dropdownName');
        if (dropdownName) {
            dropdownName.textContent = user.name || 'User';
        }

        // Dropdown email
        const dropdownEmail = document.getElementById('dropdownEmail');
        if (dropdownEmail) {
            dropdownEmail.textContent = user.email || '';
        }

        // Handle/Username
        const profileHandle = document.getElementById('profileHandle');
        if (profileHandle) {
            profileHandle.textContent = '@' + (user.username || user.handle || 'username');
        }

        // Bio
        const profileBio = document.getElementById('profileBio');
        if (profileBio) {
            profileBio.textContent = user.bio || 'Welcome to my channel!';
        }

        // Location
        const profileLocation = document.getElementById('profileLocation');
        if (profileLocation) {
            if (user.location) {
                profileLocation.innerHTML = '<i class="fas fa-map-marker-alt"></i> ' + user.location;
            } else {
                profileLocation.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
            }
        }

        // Website
        const profileWebsite = document.getElementById('profileWebsite');
        if (profileWebsite) {
            profileWebsite.textContent = user.website || '';
        }

        // Subscription plan
        const profilePlan = document.getElementById('profilePlan');
        if (profilePlan) {
            profilePlan.textContent = (user.subscription_plan || 'free').toUpperCase();
        }

        // Role
        const profileRole = document.getElementById('profileRole');
        if (profileRole) {
            profileRole.textContent = (user.role || 'user').toUpperCase();
        }

        // Stats
        const subscriberCount = document.getElementById('subscriberCount');
        if (subscriberCount) {
            subscriberCount.textContent = this.formatNumber(user.subscribers_count || 0);
        }

        const followingCount = document.getElementById('followingCount');
        if (followingCount) {
            followingCount.textContent = this.formatNumber(user.following_count || 0);
        }

        const totalViews = document.getElementById('totalViews');
        if (totalViews) {
            totalViews.textContent = this.formatNumber(user.total_views || 0);
        }

        // Populate edit form
        this.populateEditForm(user);
    },

    populateEditForm: function(user) {
        const editName = document.getElementById('editName');
        const editHandle = document.getElementById('editHandle');
        const editBio = document.getElementById('editBio');
        const editLocation = document.getElementById('editLocation');
        const editWebsite = document.getElementById('editWebsite');
        const editDob = document.getElementById('editDob');
        const editEmail = document.getElementById('editEmail');
        const editSubscription = document.getElementById('editSubscription');

        if (editName) editName.value = user.name || '';
        if (editHandle) editHandle.value = user.username || user.handle || '';
        if (editBio) editBio.value = user.bio || '';
        if (editLocation) editLocation.value = user.location || '';
        if (editWebsite) editWebsite.value = user.website || '';
        if (editDob) editDob.value = user.date_of_birth || '';
        if (editEmail) editEmail.value = user.email || '';
        if (editSubscription) editSubscription.value = user.subscription_plan || 'free';
    },

    editProfile: function() {
        const modal = document.getElementById('editProfileModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    closeEditProfile: function() {
        const modal = document.getElementById('editProfileModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    saveProfile: async function() {
        const name = document.getElementById('editName')?.value?.trim();
        const username = document.getElementById('editHandle')?.value?.trim();
        const bio = document.getElementById('editBio')?.value?.trim();
        const location = document.getElementById('editLocation')?.value?.trim();
        const website = document.getElementById('editWebsite')?.value?.trim();
        const dateOfBirth = document.getElementById('editDob')?.value?.trim();

        if (!name) {
            this.showToast('Please enter your name', 'warning');
            return;
        }

        try {
            this.showLoading();
            
            const response = await api.updateProfile({
                name: name,
                username: username,
                bio: bio,
                location: location,
                website: website,
                date_of_birth: dateOfBirth
            });

            if (response.status === 'success') {
                const updatedUser = response.data?.user || response.data;
                this.userData = { ...this.userData, ...updatedUser };
                auth.currentUser = this.userData;
                api.setStoredUser(this.userData);
                
                this.renderProfile(this.userData);
                this.closeEditProfile();
                this.showToast('Profile updated successfully!', 'success');
            } else {
                this.showToast(response.message || 'Failed to update profile', 'error');
            }
        } catch (error) {
            console.warn('Error saving profile:', error.message);
            // Update locally
            this.userData = { 
                ...this.userData, 
                name, 
                username, 
                bio, 
                location, 
                website, 
                date_of_birth: dateOfBirth 
            };
            auth.currentUser = this.userData;
            api.setStoredUser(this.userData);
            this.renderProfile(this.userData);
            this.closeEditProfile();
            this.showToast('Profile updated locally', 'info');
        } finally {
            this.hideLoading();
        }
    },

    uploadAvatar: async function(file) {
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            this.showToast('Please select a valid image (JPEG, PNG, GIF, WebP)', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            this.showToast('Image size must be less than 5MB', 'error');
            return;
        }

        try {
            this.showLoading();
            
            const formData = new FormData();
            formData.append('avatar', file);
            // Include name to prevent it from being reset
            if (this.userData?.name) {
                formData.append('name', this.userData.name);
            }

            // Use direct fetch with proper error handling
            const url = `${api.baseUrl}/user/update.php`;
            const headers = {};
            if (api.token) {
                headers['Authorization'] = `Bearer ${api.token}`;
            }

            const response = await fetch(url, {
                method: 'PUT',
                headers,
                body: formData
            });

            // Get response text first
            const responseText = await response.text();
            
            if (!responseText || responseText.trim() === '') {
                throw new Error('Server returned empty response');
            }

            const data = JSON.parse(responseText);
            console.log('Avatar upload response:', data);

            if (data.status === 'success') {
                // Get the avatar URL from response
                const avatarUrl = data.data?.avatar_url || 
                                 data.data?.user?.avatar_url || 
                                 data.data?.user?.avatar;
                
                console.log('Avatar URL:', avatarUrl);
                
                if (avatarUrl) {
                    this.userData.avatar_url = avatarUrl;
                    this.userData.avatar = avatarUrl;
                }
                
                auth.currentUser = this.userData;
                api.setStoredUser(this.userData);
                
                // Update all avatar displays
                this.renderProfile(this.userData);
                this.showToast('Avatar updated successfully!', 'success');
            } else {
                this.showToast(data.message || 'Failed to upload avatar', 'error');
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
            this.showToast('Error uploading avatar: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    },

    uploadBanner: async function(file) {
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            this.showToast('Please select a valid image', 'error');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            this.showToast('Image size must be less than 10MB', 'error');
            return;
        }

        try {
            this.showLoading();
            
            const formData = new FormData();
            formData.append('banner', file);
            if (this.userData?.name) {
                formData.append('name', this.userData.name);
            }

            const response = await fetch(`${api.baseUrl}/user/update.php`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${api.token}`
                },
                body: formData
            });

            const data = await response.json();
            console.log('Banner upload response:', data);

            if (data.status === 'success') {
                const bannerUrl = data.data?.banner_url;
                if (bannerUrl) {
                    this.userData.banner_url = bannerUrl;
                }
                
                auth.currentUser = this.userData;
                api.setStoredUser(this.userData);
                
                // Update banner display
                const profileBanner = document.getElementById('profileBanner');
                if (profileBanner && bannerUrl) {
                    profileBanner.style.backgroundImage = `url(${bannerUrl})`;
                }
                
                this.showToast('Banner updated successfully!', 'success');
            } else {
                this.showToast(data.message || 'Failed to upload banner', 'error');
            }
        } catch (error) {
            console.error('Error uploading banner:', error);
            this.showToast('Error uploading banner: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    },

    loadPlaylists: async function() {
        const grid = document.getElementById('playlistsGrid');
        if (!grid) return;

        try {
            const response = await api.getPlaylists({ limit: 50 });
            
            if (response.status === 'success' && response.data?.playlists) {
                this.playlists = response.data.playlists;
            } else {
                this.playlists = [];
            }
            this.renderPlaylists();
        } catch (error) {
            console.warn('Error loading playlists:', error.message);
            this.playlists = [];
            this.renderPlaylists();
        }
    },

    renderPlaylists: function() {
        const grid = document.getElementById('playlistsGrid');
        if (!grid) return;

        if (this.playlists.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="fas fa-layer-group"></i>
                    <h3>No playlists yet</h3>
                    <p>Create your first playlist</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.playlists.map(playlist => `
            <div class="playlist-card">
                <div class="playlist-thumbnail">
                    <img src="${playlist.thumbnail || 'assets/images/placeholder.jpg'}" 
                         alt="${this.escapeHtml(playlist.title)}"
                         onerror="this.src='assets/images/placeholder.jpg'">
                </div>
                <div class="playlist-info">
                    <h4>${this.escapeHtml(playlist.title)}</h4>
                </div>
        `).join('');
    },

    createPlaylist: function() {
        const modal = document.getElementById('createPlaylistModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            const form = document.getElementById('createPlaylistForm');
            if (form) form.reset();
        }
    },

    closeCreatePlaylist: function() {
        const modal = document.getElementById('createPlaylistModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    savePlaylist: async function() {
        const name = document.getElementById('playlistName')?.value?.trim();
        const description = document.getElementById('playlistDescription')?.value?.trim();

        if (!name) {
            this.showToast('Please enter a playlist name', 'warning');
            return;
        }

        try {
            this.showLoading();
            const response = await api.createPlaylist(name, description);

            if (response.status === 'success') {
                await this.loadPlaylists();
                this.closeCreatePlaylist();
                this.showToast('Playlist created!', 'success');
            } else {
                this.showToast(response.message || 'Failed to create', 'error');
            }
        } catch (error) {
            this.showToast('Error creating playlist', 'error');
        } finally {
            this.hideLoading();
        }
    },

    switchTab: function(tabId) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `panel-${tabId}`);
        });
        this.currentTab = tabId;
    },

    closeAllModals: function() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    },

    showLoading: function() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.add('active');
    },

    hideLoading: function() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.remove('active');
    },

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

    formatNumber: function(num) {
        if (num === null || num === undefined) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    },

    escapeHtml: function(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    profile.init();
});

// Event handlers for buttons
document.addEventListener('DOMContentLoaded', () => {
    // Edit profile button
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => profile.editProfile());
    }
    
    // Close edit modal
    const closeEditModal = document.getElementById('closeEditModal');
    if (closeEditModal) {
        closeEditModal.addEventListener('click', () => profile.closeEditProfile());
    }
    
    // Cancel edit
    const cancelEdit = document.getElementById('cancelEdit');
    if (cancelEdit) {
        cancelEdit.addEventListener('click', () => profile.closeEditProfile());
    }
    
    // Edit avatar button
    const editAvatarBtn = document.querySelector('.edit-avatar-btn');
    if (editAvatarBtn) {
        editAvatarBtn.addEventListener('click', () => {
            const input = document.getElementById('avatarFileInput');
            if (input) input.click();
        });
    }
    
    // Edit banner button
    const editBannerBtn = document.querySelector('.edit-banner-btn');
    if (editBannerBtn) {
        editBannerBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) profile.uploadBanner(file);
            };
            input.click();
        });
    }
});
