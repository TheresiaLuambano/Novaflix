/**
 * BurudaniKiganjani - UI Components
 * Reusable UI components and helpers
 */

// ========== Toast Notifications ==========

const Toast = {
    show(message, type = 'info', duration = 5000) {
        const container = document.getElementById('toastContainer') || this.createContainer();
        
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
            <button class="toast-close" onclick="Toast.remove(this.parentElement)">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Auto remove
        setTimeout(() => {
            this.remove(toast);
        }, duration);
        
        return toast;
    },
    
    createContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    },
    
    remove(toast) {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    },
    
    success(message) {
        return this.show(message, 'success');
    },
    
    error(message) {
        return this.show(message, 'error');
    },
    
    warning(message) {
        return this.show(message, 'warning');
    },
    
    info(message) {
        return this.show(message, 'info');
    }
};

// ========== Modal ==========

const Modal = {
    open(content, options = {}) {
        let overlay = document.getElementById('modalOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'modalOverlay';
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <div class="modal">
                    <button class="modal-close" onclick="Modal.close()">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="modal-content" id="modalContent"></div>
                </div>
            `;
            document.body.appendChild(overlay);
            
            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) Modal.close();
            });
        }

        document.getElementById('modalContent').innerHTML = content;
        
        if (options.size === 'large') {
            overlay.querySelector('.modal').style.maxWidth = '1100px';
        } else if (options.size === 'small') {
            overlay.querySelector('.modal').style.maxWidth = '500px';
        } else {
            overlay.querySelector('.modal').style.maxWidth = '900px';
        }
        
        overlay.classList.add('active');
        document.body.classList.add('no-scroll');
        
        return overlay;
    },
    
    close() {
        const overlay = document.getElementById('modalOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
        }
    },
    
    confirm(options) {
        return new Promise((resolve) => {
            const icon = options.icon || 'question-circle';
            const content = `
                <div class="modal-confirm">
                    <div class="confirm-icon">
                        <i class="fas fa-${icon}"></i>
                    </div>
                    <h3 class="confirm-title">${options.title || 'Confirm'}</h3>
                    <p class="confirm-message">${options.message || 'Are you sure?'}</p>
                    <div class="confirm-actions">
                        <button class="btn btn-secondary" onclick="Modal.close(); resolve(false)">
                            ${options.cancelText || 'Cancel'}
                        </button>
                        <button class="btn btn-primary" 
                                onclick="Modal.close(); resolve(true)">
                            ${options.confirmText || 'Confirm'}
                        </button>
                    </div>
                </div>
            `;
            this.open(content);
        });
    }
};

// ========== Loading ==========

const Loading = {
    show(message = 'Loading...') {
        let overlay = document.getElementById('loadingOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>${message}</p>
                </div>
            `;
            document.body.appendChild(overlay);
        }
        overlay.querySelector('p').textContent = message;
        overlay.classList.add('active');
    },
    
    hide() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    },
    
    withPromise(promise, message = 'Loading...') {
        this.show(message);
        return promise.finally(() => this.hide());
    }
};

// ========== Content Card ==========

function createContentCard(content, options = {}) {
    const {
        showOverlay = true,
        onPlay = null,
        onAdd = null,
        onDetails = null
    } = options;
    
    const match = Math.floor(Math.random() * 30) + 70;
    const quality = content.quality || 'HD';
    const duration = content.duration || '1h 30m';
    const genres = Array.isArray(content.genres) ? content.genres.slice(0, 3).join(', ') : content.genre || 'Drama';
    
    let overlayHtml = '';
    if (showOverlay) {
        overlayHtml = `
            <div class="content-card-overlay">
                <div class="content-card-actions">
                    <button class="btn btn-primary btn-icon play-btn" ${onPlay ? `data-action="play"` : ''}>
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="btn btn-icon add-btn" title="Add to My List" ${onAdd ? `data-action="add"` : ''}>
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="btn btn-icon" title="Like">
                        <i class="fas fa-thumbs-up"></i>
                    </button>
                    <button class="btn btn-icon" title="More" ${onDetails ? `data-action="details"` : ''}>
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
        `;
    }
    
    return `
        <div class="content-card" data-id="${content.id}" data-type="${content.type || 'movie'}">
            <div class="content-card-inner">
                <img src="${content.thumbnail_url || 'assets/images/placeholder.jpg'}" 
                     alt="${content.title || 'Content'}" 
                     loading="lazy">
                ${overlayHtml}
            </div>
        </div>
    `;
}

