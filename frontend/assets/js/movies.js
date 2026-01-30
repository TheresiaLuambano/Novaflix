/**
 * BurudaniKiganjani - Movies Page
 * Handles movie browsing with filters and grid view
 */

class MoviesPage {
    constructor() {
        this.filters = {
            genre: '',
            sort: 'popularity',
            year: '',
            page: 1,
            perPage: 24,
            studio: '',
            distributor: '',
            producer: '',
            network: ''
        };

        this.content = {
            trending: [],
            newReleases: [],
            action: [],
            comedy: [],
            drama: [],
            all: []
        };

        this.entities = {
            studios: [],
            distributors: [],
            producers: [],
            networks: []
        };

        this.heroContent = null;

        this.init();
    }

    async init() {
        await auth.init();
        this.setupEventListeners();
        this.updateAuthUI();
        await this.loadEntities();
        await this.loadAllContent();
    }

    setupEventListeners() {
        // Header scroll effect
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

        // Filters
        const genreSelect = document.getElementById('genreSelect');
        const sortSelect = document.getElementById('sortSelect');
        const yearSelect = document.getElementById('yearSelect');

        if (genreSelect) {
            genreSelect.addEventListener('change', (e) => {
                this.filters.genre = e.target.value;
                this.filters.page = 1;
                this.loadMovies();
            });
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.filters.sort = e.target.value;
                this.filters.page = 1;
                this.loadMovies();
            });
        }

        if (yearSelect) {
            yearSelect.addEventListener('change', (e) => {
                this.filters.year = e.target.value;
                this.filters.page = 1;
                this.loadMovies();
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

        // Section navigation
        this.setupSectionNavigation();

        // Hero buttons
        this.setupHeroButtons();
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
                    window.location.href = `search.html?q=${encodeURIComponent(query)}&type=movie`;
                }
            });

            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const query = searchInput.value.trim();
                    if (query) {
                        window.location.href = `search.html?q=${encodeURIComponent(query)}&type=movie`;
                    }
                }
            });
        }
    }

    setupSectionNavigation() {
        const sections = [
            { prev: 'trendingPrev', next: 'trendingNext', container: 'trendingRow' }
        ];

        sections.forEach(section => {
            const prevBtn = document.getElementById(section.prev);
            const nextBtn = document.getElementById(section.next);
            const container = document.getElementById(section.container);

            if (prevBtn && nextBtn && container) {
                prevBtn.addEventListener('click', () => this.scrollContent(container, -400));
                nextBtn.addEventListener('click', () => this.scrollContent(container, 400));
            }
        });
    }

    scrollContent(containerId, scrollAmount) {
        const container = document.getElementById(containerId);
        if (container) {
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    }

    setupHeroButtons() {
        const playBtn = document.getElementById('playHeroBtn');
        const infoBtn = document.getElementById('infoHeroBtn');
        const addListBtn = document.getElementById('addListBtn');

        if (playBtn) {
            playBtn.addEventListener('click', () => {
                if (this.heroContent) {
                    this.playContent(this.heroContent);
                }
            });
        }

        if (infoBtn) {
            infoBtn.addEventListener('click', () => {
                if (this.heroContent) {
                    this.showContentDetails(this.heroContent.id);
                }
            });
        }

        if (addListBtn) {
            addListBtn.addEventListener('click', async () => {
                if (this.heroContent) {
                    await this.toggleFavorite(this.heroContent.id);
                }
            });
        }
    }

    updateAuthUI() {
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

    async loadAllContent() {
        try {
            await Promise.all([
                this.loadTrendingMovies(),
                this.loadNewReleases(),
                this.loadGenreMovies('action', 'actionRow'),
                this.loadGenreMovies('comedy', 'comedyRow'),
                this.loadGenreMovies('drama', 'dramaRow'),
                this.loadMovies()
            ]);

            // Set hero content from trending
            if (this.content.trending.length > 0) {
                this.heroContent = this.content.trending[0];
                this.updateHero();
            }

        } catch (error) {
            console.error('Error loading content:', error);
            Toast.error('Failed to load movies');
        }
    }

    async loadTrendingMovies() {
        const container = document.getElementById('trendingRow');
        if (!container) return;

        try {
            const response = await api.getTrendingContent({ type: 'movie', limit: 15 });
            if (response.status === 'success' && response.data && response.data.trending) {
                this.content.trending = response.data.trending;
                container.innerHTML = response.data.trending.map(item => this.createContentCard(item)).join('');
                this.attachCardListeners(container);
            } else {
                container.innerHTML = '<p class="empty-message">No trending movies available</p>';
            }
        } catch (error) {
            console.error('Error loading trending movies:', error);
            container.innerHTML = '<p class="empty-message">Failed to load trending movies</p>';
        }
    }

    async loadNewReleases() {
        const container = document.getElementById('newReleasesRow');
        if (!container) return;

        try {
            const response = await api.request('/content/new-releases.php?type=movie&limit=15');
            if (response.status === 'success' && response.data && response.data.releases) {
                this.content.newReleases = response.data.releases;
                container.innerHTML = response.data.releases.map(item => this.createContentCard(item)).join('');
                this.attachCardListeners(container);
            } else {
                container.innerHTML = '<p class="empty-message">No new releases available</p>';
            }
        } catch (error) {
            console.error('Error loading new releases:', error);
            // Fallback to trending
            if (this.content.trending.length > 0) {
                container.innerHTML = this.content.trending.map(item => this.createContentCard(item)).join('');
                this.attachCardListeners(container);
            } else {
                container.innerHTML = '<p class="empty-message">Failed to load new releases</p>';
            }
        }
    }

    async loadGenreMovies(genre, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            const response = await api.getContentByGenre(genre, { type: 'movie', limit: 12 });
            if (response.status === 'success' && response.data && response.data.content) {
                this.content[genre] = response.data.content;
                container.innerHTML = response.data.content.map(item => this.createContentCard(item)).join('');
                this.attachCardListeners(container);
            } else {
                container.innerHTML = '<p class="empty-message">No movies in this genre</p>';
            }
        } catch (error) {
            console.error(`Error loading ${genre} movies:`, error);
            container.innerHTML = '<p class="empty-message">Failed to load movies</p>';
        }
    }

    async loadMovies() {
        const container = document.getElementById('moviesGrid');
        const resultsCount = document.getElementById('resultsCount');
        if (!container) return;

        try {
            const params = {
                type: 'movie',
                page: this.filters.page,
                limit: this.filters.perPage,
                sort: this.filters.sort
            };

            if (this.filters.genre) {
                params.genre = this.filters.genre;
            }

            if (this.filters.year) {
                if (this.filters.year === '2010s') {
                    params.year_from = 2010;
                    params.year_to = 2019;
                } else if (this.filters.year === '2000s') {
                    params.year_from = 2000;
                    params.year_to = 2009;
                } else if (this.filters.year === 'classic') {
                    params.year_to = 1999;
                } else {
                    params.year = this.filters.year;
                }
            }

            if (this.filters.studio) {
                params.studio_id = this.filters.studio;
            }

            if (this.filters.distributor) {
                params.distributor_id = this.filters.distributor;
            }

            if (this.filters.producer) {
                params.producer_id = this.filters.producer;
            }

            if (this.filters.network) {
                params.network_id = this.filters.network;
            }

            const response = await api.getContentList(params);
            
            if (response.status === 'success' && response.data) {
                const movies = Array.isArray(response.data) ? response.data : (response.data.content || []);
                this.content.all = movies;
                
                // Update results count
                const total = response.pagination?.total || movies.length;
                if (resultsCount) {
                    resultsCount.textContent = `${total} movie${total !== 1 ? 's' : ''}`;
                }

                if (movies.length === 0) {
                    container.innerHTML = this.getEmptyStateHtml();
                    this.renderPagination(response.pagination);
                    return;
                }

                container.innerHTML = movies.map(item => this.createContentCard(item, 'grid')).join('');
                this.attachCardListeners(container);
                this.renderPagination(response.pagination);
            } else {
                Toast.error('Failed to load movies');
                container.innerHTML = this.getEmptyStateHtml();
            }
        } catch (error) {
            console.error('Error loading movies:', error);
            Toast.error('Failed to load movies');
            container.innerHTML = this.getEmptyStateHtml();
        }
    }

    updateHero() {
        if (!this.heroContent) return;

        const heroBg = document.getElementById('heroBg');
        const heroTitle = document.getElementById('heroTitle');
        const heroDescription = document.getElementById('heroDescription');
        const heroMatch = document.getElementById('heroMatch');
        const heroYear = document.getElementById('heroYear');
        const heroDuration = document.getElementById('heroDuration');

        if (heroBg) {
            heroBg.src = this.heroContent.thumbnail || this.heroContent.thumbnail_url || 'assets/images/placeholder.jpg';
        }
        if (heroTitle) heroTitle.textContent = this.heroContent.title || 'Movies';
        if (heroDescription) heroDescription.textContent = this.heroContent.description || 'Discover amazing movies';
        if (heroMatch) heroMatch.textContent = `${this.heroContent.rating || 95}% Match`;
        if (heroYear) heroYear.textContent = this.heroContent.release_year || '2024';
        if (heroDuration) heroDuration.textContent = this.formatDuration(this.heroContent.duration);
    }

    createContentCard(content, layout = 'row') {
        const match = content.rating || Math.floor(Math.random() * 30) + 70;
        const quality = content.video_quality || 'HD';
        const duration = this.formatDuration(content.duration || content.duration_minutes);
        const genres = content.genres || content.genre || 'Drama';
        const thumbnail = content.thumbnail || content.thumbnail_url || 'assets/images/placeholder.jpg';

        const cardHtml = `
            <div class="content-card" data-id="${content.id}">
                <div class="content-card-inner">
                    <img src="${thumbnail}" 
                         alt="${content.title || 'Movie'}" 
                         loading="lazy"
                         onerror="this.src='assets/images/placeholder.jpg'">
                    <div class="content-card-overlay">
                        <div class="content-card-actions">
                            <button class="btn btn-primary btn-icon play-btn" title="Play">
                                <i class="fas fa-play"></i>
                            </button>
                            <button class="btn btn-icon add-btn" title="Add to My List">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button class="btn btn-icon" title="Like">
                                <i class="fas fa-thumbs-up"></i>
                            </button>
                            <button class="btn btn-icon" title="More Info">
                                <i class="fas fa-chevron-down"></i>
                            </button>
                        </div>
                        <div class="content-card-meta">
                            <span class="match">${match}% Match</span>
                            <span class="rating">${content.age_rating || 'TV-MA'}</span>
                            <span class="quality">${quality}</span>
                        </div>
                        <div class="content-card-genres">
                            <span>${genres}</span>
                            <span>${duration}</span>
                            ${content.studio_name ? `<span>${content.studio_name}</span>` : ''}
                            ${content.company_name ? `<span>${content.company_name}</span>` : ''}
                        </div>
                    </div>
                    ${content.is_premium ? '<div class="premium-badge">PREMIUM</div>' : ''}
                </div>
                <div class="content-card-title">${content.title || 'Untitled'}</div>
            </div>
        `;

        return cardHtml;
    }

    attachCardListeners(container) {
        container.querySelectorAll('.content-card').forEach(card => {
            card.addEventListener('click', () => {
                this.showContentDetails(card.dataset.id);
            });

            const playBtn = card.querySelector('.play-btn');
            if (playBtn) {
                playBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const content = this.findContentById(card.dataset.id);
                    if (content) this.playContent(content);
                });
            }

            const addBtn = card.querySelector('.add-btn');
            if (addBtn) {
                addBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await this.toggleFavorite(card.dataset.id);
                });
            }
        });
    }

    findContentById(id) {
        const allContent = [
            ...this.content.trending,
            ...this.content.newReleases,
            ...this.content.action,
            ...this.content.comedy,
            ...this.content.drama,
            ...this.content.all
        ];
        return allContent.find(c => c.id == id);
    }

    async playContent(content) {
        if (!auth.isAuthenticated) {
            Toast.warning('Please sign in to watch');
            setTimeout(() => window.location.href = 'login.html', 1500);
            return;
        }

        window.location.href = `watch.html?id=${content.id}`;
    }

    async toggleFavorite(contentId) {
        if (!auth.isAuthenticated) {
            Toast.warning('Please sign in to add to your list');
            return;
        }

        try {
            const isFav = await api.isFavorite(contentId);
            if (isFav) {
                await api.removeFromFavorites(contentId);
                Toast.success('Removed from My List');
            } else {
                await api.addToFavorites(contentId);
                Toast.success('Added to My List');
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            Toast.error('Failed to update list');
        }
    }

    async showContentDetails(contentId) {
        try {
            const response = await api.getContentDetail(contentId);
            if (response.status === 'success' && response.data) {
                const content = response.data;
                
                const modalContent = `
                    <div class="content-details-modal">
                        <div class="details-hero">
                            <img src="${content.thumbnail || content.thumbnail_url || 'assets/images/placeholder.jpg'}" alt="${content.title}">
                            <div class="details-hero-overlay"></div>
                            <div class="details-hero-content">
                                <h2>${content.title}</h2>
                                <div class="details-meta">
                                    <span class="match">${content.rating || 'N/A'}% Match</span>
                                    <span class="year">${content.release_year || 'N/A'}</span>
                                    <span class="rating">${content.age_rating || 'TV-MA'}</span>
                                    <span class="quality">${content.video_quality || 'HD'}</span>
                                    <span class="duration">${this.formatDuration(content.duration)}</span>
                                    ${content.studio_name ? `<span class="studio">${content.studio_name}</span>` : ''}
                                    ${content.distributor_name ? `<span class="distributor">${content.distributor_name}</span>` : ''}
                                    ${content.producer_name ? `<span class="producer">${content.producer_name}</span>` : ''}
                                    ${content.network_name ? `<span class="network">${content.network_name}</span>` : ''}
                                </div>
                                <p class="description">${content.description || 'No description available.'}</p>
                                <div class="details-actions">
                                    <button class="btn btn-primary" onclick="moviesPage.playContent(${JSON.stringify(content).replace(/"/g, '"')})">
                                        <i class="fas fa-play"></i> Play
                                    </button>
                                    <button class="btn btn-secondary" onclick="moviesPage.toggleFavorite(${content.id})">
                                        <i class="fas fa-plus"></i> My List
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                this.openModal(modalContent);
            }
        } catch (error) {
            console.error('Error loading content details:', error);
            Toast.error('Failed to load content details');
        }
    }

    openModal(content) {
        const modalOverlay = document.getElementById('modalOverlay');
        const modalContent = document.getElementById('modalContent');
        if (modalOverlay && modalContent) {
            modalContent.innerHTML = content;
            modalOverlay.classList.add('active');
            document.body.classList.add('no-scroll');
        }
    }

    getEmptyStateHtml() {
        return `
            <div class="empty-state" style="grid-column: 1 / -1; padding: 3rem; text-align: center;">
                <div class="empty-state-icon">
                    <i class="fas fa-film"></i>
                </div>
                <h3 class="empty-state-title">No movies found</h3>
                <p class="empty-state-description">
                    Try adjusting your filters or browse all movies.
                </p>
                <button class="btn btn-primary" onclick="moviesPage.clearFilters()">
                    <i class="fas fa-redo"></i> Clear Filters
                </button>
            </div>
        `;
    }

    async loadEntities() {
        try {
            const entityTypes = ['studios', 'distributors', 'producers', 'networks'];

            for (const type of entityTypes) {
                const response = await api.request(`/entities/crud.php?type=${type}&limit=100`);
                if (response.status === 'success' && response.data && response.data.entities) {
                    this.entities[type] = response.data.entities;
                    this.populateEntityFilter(type);
                }
            }
        } catch (error) {
            console.error('Error loading entities:', error);
        }
    }

    populateEntityFilter(type) {
        const selectId = `${type}Select`;
        const select = document.getElementById(selectId);

        if (!select) return;

        // Clear existing options except the first
        select.innerHTML = '<option value="">All</option>';

        // Add entity options
        this.entities[type].forEach(entity => {
            const option = document.createElement('option');
            option.value = entity.id;
            option.textContent = entity.name;
            select.appendChild(option);
        });
    }

    clearFilters() {
        this.filters = {
            genre: '',
            sort: 'popularity',
            year: '',
            page: 1,
            perPage: 24,
            studio: '',
            distributor: '',
            producer: '',
            network: ''
        };

        // Reset UI
        const genreSelect = document.getElementById('genreSelect');
        const sortSelect = document.getElementById('sortSelect');
        const yearSelect = document.getElementById('yearSelect');
        const studioSelect = document.getElementById('studioSelect');
        const distributorSelect = document.getElementById('distributorSelect');
        const producerSelect = document.getElementById('producerSelect');
        const networkSelect = document.getElementById('networkSelect');

        if (genreSelect) genreSelect.value = '';
        if (sortSelect) sortSelect.value = 'popularity';
        if (yearSelect) yearSelect.value = '';
        if (studioSelect) studioSelect.value = '';
        if (distributorSelect) distributorSelect.value = '';
        if (producerSelect) producerSelect.value = '';
        if (networkSelect) networkSelect.value = '';

        this.loadMovies();
    }

    renderPagination(pagination) {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer || !pagination) return;

        const { current_page, total_pages } = pagination;

        if (total_pages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let html = `
            <div class="pagination">
                <button class="pagination-btn" ${current_page === 1 ? 'disabled' : ''} 
                        onclick="moviesPage.changePage(${current_page - 1})">
                    <i class="fas fa-chevron-left"></i>
                </button>
        `;

        const startPage = Math.max(1, current_page - 2);
        const endPage = Math.min(total_pages, current_page + 2);

        if (startPage > 1) {
            html += `<button class="pagination-btn" onclick="moviesPage.changePage(1)">1</button>`;
            if (startPage > 2) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="pagination-btn ${i === current_page ? 'active' : ''}" 
                        onclick="moviesPage.changePage(${i})">${i}</button>
            `;
        }

        if (endPage < total_pages) {
            if (endPage < total_pages - 1) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }
            html += `<button class="pagination-btn" onclick="moviesPage.changePage(${total_pages})">${total_pages}</button>`;
        }

        html += `
                <button class="pagination-btn" ${current_page === total_pages ? 'disabled' : ''} 
                        onclick="moviesPage.changePage(${current_page + 1})">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;

        paginationContainer.innerHTML = html;
    }

    changePage(page) {
        this.filters.page = page;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.loadMovies();
    }

    formatDuration(minutes) {
        if (!minutes) return 'N/A';
        if (typeof minutes === 'string' && !/^\d+$/.test(minutes)) return minutes;
        const mins = parseInt(minutes);
        if (isNaN(mins)) return 'N/A';
        if (mins < 60) return `${mins}m`;
        const hours = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
    }
}

// Initialize page
let moviesPage;
document.addEventListener('DOMContentLoaded', () => {
    moviesPage = new MoviesPage();
});

window.moviesPage = moviesPage;

