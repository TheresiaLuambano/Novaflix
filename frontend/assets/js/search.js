/**
 * BurudaniKiganjani - Search Module
 * Handles search functionality and results display
 */

class SearchModule {
    constructor() {
        this.searchHistory = this.getSearchHistory();
        this.debounceTimer = null;
        this.minSearchLength = 2;
    }

    // ========== Search History ==========
    
    getSearchHistory() {
        const history = localStorage.getItem('burudani_search_history');
        return history ? JSON.parse(history) : [];
    }

    saveSearchHistory(query) {
        if (!query.trim()) return;
        
        // Remove duplicate and add to front
        this.searchHistory = this.searchHistory.filter(item => item.toLowerCase() !== query.toLowerCase());
        this.searchHistory.unshift(query.trim());
        
        // Keep only last 10 searches
        this.searchHistory = this.searchHistory.slice(0, 10);
        
        localStorage.setItem('burudani_search_history', JSON.stringify(this.searchHistory));
    }

    clearSearchHistory() {
        this.searchHistory = [];
        localStorage.removeItem('burudani_search_history');
    }

    // ========== Search Functionality ==========
    
    async search(query, options = {}) {
        if (!query || query.trim().length < this.minSearchLength) {
            return { status: 'error', message: `Search term must be at least ${this.minSearchLength} characters` };
        }

        const params = {
            q: query.trim(),
            limit: options.limit || 20,
            page: options.page || 1,
            ...options.filters
        };

        try {
            const response = await api.searchContent(query, params);
            
            if (response.status === 'success') {
                // Save to history
                this.saveSearchHistory(query);
                
                return {
                    status: 'success',
                    data: response.data || [],
                    pagination: response.pagination,
                    query: query.trim()
                };
            } else {
                return response;
            }
        } catch (error) {
            console.error('Search error:', error);
            return { status: 'error', message: 'Search failed. Please try again.' };
        }
    }

    async searchByGenre(genre, options = {}) {
        const params = {
            genre: genre,
            limit: options.limit || 20,
            page: options.page || 1
        };

        try {
            const response = await api.getContentByGenre(genre, params);
            return response;
        } catch (error) {
            console.error('Genre search error:', error);
            return { status: 'error', message: 'Failed to load content by genre' };
        }
    }

    async searchByType(type, options = {}) {
        const params = {
            type: type,
            limit: options.limit || 20,
            page: options.page || 1
        };

        try {
            const response = await api.getContentByType(type, params);
            return response;
        } catch (error) {
            console.error('Type search error:', error);
            return { status: 'error', message: 'Failed to load content by type' };
        }
    }

    // ========== Autocomplete ==========
    
    async getAutocompleteSuggestions(query) {
        if (!query || query.trim().length < 2) {
            return [];
        }

        // Get suggestions from search history
        const historySuggestions = this.searchHistory.filter(
            item => item.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);

        // Get suggestions from API (if available)
        let apiSuggestions = [];
        try {
            const response = await this.search(query, { limit: 5 });
            if (response.status === 'success' && response.data) {
                apiSuggestions = response.data.map(item => ({
                    id: item.id,
                    title: item.title,
                    type: item.type,
                    thumbnail: item.thumbnail_url
                }));
            }
        } catch (error) {
            // Ignore autocomplete errors
        }

        // Combine suggestions (prefer history for recent searches)
        const combined = [
            ...historySuggestions.map(q => ({ type: 'history', query: q })),
            ...apiSuggestions.map(item => ({ type: 'result', ...item }))
        ];

        return combined.slice(0, 8);
    }

    // ========== Debounced Search ==========
    
    debouncedSearch(query, callback, delay = 300) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(async () => {
            if (query.length >= this.minSearchLength) {
                const results = await this.search(query);
                callback(results);
            } else {
                callback({ status: 'success', data: [], query });
            }
        }, delay);
    }

    // ========== URL Utilities ==========
    
    static getSearchParams() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            query: urlParams.get('q') || '',
            genre: urlParams.get('genre') || '',
            type: urlParams.get('type') || '',
            page: parseInt(urlParams.get('page')) || 1,
            year: urlParams.get('year') || '',
            sort: urlParams.get('sort') || 'relevance'
        };
    }

    static updateSearchUrl(params) {
        const url = new URL(window.location);
        Object.entries(params).forEach(([key, value]) => {
            if (value) {
                url.searchParams.set(key, value);
            } else {
                url.searchParams.delete(key);
            }
        });
        window.history.pushState({}, '', url.toString());
    }
}

