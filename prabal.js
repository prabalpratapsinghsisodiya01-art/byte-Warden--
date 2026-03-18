document.addEventListener('DOMContentLoaded', () => {
    const submitBtn = document.getElementById('hero-submit');
    const emailInput = document.getElementById('hero-email');

    if (submitBtn && emailInput) {
        submitBtn.addEventListener('click', () => {
            const email = emailInput.value.trim();
            if (email) {
                // Add button animation
                const originalText = submitBtn.innerText;
                submitBtn.innerText = 'Creating Account...';
                submitBtn.style.opacity = '0.8';
                
                setTimeout(() => {
                    alert(`Thanks for signing up to Byte Warden, ${email}! Welcome to secure password management.`);
                    submitBtn.innerText = originalText;
                    submitBtn.style.opacity = '1';
                    emailInput.value = '';
                }, 1000);
            } else {
                emailInput.focus();
                emailInput.style.border = '1px solid #FF5F56';
                setTimeout(() => {
                    emailInput.style.border = '1px solid #1E293B';
                }, 2000);
            }
        });
    }

    // Add copy functionality to vault items
    const copyBtns = document.querySelectorAll('.action-btn');
    copyBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const originalText = this.innerText;
            this.innerText = 'Copied!';
            this.style.backgroundColor = '#27C93F';
            this.style.color = '#fff';
            this.style.border = '1px solid #27C93F';
            
            setTimeout(() => {
                this.innerText = originalText;
                this.style.backgroundColor = '';
                this.style.color = '';
                this.style.border = '';
            }, 2000);
        });
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if(href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Handle Login State and Redirection
    const authButtons = document.getElementById('auth-buttons');
    const userProfile = document.getElementById('user-profile');
    
    // Check URL for recent login success
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('login_success') === 'true') {
        const provider = urlParams.get('provider') || 'Email';
        
        // Save mock session
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('loginProvider', provider);
        
        // Brief timeout to ensure the UI has loaded
        setTimeout(() => {
            alert(`Successfully logged in via ${provider}! Welcome back to Byte Warden.`);
            
            // Clean up the URL to prevent showing the alert again on refresh
            const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({path: cleanUrl}, '', cleanUrl);
        }, 500);
    }
    
    // Toggle UI based on session state
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        if(authButtons) authButtons.style.display = 'none';
        if(userProfile) userProfile.style.display = 'flex';
    }

    // Search Overlay Functionality
    const searchTrigger = document.getElementById('search-trigger');
    const searchOverlay = document.getElementById('search-overlay');
    const searchClose = document.getElementById('search-close');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    // Mock Search Database
    const searchData = [
        { title: 'Password Vault', desc: 'Securely store and manage your passwords', url: 'passwordvault.html', type: 'Feature', icon: '🔐' },
        { title: 'Deepfake Detection', desc: 'Analyze images and videos for AI manipulation', url: 'deepfake.html', type: 'Tool', icon: '🕵️' },
        { title: 'Password Strength Analyzer', desc: 'Check your password entropy and crack time', url: 'password_strength.html', type: 'Tool', icon: '📈' },
        { title: 'AI Assistant', desc: 'Chat with our AI about security best practices', url: 'aichatbot.html', type: 'Feature', icon: '🤖' },
        { title: 'Pricing Plans', desc: 'View Free, Premium, and Family plan options', url: 'prabal.html#pricing', type: 'Page', icon: '💳' },
        { title: 'Enterprise Solutions', desc: 'Discover SSO and directory syncing for business', url: 'prabal.html#enterprise', type: 'Page', icon: '🏢' },
        { title: 'Security Architecture', desc: 'Learn about our zero-knowledge encryption', url: 'security.html', type: 'Documentation', icon: '🛡️' },
        { title: 'Privacy Policy', desc: 'Read how we handle and protect your data', url: 'privacy.html', type: 'Legal', icon: '📄' }
    ];

    if (searchTrigger && searchOverlay && searchClose) {
        // Open search
        searchTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            searchOverlay.classList.add('active');
            setTimeout(() => searchInput.focus(), 100);
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });

        // Close search
        const closeSearch = () => {
            searchOverlay.classList.remove('active');
            searchInput.value = '';
            renderSearchResults('');
            document.body.style.overflow = '';
        };

        searchClose.addEventListener('click', closeSearch);
        
        // Close on overlay click
        searchOverlay.addEventListener('click', (e) => {
            if (e.target === searchOverlay) {
                closeSearch();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
                closeSearch();
            }
        });

        // Handle search input
        searchInput.addEventListener('input', (e) => {
            renderSearchResults(e.target.value.toLowerCase().trim());
        });

        // Handle suggestion clicks
        document.querySelectorAll('.suggestion').forEach(suggestion => {
            suggestion.addEventListener('click', (e) => {
                e.preventDefault();
                const term = e.target.textContent;
                searchInput.value = term;
                renderSearchResults(term.toLowerCase());
                searchInput.focus();
            });
        });

        function renderSearchResults(query) {
            if (!query) {
                searchResults.innerHTML = `
                    <div class="search-empty">
                        <p>Start typing to search across Byte Warden...</p>
                        <div class="search-suggestions">
                            <span>Try:</span>
                            <a href="#" class="suggestion">Vault</a>
                            <a href="#" class="suggestion">Deepfake</a>
                            <a href="#" class="suggestion">Analyzer</a>
                            <a href="#" class="suggestion">Security</a>
                        </div>
                    </div>
                `;
                // Re-bind suggestion clicks since we replaced the HTML
                document.querySelectorAll('.search-results .suggestion').forEach(suggestion => {
                    suggestion.addEventListener('click', (e) => {
                        e.preventDefault();
                        const term = e.target.textContent;
                        searchInput.value = term;
                        renderSearchResults(term.toLowerCase());
                        searchInput.focus();
                    });
                });
                return;
            }

            const results = searchData.filter(item => 
                item.title.toLowerCase().includes(query) || 
                item.desc.toLowerCase().includes(query) ||
                item.type.toLowerCase().includes(query)
            );

            if (results.length === 0) {
                searchResults.innerHTML = `
                    <div class="search-empty">
                        <p>No results found for "<strong>${query}</strong>"</p>
                        <span style="color: var(--text-secondary); font-size: 0.9rem;">Try different keywords or check spelling</span>
                    </div>
                `;
                return;
            }

            let html = '';
            results.forEach(item => {
                html += `
                    <a href="${item.url}" class="search-result-item">
                        <div class="result-icon">${item.icon}</div>
                        <div class="result-content">
                            <div class="result-title">${item.title}</div>
                            <div class="result-desc">${item.desc}</div>
                        </div>
                        <div class="result-type">${item.type}</div>
                    </a>
                `;
            });
            
            searchResults.innerHTML = html;
        }
    }
});
