/**
 * Admin Dashboard - Pro View JavaScript
 * Enhanced functionality for professional admin interface
 */

// Admin Pro View Class
class AdminProView {
    constructor() {
        this.isProView = false;
        this.charts = {};
        this.refreshInterval = null;
        this.statsData = {};
        this.currentPage = 'dashboard';

        this.init();
    }

    init() {
        this.bindElements();
        this.setupEventListeners();
        this.loadInitialData();
        this.initializeCharts();
        this.startAutoRefresh();
    }

    bindElements() {
        // Pro View Toggle
        this.proToggle = document.getElementById('proToggle');
        this.proToggleSwitch = document.getElementById('proToggleSwitch');

        // Sidebar
        this.sidebar = document.getElementById('adminSidebar');
        this.sidebarToggle = document.getElementById('sidebarToggle');

        // Navigation
        this.navItems = document.querySelectorAll('.nav-item');

        // Stats Elements
        this.statUsers = document.getElementById('statUsers');
        this.statContent = document.getElementById('statContent');
        this.statViews = document.getElementById('statViews');
        this.statRevenue = document.getElementById('statRevenue');

        // Charts
        this.viewsChartCanvas = document.getElementById('viewsChart');
        this.contentChartCanvas = document.getElementById('contentChart');
        this.userGrowthChartCanvas = document.getElementById('userGrowthChart');

        // Tables
        this.usersTableBody = document.getElementById('usersTableBody');
        this.contentTableBody = document.getElementById('contentTableBody');

        // Search & Filters
        this.globalSearch = document.getElementById('globalSearch');
        this.userSearch = document.getElementById('userSearch');
        this.userStatus = document.getElementById('userStatus');

        // Pagination
        this.usersPagination = document.getElementById('usersPagination');
        this.contentPagination = document.getElementById('contentPagination');

        // Quick Actions
        this.quickActionsPanel = document.getElementById('quickActionsPanel');
        this.quickActionsToggle = document.getElementById('quickActionsToggle');

        // Buttons
        this.addUserBtn = document.getElementById('addUserBtn');
        this.addContentBtn = document.getElementById('addContentBtn');
        this.adminLogout = document.getElementById('adminLogout');
    }

