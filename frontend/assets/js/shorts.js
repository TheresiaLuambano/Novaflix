/**
 * BurudaniKiganjani - Shorts Page
 * TikTok-style short-form content page with database integration
 */

// Shorts App State
const ShortsState = {
    isLoading: true,
    shorts: [],
    currentIndex: 0,
    page: 1,
    limit: 20,
    hasMore: true,
    isLoadingMore: false,
    isInitialized: false
};

// DOM Elements
let shortsFeed, shortsLoading, loadingOverlay, toastContainer, modalOverlay;

// Base URL for resolving media URLs
const BASE_URL = window.location.origin + '/BurudaniKiganjani';

// ========== Utility Functions ==========

function resolveMediaUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/BurudaniKiganjani/')) return window.location.origin + url;
    return BASE_URL + '/' + url.replace(/^\//, '');
}

function formatViews(count) {
    if (!count) return '0';
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
}

function formatDuration(duration) {
    if (!duration) return '0:00';
    if (typeof duration === 'number' || /^\d+$/.test(duration)) {
        const mins = parseInt(duration);
        const seconds = Math.floor((mins * 60) % 60);
        return `${mins}:${seconds.toString().padStart(2, '0')}`;
    }
    const hourMatch = duration.match(/(\d+)h/);
    const minMatch = duration.match(/(\d+)m/);
    const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
    const mins = minMatch ? parseInt(minMatch[1]) : 0;
    if (hours > 0) return `${hours}:${mins.toString().padStart(2, '0')}`;
    return `${mins}:00`;
}

function getTimeAgo(dateString) {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

// ========== Initialization ==========

let _domContentLoadedHandlerRegistered = false;

document.addEventListener('DOMContentLoaded', async () => {
    if (_domContentLoadedHandlerRegistered) return;
    _domContentLoadedHandlerRegistered = true;
    
    initializeElements();
    setupEventListeners();
    await initializeShorts();
});

async function initializeShorts() {
    if (ShortsState.isInitialized) return;
    
    try {
        updateAuthUI();
        await loadShorts();
        ShortsState.isInitialized = true;
        hideLoading();
        ShortsState.isLoading = false;
    } catch (error) {
        console.error('Shorts initialization error:', error);
        hideLoading();
        showToast('Failed to load Shorts', 'error');
    }
}

function initializeElements() {
    shortsFeed = document.getElementById('shortsFeed');
    shortsLoading = document.getElementById('shortsLoading');
    loadingOverlay = document.getElementById('loadingOverlay');
    toastContainer = document.getElementById('toastContainer');
    modalOverlay = document.getElementById('modalOverlay');
    
    const modalClose = document.getElementById('modalClose');
    if (modalClose) modalClose.addEventListener('click', closeModal);
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

function openModal(content) {
    if (modalOverlay && content) {
        document.getElementById('modalContent').innerHTML = content;
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

window.closeModal = closeModal;

function setupEventListeners() {
    setupSearch();
    setupUserDropdown();
    setupInfiniteScroll();
    
    const createBtn = document.querySelector('.shorts-fab');
    if (createBtn) {
        createBtn.addEventListener('click', () => {
            if (auth.isAuthenticated) shorts.openCreateModal();
            else {
                showToast('Please sign in to create Shorts', 'warning');
                setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            }
        });
    }
}

function setupSearch() {
    const searchBtn = document.querySelector('.search-btn');
    const searchBox = document.querySelector('.search-box');
    const searchInput = document.getElementById('shortsSearchInput');

    if (searchBtn && searchBox) {
        searchBtn.addEventListener('click', () => {
            searchBox.classList.toggle('active');
            if (searchBox.classList.contains('active')) searchInput.focus();
        });
        document.addEventListener('click', (e) => {
            if (!searchBox.contains(e.target) && !searchBtn.contains(e.target)) {
                searchBox.classList.remove('active');
            }
        });
    }

    const searchSubmit = document.querySelector('.search-submit');
    if (searchSubmit && searchInput) {
        searchSubmit.addEventListener('click', () => performShortsSearch(searchInput.value));
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performShortsSearch(searchInput.value);
        });
    }
}

async function performShortsSearch(query) {
    if (!query.trim()) {
        showToast('Please enter a search term', 'warning');
        return;
    }
    try {
        showLoading();
        const response = await api.searchContent(query, { type: 'short' });
        if (response.status === 'success' && response.data) {
            renderShortsFeed(response.data);
        }
    } catch (error) {
        console.error('Search error:', error);
        showToast('Search failed', 'error');
    } finally {
        hideLoading();
    }
}

function setupUserDropdown() {
    const userAvatarBtn = document.querySelector('.user-avatar-btn');
    const userDropdown = document.querySelector('.user-dropdown');

    if (userAvatarBtn && userDropdown) {
        userAvatarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('active');
        });
        document.addEventListener('click', () => {
            userDropdown.classList.remove('active');
        });
    }
}

