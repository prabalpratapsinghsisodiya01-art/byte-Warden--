document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('breach-form');
    const input = document.getElementById('email-input');
    const btn = document.getElementById('search-btn');
    const loader = document.getElementById('search-loader');
    const resultsContainer = document.getElementById('results-container');
    const emptyState = document.getElementById('empty-state');
    const breachList = document.getElementById('breach-list');
    
    // Stats
    const statMonitored = document.getElementById('stat-monitored');
    const statBreaches = document.getElementById('stat-breaches');
    const riskScoreValue = document.getElementById('risk-score-value');
    const riskScoreUI = document.getElementById('risk-score-ui');
    const riskScoreText = document.getElementById('risk-score-text');
    const activityLog = document.getElementById('activity-log');

    // Define the backend URL for your API 
    // Usually http://localhost:3000 but if your backend runs on a different port ensure it matches.
    const API_BASE = 'http://localhost:3000/api';

    let monitoredCount = 1;
    let totalBreachesFound = 0;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = input.value.trim();
        if (!email) return;

        // UI Loading State
        btn.querySelector('span').style.display = 'none';
        loader.style.display = 'block';
        btn.disabled = true;

        try {
            logActivity(`Started breach check for ${email}`, 'success');
            
            // Call the advanced breach check endpoint we created
            const response = await fetch(`${API_BASE}/advanced-breach-check?email=${encodeURIComponent(email)}`);
            const data = await response.json();

            if (response.ok) {
                displayResults(email, data.breaches || []);
            } else {
                throw new Error(data.error || 'Failed to fetch breach data');
            }

        } catch (error) {
            console.error('Breach Check Error:', error);
            logActivity(`Error checking breaches: ${error.message}`, 'danger');
            alert(`Error: ${error.message}. Is the backend server running?`);
        } finally {
            // Restore UI
            btn.querySelector('span').style.display = 'inline';
            loader.style.display = 'none';
            btn.disabled = false;
        }
    });

    function displayResults(email, breaches) {
        emptyState.style.display = 'none';
        breachList.style.display = 'flex';
        breachList.innerHTML = ''; // clear previous

        if (breaches.length === 0) {
            logActivity(`No breaches found for ${email}`, 'success');
            updateRiskScore(0);
            breachList.innerHTML = `
                <div style="text-align: center; padding: 40px; background: rgba(16, 185, 129, 0.1); border: 1px solid var(--success-color); border-radius: 8px;">
                    <div style="font-size: 32px; margin-bottom: 8px;">✅</div>
                    <h3 style="color: var(--success-color); margin-bottom: 8px;">Secure</h3>
                    <p>No known data breaches found for <strong>${email}</strong>.</p>
                </div>
            `;
            return;
        }

        logActivity(`Found ${breaches.length} breaches for ${email}`, 'danger');
        totalBreachesFound += breaches.length;
        statBreaches.textContent = totalBreachesFound;

        // Calculate a basic risk score based on number of breaches and how recent they are
        let riskScore = calculateRiskScore(breaches);
        updateRiskScore(riskScore);

        breaches.forEach(breach => {
            const card = document.createElement('div');
            card.className = 'breach-card';
            
            const badgesHtml = breach.DataClasses 
                ? breach.DataClasses.map(dc => `<span class="data-badge">${dc}</span>`).join('') 
                : '<span class="data-badge">Unknown data</span>';

            card.innerHTML = `
                <div class="breach-header">
                    <div class="breach-title">
                        <img src="${breach.LogoPath || 'https://via.placeholder.com/32'}" alt="${breach.Name}" onerror="this.style.display='none'">
                        ${breach.Title || breach.Name}
                    </div>
                    <div class="breach-date">${new Date(breach.BreachDate).toLocaleDateString()}</div>
                </div>
                <div class="breach-desc" style="color: var(--text-muted); font-size: 14px; line-height: 1.5;">
                    ${breach.Description || 'No description available.'}
                </div>
                <div class="breach-data">
                    <strong style="color: #fff; font-size: 12px; margin-right: 8px; display: flex; align-items: center;">Exposed Data:</strong>
                    ${badgesHtml}
                </div>
                
                <div class="password-flow">
                    <div style="color: var(--warning-color); font-size: 14px; display: flex; align-items: center; gap: 8px;">
                        ⚠️ <span style="font-weight: 500;">Action Required: Change Password</span>
                    </div>
                    <div class="password-actions">
                        <button class="btn btn-outline" onclick="startPasswordFlow(this, '${breach.Name.replace(/'/g, "\\'")}', '${email}')">
                            Initiate Password Reset
                        </button>
                    </div>
                </div>
                <div class="flow-details"></div>
            `;
            breachList.appendChild(card);
        });
    }

    // Exported function explicitly mapped to window so inline onclick can use it
    window.startPasswordFlow = async function(btnElement, platform, email) {
        const flowDetails = btnElement.parentElement.parentElement.nextElementSibling;
        
        if (flowDetails.classList.contains('active')) {
            flowDetails.classList.remove('active');
            btnElement.textContent = 'Initiate Password Reset';
            return;
        }

        btnElement.textContent = 'Generating...';
        btnElement.disabled = true;

        try {
            // Call our new generate password API endpoint
            const res = await fetch(`${API_BASE}/password-flow/generate?length=18`);
            const data = await res.json();
            const newPassword = data.password;

            logActivity(`Initiated password reset flow for ${platform}`, 'warning');

            // Render the flow UI
            flowDetails.innerHTML = `
                <h4 style="margin-bottom: 12px; color: #fff;">1. Generated New Secure Password</h4>
                <p style="font-size: 14px; color: var(--text-muted);">We've generated a strong, unique 18-character password for ${platform}:</p>
                
                <div class="generated-password">${newPassword}</div>
                
                <div style="display: flex; gap: 12px; margin-bottom: 20px;">
                    <button class="btn btn-primary" onclick="copyToClipboard('${newPassword}', this)" style="flex: 1;">Copy Password</button>
                    <button class="btn btn-outline" onclick="saveToVault('${platform}', '${email}', '${newPassword}', this)" style="flex: 1;">Save to Vault</button>
                </div>

                <h4 style="margin-bottom: 12px; color: #fff;">2. Update at Provider</h4>
                <p style="font-size: 14px; color: var(--text-muted);">Click your provider to go directly to their security settings and paste your new password.</p>
                
                <div class="provider-links">
                    <a href="https://myaccount.google.com/signinoptions/password" target="_blank" class="btn btn-outline" style="text-align: center; padding: 8px;">Google / Gmail</a>
                    <a href="https://account.live.com/password/Change" target="_blank" class="btn btn-outline" style="text-align: center; padding: 8px;">Microsoft / Outlook</a>
                    <a href="https://login.yahoo.com/account/security" target="_blank" class="btn btn-outline" style="text-align: center; padding: 8px;">Yahoo</a>
                </div>
            `;

            flowDetails.classList.add('active');
            btnElement.textContent = 'Hide Password Flow';
            
        } catch (err) {
            console.error(err);
            alert('Failed to generate password. Is the backend running?');
            btnElement.textContent = 'Initiate Password Reset';
        } finally {
            btnElement.disabled = false;
        }
    };

    window.copyToClipboard = function(text, btnElement) {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = btnElement.textContent;
            btnElement.textContent = 'Copied!';
            btnElement.style.backgroundColor = 'var(--success-color)';
            btnElement.style.borderColor = 'var(--success-color)';
            setTimeout(() => {
                btnElement.textContent = originalText;
                btnElement.style.backgroundColor = '';
                btnElement.style.borderColor = '';
            }, 2000);
        });
    };

    window.saveToVault = async function(platform, email, password, btnElement) {
        const originalText = btnElement.textContent;
        btnElement.textContent = 'Saving...';
        btnElement.disabled = true;

        try {
            const res = await fetch(`${API_BASE}/password-flow/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ platform, email, password })
            });

            const data = await res.json();

            if (res.ok) {
                btnElement.textContent = 'Saved to Vault ✓';
                btnElement.style.borderColor = 'var(--success-color)';
                btnElement.style.color = 'var(--success-color)';
                logActivity(`Updated credential saved to vault for ${platform}`, 'success');
            } else {
                throw new Error(data.error || 'Failed to save');
            }
        } catch (err) {
            console.error(err);
            alert('Error saving to vault: ' + err.message);
            btnElement.textContent = originalText;
            btnElement.disabled = false;
        }
    };

    function calculateRiskScore(breaches) {
        if (!breaches || breaches.length === 0) return 0;
        
        let score = 0;
        const currentYear = new Date().getFullYear();

        breaches.forEach(b => {
            // Base weight for a breach
            let breachWeight = 20;

            // Add weight based on recency
            const breachYear = new Date(b.BreachDate).getFullYear();
            const age = currentYear - breachYear;
            
            if (age === 0) breachWeight += 40;
            else if (age <= 2) breachWeight += 20;
            else if (age <= 5) breachWeight += 10;

            // Add weight based on sensitive data classes
            if (b.DataClasses) {
                const lowerClasses = b.DataClasses.map(c => c.toLowerCase());
                if (lowerClasses.includes('passwords')) breachWeight += 30;
                if (lowerClasses.includes('credit cards') || lowerClasses.includes('bank account numbers')) breachWeight += 40;
                if (lowerClasses.includes('social security numbers')) breachWeight += 50;
            }

            score += breachWeight;
        });

        // Cap at 100
        return Math.min(Math.round(score), 100);
    }

    function updateRiskScore(score) {
        riskScoreValue.textContent = score;
        
        riskScoreUI.className = 'risk-score'; // reset classes
        if (score >= 70) {
            riskScoreUI.classList.add('high');
            riskScoreText.textContent = 'High alert! Your footprint is heavily exposed.';
        } else if (score >= 30) {
            riskScoreUI.classList.add('medium');
            riskScoreText.textContent = 'Moderate risk. Address recent breaches.';
        } else {
            riskScoreUI.classList.add('low');
            riskScoreText.textContent = 'Low risk. Your layout footprint is mostly secure.';
        }

        // Animate counter
        let start = 0;
        const duration = 1000;
        const startTime = performance.now();
        
        function animateNumber(time) {
            const progress = Math.min((time - startTime) / duration, 1);
            riskScoreValue.textContent = Math.round(progress * score);
            if (progress < 1) {
                requestAnimationFrame(animateNumber);
            }
        }
        requestAnimationFrame(animateNumber);
    }

    function logActivity(message, type = 'success') {
        const item = document.createElement('div');
        item.className = `timeline-item ${type}`;
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        item.innerHTML = `
            <div class="time-label">${time}</div>
            <div>${message}</div>
        `;
        
        activityLog.insertBefore(item, activityLog.firstChild);

        // Keep only last 10
        if (activityLog.children.length > 10) {
            activityLog.removeChild(activityLog.lastChild);
        }
    }
});