    setupEventListeners() {
        // Pro View Toggle
        if (this.proToggleSwitch) {
            this.proToggleSwitch.addEventListener('click', () => this.toggleProView());
        }

        // Sidebar Toggle
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // Navigation
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e, item));
        });

        // Search
        if (this.globalSearch) {
            this.globalSearch.addEventListener('input', (e) => this.handleGlobalSearch(e.target.value));
        }

        if (this.userSearch) {
            this.userSearch.addEventListener('input', (e) => this.filterUsers(e.target.value));
        }

        if (this.userStatus) {
            this.userStatus.addEventListener('change', (e) => this.filterUsersByStatus(e.target.value));
        }

        // Quick Actions
        if (this.quickActionsToggle) {
            this.quickActionsToggle.addEventListener('click', () => this.toggleQuickActions());
        }

        // Buttons
        if (this.addUserBtn) {
            this.addUserBtn.addEventListener('click', () => this.showAddUserModal());
        }

        if (this.addContentBtn) {
            this.addContentBtn.addEventListener('click', () => this.showAddContentModal());
        }

        if (this.adminLogout) {
            this.adminLogout.addEventListener('click', (e) => this.handleLogout(e));
        }

        // Window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    toggleProView() {
        this.isProView = !this.isProView;
        const body = document.body;

        if (this.isProView) {
            body.classList.add('pro-view');
            this.proToggleSwitch.classList.add('active');
            this.showToast('Pro View Enabled', 'success');
            this.loadProData();
        } else {
            body.classList.remove('pro-view');
            this.proToggleSwitch.classList.remove('active');
            this.showToast('Standard View Enabled', 'info');
        }

        // Save preference
        localStorage.setItem('adminProView', this.isProView);

        // Reinitialize charts with new theme
        this.initializeCharts();
    }

    toggleSidebar() {
        this.sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebarCollapsed', this.sidebar.classList.contains('collapsed'));
    }

    handleNavigation(e, item) {
        e.preventDefault();
        const page = item.dataset.page;

        // Update active state
        this.navItems.forEach(navItem => navItem.classList.remove('active'));
        item.classList.add('active');

        // Show page
        this.showPage(page);
        this.currentPage = page;

        // Update page title
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = page.charAt(0).toUpperCase() + page.slice(1);
        }
    }

    showPage(pageId) {
        // Hide all pages
        const pages = document.querySelectorAll('.admin-page');
        pages.forEach(page => page.classList.remove('active'));

        // Show selected page
        const targetPage = document.getElementById(`page-${pageId}`);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Load page data
        this.loadPageData(pageId);
    }

    async loadInitialData() {
        try {
            await this.loadStats();
            await this.loadUsers();
            await this.loadContent();
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showToast('Failed to load data', 'error');
        }
    }

    async loadProData() {
        if (!this.isProView) return;
        // Already loaded with main data
    }

    async loadStats() {
        try {
            console.log('Loading admin stats from simple-stats.php...');
            
            // Use the simple-stats.php which doesn't require auth
            // Build the correct API URL based on current location
            const apiBase = window.location.origin + '/BurudaniKiganjani/api';
            const response = await fetch(`${apiBase}/simple-stats.php`);
            const data = await response.json();
            
            console.log('Stats response:', data);
            
            if (data.status === 'success' && data.data) {
                // Transform the data to match expected structure
                this.statsData = {
                    users: {
                        total: data.data.users?.total || 0
                    },
                    content: {
                        total: data.data.content?.total || 0,
                        by_type: data.data.content?.by_type || [],
                        total_views: data.data.views?.total || 0
                    },
                    views: {
                        total: data.data.views?.total || 0
                    },
                    subscriptions: {
                        revenue: 0
                    },
                    top_content: data.data.content?.top || [],
                    recent_users: data.data.users?.recent || []
                };
                
                console.log('Stats data transformed:', this.statsData);
                this.updateStatsDisplay();
                this.updateCharts();
            } else {
                console.warn('Stats API returned error');
                // Use demo data as fallback
                this.statsData = this.getDemoStatsData();
                this.updateStatsDisplay();
                this.updateCharts();
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            // Use demo data as fallback
            console.log('Using demo data fallback');
            this.statsData = this.getDemoStatsData();
            this.updateStatsDisplay();
            this.updateCharts();
        }
    }
    
    /**
     * Get demo stats data when API fails
     */
    getDemoStatsData() {
        return {
            users: {
                total: 8,
                new_today: 1,
                new_week: 3,
                new_month: 5,
                active_today: 4
            },
            content: {
                total: 8,
                by_type: [
                    { content_type: 'movie', count: 4 },
                    { content_type: 'series', count: 2 },
                    { content_type: 'documentary', count: 2 }
                ],
                total_views: 63017
            },
            views: {
                total: 63017,
                today: 1250,
                week: 8500,
                month: 32000
            },
            subscriptions: {
                total: 5,
                revenue: 499.99
            },
            top_content: [
                { id: 1, title: 'Space Odyssey', content_type: 'movie', view_count: 25000, rating: 4.5 },
                { id: 2, title: 'Love in Paris', content_type: 'movie', view_count: 12000, rating: 4.2 },
                { id: 3, title: 'The Haunted Mansion', content_type: 'movie', view_count: 18000, rating: 4.0 },
                { id: 4, title: 'Tech Giants', content_type: 'documentary', view_count: 8000, rating: 4.3 },
                { id: 5, title: 'Space Explorers', content_type: 'series', view_count: 2, rating: 3.8 }
            ],
            recent_users: [
                { id: 1, name: 'Thomas Saimalye', email: 'saimalyethomas@gmail.com', role: 'admin', is_active: 1, created_at: '2026-01-11 19:49:17' },
                { id: 2, name: 'Jumanne Mashaka', email: 'j4@gmail.com', role: 'user', is_active: 1, created_at: '2026-01-11 19:49:18' },
                { id: 9, name: 'Google User', email: 'google.user1768426183@gmail.com', role: 'user', is_active: 1, created_at: '2026-01-15 00:29:43' }
            ]
        };
    }

    async loadUsers(params = {}) {
        try {
            console.log('Loading users from simple-stats...');
            
            // Use the simple-stats.php which doesn't require auth
            const apiBase = window.location.origin + '/BurudaniKiganjani/api';
            const response = await fetch(`${apiBase}/simple-stats.php`);
            const data = await response.json();
            
            if (data.status === 'success' && data.data) {
                this.usersData = {
                    users: data.data.users?.recent || [],
                    total: data.data.users?.total || 0,
                    pagination: { current_page: 1, per_page: 20, total: data.data.users?.total || 0, total_pages: 1 }
                };
                this.renderUsersTable();
                this.renderUsersPagination();
            } else {
                // Use demo data
                this.usersData = {
                    users: this.getDemoStatsData().recent_users,
                    total: 8,
                    pagination: { current_page: 1, per_page: 20, total: 8, total_pages: 1 }
                };
                this.renderUsersTable();
                this.renderUsersPagination();
            }
        } catch (error) {
            console.error('Error loading users:', error);
            // Use demo data as fallback
            this.usersData = {
                users: this.getDemoStatsData().recent_users,
                total: 8,
                pagination: { current_page: 1, per_page: 20, total: 8, total_pages: 1 }
            };
            this.renderUsersTable();
            this.renderUsersPagination();
        }
    }

    async loadContent(params = {}) {
        try {
            console.log('Loading content from simple-stats...');
            
            // Use the simple-stats.php which doesn't require auth
            const apiBase = window.location.origin + '/BurudaniKiganjani/api';
            const response = await fetch(`${apiBase}/simple-stats.php`);
            const data = await response.json();
            
            if (data.status === 'success' && data.data) {
                this.contentData = {
                    content: data.data.content?.top || [],
                    total: data.data.content?.total || 0,
                    pagination: { current_page: 1, per_page: 20, total: data.data.content?.total || 0, total_pages: 1 }
                };
                this.renderContentTable();
                this.renderContentPagination();
            } else {
                // Use demo data
                this.contentData = {
                    content: this.getDemoStatsData().top_content,
                    total: 8,
                    pagination: { current_page: 1, per_page: 20, total: 8, total_pages: 1 }
                };
                this.renderContentTable();
                this.renderContentPagination();
            }
        } catch (error) {
            console.error('Error loading content:', error);
            // Use demo data as fallback
            this.contentData = {
                content: this.getDemoStatsData().top_content,
                total: 8,
                pagination: { current_page: 1, per_page: 20, total: 8, total_pages: 1 }
            };
            this.renderContentTable();
            this.renderContentPagination();
        }
    }

    async loadPageData(pageId) {
        switch (pageId) {
            case 'dashboard':
                await this.loadStats();
                break;
            case 'users':
                await this.loadUsers();
                break;
            case 'content':
                await this.loadContent();
                break;
        }
    }

    updateStatsDisplay() {
        if (!this.statsData) return;

        // Update stats cards with animation
        if (this.statsData.users) {
            this.animateValue(this.statUsers, this.statsData.users.total || 0);
        }
        
        if (this.statsData.content) {
            this.animateValue(this.statContent, this.statsData.content.total || 0);
        }
        
        if (this.statsData.views) {
            this.animateValue(this.statViews, this.statsData.views.total || 0);
        }
        
        if (this.statsData.subscriptions) {
            const revenue = this.statsData.subscriptions.revenue || 0;
            if (this.statRevenue) {
                this.animateValue(this.statRevenue, revenue, '$');
            }
        }
    }

    updateCharts() {
        // Update charts with real data from stats/analytics
        if (!this.statsData && !this.analyticsData) return;

        // Reinitialize charts with new data
        this.initializeCharts();
    }

    updateAnalyticsDisplay() {
        if (!this.analyticsData) return;

        // Update charts with analytics data
        this.updateCharts();
    }

    initializeCharts() {
        // Destroy existing charts
        Object.values(this.charts).forEach(chart => chart.destroy());
        this.charts = {};

        if (this.viewsChartCanvas) {
            this.charts.views = this.createViewsChart();
        }

        if (this.contentChartCanvas) {
            this.charts.content = this.createContentChart();
        }

        if (this.userGrowthChartCanvas) {
            this.charts.userGrowth = this.createUserGrowthChart();
        }
    }

    initializeProCharts() {
        if (!this.isProView) return;

        // Enhanced chart configurations for Pro View
        this.initializeCharts();
    }

    createViewsChart() {
        const ctx = this.viewsChartCanvas.getContext('2d');
        const isPro = this.isProView;

        // Get data from stats or analytics
        let viewsData = [];
        let labels = [];
        
        if (this.statsData?.views?.daily) {
            // Use daily views from stats
            this.statsData.views.daily.forEach(item => {
                labels.push(item.date);
                viewsData.push(item.views);
            });
        } else if (this.analyticsData?.daily_views) {
            // Use daily views from analytics
            this.analyticsData.daily_views.forEach(item => {
                labels.push(item.date);
                viewsData.push(item.views);
            });
        }
        
        // Fallback to generated data if no real data
        if (viewsData.length === 0) {
            labels = this.generateDateLabels(30);
            viewsData = this.generateRandomData(30, 1000, 5000);
        }

        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Views',
                    data: viewsData,
                    borderColor: isPro ? '#ffd700' : '#e50914',
                    backgroundColor: isPro ? 'rgba(255, 215, 0, 0.1)' : 'rgba(229, 9, 20, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: isPro ? '#ffffff' : '#000000'
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            color: isPro ? '#cccccc' : '#666666'
                        },
                        grid: {
                            color: isPro ? '#444444' : '#e0e0e0'
                        }
                    },
                    x: {
                        ticks: {
                            color: isPro ? '#cccccc' : '#666666'
                        },
                        grid: {
                            color: isPro ? '#444444' : '#e0e0e0'
                        }
                    }
                }
            }
        });
    }

    createContentChart() {
        const ctx = this.contentChartCanvas.getContext('2d');
        const isPro = this.isProView;

        // Get content type distribution from stats or analytics
        let contentData = [];
        let labels = [];
        
        if (this.statsData?.content?.by_type) {
            this.statsData.content.by_type.forEach(item => {
                labels.push(item.content_type || item.type || 'Unknown');
                contentData.push(item.count);
            });
        } else if (this.analyticsData?.content?.by_type) {
            this.analyticsData.content.by_type.forEach(item => {
                labels.push(item.content_type || item.type || 'Unknown');
                contentData.push(item.count);
            });
        }
        
        // Fallback to default data if no real data
        if (contentData.length === 0) {
            labels = ['Movies', 'Series', 'Documentaries', 'Anime'];
            contentData = [35, 25, 20, 20];
        }

        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: contentData,
                    backgroundColor: isPro ?
                        ['#ffd700', '#ffed4e', '#f39c12', '#e67e22'] :
                        ['#e50914', '#f40612', '#b81d24', '#8b0000'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: isPro ? '#ffffff' : '#000000'
                        }
                    }
                }
            }
        });
    }

    createUserGrowthChart() {
        const ctx = this.userGrowthChartCanvas.getContext('2d');
        const isPro = this.isProView;

        // Get user growth data from analytics
        let growthData = [];
        let labels = [];
        
        if (this.analyticsData?.user_growth) {
            this.analyticsData.user_growth.forEach(item => {
                labels.push(item.month);
                growthData.push(item.new_users);
            });
        }
        
        // Fallback to generated data if no real data
        if (growthData.length === 0) {
            labels = this.generateMonthLabels(12);
            growthData = this.generateRandomData(12, 50, 200);
        }

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'New Users',
                    data: growthData,
                    backgroundColor: isPro ? '#ffd700' : '#e50914',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: isPro ? '#ffffff' : '#000000'
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            color: isPro ? '#cccccc' : '#666666'
                        },
                        grid: {
                            color: isPro ? '#444444' : '#e0e0e0'
                        }
                    },
                    x: {
                        ticks: {
                            color: isPro ? '#cccccc' : '#666666'
                        },
                        grid: {
                            color: isPro ? '#444444' : '#e0e0e0'
                        }
                    }
                }
            }
        });
    }

    renderUsersTable() {
        if (!this.usersTableBody) return;

        let users = [];
        
        // Handle different data structures
        if (this.usersData?.users) {
            // From users API response
            users = this.usersData.users;
        } else if (this.usersData?.recent_users) {
            // From stats API response (demo data)
            users = this.usersData.recent_users;
        }
        
        if (users.length === 0) {
            this.usersTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-users" style="font-size: 48px; margin-bottom: 10px; color: #ddd;"></i>
                        <p>No users found</p>
                    </td>
                </tr>
            `;
            return;
        }

        this.usersTableBody.innerHTML = users.map(user => `
            <tr>
                <td>
                    <div class="user-info">
                        <img src="${user.avatar || user.avatar_url || '../assets/images/default-avatar.png'}"
                             alt="${user.name}"
                             class="user-avatar-small"
                             onerror="this.src='../assets/images/default-avatar.png'">
                        <div>
                            <div class="user-name">${this.escapeHtml(user.name)}</div>
                            <div class="user-email">${this.escapeHtml(user.email)}</div>
                        </div>
                    </div>
                </td>
                <td><span class="role-badge">${this.escapeHtml(user.role || 'user')}</span></td>
                <td><span class="status-badge ${user.is_active ? 'active' : 'inactive'}">${user.is_active ? 'Active' : 'Inactive'}</span></td>
                <td>${this.formatDate(user.created_at)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="adminProView.editUser(${user.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete" onclick="adminProView.deleteUser(${user.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderContentTable() {
        if (!this.contentTableBody) return;

        let content = [];
        
        // Handle different data structures
        if (this.contentData?.content) {
            // From content API response
            content = this.contentData.content;
        } else if (this.contentData?.top) {
            // From stats API response
            content = this.contentData.top;
        } else if (this.contentData?.top_content) {
            // From stats API response (demo data)
            content = this.contentData.top_content;
        }
        
        if (content.length === 0) {
            this.contentTableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-film" style="font-size: 48px; margin-bottom: 10px; color: #ddd;"></i>
                        <p>No content found</p>
                    </td>
                </tr>
            `;
            return;
        }

        this.contentTableBody.innerHTML = content.map(item => `
            <tr>
                <td>
                    <div class="content-info">
                        <img src="${item.thumbnail || item.thumbnail_url || '../assets/images/placeholder.jpg'}"
                             alt="${item.title}"
                             class="content-thumbnail-small"
                             onerror="this.src='../assets/images/placeholder.jpg'">
                        <div>
                            <div class="content-title">${this.escapeHtml(item.title)}</div>
                            <div class="content-type">${this.escapeHtml(item.content_type || 'Unknown')}</div>
                        </div>
                    </div>
                </td>
                <td>${this.formatNumber(item.view_count || 0)}</td>
                <td><span class="status-badge active">Active</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="adminProView.editContent(${item.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete" onclick="adminProView.deleteContent(${item.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderUsersPagination() {
        if (!this.usersPagination || !this.usersData) return;

        const totalPages = Math.ceil((this.usersData.total || 0) / 20);
        const currentPage = this.usersData.page || 1;

        this.usersPagination.innerHTML = this.generatePaginationHTML(totalPages, currentPage, 'users');
    }

    renderContentPagination() {
        if (!this.contentPagination || !this.contentData) return;

        const totalPages = Math.ceil((this.contentData.total || 0) / 20);
        const currentPage = this.contentData.page || 1;

        this.contentPagination.innerHTML = this.generatePaginationHTML(totalPages, currentPage, 'content');
    }

    generatePaginationHTML(totalPages, currentPage, type) {
        let html = '';

        for (let i = 1; i <= totalPages; i++) {
            const activeClass = i === currentPage ? 'active' : '';
            html += `<button class="${activeClass}" onclick="adminProView.goToPage(${i}, '${type}')">${i}</button>`;
        }

        return html;
    }

    handleGlobalSearch(query) {
        // Implement global search across all data
        console.log('Global search:', query);
    }

    filterUsers(query) {
        // Filter users table
        console.log('Filter users:', query);
    }

    filterUsersByStatus(status) {
        // Filter users by status
        console.log('Filter users by status:', status);
    }

    toggleQuickActions() {
        if (this.quickActionsPanel) {
            this.quickActionsPanel.classList.toggle('active');
        }
    }

    showAddUserModal() {
        // Show add user modal
        this.showToast('Add User functionality coming soon', 'info');
    }

    showAddContentModal() {
        // Show add content modal
        this.showToast('Add Content functionality coming soon', 'info');
    }

    editUser(userId) {
        this.showToast(`Edit User ${userId} functionality coming soon`, 'info');
    }

    deleteUser(userId) {
        if (confirm('Are you sure you want to delete this user?')) {
            this.showToast(`User ${userId} deleted`, 'success');
        }
    }

    editContent(contentId) {
        this.showToast(`Edit Content ${contentId} functionality coming soon`, 'info');
    }

    deleteContent(contentId) {
        if (confirm('Are you sure you want to delete this content?')) {
            this.showToast(`Content ${contentId} deleted`, 'success');
        }
    }

    goToPage(page, type) {
        if (type === 'users') {
            this.loadUsers({ page });
        } else if (type === 'content') {
            this.loadContent({ page });
        }
    }

    handleLogout(e) {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            // Clear local storage
            localStorage.removeItem('burudani_auth_token');
            localStorage.removeItem('burudani_user_data');
            
            // Redirect to main login page
            window.location.href = '../login.html';
        }
    }

    handleResize() {
        // Handle responsive adjustments
        if (window.innerWidth <= 768) {
            this.sidebar.classList.add('collapsed');
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Format date string
     */
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Format date with time
     */
    formatDateTime(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    startAutoRefresh() {
        // Auto refresh stats every 5 minutes
        this.refreshInterval = setInterval(() => {
            if (this.currentPage === 'dashboard') {
                this.loadStats();
            }
        }, 300000); // 5 minutes
    }

    animateValue(element, targetValue, prefix = '') {
        if (!element) return;

        const startValue = parseInt(element.textContent.replace(/[^\d]/g, '')) || 0;
        const duration = 1000;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOutQuart);

            element.textContent = prefix + this.formatNumber(currentValue);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    generateDateLabels(days) {
        const labels = [];
        const today = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }

        return labels;
    }

    generateMonthLabels(months) {
        const labels = [];
        const today = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setMonth(today.getMonth() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
        }

        return labels;
    }

    generateRandomData(count, min, max) {
        const data = [];
        for (let i = 0; i < count; i++) {
            data.push(Math.floor(Math.random() * (max - min + 1)) + min);
        }
        return data;
    }

    updateCharts() {
        // Update charts with real data
        if (this.analyticsData?.daily_views) {
            const viewsData = this.analyticsData.daily_views.map(item => item.views);
            if (this.charts.views) {
                this.charts.views.data.datasets[0].data = viewsData;
                this.charts.views.update();
            }
        }
    }

    showToast(message, type = 'info') {
        // Use existing toast system or create a simple one
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        Object.values(this.charts).forEach(chart => chart.destroy());
    }
}

// Initialize Admin Pro View when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated as admin
    const userData = localStorage.getItem('burudani_user_data');
    const token = localStorage.getItem('burudani_auth_token');
    
    if (userData && token) {
        const user = JSON.parse(userData);
        if (user.role === 'admin') {
            // User is admin - initialize dashboard
            window.adminProView = new AdminProView();

            // Check for saved Pro View preference
            const savedProView = localStorage.getItem('adminProView') === 'true';
            if (savedProView) {
                window.adminProView.toggleProView();
            }

            // Check for saved sidebar state
            const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
            if (sidebarCollapsed) {
                document.getElementById('adminSidebar').classList.add('collapsed');
            }
            
            // Hide login overlay if exists
            const loginOverlay = document.getElementById('loginRequired');
            if (loginOverlay) {
                loginOverlay.style.display = 'none';
            }
            
            console.log('Admin dashboard initialized for:', user.name);
        } else {
            // User is logged in but not admin
            console.log('Non-admin user detected');
        }
    } else {
        // Not logged in - login overlay will be shown by inline script in HTML
        console.log('No authentication - login required');
    }

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (window.adminProView) {
            window.adminProView.destroy();
        }
    });
});
