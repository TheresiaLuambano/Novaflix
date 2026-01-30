/**
 * BurudaniKiganjani - Browse Page
 * Handles content browsing with filters and pagination
 */

class BrowsePage {
    constructor() {
        this.filters = {
            type: 'all',
            genre: '',
            sort: 'popularity',
            page: 1,
            perPage: 24
        };
        this.content = [];
        this.pagination = null;
        this.init();
    }

    async init() {
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

        // Type filters
        const typeFilters = document.getElementById('typeFilters');
        if (typeFilters) {
            typeFilters.addEventListener('click', (e) => {
                if (e.target.classList.contains('filter-btn')) {
                    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                    e.target.classList.add('active');
                    this.filters.type = e.target.dataset.type;
                    this.filters.page = 1;
                    this.loadContent();
                }
            });
        }

        // Genre select
        const genreSelect = document.getElementById('genreSelect');
        if (genreSelect) {
            genreSelect.addEventListener('change', (e) => {
                this.filters.genre = e.target.value;
                this.filters.page = 1;
                this.loadContent();
            });
        }

        // Sort select
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.filters.sort = e.target.value;
                this.filters.page = 1;
                this.loadContent();
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                auth.logout();
            });
        }

        // Check URL params
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('genre')) {
            this.filters.genre = urlParams.get('genre');
            const genreSelect = document.getElementById('genreSelect');
            if (genreSelect) genreSelect.value = this.filters.genre;
        }
        if (urlParams.has('type')) {
            this.filters.type = urlParams.get('type');
            const typeBtns = document.querySelectorAll('.filter-btn');
            typeBtns.forEach(btn => {
                if (btn.dataset.type === this.filters.type) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
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
        const contentGrid = document.getElementById('contentGrid');
        const loadingIndicator = document.getElementById('loadingIndicator');
        const resultsCount = document.getElementById('resultsCount');
        const resultsTitle = document.getElementById('resultsTitle');

        if (!contentGrid) return;

        // Show loading
        contentGrid.innerHTML = '';
        if (loadingIndicator) loadingIndicator.style.display = 'flex';
        if (resultsCount) resultsCount.textContent = 'Loading...';

        try {
            let response;
            const params = {
                page: this.filters.page,
                limit: this.filters.perPage,
                sort: this.filters.sort
            };

            if (this.filters.genre) {
                response = await api.getContentByGenre(this.filters.genre, params);
            } else if (this.filters.type && this.filters.type !== 'all') {
                response = await api.getContentByType(this.filters.type, params);
            } else {
                // Check if new releases filter is active
                if (this.filters.sort === 'newest') {
                    response = await api.request('/content/new-releases.php?' + new URLSearchParams(params).toString());
                } else {
                    response = await api.getContentList(params);
                }
            }

            if (loadingIndicator) loadingIndicator.style.display = 'none';

            // Handle different response formats
            let content = [];
            let pagination = null;

            if (response && response.data) {
                if (response.data.content) {
                    // Standard list response
                    content = response.data.content;
                    pagination = response.data.pagination;
                } else if (response.data.releases) {
                    // New releases response
                    content = response.data.releases;
                    pagination = response.data.pagination;
                } else if (response.data.trending) {
                    // Trending response
                    content = response.data.trending;
                    pagination = response.data.pagination;
                } else if (Array.isArray(response.data)) {
                    // Direct array
                    content = response.data;
                    pagination = response.pagination;
                }
            } else if (response && Array.isArray(response)) {
                content = response;
            }

            this.content = Array.isArray(content) ? content : [];
            this.pagination = pagination;

            // Ensure content is always an array before proceeding
            if (!Array.isArray(this.content)) {
                this.content = [];
            }

            // Update results count
            const total = this.pagination?.total || this.content.length;
            if (resultsCount) {
                resultsCount.textContent = `${total} result${total !== 1 ? 's' : ''}`;
            }

            // Update title
            let title = 'All Content';
            if (this.filters.genre) {
                title = this.filters.genre.charAt(0).toUpperCase() + this.filters.genre.slice(1);
            } else if (this.filters.type === 'movie') {
                title = 'Movies';
            } else if (this.filters.type === 'series') {
                title = 'TV Series';
            } else if (this.filters.sort === 'newest') {
                title = 'New Releases';
            }
            if (resultsTitle) resultsTitle.textContent = title;

            if (this.content.length === 0) {
                contentGrid.innerHTML = this.getEmptyStateHtml();
                this.renderPagination();
                return;
            }

            // Ensure this.content is a valid array before mapping
            const contentArray = Array.isArray(this.content) ? this.content : [];
            if (contentArray.length === 0) {
                contentGrid.innerHTML = this.getEmptyStateHtml();
                this.renderPagination();
                return;
            }

            // Render content
            contentGrid.innerHTML = contentArray.map(item => this.createContentCard(item)).join('');

            // Add click listeners
            contentGrid.querySelectorAll('.content-card').forEach(card => {
                card.addEventListener('click', () => {
                    window.location.href = `watch.html?id=${card.dataset.id}`;
                });
            });

            this.renderPagination();

        } catch (error) {
            console.error('Load content error:', error);
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            Toast.error('Failed to load content');
            contentGrid.innerHTML = this.getEmptyStateHtml();
        }
    }

    createContentCard(content) {
        const year = content.release_year || content.year || 'N/A';
        const duration = content.duration || '1h 30m';
        const genres = Array.isArray(content.genres) ? content.genres.join(', ') : content.genre || 'Drama';
        const match = Math.floor(Math.random() * 30) + 70;
        const quality = content.quality || 'HD';

        return `
            <div class="content-card" data-id="${content.id}">
                <div class="content-card-inner">
                    <img src="${content.thumbnail_url || 'assets/images/placeholder.jpg'}" 
                         alt="${content.title || 'Content'}" 
                         loading="lazy">
                    <div class="content-card-overlay">
                        <div class="content-card-actions">
                            <button class="btn btn-primary btn-icon play-btn">
                                <i class="fas fa-play"></i>
                            </button>
                            <button class="btn btn-icon add-btn" title="Add to My List">
                                <i class="fas fa-plus"></i>
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

    getEmptyStateHtml() {
        const genre = this.filters.genre ? ` in ${this.filters.genre}` : '';
        const type = this.filters.type && this.filters.type !== 'all' ? ` ${this.filters.type}s` : '';
        
        return `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-icon">
                    <i class="fas fa-film"></i>
                </div>
                <h3 class="empty-state-title">No content found</h3>
                <p class="empty-state-description">
                    We couldn't find any${type}${genre}. Try adjusting your filters or browse all content.
                </p>
                <button class="btn btn-primary" onclick="browsePage.clearFilters()">
                    <i class="fas fa-redo"></i> Clear Filters
                </button>
            </div>
        `;
    }

    clearFilters() {
        this.filters = {
            type: 'all',
            genre: '',
            sort: 'popularity',
            page: 1,
            perPage: 24
        };

        // Reset UI
        const typeBtns = document.querySelectorAll('.filter-btn');
        typeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === 'all');
        });

        const genreSelect = document.getElementById('genreSelect');
        if (genreSelect) genreSelect.value = '';

        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) sortSelect.value = 'popularity';

        // Update URL
        window.history.replaceState({}, '', window.location.pathname);

        this.loadContent();
    }

    renderPagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination || !this.pagination) return;

        const { current_page, total_pages } = this.pagination;

        if (total_pages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = `
            <div class="pagination">
                <button class="pagination-btn" ${current_page === 1 ? 'disabled' : ''} 
                        onclick="browsePage.changePage(${current_page - 1})">
                    <i class="fas fa-chevron-left"></i>
                </button>
        `;

        const startPage = Math.max(1, current_page - 2);
        const endPage = Math.min(total_pages, current_page + 2);

        if (startPage > 1) {
            html += `<button class="pagination-btn" onclick="browsePage.changePage(1)">1</button>`;
            if (startPage > 2) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="pagination-btn ${i === current_page ? 'active' : ''}" 
                        onclick="browsePage.changePage(${i})">${i}</button>
            `;
        }

        if (endPage < total_pages) {
            if (endPage < total_pages - 1) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }
            html += `<button class="pagination-btn" onclick="browsePage.changePage(${total_pages})">${total_pages}</button>`;
        }

        html += `
                <button class="pagination-btn" ${current_page === total_pages ? 'disabled' : ''} 
                        onclick="browsePage.changePage(${current_page + 1})">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;

        pagination.innerHTML = html;
    }

    changePage(page) {
        this.filters.page = page;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.loadContent();
    }
}

// Initialize browse page
let browsePage;
document.addEventListener('DOMContentLoaded', () => {
    browsePage = new BrowsePage();
});

window.browsePage = browsePage;

