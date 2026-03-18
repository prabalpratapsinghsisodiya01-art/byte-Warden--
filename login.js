document.addEventListener('DOMContentLoaded', () => {
    // Auth Tab Switching logic (Email vs Mobile)
    const authTabs = document.querySelectorAll('.auth-tab');
    const authSections = document.querySelectorAll('.auth-section');

    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active classes
            authTabs.forEach(t => t.classList.remove('active'));
            authSections.forEach(s => s.classList.remove('active'));

            // Add active class to clicked tab and its target section
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Mock Login handling
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const submitBtn = document.getElementById('submit-login');

    const handleLoginSuccess = (provider) => {
        const originalText = submitBtn ? submitBtn.innerText : 'Logging in...';
        if(submitBtn) {
            submitBtn.innerText = 'Authenticating...';
            submitBtn.style.opacity = '0.8';
        }
        
        loginError.innerText = '';
        
        // Simulate network request
        setTimeout(() => {
            window.location.href = `prabal.html?login_success=true&provider=${encodeURIComponent(provider)}`;
        }, 1000);
    };

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Determine active tab
            const isEmailFlow = document.getElementById('email-auth').classList.contains('active');
            let identifier = '';
            
            if (isEmailFlow) {
                identifier = document.getElementById('email').value.trim();
            } else {
                const countryCode = document.getElementById('country-code').value;
                const mobileNumber = document.getElementById('mobile').value.trim();
                identifier = countryCode + mobileNumber;
            }

            const password = document.getElementById('password').value;

            if (!identifier) {
                loginError.innerText = isEmailFlow ? 'Please enter your email.' : 'Please enter your mobile number.';
                return;
            }

            if (!password) {
                loginError.innerText = 'Please enter your password.';
                return;
            }

            // If filled out, simulate success
            handleLoginSuccess(isEmailFlow ? 'Email' : 'Mobile Number');
        });
    }

    // Third-party Social Login Bindings
    const socialProviders = [
        { id: 'btn-gmail', name: 'Google/Gmail' },
        { id: 'btn-microsoft', name: 'Microsoft' },
        { id: 'btn-instagram', name: 'Instagram' }
    ];

    socialProviders.forEach(provider => {
        const btn = document.getElementById(provider.id);
        if (btn) {
            btn.addEventListener('click', () => {
                // Change UI state
                const originalContent = btn.innerHTML;
                btn.innerText = 'Connecting...';
                
                // Simulate OAuth pop-up/redirect Flow
                setTimeout(() => {
                    handleLoginSuccess(provider.name);
                    // restore just in case it doesn't redirect
                    setTimeout(()=> { btn.innerHTML = originalContent; }, 500);
                }, 800);
            });
        }
    });

});
