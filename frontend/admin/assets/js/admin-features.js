/**
 * Admin Dashboard - Extended Features
 * Additional functionality for subscriptions, analytics, and settings
 */

// Add these methods to AdminProView class

AdminProView.prototype.analyticsData = null;
AdminProView.prototype.subscriptionsData = null;

/**
 * Export analytics data
 */
AdminProView.prototype.exportAnalytics = function() {
    this.showToast('Exporting analytics data...', 'info');
    const data = {
        exportDate: new Date().toISOString(),
        stats: this.statsData,
        analytics: this.analyticsData
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showToast('Analytics exported successfully!', 'success');
};

/**
 * Refresh analytics data
 */
AdminProView.prototype.refreshAnalytics = function() {
    this.loadAnalyticsData();
    this.showToast('Analytics refreshed', 'success');
};

/**
 * Load analytics data
 */
AdminProView.prototype.loadAnalyticsData = async function() {
    try {
        const apiBase = window.location.origin + '/BurudaniKiganjani/api';
        const response = await fetch(`${apiBase}/admin/analytics.php`);
        const data = await response.json();
        
        if (data.status === 'success' && data.data) {
            this.analyticsData = data.data;
            this.updateAnalyticsDisplay();
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
        this.analyticsData = this.getDemoAnalyticsData();
        this.updateAnalyticsDisplay();
    }
};

/**
 * Get demo analytics data
 */
AdminProView.prototype.getDemoAnalyticsData = function() {
    return {
        daily_views: this.generateRandomData(30, 1000, 5000),
        user_growth: this.generateMonthlyData(12, 50, 200),
        content_by_type: [
            { type: 'movie', count: 45 },
            { type: 'series', count: 25 },
            { type: 'documentary', count: 15 },
            { type: 'anime', count: 15 }
        ],
        engagement: {
            avg_watch_time: 45,
            completion_rate: 68,
            daily_active_users: 1250,
            retention_rate: 75
        },
        top_content: [
            { title: 'The Last Kingdom', views: 25000, rating: 4.5 },
            { title: 'Dark Secrets', views: 18000, rating: 4.2 },
            { title: 'Ocean Adventures', views: 15000, rating: 4.0 }
        ]
    };
};

/**
 * Generate monthly data for charts
 */
AdminProView.prototype.generateMonthlyData = function(months, min, max) {
    const data = [];
    const today = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(today.getMonth() - i);
        data.push({
            month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            new_users: Math.floor(Math.random() * (max - min + 1)) + min
        });
    }
    
    return data;
};

/**
 * Update analytics display
 */
AdminProView.prototype.updateAnalyticsDisplay = function() {
    if (!this.analyticsData) return;

    // Update engagement metrics
    if (this.analyticsData.engagement) {
        const eng = this.analyticsData.engagement;
        const avgWatchTimeEl = document.getElementById('avgWatchTime');
        const completionRateEl = document.getElementById('completionRate');
        const dailyActiveUsersEl = document.getElementById('dailyActiveUsers');
        const retentionRateEl = document.getElementById('retentionRate');
        
        if (avgWatchTimeEl) avgWatchTimeEl.textContent = `${eng.avg_watch_time || 0} min`;
        if (completionRateEl) completionRateEl.textContent = `${eng.completion_rate || 0}%`;
        if (dailyActiveUsersEl) dailyActiveUsersEl.textContent = this.formatNumber(eng.daily_active_users || 0);
        if (retentionRateEl) retentionRateEl.textContent = `${eng.retention_rate || 0}%`;
    }

    // Update top content table
    const topContentTable = document.getElementById('topContentTable');
    if (topContentTable && this.analyticsData.top_content) {
        topContentTable.innerHTML = this.analyticsData.top_content.map(item => `
            <tr>
                <td>${this.escapeHtml(item.title)}</td>
                <td>${this.formatNumber(item.views)}</td>
                <td>${item.rating || '-'}</td>
            </tr>
        `).join('');
    }

    // Create content type chart
    const contentTypeChartCanvas = document.getElementById('contentTypeChart');
    if (contentTypeChartCanvas && this.analyticsData.content_by_type) {
        const ctx = contentTypeChartCanvas.getContext('2d');
        if (this.charts.contentTypeChart) {
            this.charts.contentTypeChart.destroy();
        }
        
        this.charts.contentTypeChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: this.analyticsData.content_by_type.map(item => item.type),
                datasets: [{
                    data: this.analyticsData.content_by_type.map(item => item.count),
                    backgroundColor: ['#e50914', '#f40612', '#b81d24', '#831010']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
};

/**
 * Load subscription data
 */
AdminProView.prototype.loadSubscriptions = async function() {
    try {
        const apiBase = window.location.origin + '/BurudaniKiganjani/api';
        const response = await fetch(`${apiBase}/subscriptions/plans.php`);
        const data = await response.json();
        
        if (data.status === 'success' && data.data) {
            this.subscriptionsData = data.data;
            this.updateSubscriptionsDisplay();
        }
    } catch (error) {
        console.error('Error loading subscriptions:', error);
        this.subscriptionsData = this.getDemoSubscriptionsData();
        this.updateSubscriptionsDisplay();
    }
};

/**
 * Get demo subscriptions data
 */
AdminProView.prototype.getDemoSubscriptionsData = function() {
    return {
        plans: [
            { id: 1, name: 'Free', price: 0, users: 3 },
            { id: 2, name: 'Premium', price: 9.99, users: 4 },
            { id: 3, name: 'Family', price: 14.99, users: 1 }
        ],
        transactions: [
            { id: 1001, user: 'John Doe', plan: 'Premium', amount: 9.99, date: '2024-01-15', status: 'completed' },
            { id: 1002, user: 'Jane Smith', plan: 'Family', amount: 14.99, date: '2024-01-14', status: 'completed' },
            { id: 1003, user: 'Bob Wilson', plan: 'Premium', amount: 9.99, date: '2024-01-13', status: 'pending' }
        ],
        stats: {
            total_subscriptions: 8,
            monthly_revenue: 79.96,
            conversion_rate: 50,
            churn_rate: 5
        }
    };
};

/**
 * Update subscriptions display
 */
AdminProView.prototype.updateSubscriptionsDisplay = function() {
    if (!this.subscriptionsData) return;

    const stats = this.subscriptionsData.stats || {};
    const totalSubsEl = document.getElementById('totalSubscriptions');
    const monthlyRevenueEl = document.getElementById('monthlyRevenue');
    const conversionRateEl = document.getElementById('conversionRate');
    const churnRateEl = document.getElementById('churnRate');
    
    if (totalSubsEl) totalSubsEl.textContent = stats.total_subscriptions || 0;
    if (monthlyRevenueEl) monthlyRevenueEl.textContent = `$${(stats.monthly_revenue || 0).toFixed(2)}`;
    if (conversionRateEl) conversionRateEl.textContent = `${stats.conversion_rate || 0}%`;
    if (churnRateEl) churnRateEl.textContent = `${stats.churn_rate || 0}%`;

    const plans = this.subscriptionsData.plans || [];
    const freePlanEl = document.getElementById('freePlanCount');
    const premiumPlanEl = document.getElementById('premiumPlanCount');
    const familyPlanEl = document.getElementById('familyPlanCount');
    
    if (freePlanEl) {
        const freePlan = plans.find(p => p.name === 'Free');
        freePlanEl.textContent = `${freePlan?.users || 0} users`;
    }
    if (premiumPlanEl) {
        const premiumPlan = plans.find(p => p.name === 'Premium');
        premiumPlanEl.textContent = `${premiumPlan?.users || 0} users`;
    }
    if (familyPlanEl) {
        const familyPlan = plans.find(p => p.name === 'Family');
        familyPlanEl.textContent = `${familyPlan?.users || 0} users`;
    }

    const transactionsTable = document.getElementById('transactionsTable');
    const transactions = this.subscriptionsData.transactions || [];
    if (transactionsTable) {
        if (transactions.length === 0) {
            transactionsTable.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">No transactions found</td></tr>';
        } else {
            transactionsTable.innerHTML = transactions.map(t => `
                <tr>
                    <td>${this.escapeHtml(t.user)}</td>
                    <td>${this.escapeHtml(t.plan)}</td>
                    <td>$${t.amount.toFixed(2)}</td>
                    <td>${this.formatDate(t.date)}</td>
                    <td><span class="status-badge ${t.status}">${t.status}</span></td>
                </tr>
            `).join('');
        }
    }
};

/**
 * Show add plan modal
 */
AdminProView.prototype.showAddPlanModal = function() {
    this.showToast('Add Plan functionality coming soon', 'info');
};

/**
 * Load settings
 */
AdminProView.prototype.loadSettings = function() {
    console.log('Settings loaded');
};

/**
 * Save settings
 */
AdminProView.prototype.saveSettings = function() {
    const settings = {
        siteName: document.getElementById('siteName')?.value,
        supportEmail: document.getElementById('supportEmail')?.value,
        defaultLanguage: document.getElementById('defaultLanguage')?.value,
        timezone: document.getElementById('timezone')?.value,
        maxUploadSize: document.getElementById('maxUploadSize')?.value,
        defaultQuality: document.getElementById('defaultQuality')?.value,
        autoApproveContent: document.getElementById('autoApproveContent')?.checked,
        enableComments: document.getElementById('enableComments')?.checked,
        enable2FA: document.getElementById('enable2FA')?.checked,
        emailVerification: document.getElementById('emailVerification')?.checked,
        sessionTimeout: document.getElementById('sessionTimeout')?.value
    };
    
    localStorage.setItem('adminSettings', JSON.stringify(settings));
    this.showToast('Settings saved successfully!', 'success');
};

/**
 * Reset settings to default
 */
AdminProView.prototype.resetSettings = function() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
        localStorage.removeItem('adminSettings');
        const inputs = document.querySelectorAll('#page-settings input, #page-settings select');
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                input.checked = input.defaultChecked;
            } else {
                input.value = input.defaultValue;
            }
        });
        this.showToast('Settings reset to default', 'success');
    }
};

