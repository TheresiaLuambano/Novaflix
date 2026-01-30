/**
 * BurudaniKiganjani - Common Footer Component
 * Dynamic footer with current year and inline styles
 */

(function() {
    'use strict';
    
    const currentYear = new Date().getFullYear();
    const isAuthPage = document.body && document.body.classList.contains('auth-page');
    
    // Inline CSS styles
    const styles = `
        .footer {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            padding: 48px 0 24px;
            margin-top: 64px;
            border-top: 1px solid #475569;
        }
        .footer-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 24px;
        }
        .footer-brand {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
            flex-wrap: wrap;
            gap: 16px;
        }
        .footer .logo {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .footer .logo a {
            display: flex;
            align-items: center;
            gap: 10px;
            text-decoration: none;
        }
        .footer .logo-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #4361ee, #7209b7);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.2rem;
        }
        .footer .logo-text {
            font-size: 1.3rem;
            font-weight: 700;
            background: linear-gradient(135deg, #4361ee, #4cc9f0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .footer-tagline {
            color: #94a3b8;
            font-size: 0.9rem;
        }
        .footer-social {
            display: flex;
            gap: 12px;
        }
        .footer-social .social-link {
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255,255,255,0.05);
            border: 1px solid #475569;
            border-radius: 50%;
            color: #cbd5e1;
            font-size: 1rem;
            text-decoration: none;
            transition: all 0.3s ease;
        }
        .footer-social .social-link:hover {
            background: #4361ee;
            border-color: #4361ee;
            color: white;
            transform: translateY(-2px);
        }
        .footer-links-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 24px;
            margin-bottom: 32px;
        }
        .footer-column h4 {
            color: #f8fafc;
            font-size: 0.9rem;
            font-weight: 600;
            margin-bottom: 16px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .footer-column a {
            display: block;
            color: #94a3b8;
            font-size: 0.85rem;
            text-decoration: none;
            margin-bottom: 10px;
            transition: color 0.3s ease;
        }
        .footer-column a:hover {
            color: #4cc9f0;
        }
        .footer-bottom {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 24px;
            border-top: 1px solid #475569;
            flex-wrap: wrap;
            gap: 16px;
        }
        .footer-bottom p {
            color: #64748b;
            font-size: 0.8rem;
        }
        .footer-badges {
            display: flex;
            gap: 8px;
        }
        .footer-badges .badge {
            padding: 4px 12px;
            background: rgba(255,255,255,0.05);
            border: 1px solid #475569;
            border-radius: 4px;
            color: #94a3b8;
            font-size: 0.75rem;
            font-weight: 600;
        }
        
        /* Auth page footer styles */
        .auth-footer-section {
            position: relative;
            z-index: 10;
            padding: 32px 48px 24px;
            background: transparent;
            border-top: none;
        }
        .auth-footer-section .footer-content {
            max-width: 1000px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
        }
        .auth-footer-section .footer-links {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 24px;
        }
        .auth-footer-section .footer-links a {
            font-size: 0.85rem;
            color: rgba(255,255,255,0.5);
            text-decoration: none;
            transition: color 0.3s ease;
        }
        .auth-footer-section .footer-links a:hover {
            color: rgba(255,255,255,0.8);
        }
        .auth-footer-section .copyright {
            font-size: 0.8rem;
            color: rgba(255,255,255,0.3);
        }
        
        @media (max-width: 768px) {
            .footer-links-row {
                grid-template-columns: repeat(2, 1fr);
            }
            .footer-brand {
                flex-direction: column;
                text-align: center;
            }
            .footer-bottom {
                flex-direction: column;
                text-align: center;
            }
        }
        @media (max-width: 480px) {
            .footer-links-row {
                grid-template-columns: 1fr;
            }
        }
    `;
    
    // Inject styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    
    // Footer HTML
    const footerHTML = isAuthPage ? `
        <footer class="auth-footer-section">
            <div class="footer-content">
                <div class="footer-links">
                    <a href="#">Terms of Use</a>
                    <a href="#">Privacy Policy</a>
                    <a href="#">Help Center</a>
                    <a href="#">Contact Us</a>
                </div>
                <p class="copyright">&copy; ${currentYear} BurudaniKiganjani. All rights reserved.</p>
            </div>
        </footer>
    ` : `
        <footer class="footer">
            <div class="footer-container">
                <div class="footer-brand">
                    <div class="logo">
                        <a href="index.html">
                            <div class="logo-icon"><i class="fas fa-play"></i></div>
                            <span class="logo-text">BurudaniKiganjani</span>
                        </a>
                    </div>
                    <p class="footer-tagline">Your premium entertainment destination</p>
                </div>
                <div class="footer-social">
                    <a href="#" class="social-link" title="Facebook"><i class="fab fa-facebook-f"></i></a>
                    <a href="#" class="social-link" title="Instagram"><i class="fab fa-instagram"></i></a>
                    <a href="#" class="social-link" title="Twitter"><i class="fab fa-twitter"></i></a>
                    <a href="#" class="social-link" title="YouTube"><i class="fab fa-youtube"></i></a>
                    <a href="#" class="social-link" title="TikTok"><i class="fab fa-tiktok"></i></a>
                </div>
                <div class="footer-links-row">
                    <div class="footer-column">
                        <h4>Browse</h4>
                        <a href="browse.html">Movies</a>
                        <a href="browse.html">Series</a>
                        <a href="shorts.html">Shorts</a>
                        <a href="browse.html?type=live">Live</a>
                    </div>
                    <div class="footer-column">
                        <h4>Account</h4>
                        <a href="profile.html">Profile</a>
                        <a href="my-list.html">My List</a>
                        <a href="settings.html">Settings</a>
                        <a href="subscriptions.html">Membership</a>
                    </div>
                    <div class="footer-column">
                        <h4>Support</h4>
                        <a href="#">Help Center</a>
                        <a href="#">Contact Us</a>
                        <a href="#">Terms of Use</a>
                        <a href="#">Privacy Policy</a>
                    </div>
                    <div class="footer-column">
                        <h4>Creators</h4>
                        <a href="#">Creator Studio</a>
                        <a href="#">Upload Content</a>
                        <a href="#">Monetization</a>
                        <a href="#">Analytics</a>
                    </div>
                <div class="footer-bottom">
                    <p>&copy; ${currentYear} BurudaniKiganjani. All rights reserved.</p>
                    <div class="footer-badges">
                        <span class="badge">4K</span>
                        <span class="badge">Dolby</span>
                        <span class="badge">HDR</span>
                    </div>
            </div>
        </footer>
    `;
    
    // Find existing footer or container and update
    const existingFooter = document.querySelector('.footer, .auth-footer-section');
    if (existingFooter) {
        existingFooter.outerHTML = footerHTML;
    } else {
        const authFooter = document.getElementById('authFooter');
        if (authFooter) {
            authFooter.innerHTML = footerHTML.replace('<footer class="footer">', '<footer class="auth-footer-section">').replace('</footer>', '');
        } else {
            document.body.insertAdjacentHTML('beforeend', footerHTML);
        }
    }
})();
