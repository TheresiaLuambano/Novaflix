/**
 * BurudaniKiganjani - Search Page
 * Handles search functionality with filters and results display
 */

class SearchPage {
    constructor() {
        this.query = '';
        this.filters = {
            type: 'all',
            genre: '',
            sort: 'relevance',
            page: 1
        };
        this.results = [];
        this.pagination = null;
        this.debounceTimer = null;
        this.minSearchLength = 2;
        
        this.init();
    }

    init() {
        // Get URL params
        const urlParams = new URLSearchParams(window.location.search);
        this.query = urlParams.get('q') || '';
        this.filters.type = urlParams.get('type') || 'all';
        this.filters.genre = urlParams.get('genre') || '';
        this.filters.sort = urlParams.get('sort') || 'relevance';
        this.filters.page = parseInt(urlParams.get('page')) || 1;

        auth.init().then(() => {
            this.setupEventListeners();
            this.updateUI();
            
            // If there's a query, perform search
            if (this.query) {
                const searchInput = document.getElementById('searchInput');
                if (searchInput) searchInput.value = this.query;
                this.performSearch();
            }
        });
    }

    setupEventListeners() {
        // Header scroll
        window.addEventListener('scroll', () => {
            const header = document.getElementById('header');
            if (header) {
                header.classList.toggle('scrolled', window.scrollY > 50);
            }
        });

        // Search input
        const searchInput = document.getElementById('searchInput');
        const searchClear = document.getElementById('searchClear');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearchInput(e.target.value);
                
                if (searchClear) {
                    searchClear.style.display = e.target.value ? 'block' : 'none';
                }
            });

            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const query = searchInput.value.trim();
                    if (query.length >= this.minSearchLength) {
                        this.updateUrlAndSearch(query);
                    }
                }
            });

            // Focus on load if there's a query
            if (this.query) {
                searchInput.focus();
            }
        }

        if (searchClear) {
            searchClear.addEventListener('click', () => {
                if (searchInput) {
                    searchInput.value = '';
                    searchInput.focus();
                    searchClear.style.display = 'none';
                    this.clearSearch();
                }
            });
        }

        // Suggestion tags
        document.querySelectorAll('.suggestion-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                const query = tag.dataset.query;
                if (searchInput) searchInput.value = query;
                this.handleSearchInput(query);
                this.updateUrlAndSearch(query);
            });
        });

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
                    document.querySelectorAll('#typeFilters .filter-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    e.target.classList.add('active');
                    this.filters.type = e.target.dataset.type;
                    this.filters.page = 1;
                    
                    if (this.query) {
                        this.performSearch();
                    }
                }
            });
        }

        // Genre select
        const genreSelect = document.getElementById('genreSelect');
        if (genreSelect) {
            genreSelect.value = this.filters.genre;
            genreSelect.addEventListener('change', (e) => {
                this.filters.genre = e.target.value;
                this.filters.page = 1;
                if (this.query) this.performSearch();
            });
        }

        // Sort select
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.value = this.filters.sort;
            sortSelect.addEventListener('change', (e) => {
                this.filters.sort = e.target.value;
                this.filters.page = 1;
                if (this.query) this.performSearch();
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
    }

    handleSearchInput(value) {
        clearTimeout(this.debounceTimer);
        
        if (value.length >= this.minSearchLength) {
            this.debounceTimer = setTimeout(() => {
                this.performSearch(value);
            }, 300);
        }
    }

    updateUrlAndSearch(query) {
        this.query = query;
        this.filters.page = 1;
        
        // Update URL
        const url = new URL(window.location);
        url.searchParams.set('q', query);
        url.searchParams.set('page', '1');
        if (this.filters.type !== 'all') {
            url.searchParams.set('type', this.filters.type);
        } else {
            url.searchParams.delete('type');
        }
        if (this.filters.genre) {
            url.searchParams.set('genre', this.filters.genre);
        }
        window.history.pushState({}, '', url.toString());

        this.performSearch(query);
    }

    async performSearch(query = this.query) {
        const searchResults = document.getElementById('searchResults');
        const loadingIndicator = document.getElementById('loadingIndicator');
        const resultsCount = document.getElementById('resultsCount');
        const searchInitial = document.getElementById('searchInitial');
        const pagination = document.getElementById('pagination');

        if (!searchResults) return;

        // Show loading
        if (loadingIndicator) loadingIndicator.style.display = 'flex';
        if (searchInitial) searchInitial.style.display = 'none';
        if (pagination) pagination.style.display = 'none';

        try {
            const response = await api.searchContent(query, {
                type: this.filters.type !== 'all' ? this.filters.type : '',
                genre: this.filters.genre,
                sort: this.filters.sort,
                page: this.filters.page,
                limit: 20
            });

            if (loadingIndicator) loadingIndicator.style.display = 'none';

            if (response.status === 'success') {
                this.results = response.data || [];
                this.pagination = response.pagination;

                // Update results count
                if (resultsCount) {
                    const total = this.pagination?.total || this.results.length;
                    resultsCount.textContent = `${total} result${total !== 1 ? 's' : ''} for "${query}"`;
                }

                if (this.results.length === 0) {
                    this.renderEmptyState(query);
                    return;
                }

                // Render results
                this.renderResults();

                // Render pagination
                if (pagination) {
                    pagination.style.display = 'flex';
                    this.renderPagination();
                }
            } else {
                Toast.error(response.message || 'Search failed');
                this.renderEmptyState(query);
            }
        } catch (error) {
            console.error('Search error:', error);
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            
            // Use demo results
            this.results = this.getDemoResults(query);
            this.pagination = { current_page: 1, total_pages: 1, total: this.results.length };
            
            if (resultsCount) {
                resultsCount.textContent = `${this.results.length} results for "${query}"`;
            }
            
            this.renderResults();
        }
    }

    getDemoResults(query) {
        const demoContent = [
            { id: 1, title: 'Breaking Bad', thumbnail_url: 'https://picsum.photos/seed/s1/400/225', genre: 'Drama, Crime', duration: '1h', release_year: 2008, description: 'A high school chemistry teacher turned methamphetamine producer.' },
            { id: 2, title: 'Stranger Things', thumbnail_url: 'https://picsum.photos/seed/s2/400/225', genre: 'Sci-Fi, Horror', duration: '1h', release_year: 2016, description: 'When a young boy vanishes, a small town uncovers a mystery.' },
            { id: 3, title: 'Inception', thumbnail_url: 'https://picsum.photos/seed/s3/400/225', genre: 'Sci-Fi, Action', duration: '2h 28m', release_year: 2010, description: 'A thief who steals corporate secrets through dream-sharing technology.' },
            { id: 4, title: 'The Crown', thumbnail_url: 'https://picsum.photos/seed/s4/400/225', genre: 'Drama, History', duration: '1h', release_year: 2016, description: 'Follows the political rivalries and romance of Queen Elizabeth II.' },
            { id: 5, title: 'Dark', thumbnail_url: 'https://picsum.photos/seed/s5/400/225', genre: 'Mystery, Sci-Fi', duration: '1h', release_year: 2017, description: 'A family saga with a supernatural twist, set in a German town.' },
            { id: 6, title: 'Pulp Fiction', thumbnail_url: 'https://picsum.photos/seed/s6/400/225', genre: 'Crime, Drama', duration: '2h 34m', release_year: 1994, description: 'The lives of two mob hitmen intertwine in a tale of violence.' }
        ];
        
        return demoContent.filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.genre.toLowerCase().includes(query.toLowerCase()) ||
            item.description.toLowerCase().includes(query.toLowerCase())
        );
    }

    renderResults() {
        const searchResults = document.getElementById('searchResults');
        if (!searchResults) return;

        searchResults.innerHTML = this.results.map(item => this.createResultCard(item)).join('');

        // Add click listeners
        searchResults.querySelectorAll('.search-result-card').forEach(card => {
            card.addEventListener('click', () => {
                window.location.href = `watch.html?id=${card.dataset.id}`;
            });

            // Play button
            const playBtn = card.querySelector('.play-btn');
            if (playBtn) {
                playBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.location.href = `watch.html?id=${card.dataset.id}`;
                });
            }

            // Add to list button
            const addBtn = card.querySelector('.add-btn');
            if (addBtn) {
                addBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.addToList(card.dataset.id);
                });
            }
        });
    }

    createResultCard(content) {
        const year = content.release_year || content.year || 'N/A';
        const duration = content.duration || '1h 30m';
        const genres = Array.isArray(content.genres) ? content.genres.join(', ') : content.genre || 'Drama';
        const match = Math.floor(Math.random() * 30) + 70;

        return `
            <div class="search-result-card" data-id="${content.id}">
                <div class="result-thumbnail">
                    <img src="${content.thumbnail_url || 'assets/images/placeholder.jpg'}" alt="${content.title}">
                </div>
                <div class="result-info">
                    <h3 class="result-title">${content.title}</h3>
                    <div class="result-meta">
                        <span class="result-year">${year}</span>
                        <span class="result-rating">${match}% Match</span>
                        <span class="result-duration">${duration}</span>
                    </div>
                    <p class="result-description">${content.description || 'No description available.'}</p>
                    <div class="result-genres">
                        <span class="tag">${genres}</span>
                    </div>
                    <div class="result-actions">
                        <button class="btn btn-primary btn-sm play-btn">
                            <i class="fas fa-play"></i> Play
                        </button>
                        <button class="btn btn-secondary btn-sm add-btn" title="Add to My List">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="btn btn-icon-sm" title="Like">
                            <i class="fas fa-thumbs-up"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderEmptyState(query) {
        const searchResults = document.getElementById('searchResults');
        const resultsCount = document.getElementById('resultsCount');
        const pagination = document.getElementById('pagination');

        if (resultsCount) {
            resultsCount.textContent = `No results found for "${query}"`;
        }

        if (searchResults) {
            searchResults.innerHTML = `
                <div class="empty-state" style="padding: 64px 24px;">
                    <div class="empty-state-icon">
                        <i class="fas fa-search"></i>
                    </div>
                    <h3 class="empty-state-title">No results found</h3>
                    <p class="empty-state-description">
                        We couldn't find anything matching "${query}". 
                        Try different keywords or browse our catalog.
                    </p>
                    <a href="browse.html" class="btn btn-primary">
                        <i class="fas fa-compass"></i> Browse All Content
                    </a>
                </div>
            `;
        }

        if (pagination) pagination.style.display = 'none';
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
                        onclick="searchPage.changePage(${current_page - 1})">
                    <i class="fas fa-chevron-left"></i>
                </button>
        `;

        const startPage = Math.max(1, current_page - 2);
        const endPage = Math.min(total_pages, current_page + 2);

        if (startPage > 1) {
            html += `<button class="pagination-btn" onclick="searchPage.changePage(1)">1</button>`;
            if (startPage > 2) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="pagination-btn ${i === current_page ? 'active' : ''}" 
                        onclick="searchPage.changePage(${i})">${i}</button>
            `;
        }

        if (endPage < total_pages) {
            if (endPage < total_pages - 1) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }
            html += `<button class="pagination-btn" onclick="searchPage.changePage(${total_pages})">${total_pages}</button>`;
        }

        html += `
                <button class="pagination-btn" ${current_page === total_pages ? 'disabled' : ''} 
                        onclick="searchPage.changePage(${current_page + 1})">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;

        pagination.innerHTML = html;
    }

    changePage(page) {
        this.filters.page = page;
        
        // Update URL
        const url = new URL(window.location);
        url.searchParams.set('page', page.toString());
        window.history.pushState({}, '', url.toString());

        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.performSearch();
    }

    clearSearch() {
        this.query = '';
        this.results = [];
        this.filters.page = 1;
        
        const url = new URL(window.location);
        url.searchParams.delete('q');
        url.searchParams.delete('page');
        window.history.pushState({}, '', url.toString());

        const searchResults = document.getElementById('searchResults');
        const resultsCount = document.getElementById('resultsCount');
        const searchInitial = document.getElementById('searchInitial');
        const pagination = document.getElementById('pagination');

        if (searchInitial) searchInitial.style.display = 'flex';
        if (searchResults) searchResults.innerHTML = '';
        if (resultsCount) resultsCount.textContent = 'Search for movies and series';
        if (pagination) pagination.style.display = 'none';
    }

    async addToList(contentId) {
        if (!auth.isAuthenticated) {
            Toast.warning('Please sign in to add to your list');
            return;
        }

        try {
            await api.addToFavorites(contentId);
            Toast.success('Added to My List');
        } catch (error) {
            console.error('Add to list error:', error);
            Toast.error('Failed to add to list');
        }
    }

    updateUI() {
        const userAvatar = document.getElementById('userAvatar');
        const dropdownAvatar = document.getElementById('dropdownAvatar');
        const userName = document.getElementById('userName');

        if (auth.isAuthenticated && auth.currentUser) {
            if (userName) userName.textContent = auth.currentUser.name || 'User';
            
            const avatarUrl = auth.currentUser.avatar_url || 'assets/images/default-avatar.png';
            if (userAvatar) userAvatar.src = avatarUrl;
            if (dropdownAvatar) dropdownAvatar.src = avatarUrl;
        }
    }
}

// Initialize search page
let searchPage;
document.addEventListener('DOMContentLoaded', () => {
    searchPage = new SearchPage();
});

window.searchPage = searchPage;