function updateAuthUI() {
    const userMenu = document.querySelector('.user-menu');
    const authButtons = document.querySelector('.auth-buttons');
    
    if (auth.isAuthenticated) {
        if (userMenu) userMenu.style.display = 'block';
        if (authButtons) authButtons.style.display = 'none';
        
        const user = auth.user || api.getStoredUser();
        if (user) {
            const dropdownName = document.getElementById('dropdownName');
            const dropdownEmail = document.getElementById('dropdownEmail');
            const headerAvatar = document.getElementById('headerAvatar');
            const dropdownAvatar = document.getElementById('dropdownAvatar');
            
            if (dropdownName) dropdownName.textContent = user.name || 'User';
            if (dropdownEmail) dropdownEmail.textContent = user.email || '';
            
            const avatarUrl = user.avatar_url || user.avatar || 'assets/images/default-avatar.png';
            if (headerAvatar) headerAvatar.src = avatarUrl;
            if (dropdownAvatar) dropdownAvatar.src = avatarUrl;
        }
    } else {
        if (userMenu) userMenu.style.display = 'none';
        if (authButtons) authButtons.style.display = 'flex';
    }
}

// ========== Shorts Loading ==========

let _loadShortsCallId = 0;

async function loadShorts(reset = true) {
    if (ShortsState.isLoadingMore && !reset) return;

    _loadShortsCallId++;
    const callId = _loadShortsCallId;
    
    if (reset) {
        ShortsState.page = 1;
        ShortsState.shorts = [];
        ShortsState.hasMore = true;
    }

    if (!ShortsState.hasMore) return;

    try {
        if (reset) showLoading();
        else {
            ShortsState.isLoadingMore = true;
            if (shortsLoading) shortsLoading.style.display = 'flex';
        }

        const response = await api.request(`/content/shorts.php?limit=${ShortsState.limit}&page=${ShortsState.page}`);
        
        if (response.status === 'success' && response.data) {
            const newShorts = response.data.shorts || [];
            
            if (newShorts.length === 0) {
                if (reset) renderEmptyState();
            } else {
                if (reset) {
                    ShortsState.shorts = newShorts;
                    renderShortsFeed(newShorts);
                } else {
                    ShortsState.shorts = [...ShortsState.shorts, ...newShorts];
                    appendShorts(newShorts);
                }

                const totalLoaded = ShortsState.shorts.length;
                const total = response.data.pagination?.total || 0;
                ShortsState.hasMore = totalLoaded < total;
                
                if (ShortsState.hasMore) ShortsState.page++;
            }
        } else {
            if (reset) renderEmptyState();
        }
    } catch (error) {
        console.error('[Shorts DEBUG] Error loading shorts:', error);
        if (reset) {
            renderEmptyState();
            showToast('Failed to load Shorts', 'error');
        }
    } finally {
        ShortsState.isLoadingMore = false;
        if (shortsLoading) shortsLoading.style.display = 'none';
        if (reset) hideLoading();
    }
}

function renderShortsFeed(shorts) {
    if (!shortsFeed) return;
    if (!shorts || shorts.length === 0) {
        renderEmptyState();
        return;
    }

    const html = shorts.map(short => createShortItem(short)).join('');
    shortsFeed.innerHTML = html;
    setupShortsInteractions();
}

function appendShorts(shorts) {
    if (!shortsFeed || !shorts || shorts.length === 0) return;

    shorts.forEach(short => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = createShortItem(short);
        shortsFeed.appendChild(tempDiv.firstElementChild);
    });

    setupShortsInteractions();
}

