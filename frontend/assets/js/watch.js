/**
 * BurudaniKiganjani - Watch Page
 * Handles video playback, content details, and interactions
 */

class WatchPage {
    constructor() {
        this.contentId = null;
        this.episodeId = null;
        this.content = null;
        this.episodes = [];
        this.currentEpisode = null;
        this.progress = 0;
        this.duration = 0;
        this.isPlaying = false;
        this.playbackInterval = null;
        
        this.init();
    }

    async init() {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        this.contentId = urlParams.get('id');
        this.episodeId = urlParams.get('episode');

        if (!this.contentId) {
            Toast.error('No content specified');
            setTimeout(() => window.location.href = 'browse.html', 2000);
            return;
        }

        await auth.init();
        this.setupEventListeners();
        await this.loadContent();
        this.setupVideoControls();
    }

    setupEventListeners() {
        // Header scroll
        window.addEventListener('scroll', () => {
            const header = document.getElementById('header');
            if (header) {
                header.classList.toggle('scrolled', window.scrollY > 50);
            }
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

        // Play button
        const playButton = document.getElementById('playButton');
        if (playButton) {
            playButton.addEventListener('click', () => this.startPlayback());
        }

        // Add to list
        const addToListBtn = document.getElementById('addToListBtn');
        if (addToListBtn) {
            addToListBtn.addEventListener('click', () => this.toggleWatchList());
        }

        // Like button
        const likeBtn = document.getElementById('likeBtn');
        if (likeBtn) {
            likeBtn.addEventListener('click', () => this.toggleLike());
        }

        // Share button
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareContent());
        }

        // Rate button
        const rateBtn = document.getElementById('rateBtn');
        if (rateBtn) {
            rateBtn.addEventListener('click', () => this.showRatingModal());
        }

        // Submit comment
        const submitComment = document.getElementById('submitComment');
        const commentInput = document.getElementById('commentInput');
        if (submitComment && commentInput) {
            submitComment.addEventListener('click', () => this.submitComment());
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

    async loadContent() {
        showLoading();

        try {
            // Load content details
            const response = await api.getContentDetail(this.contentId);
            
            if (response.status === 'success') {
                this.content = response.data;
                this.renderContent();
                
                // Load episodes if it's a series
                if (this.content.type === 'series') {
                    await this.loadEpisodes();
                }

                // Load related content
                await this.loadRelatedContent();

                // Load comments
                await this.loadComments();

                // Load user rating
                await this.loadUserRating();

                // Update user info
                this.updateUI();
            } else {
                Toast.error(response.message || 'Content not found');
                setTimeout(() => window.location.href = 'browse.html', 2000);
            }
        } catch (error) {
            console.error('Load content error:', error);
            Toast.error('Failed to load content');
            // Use demo content for demo purposes
            this.loadDemoContent();
        } finally {
            hideLoading();
        }
    }

    loadDemoContent() {
        this.content = {
            id: this.contentId,
            title: 'Demo Content',
            description: 'This is a demo content description. In a real application, this would show the actual content details.',
            type: 'movie',
            release_year: 2024,
            duration: '2h 30m',
            genre: 'Drama, Action',
            genres: ['Action', 'Drama'],
            cast: 'Actor 1, Actor 2, Actor 3',
            rating: 4.5,
            thumbnail_url: 'https://picsum.photos/seed/demo/1920/1080'
        };

        this.renderContent();
        this.updateUI();
    }

    renderContent() {
        const content = this.content;
        if (!content) return;

        // Update page title
        document.title = `${content.title} - BurudaniKiganjani`;

        // Update video placeholder
        const placeholderTitle = document.getElementById('placeholderTitle');
        const placeholderMessage = document.getElementById('placeholderMessage');
        if (placeholderTitle) placeholderTitle.textContent = content.title;
        if (placeholderMessage) placeholderMessage.textContent = 'Click play to start watching';

        // Update content info
        const contentTitle = document.getElementById('contentTitle');
        const contentDescription = document.getElementById('contentDescription');
        const contentYear = document.getElementById('contentYear');
        const contentDuration = document.getElementById('contentDuration');
        const contentCast = document.getElementById('contentCast');
        const contentGenres = document.getElementById('contentGenres');
        const contentMatch = document.getElementById('contentMatch');

        if (contentTitle) contentTitle.textContent = content.title;
        if (contentDescription) contentDescription.textContent = content.description || 'No description available.';
        if (contentYear) contentYear.textContent = content.release_year || '2024';
        if (contentDuration) contentDuration.textContent = content.duration || '1h 30m';
        if (contentCast) contentCast.textContent = content.cast || 'Not specified';
        if (contentGenres) contentGenres.textContent = Array.isArray(content.genres) ? content.genres.join(', ') : content.genre || 'Drama';
        if (contentMatch) contentMatch.textContent = `${Math.floor(Math.random() * 20) + 80}% Match`;

        // Update rating display
        this.updateRatingDisplay(content.rating || 0);
    }

    updateRatingDisplay(rating) {
        const ratingScore = document.getElementById('ratingScore');
        const ratingStars = document.getElementById('ratingStars');
        const ratingCount = document.getElementById('ratingCount');

        if (ratingScore) ratingScore.textContent = rating.toFixed(1);
        
        if (ratingStars) {
            const fullStars = Math.floor(rating);
            const hasHalfStar = rating % 1 >= 0.5;
            let starsHtml = '';
            
            for (let i = 1; i <= 5; i++) {
                if (i <= fullStars) {
                    starsHtml += '<i class="fas fa-star"></i>';
                } else if (i === fullStars + 1 && hasHalfStar) {
                    starsHtml += '<i class="fas fa-star-half-alt"></i>';
                } else {
                    starsHtml += '<i class="far fa-star"></i>';
                }
            }
            ratingStars.innerHTML = starsHtml;
        }

        if (ratingCount) {
            const count = Math.floor(Math.random() * 10000) + 1000;
            ratingCount.textContent = `${count.toLocaleString()} ratings`;
        }
    }

    async loadEpisodes() {
        try {
            const response = await api.getEpisodes(this.contentId);
            
            if (response.status === 'success' && response.data) {
                this.episodes = response.data;
                this.renderEpisodes();
                
                const episodesSection = document.getElementById('episodesSection');
                if (episodesSection && this.episodes.length > 0) {
                    episodesSection.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Load episodes error:', error);
            // Use demo episodes
            this.episodes = this.getDemoEpisodes();
            this.renderEpisodes();
            
            const episodesSection = document.getElementById('episodesSection');
            if (episodesSection) {
                episodesSection.style.display = 'block';
            }
        }
    }

    getDemoEpisodes() {
        return [
            { id: 1, title: 'Episode 1: The Beginning', description: 'The story begins...', duration: '45m', thumbnail_url: 'https://picsum.photos/seed/ep1/320/180' },
            { id: 2, title: 'Episode 2: The Journey', description: 'Our heroes set off...', duration: '48m', thumbnail_url: 'https://picsum.photos/seed/ep2/320/180' },
            { id: 3, title: 'Episode 3: The Challenge', description: 'A new challenge emerges...', duration: '42m', thumbnail_url: 'https://picsum.photos/seed/ep3/320/180' },
            { id: 4, title: 'Episode 4: The Revelation', description: 'Secrets are revealed...', duration: '50m', thumbnail_url: 'https://picsum.photos/seed/ep4/320/180' },
            { id: 5, title: 'Episode 5: The Climax', description: 'The tension builds...', duration: '52m', thumbnail_url: 'https://picsum.photos/seed/ep5/320/180' }
        ];
    }

    renderEpisodes() {
        const episodesList = document.getElementById('episodesList');
        if (!episodesList) return;

        episodesList.innerHTML = this.episodes.map((episode, index) => `
            <div class="card-episode" data-episode-id="${episode.id}" onclick="watchPage.selectEpisode(${index})">
                <div class="card-episode-number">${index + 1}</div>
                <div class="card-episode-image">
                    <img src="${episode.thumbnail_url || this.content.thumbnail_url}" alt="${episode.title}">
                </div>
                <div class="card-episode-content">
                    <div class="card-episode-title">${episode.title}</div>
                    <div class="card-episode-description">${episode.description || ''}</div>
                    <div class="card-episode-duration">${episode.duration || '45m'}</div>
                </div>
            </div>
        `).join('');
    }

    selectEpisode(index) {
        this.currentEpisode = this.episodes[index];
        // Update UI to show selected episode
        document.querySelectorAll('.card-episode').forEach((card, i) => {
            card.style.border = i === index ? '2px solid var(--primary-color)' : '';
        });
        Toast.info(`Selected: ${this.currentEpisode.title}`);
    }

    async loadRelatedContent() {
        try {
            // Get content by same genre
            const genres = this.content.genres || [this.content.genre];
            const mainGenre = genres[0]?.toLowerCase();
            
            if (mainGenre) {
                const response = await api.getContentByGenre(mainGenre, { limit: 5 });
                
                if (response.status === 'success' && response.data) {
                    // Filter out current content
                    const related = response.data.filter(item => item.id != this.contentId).slice(0, 4);
                    this.renderRelatedContent(related);
                }
            }
        } catch (error) {
            console.error('Load related content error:', error);
            // Use demo related content
            const demoRelated = this.getDemoRelatedContent();
            this.renderRelatedContent(demoRelated);
        }
    }

    getDemoRelatedContent() {
        return [
            { id: 101, title: 'Related Movie 1', thumbnail_url: 'https://picsum.photos/seed/rel1/320/180', duration: '2h' },
            { id: 102, title: 'Related Movie 2', thumbnail_url: 'https://picsum.photos/seed/rel2/320/180', duration: '1h 45m' },
            { id: 103, title: 'Related Movie 3', thumbnail_url: 'https://picsum.photos/seed/rel3/320/180', duration: '2h 10m' },
            { id: 104, title: 'Related Movie 4', thumbnail_url: 'https://picsum.photos/seed/rel4/320/180', duration: '1h 55m' }
        ];
    }

    renderRelatedContent(related) {
        const relatedList = document.getElementById('relatedList');
        if (!relatedList) return;

        relatedList.innerHTML = related.map(item => `
            <div class="related-item" onclick="window.location.href='watch.html?id=${item.id}'">
                <div class="related-thumbnail">
                    <img src="${item.thumbnail_url}" alt="${item.title}">
                </div>
                <div class="related-info">
                    <div class="related-title">${item.title}</div>
                    <div class="related-meta">${item.duration || '1h 30m'}</div>
                </div>
            </div>
        `).join('');
    }

    async loadComments() {
        try {
            const response = await api.getComments(this.contentId, { limit: 10 });
            
            if (response.status === 'success' && response.data) {
                this.renderComments(response.data);
            }
        } catch (error) {
            console.error('Load comments error:', error);
            // Show empty state
            const commentsList = document.getElementById('commentsList');
            if (commentsList) {
                commentsList.innerHTML = `
                    <div class="empty-comments">
                        <p>No comments yet. Be the first to comment!</p>
                    </div>
                `;
            }
        }
    }

    renderComments(comments) {
        const commentsList = document.getElementById('commentsList');
        if (!commentsList) return;

        if (comments.length === 0) {
            commentsList.innerHTML = `
                <div class="empty-comments">
                    <p>No comments yet. Be the first to comment!</p>
                </div>
            `;
            return;
        }

        commentsList.innerHTML = comments.map(comment => `
            <div class="comment-item">
                <div class="comment-avatar">
                    <img src="${comment.user_avatar || 'assets/images/default-avatar.png'}" alt="${comment.user_name}">
                </div>
                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-author">${comment.user_name || 'Anonymous'}</span>
                        <span class="comment-date">${this.formatDate(comment.created_at)}</span>
                    </div>
                    <div class="comment-text">${comment.comment}</div>
                    <div class="comment-actions">
                        <span class="comment-action" onclick="watchPage.likeComment(${comment.id})">
                            <i class="fas fa-thumbs-up"></i> ${comment.likes || 0}
                        </span>
                        <span class="comment-action">
                            <i class="fas fa-reply"></i> Reply
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async loadUserRating() {
        try {
            const response = await api.getUserRatings();
            if (response.status === 'success' && response.data) {
                const userRating = response.data.find(r => r.content_id == this.contentId);
                if (userRating) {
                    this.updateUserRatingDisplay(userRating.rating);
                }
            }
        } catch (error) {
            console.error('Load user rating error:', error);
        }
    }

    updateUserRatingDisplay(rating) {
        const rateBtn = document.getElementById('rateBtn');
        if (rateBtn) {
            rateBtn.classList.add('active');
            rateBtn.innerHTML = `<i class="fas fa-star"></i> ${rating}/5`;
        }
    }

    async submitComment() {
        if (!auth.isAuthenticated) {
            Toast.warning('Please sign in to comment');
            setTimeout(() => window.location.href = 'login.html', 1500);
            return;
        }

        const commentInput = document.getElementById('commentInput');
        const comment = commentInput?.value?.trim();

        if (!comment) {
            Toast.warning('Please write a comment');
            return;
        }

        try {
            const response = await api.createComment(this.contentId, comment);
            
            if (response.status === 'success') {
                Toast.success('Comment posted');
                commentInput.value = '';
                await this.loadComments();
            } else {
                Toast.error(response.message || 'Failed to post comment');
            }
        } catch (error) {
            console.error('Submit comment error:', error);
            Toast.error('Failed to post comment');
        }
    }

    async likeComment(commentId) {
        if (!auth.isAuthenticated) {
            Toast.warning('Please sign in to like comments');
            return;
        }

        try {
            await api.likeComment(commentId);
            Toast.success('Liked!');
        } catch (error) {
            console.error('Like comment error:', error);
        }
    }

    // ========== Video Controls ==========

    setupVideoControls() {
        const playPauseBtn = document.getElementById('playPauseBtn');
        const rewindBtn = document.getElementById('rewindBtn');
        const forwardBtn = document.getElementById('forwardBtn');
        const muteBtn = document.getElementById('muteBtn');
        const volumeSlider = document.getElementById('volumeSlider');
        const progressBar = document.getElementById('progressBar');
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        const videoContainer = document.getElementById('videoContainer');

        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        }

        if (rewindBtn) {
            rewindBtn.addEventListener('click', () => this.rewind(10));
        }

        if (forwardBtn) {
            forwardBtn.addEventListener('click', () => this.forward(10));
        }

        if (muteBtn) {
            muteBtn.addEventListener('click', () => this.toggleMute());
        }

        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
        }

        if (progressBar) {
            progressBar.addEventListener('click', (e) => this.seekTo(e));
            progressBar.addEventListener('mousemove', (e) => this.showPreview(e));
        }

        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }

        if (videoContainer) {
            videoContainer.addEventListener('dblclick', () => this.toggleFullscreen());
        }

        // Show/hide controls on hover
        const videoPlayer = document.getElementById('videoPlayer');
        if (videoPlayer) {
            let hideControlsTimeout;
            
            videoPlayer.addEventListener('mousemove', () => {
                const controls = document.getElementById('videoControls');
                if (controls) controls.classList.add('visible');
                clearTimeout(hideControlsTimeout);
                hideControlsTimeout = setTimeout(() => {
                    if (this.isPlaying) {
                        const controls = document.getElementById('videoControls');
                        if (controls) controls.classList.remove('visible');
                    }
                }, 3000);
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.key) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    this.togglePlayPause();
                    break;
                case 'ArrowLeft':
                    this.rewind(10);
                    break;
                case 'ArrowRight':
                    this.forward(10);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.setVolume(Math.min(100, parseInt(volumeSlider?.value || 100) + 10));
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.setVolume(Math.max(0, parseInt(volumeSlider?.value || 100) - 10));
                    break;
                case 'm':
                    this.toggleMute();
                    break;
                case 'f':
                    this.toggleFullscreen();
                    break;
            }
        });
    }

    startPlayback() {
        const placeholder = document.getElementById('videoPlaceholder');
        if (placeholder) {
            placeholder.innerHTML = `
                <div class="video-active">
                    <div class="video-screen">
                        <img src="${this.content.thumbnail_url}" alt="${this.content.title}" id="videoScreen">
                        <div class="video-overlay">
                            <button class="btn btn-primary btn-lg" onclick="this.parentElement.parentElement.style.display='none'; watchPage.simulatePlayback()">
                                <i class="fas fa-play"></i> Click to Play
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    simulatePlayback() {
        this.isPlaying = true;
        this.duration = 150; // 2.5 hours in minutes
        this.progress = 0;

        this.updatePlayPauseButton();
        this.startProgressTracking();
        this.startDurationTimer();
    }

    togglePlayPause() {
        if (!this.isPlaying) {
            this.simulatePlayback();
        } else {
            this.isPlaying = false;
            clearInterval(this.playbackInterval);
            clearInterval(this.durationInterval);
        }
        this.updatePlayPauseButton();
    }

    updatePlayPauseButton() {
        const playPauseBtn = document.getElementById('playPauseBtn');
        if (playPauseBtn) {
            playPauseBtn.innerHTML = `<i class="fas fa-${this.isPlaying ? 'pause' : 'play'}"></i>`;
        }
    }

    startProgressTracking() {
        this.playbackInterval = setInterval(() => {
            if (this.isPlaying && this.progress < 100) {
                this.progress += (100 / (this.duration * 60)); // Progress per second
                this.progress = Math.min(this.progress, 100);
                this.updateProgress();
                this.saveProgress();
            } else if (this.progress >= 100) {
                this.isPlaying = false;
                clearInterval(this.playbackInterval);
                this.updatePlayPauseButton();
            }
        }, 1000);
    }

    startDurationTimer() {
        this.durationInterval = setInterval(() => {
            if (this.isPlaying) {
                const currentTime = document.getElementById('currentTime');
                const duration = document.getElementById('duration');
                
                if (currentTime) {
                    const mins = Math.floor((this.progress / 100) * this.duration);
                    currentTime.textContent = `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`;
                }
                
                if (duration) {
                    duration.textContent = `${Math.floor(this.duration / 60)}:${String(this.duration % 60).padStart(2, '0')}`;
                }
            }
        }, 1000);
    }

    updateProgress() {
        const progressFill = document.getElementById('progressFill');
        const progressHandle = document.getElementById('progressHandle');
        
        if (progressFill) progressFill.style.width = `${this.progress}%`;
        if (progressHandle) progressHandle.style.left = `${this.progress}%`;
    }

    seekTo(e) {
        const progressBar = document.getElementById('progressBar');
        if (!progressBar) return;

        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width * 100;
        this.progress = Math.max(0, Math.min(100, percent));
        this.updateProgress();
    }

    showPreview(e) {
        const progressBar = document.getElementById('progressBar');
        const progressHover = document.getElementById('progressHover');
        const hoverTime = document.getElementById('hoverTime');
        
        if (progressBar && progressHover && hoverTime) {
            const rect = progressBar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            const mins = Math.floor(percent * this.duration);
            
            hoverTime.textContent = `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`;
            progressHover.style.left = `${percent * 100}%`;
        }
    }

    rewind(seconds) {
        this.progress = Math.max(0, this.progress - (seconds / (this.duration * 60)) * 100);
        this.updateProgress();
    }

    forward(seconds) {
        this.progress = Math.min(100, this.progress + (seconds / (this.duration * 60)) * 100);
        this.updateProgress();
    }

    toggleMute() {
        const muteBtn = document.getElementById('muteBtn');
        const volumeSlider = document.getElementById('volumeSlider');
        
        if (volumeSlider) {
            if (volumeSlider.value > 0) {
                this.lastVolume = volumeSlider.value;
                volumeSlider.value = 0;
                if (muteBtn) muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            } else {
                volumeSlider.value = this.lastVolume || 100;
                this.updateVolumeIcon();
            }
        }
    }

    setVolume(value) {
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.value = value;
            this.updateVolumeIcon();
        }
    }

    updateVolumeIcon() {
        const muteBtn = document.getElementById('muteBtn');
        const volumeSlider = document.getElementById('volumeSlider');
        
        if (muteBtn && volumeSlider) {
            const value = parseInt(volumeSlider.value);
            if (value === 0) {
                muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            } else if (value < 50) {
                muteBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
            } else {
                muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            }
        }
    }

    toggleFullscreen() {
        const videoContainer = document.getElementById('videoContainer');
        
        if (!document.fullscreenElement) {
            videoContainer?.requestFullscreen?.();
        } else {
            document.exitFullscreen();
        }
    }

    async saveProgress() {
        if (!auth.isAuthenticated) return;
        
        try {
            await api.updateWatchProgress(this.contentId, this.progress);
        } catch (error) {
            console.error('Save progress error:', error);
        }
    }

    // ========== Actions ==========

    async toggleWatchList() {
        if (!auth.isAuthenticated) {
            Toast.warning('Please sign in to add to your list');
            return;
        }

        try {
            const isFavorite = await api.isFavorite(this.contentId);
            
            if (isFavorite) {
                await api.removeFromFavorites(this.contentId);
                Toast.success('Removed from My List');
            } else {
                await api.addToFavorites(this.contentId);
                Toast.success('Added to My List');
            }
        } catch (error) {
            console.error('Toggle watchlist error:', error);
            Toast.error('Failed to update list');
        }
    }

    async toggleLike() {
        if (!auth.isAuthenticated) {
            Toast.warning('Please sign in to like content');
            return;
        }

        const likeBtn = document.getElementById('likeBtn');
        likeBtn?.classList.toggle('active');
        
        if (likeBtn?.classList.contains('active')) {
            Toast.success('Added to your likes');
        } else {
            Toast.info('Removed from your likes');
        }
    }

    shareContent() {
        const url = window.location.href;
        
        if (navigator.share) {
            navigator.share({
                title: this.content?.title || 'BurudaniKiganjani',
                text: `Check out ${this.content?.title}`,
                url: url
            }).catch(console.error);
        } else {
            copyToClipboard(url);
            Toast.success('Link copied to clipboard');
        }
    }

    showRatingModal() {
        if (!auth.isAuthenticated) {
            Toast.warning('Please sign in to rate');
            return;
        }

        const content = `
            <div class="rating-modal">
                <h3>Rate this content</h3>
                <div class="rating-stars interactive" id="interactiveRating">
                    ${[1,2,3,4,5].map(i => `<i class="fas fa-star" data-rating="${i}"></i>`).join('')}
                </div>
                <div class="rating-actions">
                    <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
                    <button class="btn btn-primary" onclick="watchPage.submitRating()">Submit</button>
                </div>
            </div>
        `;
        
        Modal.open(content, { size: 'small' });
        
        // Setup star hover
        const stars = document.querySelectorAll('#interactiveRating .fas');
        stars.forEach(star => {
            star.addEventListener('mouseenter', () => {
                const rating = parseInt(star.dataset.rating);
                this.highlightStars(rating);
            });
            star.addEventListener('mouseleave', () => {
                this.highlightStars(this.selectedRating || 0);
            });
            star.addEventListener('click', () => {
                this.selectedRating = parseInt(star.dataset.rating);
                this.highlightStars(this.selectedRating);
            });
        });
    }

    highlightStars(rating) {
        const stars = document.querySelectorAll('#interactiveRating .fas');
        stars.forEach((star, index) => {
            star.classList.toggle('filled', index < rating);
        });
    }

    async submitRating() {
        if (!this.selectedRating) {
            Toast.warning('Please select a rating');
            return;
        }

        try {
            const response = await api.rateContent(this.contentId, this.selectedRating);
            
            if (response.status === 'success') {
                Toast.success('Rating submitted');
                Modal.close();
                this.updateUserRatingDisplay(this.selectedRating);
            } else {
                Toast.error(response.message || 'Failed to submit rating');
            }
        } catch (error) {
            console.error('Submit rating error:', error);
            Toast.error('Failed to submit rating');
        }
    }

    // ========== UI Updates ==========

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

    formatDate(dateString) {
        if (!dateString) return 'Recently';
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
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}

// Initialize watch page
let watchPage;
document.addEventListener('DOMContentLoaded', () => {
    watchPage = new WatchPage();
});

window.watchPage = watchPage;

