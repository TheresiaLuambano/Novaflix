/**
 * BurudaniKiganjani - New & Popular Page
 * Handles trending, new releases, and popular content
 */

class NewPopularPage {
    constructor() {
        this.state = {
            trending: [],
            newReleases: [],
            popularMovies: [],
            popularSeries: [],
            topRated: [],
            heroContent: null
        };
        
        this.init();
    }

    async init() {
        await auth.init();
        this.setupEventListeners();
        this.updateAuthUI();
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

        if (playBtn) {
            playBtn.addEventListener('click', () => {
                if (this.state.heroContent) {
                    this.playContent(this.state.heroContent);
                }
            });
        }

        if (infoBtn) {
            infoBtn.addEventListener('click', () => {
                if (this.state.heroContent) {
                    this.showContentDetails(this.state.heroContent.id);
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
            
            const avatarUrl = auth.currentUser.avatar_url || auth.currentUser.avatar || 'assets/images/default-avatar.png';
            if (userAvatar) userAvatar.src = avatarUrl;
            if (dropdownAvatar) dropdownAvatar.src = avatarUrl;
        }
    }

    async loadAllContent() {
        try {
            // Load content in parallel
            await Promise.all([
                this.loadTrending(),
                this.loadNewReleases(),
                this.loadPopularMovies(),
                this.loadPopularSeries(),
                this.loadTopRated()
            ]);

            // Set hero content after loading new releases
            if (this.state.newReleases.length > 0) {
                this.state.heroContent = this.state.newReleases[0];
                this.updateHero();
            }

        } catch (error) {
            console.error('Error loading content:', error);
            Toast.error('Failed to load content');
        }
    }

    async loadTrending() {
        const container = document.getElementById('trendingRow');
        if (!container) return;

        try {
            const response = await api.getTrendingContent({ limit: 15 });
            
            let trending = [];
            if (response && response.status === 'success') {
                trending = response.data?.trending || response.data || [];
            }
            
            if (trending.length > 0) {
                this.state.trending = trending;
                container.innerHTML = trending.map(item => this.createContentCard(item)).join('');
                this.attachCardListeners(container);
            } else {
                container.innerHTML = '<p class="empty-message">No trending content available</p>';
            }
        } catch (error) {
            console.error('Error loading trending:', error);
            container.innerHTML = '<p class="empty-message">Failed to load trending content</p>';
        }
    }

    async loadNewReleases() {
        const container = document.getElementById('newReleasesRow');
        if (!container) return;

        try {
            const response = await api.request('/content/new-releases.php?limit=15');
            
            let releases = [];
            if (response && response.status === 'success') {
                releases = response.data?.releases || response.data || [];
            }
            
            if (releases.length > 0) {
                this.state.newReleases = releases;
                container.innerHTML = releases.map(item => this.createContentCard(item)).join('');
                this.attachCardListeners(container);
            } else {
                // Fallback to trending
                if (this.state.trending.length > 0) {
                    this.state.newReleases = this.state.trending;
                    container.innerHTML = this.state.trending.map(item => this.createContentCard(item)).join('');
                    this.attachCardListeners(container);
                } else {
                    container.innerHTML = '<p class="empty-message">No new releases available</p>';
                }
            }
        } catch (error) {
            console.error('Error loading new releases:', error);
            // Fallback to trending
            if (this.state.trending.length > 0) {
                this.state.newReleases = this.state.trending;
                container.innerHTML = this.state.trending.map(item => this.createContentCard(item)).join('');
                this.attachCardListeners(container);
            } else {
                container.innerHTML = '<p class="empty-message">Failed to load new releases</p>';
            }
        }
    }

    async loadPopularMovies() {
        const container = document.getElementById('popularMoviesRow');
        if (!container) return;

        try {
            const response = await api.getContentByType('movie', { limit: 15 });
            
            let movies = [];
            if (response && response.status === 'success') {
                movies = response.data?.content || response.data || [];
            }
            
            if (movies.length > 0) {
                this.state.popularMovies = movies;
                container.innerHTML = movies.map(item => this.createContentCard(item)).join('');
                this.attachCardListeners(container);
            } else {
                container.innerHTML = '<p class="empty-message">No movies available</p>';
            }
        } catch (error) {
            console.error('Error loading movies:', error);
            container.innerHTML = '<p class="empty-message">Failed to load movies</p>';
        }
    }

    async loadPopularSeries() {
        const container = document.getElementById('popularSeriesRow');
        if (!container) return;

        try {
            const response = await api.getContentByType('series', { limit: 15 });
            
            let series = [];
            if (response && response.status === 'success') {
                series = response.data?.content || response.data || [];
            }
            
            if (series.length > 0) {
                this.state.popularSeries = series;
                container.innerHTML = series.map(item => this.createContentCard(item)).join('');
                this.attachCardListeners(container);
            } else {
                container.innerHTML = '<p class="empty-message">No series available</p>';
            }
        } catch (error) {
            console.error('Error loading series:', error);
            container.innerHTML = '<p class="empty-message">Failed to load series</p>';
        }
    }

    async loadTopRated() {
        const container = document.getElementById('topRatedRow');
        if (!container) return;

        try {
            const response = await api.getContentList({ sort: 'rating', limit: 15 });
            
            let topRated = [];
            if (response && response.status === 'success') {
                topRated = response.data?.content || response.data || [];
            }
            
            if (topRated.length > 0) {
                this.state.topRated = topRated;
                container.innerHTML = topRated.map(item => this.createContentCard(item)).join('');
                this.attachCardListeners(container);
            } else {
                // Fallback to trending
                if (this.state.trending.length > 0) {
                    container.innerHTML = this.state.trending.map(item => this.createContentCard(item)).join('');
                    this.attachCardListeners(container);
                } else {
                    container.innerHTML = '<p class="empty-message">No top rated content available</p>';
                }
            }
        } catch (error) {
            console.error('Error loading top rated:', error);
            // Fallback to trending
            if (this.state.trending.length > 0) {
                container.innerHTML = this.state.trending.map(item => this.createContentCard(item)).join('');
                this.attachCardListeners(container);
            } else {
                container.innerHTML = '<p class="empty-message">Failed to load top rated content</p>';
            }
        }
    }

    updateHero() {
        if (!this.state.heroContent) return;

        const heroBg = document.getElementById('heroBg');
        const heroTitle = document.getElementById('heroTitle');
        const heroDescription = document.getElementById('heroDescription');

        if (heroBg) {
            heroBg.src = this.state.heroContent.thumbnail || this.state.heroContent.thumbnail_url || 'assets/images/placeholder.jpg';
        }
        if (heroTitle) heroTitle.textContent = this.state.heroContent.title || 'New Releases';
        if (heroDescription) heroDescription.textContent = this.state.heroContent.description || 'Discover the latest movies, series, and exclusive content';
    }

    createContentCard(content) {
        const match = content.rating || Math.floor(Math.random() * 30) + 70;
        const quality = content.video_quality || 'HD';
        const duration = this.formatDuration(content.duration || content.duration_minutes);
        const genres = content.genres || content.genre || 'Drama';
        const thumbnail = content.thumbnail || content.thumbnail_url || 'assets/images/placeholder.jpg';

        return `
            <div class="content-card" data-id="${content.id}">
                <div class="content-card-inner">
                    <img src="${thumbnail}" 
                         alt="${content.title || 'Content'}" 
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
                        </div>
                    </div>
                    ${content.is_premium ? '<div class="premium-badge">PREMIUM</div>' : ''}
                </div>
                <div class="content-card-title">${content.title || 'Untitled'}</div>
            </div>
        `;
    }

    attachCardListeners(container) {
        if (!container) return;
        
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
            ...this.state.trending,
            ...this.state.newReleases,
            ...this.state.popularMovies,
            ...this.state.popularSeries,
            ...this.state.topRated
        ];
        return allContent.find(c => c.id == id);
    }

    playContent(content) {
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
            if (response && response.status === 'success' && response.data) {
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
                                </div>
                                <p class="description">${content.description || 'No description available.'}</p>
                                <div class="details-actions">
                                    <button class="btn btn-primary" onclick="newPopular.playContent(${JSON.stringify(content).replace(/"/g, '"')})">
                                        <i class="fas fa-play"></i> Play
                                    </button>
                                    <button class="btn btn-secondary" onclick="newPopular.toggleFavorite(${content.id})">
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

    formatDuration(minutes) {
        if (!minutes) return 'N/A';
        if (typeof minutes === 'string' && !/^\d+$/.test(minutes)) return minutes;
        const mins = parseInt(minutes);
        if (mins < 60) return `${mins}m`;
        const hours = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
    }
}

// Initialize page
let newPopular;
document.addEventListener('DOMContentLoaded', () => {
    newPopular = new NewPopularPage();
});

window.newPopular = newPopular;