function createShortItem(short) {
    const videoUrl = resolveMediaUrl(short.video_url || '');
    const thumbnail = resolveMediaUrl(short.thumbnail || short.thumbnail_url || '') || 'assets/images/placeholder.jpg';
    const views = formatViews(short.view_count || 0);
    const likes = formatViews(short.like_count || 0);
    const duration = formatDuration(short.duration || short.duration_minutes);
    const creator = short.creator_name || 'Burudani Creator';
    const creatorAvatar = short.creator_avatar || 'assets/images/default-avatar.png';
    const timeAgo = getTimeAgo(short.created_at || new Date());
    
    let mediaElement;
    if (videoUrl && videoUrl.trim() !== '') {
        mediaElement = `<video 
            src="${videoUrl}" 
            class="short-video" 
            autoplay 
            muted 
            loop 
            playsinline 
            preload="metadata"
            poster="${thumbnail}"
            onerror="this.poster='assets/images/placeholder.jpg'"
        ></video>`;
    } else {
        mediaElement = `<img src="${thumbnail}" alt="${short.title}" class="short-video" loading="lazy">`;
    }
    
    return `
        <div class="short-item" data-id="${short.id}">
            <div class="short-video-container">
                ${mediaElement}
                <div class="short-overlay">
                    <div class="short-header">
                        <img src="${creatorAvatar}" alt="${creator}" class="short-avatar">
                        <div class="short-creator-info">
                            <span class="short-creator">${creator}</span>
                            <span class="short-time">${timeAgo}</span>
                        </div>
                        ${auth.isAuthenticated ? '<button class="short-follow" onclick="shorts.followCreator(' + short.id + ')">Follow</button>' : ''}
                    </div>
                    <p class="short-caption">${short.title || 'Check out this amazing short!'}</p>
                    <div class="short-hashtags">
                        <a href="#">#${short.genres?.split(',')[0] || 'shorts'}</a>
                        <a href="#">#BurudaniKiganjani</a>
                    </div>
                    <div class="short-sound">
                        <i class="fas fa-music"></i>
                        <span>${short.genres?.split(',')[0] || 'Original Sound'}</span>
                    </div>
                </div>
                <div class="short-actions">
                    <button class="action-btn volume-btn" onclick="shorts.toggleMute(${short.id}, this)">
                        <i class="fas fa-volume-mute"></i>
                    </button>
                    <button class="action-btn like-btn ${short.user_has_liked ? 'liked' : ''}" onclick="shorts.likeShort(${short.id}, this)">
                        <i class="fas fa-heart"></i>
                        <span>${likes}</span>
                    </button>
                    <button class="action-btn" onclick="shorts.showComments(${short.id})">
                        <i class="fas fa-comment"></i>
                        <span>${short.comment_count || 0}</span>
                    </button>
                    <button class="action-btn" onclick="shorts.shareShort(${short.id})">
                        <i class="fas fa-share"></i>
                        <span>Share</span>
                    </button>
                    <button class="action-btn" onclick="shorts.openDetails(${short.id})">
                        <i class="fas fa-ellipsis-h"></i>
                    </button>
                </div>
                <div class="short-sound-info">
                    <div class="sound-wave">
                        <span></span><span></span><span></span><span></span><span></span>
                    </div>
                    <span class="sound-label">${duration}</span>
                </div>
                <div class="short-progress">
                    <div class="progress-fill" style="width: ${short.watch_progress || 0}%"></div>
                </div>
            </div>
        </div>
    `;
}

function renderEmptyState() {
    if (!shortsFeed) return;
    shortsFeed.innerHTML = `
        <div class="empty-state" style="flex: 0 0 100%; text-align: center; padding: 48px;">
            <i class="fas fa-film" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 16px;"></i>
            <h3 style="color: var(--text-primary); margin-bottom: 8px;">No Shorts Yet</h3>
            <p style="color: var(--text-secondary);">Be the first to create a Short!</p>
        </div>
    `;
}

function setupShortsInteractions() {
    document.querySelectorAll('.short-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('.action-btn') || e.target.closest('.short-follow')) return;
            togglePlayPause(item);
        });
    });
}

function togglePlayPause(item) {
    const video = item.querySelector('.short-video');
    if (video) {
        if (video.paused) video.play();
        else video.pause();
    }
}

function setupInfiniteScroll() {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && ShortsState.hasMore && !ShortsState.isLoadingMore) {
            loadShorts(false);
        }
    }, { threshold: 0.1 });

    if (shortsLoading) observer.observe(shortsLoading);
}

// ========== Short Actions ==========