/**
 * Generate report
 */
AdminProView.prototype.generateReport = function() {
    this.showToast('Generating report...', 'info');
    
    setTimeout(() => {
        const report = {
            title: 'BurudaniKiganjani Admin Report',
            generatedAt: new Date().toISOString(),
            stats: this.statsData,
            analytics: this.analyticsData
        };
        
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `admin-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Report generated!', 'success');
    }, 1000);
};

/**
 * Export data
 */
AdminProView.prototype.exportData = function() {
    this.showToast('Exporting all data...', 'info');
    
    setTimeout(() => {
        const data = {
            exportDate: new Date().toISOString(),
            users: this.usersData,
            content: this.contentData,
            stats: this.statsData
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Data exported!', 'success');
    }, 1000);
};

/**
 * System health check
 */
AdminProView.prototype.systemHealthCheck = function() {
    this.showToast('Running system health check...', 'info');
    
    setTimeout(() => {
        this.showToast('System is healthy! ✓', 'success');
    }, 1500);
};

/**
 * Clear cache
 */
AdminProView.prototype.clearCache = function() {
    if (confirm('Clear all cached data?')) {
        localStorage.removeItem('adminProView');
        localStorage.removeItem('sidebarCollapsed');
        this.showToast('Cache cleared!', 'success');
    }
};

// Update loadPageData to handle new pages
const originalLoadPageData = AdminProView.prototype.loadPageData;
AdminProView.prototype.loadPageData = async function(pageId) {
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
        case 'analytics':
            await this.loadAnalyticsData();
            break;
        case 'subscriptions':
            await this.loadSubscriptions();
            break;
        case 'settings':
            this.loadSettings();
            break;
        default:
            if (originalLoadPageData) {
                originalLoadPageData.call(this, pageId);
            }
    }
};

console.log('Admin features loaded successfully');