// Create and export SearchModule instance
const searchModule = new SearchModule();

// ========== Search Page Functions ==========

async function initSearchPage() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const filtersSection = document.getElementById('filtersSection');
    
    if (!searchInput || !searchResults) return;

    // Get initial search params
    const params = SearchModule.getSearchParams();
    
    if (params.query) {
        searchInput.value = params.query;
        await performSearch(params.query, params);
    } else if (params.genre) {
        await performGenreSearch(params.genre);
    } else if (params.type) {
        await performTypeSearch(params.type);
    }

    // Setup search input
    searchInput.addEventListener('input', (e) => {
        searchModule.debouncedSearch(e.target.value, async (results) => {
            if (results.query && results.query.length >= searchModule.minSearchLength) {
                await performSearch(results.query, { ...params, query: results.query });
            }
        });
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query.length >= searchModule.minSearchLength) {
                SearchModule.updateSearchUrl({ q: query, page: 1 });
                performSearch(query, { ...params, query, page: 1 });
            }
        }
    });

    // Setup filters
    setupSearchFilters(params);
}

async function performSearch(query, params = {}) {
    const resultsContainer = document.getElementById('searchResults');
    const resultsCount = document.getElementById('resultsCount');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    if (!resultsContainer) return;

    // Show loading
    if (loadingIndicator) loadingIndicator.style.display = 'flex';
    resultsContainer.innerHTML = '';

    try {
        const response = await api.searchContent(query, {
            limit: 24,
            page: params.page || 1,
            type: params.type || '',
            genre: params.genre || '',
            year: params.year || '',
            sort: params.sort || 'relevance'
        });

        if (loadingIndicator) loadingIndicator.style.display = 'none';

        if (response.status === 'success') {
            const results = response.data || [];
            
            // Update results count
            if (resultsCount) {
                const total = response.pagination?.total || results.length;
                resultsCount.textContent = `${total} result${total !== 1 ? 's' : ''} for "${query}"`;
            }

            if (results.length === 0) {
                resultsContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <i class="fas fa-search"></i>
                        </div>
                        <h3 class="empty-state-title">No results found</h3>
                        <p class="empty-state-description">
                            We couldn't find any content matching "${query}". 
                            Try different keywords or browse by genre.
                        </p>
                        <a href="browse.html" class="btn btn-primary">Browse All Content</a>
                    </div>
                `;
                return;
            }

            // Render results
            resultsContainer.innerHTML = results.map(item => createSearchResultCard(item)).join('');
            
            // Setup pagination
            setupPagination(response.pagination);

            // Add click listeners
            resultsContainer.querySelectorAll('.search-result-card').forEach(card => {
                card.addEventListener('click', () => {
                    window.location.href = `watch.html?id=${card.dataset.id}`;
                });
            });
        } else {
            showToast(response.message || 'Search failed', 'error');
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3 class="empty-state-title">Search failed</h3>
                    <p class="empty-state-description">${response.message || 'Please try again later.'}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Search error:', error);
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        showToast('An error occurred while searching', 'error');
    }
}

async function performGenreSearch(genre) {
    const resultsContainer = document.getElementById('searchResults');
    const resultsCount = document.getElementById('resultsCount');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    if (!resultsContainer) return;

    if (loadingIndicator) loadingIndicator.style.display = 'flex';
    resultsContainer.innerHTML = '';

    try {
        const response = await api.getContentByGenre(genre, { limit: 24, page: 1 });

        if (loadingIndicator) loadingIndicator.style.display = 'none';

        if (response.status === 'success') {
            const results = response.data || [];
            
            if (resultsCount) {
                resultsCount.textContent = `${results.length} result${results.length !== 1 ? 's' : ''} in ${genre}`;
            }

            resultsContainer.innerHTML = results.map(item => createSearchResultCard(item)).join('');
            
            resultsContainer.querySelectorAll('.search-result-card').forEach(card => {
                card.addEventListener('click', () => {
                    window.location.href = `watch.html?id=${card.dataset.id}`;
                });
            });
        }
    } catch (error) {
        console.error('Genre search error:', error);
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        showToast('Failed to load content', 'error');
    }
}

async function performTypeSearch(type) {
    const resultsContainer = document.getElementById('searchResults');
    const resultsCount = document.getElementById('resultsCount');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    if (!resultsContainer) return;

    if (loadingIndicator) loadingIndicator.style.display = 'flex';
    resultsContainer.innerHTML = '';

    try {
        const response = await api.getContentByType(type, { limit: 24, page: 1 });

        if (loadingIndicator) loadingIndicator.style.display = 'none';

        if (response.status === 'success') {
            const results = response.data || [];
            
            if (resultsCount) {
                resultsCount.textContent = `${results.length} ${type}${results.length !== 1 ? 's' : ''}`;
            }

            resultsContainer.innerHTML = results.map(item => createSearchResultCard(item)).join('');
            
            resultsContainer.querySelectorAll('.search-result-card').forEach(card => {
                card.addEventListener('click', () => {
                    window.location.href = `watch.html?id=${card.dataset.id}`;
                });
            });
        }
    } catch (error) {
        console.error('Type search error:', error);
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        showToast('Failed to load content', 'error');
    }
}

function createSearchResultCard(content) {
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
            </div>
            <div class="result-actions">
                <button class="btn btn-primary btn-sm">
                    <i class="fas fa-play"></i> Play
                </button>
                <button class="btn btn-icon btn-sm" title="Add to list">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        </div>
    `;
}

function setupSearchFilters(params) {
    const typeFilters = document.querySelectorAll('.filter-type');
    const genreFilters = document.querySelectorAll('.filter-genre');
    const sortSelect = document.getElementById('sortSelect');
    const yearSelect = document.getElementById('yearSelect');

    // Type filters
    typeFilters.forEach(filter => {
        filter.addEventListener('click', () => {
            const type = filter.dataset.type;
            typeFilters.forEach(f => f.classList.remove('active'));
            filter.classList.add('active');
            
            SearchModule.updateSearchUrl({ type: type === 'all' ? '' : type, page: 1 });
            
            const query = document.getElementById('searchInput')?.value || '';
            if (query) {
                performSearch(query, { ...params, type: type === 'all' ? '' : type, page: 1 });
            } else if (type !== 'all') {
                performTypeSearch(type);
            } else {
                window.location.href = 'browse.html';
            }
        });
    });

    // Sort select
    if (sortSelect) {
        sortSelect.value = params.sort || 'relevance';
        sortSelect.addEventListener('change', () => {
            SearchModule.updateSearchUrl({ sort: sortSelect.value, page: 1 });
            const query = document.getElementById('searchInput')?.value || '';
            if (query) {
                performSearch(query, { ...params, sort: sortSelect.value, page: 1 });
            }
        });
    }

    // Year select
    if (yearSelect) {
        yearSelect.value = params.year || '';
        yearSelect.addEventListener('change', () => {
            SearchModule.updateSearchUrl({ year: yearSelect.value, page: 1 });
            const query = document.getElementById('searchInput')?.value || '';
            if (query) {
                performSearch(query, { ...params, year: yearSelect.value, page: 1 });
            }
        });
    }
}

function setupPagination(pagination) {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer || !pagination) return;

    const { current_page, total_pages } = pagination;
    
    if (total_pages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let html = `
        <button class="pagination-btn" ${current_page === 1 ? 'disabled' : ''} 
                onclick="changePage(${current_page - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    // Generate page numbers
    const startPage = Math.max(1, current_page - 2);
    const endPage = Math.min(total_pages, current_page + 2);

    if (startPage > 1) {
        html += `<button class="pagination-btn" onclick="changePage(1)">1</button>`;
        if (startPage > 2) {
            html += `<span class="pagination-ellipsis">...</span>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `
            <button class="pagination-btn ${i === current_page ? 'active' : ''}" 
                    onclick="changePage(${i})">${i}</button>
        `;
    }

    if (endPage < total_pages) {
        if (endPage < total_pages - 1) {
            html += `<span class="pagination-ellipsis">...</span>`;
        }
        html += `<button class="pagination-btn" onclick="changePage(${total_pages})">${total_pages}</button>`;
    }

    html += `
        <button class="pagination-btn" ${current_page === total_pages ? 'disabled' : ''} 
                onclick="changePage(${current_page + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    paginationContainer.innerHTML = html;
}

function changePage(page) {
    const params = SearchModule.getSearchParams();
    SearchModule.updateSearchUrl({ page });
    
    const query = document.getElementById('searchInput')?.value || '';
    if (query) {
        performSearch(query, { ...params, page });
    } else if (params.genre) {
        performGenreSearch(params.genre);
    } else if (params.type) {
        performTypeSearch(params.type);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Make functions globally accessible
window.performSearch = performSearch;
window.performGenreSearch = performGenreSearch;
window.performTypeSearch = performTypeSearch;
window.changePage = changePage;
window.initSearchPage = initSearchPage;

