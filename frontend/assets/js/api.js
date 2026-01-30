/**
 * BurudaniKiganjani - API Client
 * Handles all API requests to the backend
 */

// Auto-detect base URL
const getBaseUrl = () => {
    // Get the current path and port
    const path = window.location.pathname;
    const port = window.location.port;
    
    // Build base URL using window.location.origin (includes protocol, host, and port)
    const origin = window.location.origin;
    
    // Check if we're in the BurudaniKiganjani directory or frontend subdirectory
    if (path.includes('/BurudaniKiganjani/') || path.includes('/frontend/')) {
        return `${origin}/BurudaniKiganjani/api`;
    }
    
    // Default to include BurudaniKiganjani path
    return `${origin}/BurudaniKiganjani/api`;
};

const API_BASE_URL = getBaseUrl();
const AUTH_TOKEN_KEY = 'burudani_auth_token';
const USER_DATA_KEY = 'burudani_user_data';

class ApiClient {
    constructor() {
        this.baseUrl = API_BASE_URL;
        this.token = this.getAuthToken();
    }

    // ========== Token Management ==========
    
    getAuthToken() {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    }

    setAuthToken(token) {
        this.token = token;
        localStorage.setItem(AUTH_TOKEN_KEY, token);
    }

    removeAuthToken() {
        this.token = null;
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);
    }

    getStoredUser() {
        const userData = localStorage.getItem(USER_DATA_KEY);
        return userData ? JSON.parse(userData) : null;
    }

    setStoredUser(user) {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    }

    // ========== API Request ==========
    
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);
            
            // Get response text first to handle empty responses
            const responseText = await response.text();
            
            if (!responseText || responseText.trim() === '') {
                // Handle empty responses - return success if HTTP status is OK
                if (response.ok) {
                    return { status: 'success', message: 'OK', data: null };
                }
                throw {
                    status: response.status,
                    message: `Server returned empty response (HTTP ${response.status})`,
                    errors: {}
                };
            }

            try {
                const data = JSON.parse(responseText);
                
                if (!response.ok) {
                    throw {
                        status: response.status,
                        message: data.message || `Request failed with HTTP ${response.status}`,
                        errors: data.errors || {}
                    };
                }

                return data;
            } catch (parseError) {
                console.error(`JSON Parse Error [${endpoint}]:`, responseText);
                throw {
                    status: response.status,
                    message: 'Invalid JSON response from server',
                    errors: {},
                    rawResponse: responseText.substring(0, 500)
                };
            }
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    // ========== Authentication ==========
    
    async register(userData) {
        const response = await this.request('/auth/register.php', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        if (response.data && response.data.token) {
            this.setAuthToken(response.data.token);
            this.setStoredUser(response.data.user);
        }

        return response;
    }

    async login(email, password) {
        const response = await this.request('/auth/login.php', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (response.data && response.data.token) {
            this.setAuthToken(response.data.token);
            this.setStoredUser(response.data.user);
        }

        return response;
    }

    async logout() {
        try {
            await this.request('/auth/logout.php', {
                method: 'POST'
            });
        } catch (error) {
            console.log('Logout API call failed, but continuing with local logout');
        }

        this.removeAuthToken();
        window.location.href = 'login.html';
    }

    async verifyToken() {
        if (!this.token) {
            return { valid: false };
        }

        try {
            const response = await this.request('/auth/verify.php');
            return { valid: response.status === 'success', user: response.data };
        } catch (error) {
            this.removeAuthToken();
            return { valid: false };
        }
    }

    async changePassword(currentPassword, newPassword) {
        return await this.request('/auth/change-password.php', {
            method: 'POST',
            body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
        });
    }

    async forgotPassword(email) {
        return await this.request('/auth/forgot-password.php', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    }

    async resetPassword(token, newPassword) {
        return await this.request('/auth/reset-password.php', {
            method: 'POST',
            body: JSON.stringify({ token, new_password: newPassword })
        });
    }

    /**
     * Social login (Google/Facebook)
     * @param {string} provider - 'google' or 'facebook'
     * @param {string} accessToken - OAuth access token
     */
    async socialLogin(provider, accessToken) {
        const response = await this.request('/auth/social-login.php', {
            method: 'POST',
            body: JSON.stringify({ provider, access_token: accessToken })
        });

        if (response.data && response.data.token) {
            this.setAuthToken(response.data.token);
            this.setStoredUser(response.data.user);
        }

        return response;
    }

    /**
     * Send email verification
     */
    async sendEmailVerification() {
        return await this.request('/auth/verify-email.php', {
            method: 'POST'
        });
    }

    /**
     * Verify email token
     * @param {string} token - Verification token
     * @param {number} userId - User ID
     */
    async verifyEmailToken(token, userId) {
        const response = await this.request('/auth/verify-token.php', {
            method: 'POST',
            body: JSON.stringify({ token, user_id: userId })
        });

        if (response.data && response.data.token) {
            this.setAuthToken(response.data.token);
            this.setStoredUser(response.data.user);
        }

        return response;
    }

    // ========== User ==========
    
    async getProfile() {
        return await this.request('/user/profile.php');
    }

    async updateProfile(userData) {
        return await this.request('/user/update.php', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    async getWatchHistory(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/user/history.php${query ? '?' + query : ''}`);
    }

    // ========== Content ==========
    
    async getContentList(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/content/list.php${query ? '?' + query : ''}`);
    }

    async getContentDetail(id) {
        return await this.request(`/content/detail.php?id=${id}`);
    }

    async searchContent(query, params = {}) {
        const searchParams = { q: query, ...params };
        const queryString = new URLSearchParams(searchParams).toString();
        return await this.request(`/content/search.php?${queryString}`);
    }

    async getFeaturedContent() {
        return await this.request('/content/featured.php');
    }

    async getTrendingContent(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/content/trending.php${query ? '?' + query : ''}`);
    }

    async getContentByGenre(genre, params = {}) {
        const query = new URLSearchParams({ genre, ...params }).toString();
        return await this.request(`/content/byGenre.php?${query}`);
    }

    async getContentByType(type, params = {}) {
        const query = new URLSearchParams({ type, ...params }).toString();
        return await this.request(`/content/byType.php?${query}`);
    }

    /**
     * Create new content (movie, series, short)
     * @param {FormData} formData - Form data with content fields and files
     */
    async createContent(formData) {
        const url = `${this.baseUrl}/content/create.php`;
        
        const headers = {};
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: formData
            });

            // Get response text first to handle empty responses
            const responseText = await response.text();
            
            if (!responseText || responseText.trim() === '') {
                throw {
                    status: response.status,
                    message: 'Server returned an empty response. Please check the PHP error logs.',
                    errors: {}
                };
            }

            try {
                const data = JSON.parse(responseText);
                
                if (!response.ok) {
                    throw {
                        status: response.status,
                        message: data.message || 'An error occurred',
                        errors: data.errors || {}
                    };
                }

                return data;
            } catch (parseError) {
                console.error('JSON Parse Error:', responseText);
                throw {
                    status: response.status,
                    message: 'Invalid JSON response from server',
                    errors: {},
                    rawResponse: responseText.substring(0, 500)
                };
            }
        } catch (error) {
            console.error('API Error [create content]:', error);
            throw error;
        }
    }

    async getContentDetail(id) {
        return await this.request(`/content/detail.php?id=${id}`);
    }
    
    async getEpisodes(contentId, params = {}) {
        const query = new URLSearchParams({ content_id: contentId, ...params }).toString();
        return await this.request(`/episodes/list.php?${query}`);
    }

    async getEpisodeDetail(id) {
        return await this.request(`/episodes/detail.php?id=${id}`);
    }

    // ========== Favorites ==========
    
    async getFavorites(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/favorites/list.php${query ? '?' + query : ''}`);
    }

    async addToFavorites(contentId) {
        return await this.request('/favorites/add.php', {
            method: 'POST',
            body: JSON.stringify({ content_id: contentId })
        });
    }

    async removeFromFavorites(contentId) {
        return await this.request(`/favorites/remove.php?id=${contentId}`, {
            method: 'DELETE'
        });
    }

    async isFavorite(contentId) {
        const favorites = await this.getFavorites();
        return favorites.data?.some(f => f.content_id === contentId || f.id === contentId);
    }

    // ========== Watch Later ==========
    
    async getWatchLater(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/watch/later.php${query ? '?' + query : ''}`);
    }

    async addToWatchLater(contentId) {
        return await this.request('/watch/later.php', {
            method: 'POST',
            body: JSON.stringify({ content_id: contentId })
        });
    }

    async removeFromWatchLater(contentId) {
        return await this.request(`/watch/later.php?id=${contentId}`, {
            method: 'DELETE'
        });
    }

    // ========== Watch Progress ==========
    
    async getWatchProgress(contentId) {
        return await this.request(`/watch/progress.php?content_id=${contentId}`);
    }

    async updateWatchProgress(contentId, progress, episodeId = null) {
        const body = { content_id: contentId, progress };
        if (episodeId) body.episode_id = episodeId;

        return await this.request('/watch/progress.php', {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    async getWatchHistory(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/watch/history.php${query ? '?' + query : ''}`);
    }

    // ========== Ratings ==========
    
    async rateContent(contentId, rating, review = '') {
        return await this.request('/ratings/rate.php', {
            method: 'POST',
            body: JSON.stringify({ content_id: contentId, rating, review })
        });
    }

    async getContentRatings(contentId) {
        return await this.request(`/ratings/content.php?content_id=${contentId}`);
    }

    async getUserRatings() {
        return await this.request('/ratings/user.php');
    }

    // ========== Comments ==========
    
    async getComments(contentId, params = {}) {
        const query = new URLSearchParams({ content_id: contentId, ...params }).toString();
        return await this.request(`/comments/list.php?${query}`);
    }

    async createComment(contentId, comment, parentId = null) {
        const body = { content_id: contentId, comment };
        if (parentId) body.parent_id = parentId;

        return await this.request('/comments/create.php', {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    async updateComment(commentId, comment) {
        return await this.request('/comments/update.php', {
            method: 'PUT',
            body: JSON.stringify({ id: commentId, comment })
        });
    }

    async deleteComment(commentId) {
        return await this.request(`/comments/delete.php?id=${commentId}`, {
            method: 'DELETE'
        });
    }

    async likeComment(commentId) {
        return await this.request('/comments/like.php', {
            method: 'POST',
            body: JSON.stringify({ id: commentId })
        });
    }

    // ========== Playlists ==========
    
    async getPlaylists(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/playlists/list.php${query ? '?' + query : ''}`);
    }

    async getPlaylistDetail(id) {
        return await this.request(`/playlists/detail.php?id=${id}`);
    }

    async createPlaylist(name, description = '') {
        return await this.request('/playlists/create.php', {
            method: 'POST',
            body: JSON.stringify({ name, description })
        });
    }

    async updatePlaylist(id, name, description = '') {
        return await this.request('/playlists/update.php', {
            method: 'PUT',
            body: JSON.stringify({ id, name, description })
        });
    }

    async deletePlaylist(id) {
        return await this.request(`/playlists/delete.php?id=${id}`, {
            method: 'DELETE'
        });
    }

    async addToPlaylist(playlistId, contentId) {
        return await this.request('/playlists/addItem.php', {
            method: 'POST',
            body: JSON.stringify({ playlist_id: playlistId, content_id: contentId })
        });
    }

    async removeFromPlaylist(playlistId, contentId) {
        return await this.request('/playlists/removeItem.php', {
            method: 'DELETE',
            body: JSON.stringify({ playlist_id: playlistId, content_id: contentId })
        });
    }

    // ========== Channels ==========
    
    async getChannels(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/channels/list.php${query ? '?' + query : ''}`);
    }

    async getChannelDetail(id) {
        return await this.request(`/channels/detail.php?id=${id}`);
    }

    async getMyChannel() {
        return await this.request('/channels/myChannel.php');
    }

    async createChannel(name, description = '') {
        return await this.request('/channels/create.php', {
            method: 'POST',
            body: JSON.stringify({ name, description })
        });
    }

    async updateChannel(id, name, description = '') {
        return await this.request('/channels/update.php', {
            method: 'PUT',
            body: JSON.stringify({ id, name, description })
        });
    }

    async subscribeToChannel(channelId) {
        return await this.request('/channels/subscribe.php', {
            method: 'POST',
            body: JSON.stringify({ channel_id: channelId })
        });
    }

    async unsubscribeFromChannel(channelId) {
        return await this.request('/channels/unsubscribe.php', {
            method: 'DELETE',
            body: JSON.stringify({ channel_id: channelId })
        });
    }

    // ========== Subscriptions ==========
    
    async getSubscriptionPlans() {
        return await this.request('/subscriptions/plans.php');
    }

    async getCurrentSubscription() {
        return await this.request('/subscriptions/current.php');
    }

    async subscribeToPlan(planId, paymentMethod = {}) {
        return await this.request('/subscriptions/subscribe.php', {
            method: 'POST',
            body: JSON.stringify({ plan_id: planId, ...paymentMethod })
        });
    }

    async cancelSubscription() {
        return await this.request('/subscriptions/cancel.php', {
            method: 'DELETE'
        });
    }

    // ========== Notifications ==========
    
    async getNotifications(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/notifications/list.php${query ? '?' + query : ''}`);
    }

    async markNotificationRead(id) {
        return await this.request(`/notifications/markRead.php?id=${id}`, {
            method: 'PUT'
        });
    }

    async markAllNotificationsRead() {
        return await this.request('/notifications/markAllRead.php', {
            method: 'PUT'
        });
    }

    // ========== Admin ==========
    
    async getAdminStats() {
        return await this.request('/admin/stats.php');
    }

    async getAdminAnalytics(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/admin/analytics.php${query ? '?' + query : ''}`);
    }

    async getAdminUsers(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/admin/users.php${query ? '?' + query : ''}`);
    }

    async createAdminUser(userData) {
        return await this.request('/admin/users.php', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async updateAdminUser(userId, userData) {
        return await this.request('/admin/users.php', {
            method: 'PUT',
            body: JSON.stringify({ id: userId, ...userData })
        });
    }

    async deleteAdminUser(userId) {
        return await this.request(`/admin/users.php?id=${userId}`, {
            method: 'DELETE'
        });
    }

    async getAdminContent(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/admin/content.php${query ? '?' + query : ''}`);
    }

    async createAdminContent(contentData) {
        return await this.request('/admin/content.php', {
            method: 'POST',
            body: JSON.stringify(contentData)
        });
    }

    async updateAdminContent(contentId, contentData) {
        return await this.request('/admin/content.php', {
            method: 'PUT',
            body: JSON.stringify({ id: contentId, ...contentData })
        });
    }

    async deleteAdminContent(contentId) {
        return await this.request(`/admin/content.php?id=${contentId}`, {
            method: 'DELETE'
        });
    }
}

// Create and export API instance
const api = new ApiClient();