// ========== Episode Card ==========

function createEpisodeCard(episode, contentId, index = 1) {
    return `
        <div class="card-episode" onclick="window.location.href='watch.html?id=${contentId}&episode=${episode.id}'">
            <div class="card-episode-number">${index}</div>
            <div class="card-episode-image">
                <img src="${episode.thumbnail_url || 'assets/images/placeholder.jpg'}" alt="${episode.title}">
            </div>
            <div class="card-episode-content">
                <div class="card-episode-title">${episode.title || `Episode ${index}`}</div>
                <div class="card-episode-description">${episode.description || ''}</div>
                <div class="card-episode-duration">${episode.duration || '45m'}</div>
            </div>
        </div>
    `;
}

// ========== Channel Card ==========

function createChannelCard(channel, isSubscribed = false) {
    return `
        <div class="card-channel" data-id="${channel.id}">
            <div class="card-channel-avatar">
                <img src="${channel.avatar_url || 'assets/images/default-avatar.png'}" alt="${channel.name}">
            </div>
            <div class="card-channel-info">
                <div class="card-channel-name">${channel.name}</div>
                <div class="card-channel-subscribers">
                    ${formatNumber(channel.subscribers || 0)} subscribers
                </div>
            </div>
            <button class="btn ${isSubscribed ? 'btn-secondary' : 'btn-primary'} card-channel-subscribe">
                ${isSubscribed ? 'Subscribed' : 'Subscribe'}
            </button>
        </div>
    `;
}

// ========== Format Helpers ==========

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function formatDuration(minutes) {
    if (minutes < 60) {
        return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'week', seconds: 604800 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 }
    ];
    
    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) {
            return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
        }
    }
    return 'Just now';
}

// ========== Skeleton Loading ==========

function createSkeletonCard() {
    return `
        <div class="content-card">
            <div class="content-card-inner skeleton skeleton-card"></div>
        </div>
    `;
}

function createSkeletonList(count = 5) {
    return Array(count).fill(createSkeletonCard()).join('');
}

// ========== Empty State ==========

function createEmptyState(icon, title, description, action = null) {
    return `
        <div class="empty-state">
            <div class="empty-state-icon">
                <i class="fas fa-${icon}"></i>
            </div>
            <h3 class="empty-state-title">${title}</h3>
            <p class="empty-state-description">${description}</p>
            ${action ? `<a href="${action.href}" class="btn btn-primary">${action.text}</a>` : ''}
        </div>
    `;
}

// ========== Pagination ==========