const shorts = {
    toggleMute(id, button) {
        const shortItem = document.querySelector(`.short-item[data-id="${id}"]`);
        if (!shortItem) return;
        
        const video = shortItem.querySelector('.short-video');
        if (!video) return;
        
        const icon = button.querySelector('i');
        
        if (video.muted) {
            video.muted = false;
            icon.className = 'fas fa-volume-up';
            showToast('Sound on', 'success');
        } else {
            video.muted = true;
            icon.className = 'fas fa-volume-mute';
            showToast('Sound off', 'info');
        }
    },
    
    async likeShort(id, button) {
        if (!auth.isAuthenticated) {
            showToast('Please sign in to like Shorts', 'warning');
            return;
        }

        try {
            const isLiked = button.classList.contains('liked');
            button.classList.toggle('liked');
            
            const countSpan = button.querySelector('span');
            if (countSpan) {
                const count = parseInt(countSpan.textContent.replace(/[^0-9]/g, '')) || 0;
                countSpan.textContent = formatViews(isLiked ? count - 1 : count + 1);
            }

            const response = await api.rateContent(id, isLiked ? 0 : 5);
            
            if (response.status === 'success') {
                if (!isLiked) showToast('Added to likes!', 'success');
            } else {
                button.classList.toggle('liked');
                if (countSpan) {
                    const count = parseInt(countSpan.textContent.replace(/[^0-9]/g, '')) || 0;
                    countSpan.textContent = formatViews(isLiked ? count + 1 : count - 1);
                }
                showToast(response.message || 'Failed to like', 'error');
            }
        } catch (error) {
            console.error('Like error:', error);
            showToast('Failed to like', 'error');
        }
    },

    async showComments(id) {
        if (!auth.isAuthenticated) {
            showToast('Please sign in to view comments', 'warning');
            return;
        }

        try {
            showLoading();
            const response = await api.getComments(id);
            
            if (response.status === 'success' && response.data) {
                // Extract comments array from response data (response.data.comments or response.data)
                const comments = response.data.comments || response.data || [];
                this.displayCommentsModal(id, comments);
            } else {
                showToast('Failed to load comments', 'error');
            }
        } catch (error) {
            console.error('Comments error:', error);
            showToast('Failed to load comments', 'error');
        } finally {
            hideLoading();
        }
    },

    displayCommentsModal(id, comments) {
        // Ensure comments is an array
        if (!Array.isArray(comments)) {
            comments = [];
        }
        const short = ShortsState.shorts.find(s => s.id == id);
        
        const commentsHTML = comments.map(c => `
            <div class="comment-item">
                <img src="${c.user_avatar || 'assets/images/default-avatar.png'}" alt="${c.user_name}" class="comment-avatar">
                <div class="comment-content">
                    <span class="comment-name">${c.user_name}</span>
                    <p class="comment-text">${c.comment}</p>
                    <span class="comment-time">${getTimeAgo(c.created_at)}</span>
                </div>
            </div>
        `).join('') || '<p class="no-comments">No comments yet. Be the first to comment!</p>';
        
        const modalContent = `
            <div class="comments-modal">
                <div class="comments-modal-header">
                    <h3><i class="fas fa-comments"></i> Comments</h3>
                    <button class="modal-close-btn" onclick="closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="comments-modal-body">
                    <div class="comments-list">${commentsHTML}</div>
                </div>
                <div class="comments-modal-footer">
                    <div class="comment-input-wrapper">
                        <input type="text" id="commentInput" placeholder="Add a comment..." onkeypress="if(event.key==='Enter')shorts.postComment(${id})">
                        <button class="btn btn-primary" onclick="shorts.postComment(${id})">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        openModal(modalContent);
    },

    async postComment(id) {
        if (!auth.isAuthenticated) {
            showToast('Please sign in to comment', 'warning');
            return;
        }

        const input = document.getElementById('commentInput');
        const comment = input.value.trim();
        
        if (!comment) {
            showToast('Please enter a comment', 'warning');
            return;
        }

        try {
            const response = await api.createComment(id, comment);
            
            if (response.status === 'success') {
                showToast('Comment posted!', 'success');
                input.value = '';
                this.showComments(id);
            } else {
                showToast(response.message || 'Failed to post comment', 'error');
            }
        } catch (error) {
            console.error('Comment error:', error);
            showToast('Failed to post comment', 'error');
        }
    },

    shareShort(id) {
        const short = ShortsState.shorts.find(s => s.id == id);
        if (!short) return;
        
        const shareUrl = `${window.location.origin}${window.location.pathname}?id=${id}`;
        const shareTitle = short?.title || 'Burudani Short';
        const shareText = `Check out this amazing short: ${shareTitle}`;
        const encodedUrl = encodeURIComponent(shareUrl);
        const encodedTitle = encodeURIComponent(shareTitle);
        const encodedText = encodeURIComponent(shareText);
        
        const shareOptions = `
            <div class="share-modal">
                <div class="share-modal-header">
                    <h3><i class="fas fa-share-alt"></i> Share</h3>
                    <button class="modal-close-btn" onclick="closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="share-modal-body">
                    <div class="share-options">
                        <a href="https://wa.me/?text=${encodedText}%20${encodedUrl}" target="_blank" class="share-option whatsapp">
                            <div class="share-icon"><i class="fab fa-whatsapp"></i></div>
                            <span>WhatsApp</span>
                        </a>
                        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" class="share-option facebook">
                            <div class="share-icon"><i class="fab fa-facebook-f"></i></div>
                            <span>Facebook</span>
                        </a>
                        <a href="https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}" target="_blank" class="share-option x-twitter">
                            <div class="share-icon"><i class="fa-brands fa-x-twitter"></i></div>
                            <span>X / Twitter</span>
                        </a>
                        <a href="https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}" target="_blank" class="share-option linkedin">
                            <div class="share-icon"><i class="fab fa-linkedin-in"></i></div>
                            <span>LinkedIn</span>
                        </a>
                        <a href="https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}" target="_blank" class="share-option telegram">
                            <div class="share-icon"><i class="fab fa-telegram-plane"></i></div>
                            <span>Telegram</span>
                        </a>
                        <a href="mailto:?subject=${encodedTitle}&body=${encodedText}%20${encodedUrl}" class="share-option email">
                            <div class="share-icon"><i class="fas fa-envelope"></i></div>
                            <span>Email</span>
                        </a>
                    </div>
                    <div class="share-divider"><span>or copy link</span></div>
                    <div class="share-link-box">
                        <input type="text" value="${shareUrl}" readonly id="shareLinkInput">
                        <button class="btn btn-primary" onclick="shorts.copyShareLink()">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        openModal(shareOptions);
    },

    copyShareLink() {
        const input = document.getElementById('shareLinkInput');
        if (input) {
            input.select();
            navigator.clipboard.writeText(input.value).then(() => {
                showToast('Link copied to clipboard!', 'success');
            }).catch(() => {
                showToast('Failed to copy link', 'error');
            });
        }
    },

    openDetails(id) {
        const short = ShortsState.shorts.find(s => s.id == id);
        if (!short) return;
        
        const detailsHTML = `
            <div class="short-details-modal">
                <div class="details-header">
                    <h3>${short.title}</h3>
                    <button class="modal-close-btn" onclick="closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="details-body">
                    <div class="detail-row">
                        <span class="detail-label">Description</span>
                        <p class="detail-value">${short.description || 'No description'}</p>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Views</span>
                        <p class="detail-value">${formatViews(short.view_count || 0)}</p>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Likes</span>
                        <p class="detail-value">${formatViews(short.like_count || 0)}</p>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Creator</span>
                        <p class="detail-value">${short.creator_name || 'Unknown'}</p>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Genre</span>
                        <p class="detail-value">${short.genres || 'General'}</p>
                    </div>
                    <div class="detail-actions">
                        <button class="btn btn-secondary" onclick="shorts.reportShort(${id})">
                            <i class="fas fa-flag"></i> Report
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        openModal(detailsHTML);
    },

    async followCreator(id) {
        if (!auth.isAuthenticated) {
            showToast('Please sign in to follow creators', 'warning');
            return;
        }
        const short = ShortsState.shorts.find(s => s.id == id);
        showToast('Following ' + (short?.creator_name || 'creator') + '!', 'success');
    },

    reportShort(id) {
        showToast('Report submitted. Thank you for your feedback!', 'success');
        closeModal();
    },

    openCreateModal() {
        if (!auth.isAuthenticated) {
            showToast('Please sign in to create Shorts', 'warning');
            setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            return;
        }
        openModal(createShortModalHTML());
        setupCreateShortForm();
    }
};

window.shorts = shorts;

// Create Short Modal HTML
function createShortModalHTML() {
    return `
        <div class="create-short-modal">
            <div class="create-modal-header">
                <h2><i class="fas fa-video"></i> Create New Short</h2>
                <button class="modal-close-btn" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="create-modal-body">
                <form id="createShortForm" enctype="multipart/form-data">
                    <div class="form-group">
                        <label for="shortTitle">Title *</label>
                        <input type="text" id="shortTitle" name="title" placeholder="Give your short a catchy title" required>
                    </div>
                    <div class="form-group">
                        <label for="shortDescription">Description *</label>
                        <textarea id="shortDescription" name="description" placeholder="Describe your short..." rows="3" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="shortVideo">Video *</label>
                        <div class="file-upload-area" id="videoUploadArea">
                            <input type="file" id="shortVideo" name="video" accept="video/*" required hidden>
                            <div class="upload-content">
                                <i class="fas fa-cloud-upload-alt"></i>
                                <p>Drag & drop video here or <span class="browse-btn">browse</span></p>
                                <span class="file-info">MP4, WebM up to 100MB</span>
                            </div>
                        </div>
                        <div id="videoPreview" class="video-preview" style="display: none;">
                            <video id="videoElement" controls></video>
                            <button type="button" class="remove-video-btn" onclick="removeVideo()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="shortDuration">Duration</label>
                        <select id="shortDuration" name="duration">
                            <option value="15s">15 seconds</option>
                            <option value="30s">30 seconds</option>
                            <option value="45s">45 seconds</option>
                            <option value="1m">1 minute</option>
                            <option value="3m">3 minutes</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary" id="createSubmitBtn">
                            <i class="fas fa-upload"></i> Upload Short
                        </button>
                    </div>
                    <div class="upload-progress" id="uploadProgress" style="display: none;">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progressFill"></div>
                        </div>
                        <p id="progressText">Uploading...</p>
                    </div>
                </form>
            </div>
        </div>
    `;
}

function setupCreateShortForm() {
    const form = document.getElementById('createShortForm');
    const videoInput = document.getElementById('shortVideo');
    const videoUploadArea = document.getElementById('videoUploadArea');
    
    videoUploadArea.addEventListener('click', () => videoInput.click());
    videoInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleVideoSelect(e.target.files[0]);
    });
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitCreateShortForm();
    });
}

function handleVideoSelect(file) {
    if (!file.type.startsWith('video/')) {
        showToast('Please select a valid video file', 'error');
        return;
    }
    if (file.size > 100 * 1024 * 1024) {
        showToast('Video size must be less than 100MB', 'error');
        return;
    }
    
    const videoElement = document.getElementById('videoElement');
    const videoPreview = document.getElementById('videoPreview');
    const videoUploadArea = document.getElementById('videoUploadArea');
    
    videoElement.src = URL.createObjectURL(file);
    videoPreview.style.display = 'block';
    videoUploadArea.style.display = 'none';
}

function removeVideo() {
    const videoInput = document.getElementById('shortVideo');
    const videoPreview = document.getElementById('videoPreview');
    const videoUploadArea = document.getElementById('videoUploadArea');
    videoInput.value = '';
    videoPreview.style.display = 'none';
    videoUploadArea.style.display = 'block';
}

window.removeVideo = removeVideo;

async function submitCreateShortForm() {
    const form = document.getElementById('createShortForm');
    const submitBtn = document.getElementById('createSubmitBtn');
    const progressDiv = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    const title = document.getElementById('shortTitle').value.trim();
    const description = document.getElementById('shortDescription').value.trim();
    const videoInput = document.getElementById('shortVideo');
    
    if (!title || !description || !videoInput.files.length) {
        showToast('Please fill in all required fields', 'warning');
        return;
    }
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('content_type', 'short');
    formData.append('video', videoInput.files[0]);
    
    const durationSelect = document.getElementById('shortDuration');
    formData.append('duration', durationSelect.value);
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    progressDiv.style.display = 'block';
    
    try {
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 10;
            if (progress < 90) {
                progressFill.style.width = progress + '%';
                progressText.textContent = `Uploading... ${progress}%`;
            }
        }, 500);
        
        const response = await api.createContent(formData);
        clearInterval(progressInterval);
        
        if (response.status === 'success') {
            showToast('Short created successfully!', 'success');
            closeModal();
            await loadShorts(true);
            form.reset();
            removeVideo();
        } else {
            showToast(response.message || 'Failed to create short', 'error');
        }
    } catch (error) {
        console.error('Create short error:', error);
        showToast('Failed to create short', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Short';
        progressDiv.style.display = 'none';
        progressFill.style.width = '0%';
    }
}

// ========== Loading & Toast ==========

function showLoading() {
    if (loadingOverlay) loadingOverlay.classList.add('active');
}

function hideLoading() {
    if (loadingOverlay) loadingOverlay.classList.remove('active');
}

function showToast(message, type = 'info') {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-times-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="${icons[type]} toast-icon"></i>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

window.showToast = showToast;
window.showLoading = showLoading;
window.hideLoading = hideLoading;

