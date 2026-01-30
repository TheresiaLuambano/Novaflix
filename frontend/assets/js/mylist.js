/**
 * BurudaniKiganjani - My List Page
 * Handles user's saved content
 */

class MyListPage {
    constructor() {
        this.favorites = [];
        this.watchLater = [];
        this.currentTab = 'all';
        this.init();
    }

    async init() {
        // Require authentication
        if (!auth.requireAuth('login.html')) return;

        await auth.init();
        this.setupEventListeners();
        this.updateUI();
        await this.loadContent();
    }

    setupEventListeners() {
        // Header scroll
        window.addEventListener('scroll', () => {
            const header = document.getElementById('header');
            if (header) {
                header.classList.toggle('scrolled', window.scrollY > 50);
            }
        });

        // Mobile menu
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mainNav = document.getElementById('mainNav');
        if (mobileMenuBtn && mainNav) {
            mobileMenuBtn.addEventListener('click', () => {
                mainNav.classList.toggle('active');
            });
        }

        // Search
        this.setupSearch();

        // User dropdown
        const userAvatarBtn = document.getElementById('userAvatarBtn');
        const userDropdown = document.getElementById('userDropdown');
        if (userAvatarBtn && userDropdown) {
            userAvatarBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('active');
            });
            document.addEventListener('click', () => {
                userDropdown.classList.remove('active');
            });
        }

        // Tab navigation
        const tabs = document.querySelectorAll('.mylist-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentTab = tab.dataset.tab;
                this.renderContent();
            });
        });

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                auth.logout();
            });
        }
    }

    setupSearch() {
        const searchBtn = document.getElementById('searchBtn');
        const searchBox = document.getElementById('searchBox');
        const searchInput = document.getElementById('searchInput');
        const searchSubmit = document.getElementById('searchSubmit');

        if (searchBtn && searchBox) {
            searchBtn.addEventListener('click', () => {
                searchBox.classList.toggle('active');
                if (searchBox.classList.contains('active')) {
                    searchInput.focus();
                }
            });

            document.addEventListener('click', (e) => {
                if (!searchBox.contains(e.target) && !searchBtn.contains(e.target)) {
                    searchBox.classList.remove('active');
                }
            });
        }

        if (searchSubmit && searchInput) {
            searchSubmit.addEventListener('click', () => {
                const query = searchInput.value.trim();
                if (query) {
                    window.location.href = `search.html?q=${encodeURIComponent(query)}`;
                }
            });

            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const query = searchInput.value.trim();
                    if (query) {
                        window.location.href = `search.html?q=${encodeURIComponent(query)}`;
                    }
                }
            });
        }
    }

    updateUI() {
        const userAvatar = document.getElementById('userAvatar');
        const dropdownAvatar = document.getElementById('dropdownAvatar');
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');

        if (auth.isAuthenticated && auth.currentUser) {
            if (userName) userName.textContent = auth.currentUser.name || 'User';
            if (userEmail) userEmail.textContent = auth.currentUser.email || '';
            
            const avatarUrl = auth.currentUser.avatar_url || 'assets/images/default-avatar.png';
            if (userAvatar) userAvatar.src = avatarUrl;
            if (dropdownAvatar) dropdownAvatar.src = avatarUrl;
        }
    }

    async loadContent() {
        const contentContainer = document.getElementById('mylistContent');
        const loadingIndicator = document.getElementById('loadingIndicator');
        const emptyState = document.getElementById('emptyState');

        try {
            // Load favorites
            const favoritesResponse = await api.getFavorites({ limit: 100 });
            if (favoritesResponse.status === 'success') {
                this.favorites = favoritesResponse.data || [];
            }

            // Load watch later
            const watchLaterResponse = await api.getWatchLater({ limit: 100 });
            if (watchLaterResponse.status === 'success') {
                this.watchLater = watchLaterResponse.data || [];
            }

            // Combine content (prioritize favorites)
            this.allContent = [
                ...this.favorites.map(item => ({ ...item, type: 'favorite' })),
                ...this.watchLater.filter(item => !this.favorites.some(f => f.id === item.id))
                    .map(item => ({ ...item, type: 'watchlater' }))
            ];

            // Update counts
            this.updateCounts();

            // Hide loading, show content or empty state
            if (loadingIndicator) loadingIndicator.style.display = 'none';

            if (this.allContent.length === 0) {
                if (emptyState) emptyState.style.display = 'flex';
                if (contentContainer) contentContainer.style.display = 'none';
            } else {
                if (emptyState) emptyState.style.display = 'none';
                if (contentContainer) contentContainer.style.display = 'grid';
                this.renderContent();
            }

        } catch (error) {
            console.error('Load mylist error:', error);
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            
            // Use demo content
            this.loadDemoContent();
        }
    }

    loadDemoContent() {
        this.allContent = this.getDemoContent();
        this.updateCounts();

        const contentContainer = document.getElementById('mylistContent');
        const emptyState = document.getElementById('emptyState');

        if (emptyState) emptyState.style.display = 'none';
        if (contentContainer) {
            contentContainer.style.display = 'grid';
            this.renderContent();
        }
    }

    getDemoContent() {
        return [
            { id: 1, title: 'Breaking Bad', thumbnail_url: 'https://picsum.photos/seed/m1/400/225', type: 'favorite', genre: 'Drama', duration: '1h' },
            { id: 2, title: 'Stranger Things', thumbnail_url: 'https://picsum.photos/seed/m2/400/225', type: 'favorite', genre: 'Sci-Fi', duration: '1h' },
            { id: 3, title: 'The Crown', thumbnail_url: 'https://picsum.photos/seed/m3/400/225', type: 'watchlater', genre: 'Drama', duration: '1h' },
            { id: 4, title: 'Inception', thumbnail_url: 'https://picsum.photos/seed/m4/400/225', type: 'favorite', genre: 'Sci-Fi', duration: '2h 28m' },
            { id: 5, title: 'Dark', thumbnail_url: 'https://picsum.photos/seed/m5/400/225', type: 'watchlater', genre: 'Mystery', duration: '1h' },
            { id: 6, title: 'The Office', thumbnail_url: 'https://picsum.photos/seed/m6/400/225', type: 'favorite', genre: 'Comedy', duration: '30m' },
            { id: 7, title: 'Pulp Fiction', thumbnail_url: 'https://picsum.photos/seed/m7/400/225', type: 'favorite', genre: 'Crime', duration: '2h 34m' },
            { id: 8, title: 'Friends', thumbnail_url: 'https://picsum.photos/seed/m8/400/225', type: 'watchlater', genre: 'Comedy', duration: '30m' }
        ];
    }

    updateCounts() {
        const allCount = document.getElementById('allCount');
        const moviesCount = document.getElementById('moviesCount');
        const seriesCount = document.getElementById('seriesCount');

        // Count all
        if (allCount) allCount.textContent = this.allContent?.length || 0;

        // Count movies (items with longer duration > 60m usually)
        const movies = this.allContent?.filter(item => {
            const duration = parseInt(item.duration) || 0;
            return duration > 60 || item.genre?.toLowerCase().includes('movie');
        }) || [];
        if (moviesCount) moviesCount.textContent = movies.length;

        // Count series
        const series = this.allContent?.filter(item => {
            const duration = parseInt(item.duration) || 0;
            return duration <= 60 || item.genre?.toLowerCase().includes('series') || item.genre?.toLowerCase().includes('tv');
        }) || [];
        if (seriesCount) seriesCount.textContent = series.length;
    }

    renderContent() {
        const contentContainer = document.getElementById('mylistContent');
        if (!contentContainer) return;

        let filteredContent = this.allContent || [];

        // Filter by tab
        if (this.currentTab === 'movies') {
            filteredContent = filteredContent.filter(item => {
                const duration = parseInt(item.duration) || 0;
                return duration > 60 || item.genre?.toLowerCase().includes('movie');
            });
        } else if (this.currentTab === 'series') {
            filteredContent = filteredContent.filter(item => {
                const duration = parseInt(item.duration) || 0;
                return duration <= 60 || item.genre?.toLowerCase().includes('series') || 
                       item.genre?.toLowerCase().includes('tv');
            });
        }

        if (filteredContent.length === 0) {
            contentContainer.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-state-icon">
                        <i class="fas fa-film"></i>
                    </div>
                    <h3 class="empty-state-title">No ${this.currentTab === 'all' ? '' : this.currentTab} content</h3>
                    <p class="empty-state-description">
                        ${this.currentTab === 'all' ? 'Start adding content to your list!' : 
                          `No ${this.currentTab} in your list yet.`}
                    </p>
                    ${this.currentTab !== 'all' ? `
                        <button class="btn btn-primary" onclick="document.querySelector('.mylist-tab[data-tab=\"all\"]').click()">
                            View All
                        </button>
                    ` : ''}
                </div>
            `;
            return;
        }

        contentContainer.innerHTML = filteredContent.map(item => this.createContentCard(item)).join('');

        // Add click listeners
        contentContainer.querySelectorAll('.content-card').forEach(card => {
            card.addEventListener('click', () => {
                window.location.href = `watch.html?id=${card.dataset.id}`;
            });

            // Remove button
            const removeBtn = card.querySelector('.remove-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removeFromList(card.dataset.id, card.dataset.type);
                });
            }
        });
    }

    createContentCard(content) {
        const match = Math.floor(Math.random() * 30) + 70;
        const quality = 'HD';
        const duration = content.duration || '1h 30m';
        const genres = content.genre || 'Drama';

        return `
            <div class="content-card" data-id="${content.id}" data-type="${content.type}">
                <div class="content-card-inner">
                    <img src="${content.thumbnail_url || 'assets/images/placeholder.jpg'}" 
                         alt="${content.title || 'Content'}" 
                         loading="lazy">
                    <div class="content-card-overlay">
                        <div class="content-card-actions">
                            <button class="btn btn-primary btn-icon play-btn">
                                <i class="fas fa-play"></i>
                            </button>
                            <button class="btn btn-icon remove-btn" title="Remove from list" 
                                    data-type="${content.type}">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-icon" title="Like">
                                <i class="fas fa-thumbs-up"></i>
                            </button>
                            <button class="btn btn-icon" title="More Info" onclick="event.stopPropagation(); window.location.href='watch.html?id=${content.id}'">
                                <i class="fas fa-chevron-down"></i>
                            </button>
                        </div>
                        <div class="content-card-meta">
                            <span class="match">${match}% Match</span>
                            <span class="rating">TV-MA</span>
                            <span class="quality">${quality}</span>
                        </div>
                        <div class="content-card-genres">
                            <span>${genres}</span>
                            <span>${duration}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async removeFromList(contentId, type) {
        try {
            if (type === 'favorite') {
                await api.removeFromFavorites(contentId);
            } else if (type === 'watchlater') {
                await api.removeFromWatchLater(contentId);
            }

            // Update local content
            this.allContent = this.allContent.filter(item => item.id != contentId);
            
            // Re-render
            this.updateCounts();
            this.renderContent();

            Toast.success('Removed from your list');
        } catch (error) {
            console.error('Remove from list error:', error);
            Toast.error('Failed to remove from list');
        }
    }
}

// Initialize mylist page
let myListPage;
document.addEventListener('DOMContentLoaded', () => {
    myListPage = new MyListPage();
});

window.myListPage = myListPage;

