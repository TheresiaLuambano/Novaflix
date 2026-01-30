/**
 * BurudaniKiganjani - Main Application
 * Core application logic
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

var AppState = {
    isLoading: true,
    currentPage: 'home',
    featuredContent: null,
    contentCache: {
        trending: [],
        featured: [],
        movies: [],
        series: [],
        shorts: [],
        continueWatching: [],
        myList: []
    },
    genres: [],
    contentTypes: ['movie', 'series', 'documentary', 'anime', 'short']
};

var header, heroSection, mainContent, modalOverlay, loadingOverlay, toastContainer;

function initializeElements() {
    header = document.getElementById('header');
    heroSection = document.getElementById('hero');
    mainContent = document.querySelector('.main-content');
    modalOverlay = document.getElementById('modalOverlay');
    loadingOverlay = document.getElementById('loadingOverlay');
    toastContainer = document.getElementById('toastContainer');
}

function setupEventListeners() {
    window.addEventListener('scroll', handleScroll);
    
    var mobileMenuBtn = document.getElementById('mobileMenuBtn');
    var mainNav = document.getElementById('mainNav');
    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener('click', function() {
            mainNav.classList.toggle('active');
            var icon = mobileMenuBtn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });
    }
    
    setupSearch();
    setupUserDropdown();
    setupModal();
    setupHeroButtons();
    setupSectionNavigation();
    
    var logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            auth.logout();
        });
    }
}

function handleScroll() {
    if (header) {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
}

function setupSearch() {
    var searchBtn = document.getElementById('searchBtn');
    var searchDropdown = document.getElementById('searchDropdown');
    var searchInput = document.getElementById('searchInput');

    if (searchBtn && searchDropdown) {
        searchBtn.addEventListener('click', function() {
            searchDropdown.classList.toggle('active');
            if (searchDropdown.classList.contains('active') && searchInput) {
                searchInput.focus();
            }
        });

        document.addEventListener('click', function(e) {
            if (!searchDropdown.contains(e.target) && !searchBtn.contains(e.target)) {
                searchDropdown.classList.remove('active');
            }
        });
    }

    var searchSubmit = document.querySelector('.search-submit');
    if (searchSubmit && searchInput) {
        searchSubmit.addEventListener('click', function() {
            performSearch(searchInput.value);
        });
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') performSearch(searchInput.value);
        });
    }
}

function performSearch(query) {
    if (!query || !query.trim()) {
        showToast('Please enter a search term', 'warning');
        return;
    }
    window.location.href = 'search.html?q=' + encodeURIComponent(query.trim());
}

function setupUserDropdown() {
    var userAvatarBtn = document.getElementById('userAvatarBtn');
    var userDropdown = document.getElementById('userDropdown');

    if (userAvatarBtn && userDropdown) {
        userAvatarBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.classList.toggle('active');
        });

        document.addEventListener('click', function() {
            userDropdown.classList.remove('active');
        });
    }
}

function setupModal() {
    var modalClose = document.getElementById('modalClose');
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) closeModal();
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
}

function openModal(content) {
    if (modalOverlay && content) {
        var modalContent = document.getElementById('modalContent');
        if (modalContent) {
            modalContent.innerHTML = content;
        }
        modalOverlay.classList.add('active');
        document.body.classList.add('no-scroll');
    }
}

function closeModal() {
    if (modalOverlay) {
        modalOverlay.classList.remove('active');
        document.body.classList.remove('no-scroll');
    }
}

async function initializeApp() {
    try {
        initializeElements();
        await auth.init();
        await loadAllContentFromDatabase();
        auth.updateUI();
        hideLoading();
        AppState.isLoading = false;
    } catch (error) {
        console.error('App initialization error:', error);
        hideLoading();
        showToast('Failed to load content. Please refresh the page.', 'error');
    }
}

async function loadAllContentFromDatabase() {
    try {
        await Promise.all([
            loadTrendingContent(),
            loadNewReleases(),
            loadMovies(),
            loadSeries()
        ]);
    } catch (error) {
        console.error('Error loading content:', error);
        throw error;
    }
}

async function loadTrendingContent() {
    try {
        var response = await api.getTrendingContent({ limit: 12 });
        var trending = [];
        if (response && response.status === 'success') {
            trending = response.data.trending || response.data || [];
        }
        
        if (trending.length > 0) {
            AppState.contentCache.trending = trending;
            renderContentRow('trendingRow', trending);
        } else {
            renderEmptyState('trendingRow', 'Trending content coming soon');
        }
    } catch (error) {
        console.error('Error loading trending content:', error);
        renderEmptyState('trendingRow', 'Unable to load trending content');
    }
}

async function loadNewReleases() {
    try {
        var response = await api.request('/content/new-releases.php?limit=12');
        var releases = [];
        if (response && response.status === 'success') {
            releases = response.data.releases || response.data || [];
        }
        
        var container = document.getElementById('newReleasesRow');
        if (container && releases.length > 0) {
            renderContentRow('newReleasesRow', releases);
        }
    } catch (error) {
        console.error('Error loading new releases:', error);
    }
}

async function loadMovies() {
    try {
        var response = await api.getContentByType('movie', { limit: 12 });
        var movies = [];
        if (response && response.status === 'success') {
            movies = response.data.content || response.data || [];
        }
        
        if (movies.length > 0) {
            AppState.contentCache.movies = movies;
            renderContentRow('moviesRow', movies);
        } else {
            renderEmptyState('moviesRow', 'Movies coming soon');
        }
    } catch (error) {
        console.error('Error loading movies:', error);
        renderEmptyState('moviesRow', 'Unable to load movies');
    }
}

async function loadSeries() {
    try {
        var response = await api.getContentByType('series', { limit: 12 });
        var series = [];
        if (response && response.status === 'success') {
            series = response.data.content || response.data || [];
        }
        
        if (series.length > 0) {
            AppState.contentCache.series = series;
            renderContentRow('seriesRow', series);
        } else {
            renderEmptyState('seriesRow', 'Series coming soon');
        }
    } catch (error) {
        console.error('Error loading series:', error);
        renderEmptyState('seriesRow', 'Unable to load series');
    }
}

function setupHeroButtons() {
    var playBtn = document.getElementById('playBtn');
    var moreInfoBtn = document.getElementById('moreInfoBtn');

    if (playBtn) {
        playBtn.addEventListener('click', function() {
            if (AppState.featuredContent) {
                playContent(AppState.featuredContent);
            }
        });
    }

    if (moreInfoBtn) {
        moreInfoBtn.addEventListener('click', function() {
            if (AppState.featuredContent) {
                showContentDetails(AppState.featuredContent.id);
            }
        });
    }
}

function updateHero(content) {
    if (!content) return;

    AppState.featuredContent = content;

    var heroBg = document.getElementById('heroBg');
    var heroTitle = document.getElementById('heroTitle');
    var heroDescription = document.getElementById('heroDescription');

    if (heroBg) heroBg.src = content.thumbnail || content.thumbnail_url || 'assets/images/hero-bg.jpg';
    if (heroTitle) heroTitle.textContent = content.title || 'Untitled';
    if (heroDescription) heroDescription.textContent = content.description || 'No description available.';
}

function formatDuration(duration) {
    if (!duration) return '1h 30m';
    var mins = parseInt(duration);
    if (mins < 60) return mins + 'm';
    var hours = Math.floor(mins / 60);
    var remainingMins = mins % 60;
    if (remainingMins > 0) {
        return hours + 'h ' + remainingMins + 'm';
    }
    return hours + 'h';
}

function renderContentRow(containerId, content) {
    var container = document.getElementById(containerId);
    if (!container) return;

    if (!content || content.length === 0) {
        container.innerHTML = '<p class="empty-message">No content available</p>';
        return;
    }

    var html = '';
    for (var i = 0; i < content.length; i++) {
        html += createContentCard(content[i]);
    }
    container.innerHTML = html;
    
    var cards = container.querySelectorAll('.content-card');
    for (var j = 0; j < cards.length; j++) {
        cards[j].addEventListener('click', function() {
            showContentDetails(this.dataset.id);
        });
    }
}

function createContentCard(content) {
    var match = content.rating || Math.floor(Math.random() * 30) + 70;
    var quality = content.video_quality || 'HD';
    var duration = formatDuration(content.duration);
    var genres = content.genres || content.genre || 'Drama';
    var thumbnail = content.thumbnail || content.thumbnail_url || 'assets/images/placeholder.jpg';
    var premiumBadge = content.is_premium ? '<div class="premium-badge">PREMIUM</div>' : '';
    
    return '<div class="content-card" data-id="' + content.id + '">' +
        '<div class="content-card-inner">' +
        '<img src="' + thumbnail + '" alt="' + (content.title || 'Content') + '" loading="lazy" onerror="this.src=\'assets/images/placeholder.jpg\'">' +
        '<div class="content-card-overlay">' +
        '<div class="content-card-actions">' +
        '<button class="btn btn-primary btn-icon play-btn" title="Play"><i class="fas fa-play"></i></button>' +
        '<button class="btn btn-icon" title="Like"><i class="fas fa-thumbs-up"></i></button>' +
        '<button class="btn btn-icon" title="More"><i class="fas fa-chevron-down"></i></button>' +
        '</div>' +
        '<div class="content-card-meta">' +
        '<span class="match">' + match + '% Match</span>' +
        '<span class="rating">' + (content.age_rating || 'TV-MA') + '</span>' +
        '<span class="quality">' + quality + '</span>' +
        '</div>' +
        '<div class="content-card-genres">' +
        '<span>' + genres + '</span>' +
        '<span>' + duration + '</span>' +
        '</div>' +
        '</div>' +
        premiumBadge +
        '</div>' +
        '<div class="content-card-title">' + (content.title || 'Untitled') + '</div>' +
        '</div>';
}

function renderEmptyState(containerId, message) {
    var container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '<p class="empty-message" style="padding: 2rem; text-align: center; color: #888;">' + message + '</p>';
    }
}

function setupSectionNavigation() {
    var sections = [
        { prev: 'trendingPrev', next: 'trendingNext', container: 'trendingRow' },
        { prev: 'moviesPrev', next: 'moviesNext', container: 'moviesRow' },
        { prev: 'seriesPrev', next: 'seriesNext', container: 'seriesRow' }
    ];

    for (var i = 0; i < sections.length; i++) {
        var section = sections[i];
        var prevBtn = document.getElementById(section.prev);
        var nextBtn = document.getElementById(section.next);
        var container = document.getElementById(section.container);

        if (prevBtn && nextBtn && container) {
            prevBtn.addEventListener('click', (function(c) {
                return function() {
                    scrollContent(c, -400);
                };
            })(container));
            nextBtn.addEventListener('click', (function(c) {
                return function() {
                    scrollContent(c, 400);
                };
            })(container));
        }
    }
}

function scrollContent(containerId, scrollAmount) {
    var container = document.getElementById(containerId);
    if (container) {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
}

function playContent(content) {
    if (!auth.isAuthenticated) {
        showToast('Please sign in to watch', 'warning');
        setTimeout(function() {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }
    window.location.href = 'watch.html?id=' + content.id;
}

async function showContentDetails(contentId) {
    try {
        showLoading();
        var response = await api.getContentDetail(contentId);
        
        if (response && response.status === 'success') {
            var content = response.data;
            
            var modalContent = '<div class="content-details-modal">' +
                '<div class="details-hero">' +
                '<img src="' + (content.thumbnail || content.thumbnail_url || 'assets/images/placeholder.jpg') + '" alt="' + content.title + '">' +
                '<div class="details-hero-overlay"></div>' +
                '<div class="details-hero-content">' +
                '<h2>' + content.title + '</h2>' +
                '<div class="details-meta">' +
                '<span class="match">' + (content.rating || 'N/A') + '% Match</span>' +
                '<span class="year">' + (content.release_year || 'N/A') + '</span>' +
                '<span class="rating">' + (content.age_rating || 'TV-MA') + '</span>' +
                '<span class="duration">' + formatDuration(content.duration) + '</span>' +
                '</div>' +
                '<p class="description">' + (content.description || 'No description available.') + '</p>' +
                '<div class="details-actions">' +
                '<button class="btn btn-primary" onclick="playContent({id: ' + content.id + '});"><i class="fas fa-play"></i> Play</button>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>';
            
            openModal(modalContent);
        }
    } catch (error) {
        console.error('Error loading content details:', error);
        showToast('Failed to load content details', 'error');
    } finally {
        hideLoading();
    }
}

function showLoading() {
    if (loadingOverlay) loadingOverlay.classList.add('active');
}

function hideLoading() {
    if (loadingOverlay) loadingOverlay.classList.remove('active');
}

function showToast(message, type) {
    type = type || 'info';
    if (!toastContainer) return;

    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    
    var icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-times-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    toast.innerHTML = '<i class="' + icons[type] + ' toast-icon"></i>' +
        '<span class="toast-message">' + message + '</span>' +
        '<button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>';

    toastContainer.appendChild(toast);
    setTimeout(function() {
        toast.classList.add('show');
    }, 10);
    setTimeout(function() {
        toast.classList.remove('show');
        setTimeout(function() {
            toast.remove();
        }, 300);
    }, 5000);
}

window.playContent = playContent;
window.showContentDetails = showContentDetails;
window.showToast = showToast;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
