// Company Dashboard App JavaScript

const API_BASE = '../../api';
let authToken = localStorage.getItem('auth_token');
let currentPage = 'dashboard';

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    if (!authToken) {
        // Redirect to login if not authenticated
        window.location.href = '../login.html';
        return;
    }
    
    // Check if user is a company
    checkAuth();
    
    // Load initial data
    loadGenres();
    
    // Set up file upload handlers
    setupUploadZones();
});

// Authentication Check
async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE}/auth/verify-token.php`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (!data.success || data.data.role !== 'company') {
            // Not a company account
            alert('Access denied. Company account required.');
            window.location.href = '../index.html';
            return;
        }
        
        // Load dashboard data
        loadDashboard();
        loadProfile();
        
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '../login.html';
    }
}

// Dashboard Data
async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE}/company/dashboard.php`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            updateDashboard(data.data);
        }
    } catch (error) {
        console.error('Failed to load dashboard:', error);
    }
}

function updateDashboard(data) {
    const stats = data.stats;
    
    // Update stats
    document.getElementById('stat-total-content').textContent = stats.total_content || 0;
    document.getElementById('stat-total-views').textContent = formatNumber(stats.total_views || 0);
    document.getElementById('stat-avg-rating').textContent = stats.average_rating || '0.0';
    document.getElementById('stat-active-content').textContent = stats.active_content || 0;
    
    // Update analytics
    if (document.getElementById('analytics-views')) {
        document.getElementById('analytics-views').textContent = formatNumber(stats.total_views || 0);
        document.getElementById('analytics-watch-time').textContent = formatDuration(stats.total_views * 3 || 0);
    }
    
    // Update verification banner
    const verification = data.verification;
    const banner = document.getElementById('verification-banner');
    if (banner && verification) {
        banner.innerHTML = `
            <div class="verification-icon ${verification.status}">
                ${verification.status === 'verified' ? '✓' : verification.status === 'pending' ? '⏳' : '✗'}
            </div>
            <div class="verification-text">
                <h3>Account ${verification.status.charAt(0).toUpperCase() + verification.status.slice(1)}</h3>
                <p>${verification.message}</p>
            </div>
        `;
    }
    
    // Update recent content table
    const recentContent = data.recent_content || [];
    const tbody = document.getElementById('recent-content-table');
    if (tbody) {
        if (recentContent.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">No content yet. Upload your first movie or series!</td></tr>';
        } else {
            tbody.innerHTML = recentContent.map(item => `
                <tr>
                    <td>${escapeHtml(item.title)}</td>
                    <td><span class="content-type">${item.content_type}</span></td>
                    <td>${formatNumber(item.view_count || 0)}</td>
                    <td>${item.rating || '-'}</td>
                    <td><span class="badge ${item.is_active ? 'badge-success' : 'badge-warning'}">${item.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-secondary btn-sm" onclick="editContent(${item.id})">Edit</button>
                            <button class="btn btn-sm" style="background-color: rgba(229, 9, 20, 0.2); color: var(--error-color);" onclick="deleteContent(${item.id})">Delete</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    }
    
    // Update content by type
    const byType = stats.content_by_type || {};
    const typeContainer = document.getElementById('content-by-type');
    if (typeContainer) {
        const typeIcons = { movie: '🎬', series: '📺', documentary: '📹', anime: '🎌' };
        typeContainer.innerHTML = Object.entries(byType).map(([type, count]) => `
            <div class="content-card" style="text-align: center; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 10px;">${typeIcons[type] || '📁'}</div>
                <div style="font-size: 24px; font-weight: bold; color: var(--primary-color);">${count}</div>
                <div style="color: var(--text-secondary); text-transform: capitalize;">${type}s</div>
            </div>
        `).join('') || '<p style="color: var(--text-secondary);">No content types yet</p>';
    }
    
    // Update top content for analytics
    const topContent = data.top_content || [];
    const topTable = document.getElementById('top-content-table');
    if (topTable) {
        topTable.innerHTML = topContent.map(item => `
            <tr>
                <td>${escapeHtml(item.title)}</td>
                <td>${formatNumber(item.view_count || 0)}</td>
                <td>${formatDuration((item.view_count || 0) * 4)}</td>
                <td>${item.rating || '-'}</td>
            </tr>
        `).join('') || '<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">No data yet</td></tr>';
    }
}

// Load Profile
async function loadProfile() {
    try {
        const response = await fetch(`${API_BASE}/company/profile.php`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const company = data.data.company;
            
            document.getElementById('company-name').value = company.name || '';
            document.getElementById('company-description').value = company.description || '';
            document.getElementById('company-website').value = company.website || '';
            document.getElementById('company-country').value = company.country || '';
            document.getElementById('company-address').value = company.address || '';
            document.getElementById('settings-email').value = company.email || '';
            document.getElementById('settings-tax-id').value = company.tax_id || '';
            
            // Update logo preview
            if (company.logo) {
                document.getElementById('company-logo-preview').src = company.logo;
                document.getElementById('company-logo-preview').style.display = 'block';
                document.getElementById('logo-placeholder').style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Failed to load profile:', error);
    }
}

// Load Genres
async function loadGenres() {
    try {
        const response = await fetch(`${API_BASE}/content/genres.php`);
        const data = await response.json();
        
        if (data.success) {
            const container = document.getElementById('genre-checkboxes');
            if (container) {
                container.innerHTML = data.data.genres.map(genre => `
                    <label style="display: flex; align-items: center; gap: 5px; padding: 8px 12px; 
                                 background-color: var(--bg-dark); border-radius: 20px; cursor: pointer;">
                        <input type="checkbox" name="genres" value="${genre.id}">
                        <span>${escapeHtml(genre.name)}</span>
                    </label>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Failed to load genres:', error);
    }
}

// Load Content List
async function loadContent() {
    const search = document.getElementById('content-search')?.value || '';
    const type = document.getElementById('content-type')?.value || '';
    const status = document.getElementById('content-status')?.value || '';
    const page = new URLSearchParams(window.location.search).get('page') || 1;
    
    const params = new URLSearchParams({
        search,
        type,
        status,
        page
    });
    
    try {
        const response = await fetch(`${API_BASE}/company/content.php?${params}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            renderContentGrid(data.data.content);
            renderPagination(data.data.pagination);
        }
    } catch (error) {
        console.error('Failed to load content:', error);
    }
}

function renderContentGrid(content) {
    const container = document.getElementById('content-list');
    if (!container) return;
    
    if (content.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-icon">🎬</div>
                <h3 class="empty-title">No Content Found</h3>
                <p class="empty-text">Upload your first movie or series to get started.</p>
                <button class="btn btn-primary" onclick="showPage('upload')">Upload Content</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = content.map(item => `
        <div class="content-card">
            <img src="${item.thumbnail_url || '../assets/images/placeholder.jpg'}" 
                 alt="${escapeHtml(item.title)}" 
                 class="content-thumbnail"
                 onerror="this.src='../assets/images/placeholder.jpg'">
            <div class="content-info">
                <h3 class="content-title">${escapeHtml(item.title)}</h3>
                <div class="content-meta">
                    <span class="content-type">${item.content_type}</span>
                    <span>${item.release_year || ''}</span>
                </div>
                <div class="content-stats">
                    <span>👁️ ${formatNumber(item.view_count || 0)}</span>
                    <span>⭐ ${item.rating || '-'}</span>
                </div>
                <div style="margin-top: 10px; display: flex; gap: 5px;">
                    <span class="badge ${item.is_active ? 'badge-success' : 'badge-warning'}">
                        ${item.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}

function renderPagination(pagination) {
    const container = document.getElementById('content-pagination');
    if (!container) return;
    
    if (pagination.pages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    for (let i = 1; i <= pagination.pages; i++) {
        html += `<button class="pagination-btn ${i === pagination.page ? 'active' : ''}" 
                        onclick="goToPage(${i})">${i}</button>`;
    }
    container.innerHTML = html;
}

function goToPage(page) {
    const params = new URLSearchParams(window.location.search);
    params.set('page', page);
    window.location.search = params.toString();
}

// Upload Handler
async function handleUpload(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Uploading...';
    
    const formData = new FormData(form);
    
    // Get selected genres
    const genres = Array.from(form.querySelectorAll('input[name="genres"]:checked'))
                        .map(cb => cb.value);
    formData.set('genres', JSON.stringify(genres));
    
    try {
        const response = await fetch(`${API_BASE}/company/upload.php`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Content uploaded successfully!');
            form.reset();
            document.getElementById('thumbnail-preview').style.display = 'none';
            document.getElementById('video-info').style.display = 'none';
            showPage('content');
            loadDashboard();
        } else {
            alert('Upload failed: ' + data.message);
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Upload failed. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>📤</span> Upload Content';
    }
}

// Update Profile
async function updateProfile(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    try {
        const response = await fetch(`${API_BASE}/company/profile.php`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(Object.fromEntries(formData))
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Profile updated successfully!');
        } else {
            alert('Update failed: ' + data.message);
        }
    } catch (error) {
        console.error('Profile update error:', error);
        alert('Update failed. Please try again.');
    }
}

// Edit Content
function editContent(id) {
    alert('Edit functionality coming soon! Content ID: ' + id);
}

// Delete Content
async function deleteContent(id) {
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/company/content.php?id=${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Content deleted successfully!');
            loadDashboard();
            loadContent();
        } else {
            alert('Delete failed: ' + data.message);
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('Delete failed. Please try again.');
    }
}

// File Upload Zones Setup
function setupUploadZones() {
    ['thumbnail', 'video'].forEach(type => {
        const zone = document.getElementById(`${type}-zone`);
        const input = zone?.querySelector('input[type="file"]');
        
        if (zone && input) {
            zone.addEventListener('click', () => input.click());
            
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                zone.classList.add('dragover');
            });
            
            zone.addEventListener('dragleave', () => {
                zone.classList.remove('dragover');
            });
            
            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('dragover');
                input.files = e.dataTransfer.files;
                handleFileSelect(type, input.files[0]);
            });
            
            input.addEventListener('change', () => {
                handleFileSelect(type, input.files[0]);
            });
        }
    });
}

function handleFileSelect(type, file) {
    if (!file) return;
    
    if (type === 'thumbnail') {
        const preview = document.getElementById('thumbnail-preview');
        const img = preview.querySelector('img');
        img.src = URL.createObjectURL(file);
        preview.style.display = 'block';
    } else if (type === 'video') {
        const info = document.getElementById('video-info');
        document.getElementById('video-name').textContent = file.name + ' (' + formatFileSize(file.size) + ')';
        info.style.display = 'block';
    }
}

function previewLogo(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('company-logo-preview').src = e.target.result;
            document.getElementById('company-logo-preview').style.display = 'block';
            document.getElementById('logo-placeholder').style.display = 'none';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Page Navigation
function showPage(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    
    // Show selected page
    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) {
        targetPage.style.display = 'block';
    }
    
    // Update nav active state
    document.querySelectorAll('.sidebar-nav a').forEach(a => {
        a.classList.remove('active');
        if (a.getAttribute('onclick')?.includes(page)) {
            a.classList.add('active');
        }
    });
    
    currentPage = page;
    
    // Load page-specific data
    if (page === 'content') {
        loadContent();
    }
}

// Logout
function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    window.location.href = '../index.html';
}

// Utility Functions
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function formatDuration(seconds) {
    if (seconds < 60) return seconds + 's';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h';
    return Math.floor(seconds / 86400) + 'd';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