function createPagination(currentPage, totalPages, onPageChange) {
    if (totalPages <= 1) return '';
    
    let html = `
        <div class="pagination">
            <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} 
                    onclick="${onPageChange}(${currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
    `;

    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
        html += `<button class="pagination-btn" onclick="${onPageChange}(1)">1</button>`;
        if (startPage > 2) {
            html += `<span class="pagination-ellipsis">...</span>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                    onclick="${onPageChange}(${i})">${i}</button>
        `;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<span class="pagination-ellipsis">...</span>`;
        }
        html += `<button class="pagination-btn" onclick="${onPageChange}(${totalPages})">${totalPages}</button>`;
    }

    html += `
            <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} 
                    onclick="${onPageChange}(${currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>
    `;
    
    return html;
}

// ========== Genre Tags ==========

function createGenreTags(genres, selectedGenre = null) {
    return genres.map(genre => `
        <a href="browse.html?genre=${genre.toLowerCase()}" 
           class="chip ${genre.toLowerCase() === selectedGenre?.toLowerCase() ? 'active' : ''}">
            ${genre}
        </a>
    `).join('');
}

// ========== Rating Stars ==========

function createRatingStars(rating, maxRating = 5, interactive = false) {
    const stars = [];
    for (let i = 1; i <= maxRating; i++) {
        const filled = i <= rating;
        stars.push(`<i class="fas fa-star rating-star ${filled ? 'filled' : ''}"></i>`);
    }
    return stars.join('');
}

// ========== Avatar ==========

function createAvatar(user, size = 'md') {
    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
    return `
        <div class="avatar avatar-${size}">
            ${user.avatar_url 
                ? `<img src="${user.avatar_url}" alt="${user.name || 'User'}">`
                : `<span class="avatar-initials">${initials}</span>`
            }
        </div>
    `;
}

// ========== Scroll Controls ==========

function setupScrollControls(containerId, prevBtnId, nextBtnId, scrollAmount = 400) {
    const container = document.getElementById(containerId);
    const prevBtn = document.getElementById(prevBtnId);
    const nextBtn = document.getElementById(nextBtnId);
    
    if (!container || !prevBtn || !nextBtn) return;
    
    // Update button states
    const updateButtons = () => {
        prevBtn.disabled = container.scrollLeft <= 0;
        nextBtn.disabled = container.scrollLeft + container.clientWidth >= container.scrollWidth;
    };
    
    container.addEventListener('scroll', updateButtons);
    updateButtons();
    
    // Button click handlers
    prevBtn.addEventListener('click', () => {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });
    
    nextBtn.addEventListener('click', () => {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
    
    // Drag support
    let isDown = false;
    let startX;
    let scrollLeft;
    
    container.addEventListener('mousedown', (e) => {
        isDown = true;
        container.classList.add('dragging');
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
    });
    
    container.addEventListener('mouseleave', () => {
        isDown = false;
        container.classList.remove('dragging');
    });
    
    container.addEventListener('mouseup', () => {
        isDown = false;
        container.classList.remove('dragging');
    });
    
    container.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 2;
        container.scrollLeft = scrollLeft - walk;
    });
}

// ========== Image Lazy Load ==========

function setupLazyLoad() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        img.classList.add('loaded');
                    }
                    observer.unobserve(img);
                }
            });
        });
        
        images.forEach(img => observer.observe(img));
    } else {
        // Fallback for browsers without IntersectionObserver
        images.forEach(img => {
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.classList.add('loaded');
            }
        });
    }
}

// ========== Dropdown Menu ==========

function setupDropdown(triggerId, menuId) {
    const trigger = document.getElementById(triggerId);
    const menu = document.getElementById(menuId);
    
    if (!trigger || !menu) return;
    
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('active');
    });
    
    document.addEventListener('click', () => {
        menu.classList.remove('active');
    });
}

// ========== Tab Navigation ==========

function setupTabs(containerId, onTabChange) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const tabs = container.querySelectorAll('.tab');
    const panels = container.querySelectorAll('.tab-panel');
    
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            // Remove active from all
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            
            // Add active to clicked
            tab.classList.add('active');
            if (panels[index]) {
                panels[index].classList.add('active');
                if (onTabChange) onTabChange(index, tab.dataset.tab);
            }
        });
    });
}

// ========== Accordion ==========

function setupAccordion(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const items = container.querySelectorAll('.accordion-item');
    
    items.forEach(item => {
        const header = item.querySelector('.accordion-header');
        const content = item.querySelector('.accordion-content');
        
        if (header && content) {
            header.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                
                // Close all
                items.forEach(i => {
                    i.classList.remove('active');
                    i.querySelector('.accordion-content').style.maxHeight = '0';
                });
                
                // Toggle current
                if (!isActive) {
                    item.classList.add('active');
                    content.style.maxHeight = content.scrollHeight + 'px';
                }
            });
        }
    });
}

// ========== Copy to Clipboard ==========

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        Toast.success('Copied to clipboard');
        return true;
    } catch (error) {
        Toast.error('Failed to copy');
        return false;
    }
}

// ========== URL Builder ==========

function buildUrl(path, params = {}) {
    const url = new URL(path, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            url.searchParams.set(key, value);
        }
    });
    return url.toString();
}

// ========== Export ==========

window.Toast = Toast;
window.Modal = Modal;
window.Loading = Loading;
window.copyToClipboard = copyToClipboard;
window.formatNumber = formatNumber;
window.formatDuration = formatDuration;
window.formatDate = formatDate;
window.timeAgo = timeAgo;
window.createContentCard = createContentCard;
window.createEpisodeCard = createEpisodeCard;
window.createChannelCard = createChannelCard;
window.createSkeletonCard = createSkeletonCard;
window.createSkeletonList = createSkeletonList;
window.createEmptyState = createEmptyState;
window.createPagination = createPagination;
window.createGenreTags = createGenreTags;
window.createRatingStars = createRatingStars;
window.createAvatar = createAvatar;
window.setupScrollControls = setupScrollControls;
window.setupLazyLoad = setupLazyLoad;
window.setupDropdown = setupDropdown;
window.setupTabs = setupTabs;
window.setupAccordion = setupAccordion;

