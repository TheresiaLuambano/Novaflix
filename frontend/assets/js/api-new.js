/**
 * BurudaniKiganjani - API Client (Updated with deleteUser)
 */

class ApiClient {
    constructor() {
        this.baseUrl = API_BASE_URL;
        this.token = this.getAuthToken();
    }

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

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

        const response = await fetch(url, { ...options, headers });
        const text = await response.text();
        if (!text) return { status: 'success' };
        return JSON.parse(text);
    }

    // User CRUD
    async getProfile() {
        return await this.request('/user/profile.php');
    }

    async updateProfile(userData) {
        return await this.request('/user/update.php', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    async deleteUser(password) {
        return await this.request('/user/delete.php', {
            method: 'DELETE',
            body: JSON.stringify({ password })
        });
    }

    // All-in-one CRUD endpoint
    async userCrud(operation, data = {}) {
        const method = operation === 'delete' ? 'DELETE' : 
                      operation === 'create' ? 'POST' : 
                      operation === 'update' ? 'PUT' : 'GET';
        return await this.request('/user/crud.php', {
            method: method,
            body: JSON.stringify(data)
        });
    }

    // Auth methods
    async register(userData) {
        const response = await this.request('/auth/register.php', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        if (response.data?.token) {
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
        if (response.data?.token) {
            this.setAuthToken(response.data.token);
            this.setStoredUser(response.data.user);
        }
        return response;
    }

    async logout() {
        try {
            await this.request('/auth/logout.php', { method: 'POST' });
        } catch (e) {}
        this.removeAuthToken();
        window.location.href = 'login.html';
    }

    async changePassword(currentPassword, newPassword) {
        return await this.request('/auth/change-password.php', {
            method: 'POST',
            body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
        });
    }

    // Content methods
    async getContentList(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/content/list.php${query ? '?' + query : ''}`);
    }

    async getContentDetail(id) {
        return await this.request(`/content/detail.php?id=${id}`);
    }

    async searchContent(query, params = {}) {
        const queryString = new URLSearchParams({ q: query, ...params }).toString();
        return await this.request(`/content/search.php?${queryString}`);
    }

    async getFeaturedContent() {
        return await this.request('/content/featured.php');
    }

    async getTrendingContent(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/content/trending.php${query ? '?' + query : ''}`);
    }

    // Playlists
    async getPlaylists(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/playlists/list.php${query ? '?' + query : ''}`);
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
        return await this.request(`/playlists/delete.php?id=${id}`, { method: 'DELETE' });
    }

    // Favorites
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
        return await this.request(`/favorites/remove.php?id=${contentId}`, { method: 'DELETE' });
    }

    // Watch Later
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
        return await this.request(`/watch/later.php?id=${contentId}`, { method: 'DELETE' });
    }

    async getWatchHistory(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/watch/history.php${query ? '?' + query : ''}`);
    }

    // Comments
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

    async deleteComment(commentId) {
        return await this.request(`/comments/delete.php?id=${commentId}`, { method: 'DELETE' });
    }

    // Notifications
    async getNotifications(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/notifications/list.php${query ? '?' + query : ''}`);
    }

    async markNotificationRead(id) {
        return await this.request(`/notifications/markRead.php?id=${id}`, { method: 'PUT' });
    }

    async markAllNotificationsRead() {
        return await this.request('/notifications/markAllRead.php', { method: 'PUT' });
    }

    // Channels
    async getChannels(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/channels/list.php${query ? '?' + query : ''}`);
    }

    async getChannelDetail(id) {
        return await this.request(`/channels/detail.php?id=${id}`);
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

    // Subscriptions
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
        return await this.request('/subscriptions/cancel.php', { method: 'DELETE' });
    }

    // Admin
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

    async deleteAdminUser(userId) {
        return await this.request(`/admin/users.php?id=${userId}`, { method: 'DELETE' });
    }
}

const api = new ApiClient();
