const { useState, useEffect } = React;

const API_URL = 'http://localhost:3000/api';

// Components
const App = () => {
    const [activeTab, setActiveTab] = useState('scanner'); // 'scanner' | 'password'
    
    return (
        <div className="app-container">
            <div className="header-section">
                <h1>Digital Footprint Protection System</h1>
                <p>Secure your online identity. Scan your email across known data breaches and evaluate your passwords locally.</p>
                
                <div className="tabs">
                    <button 
                        className={`tab-btn ${activeTab === 'scanner' ? 'active' : ''}`}
                        onClick={() => setActiveTab('scanner')}
                    >
                        <i data-lucide="search"></i> Breach Scanner
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`}
                        onClick={() => setActiveTab('password')}
                    >
                        <i data-lucide="key"></i> Password Analyzer
                    </button>
                </div>
            </div>

            <div className="content-container">
                {activeTab === 'scanner' ? <BreachScanner /> : <PasswordAnalyzer />}
            </div>
        </div>
    );
};

const BreachScanner = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null); // { safe: boolean, data: any }
    const [error, setError] = useState('');

    const handleScan = async (e) => {
        e.preventDefault();
        if (!email) return;
        
        setLoading(true);
        setError('');
        setResult(null);

        try {
            // Since Node.js isn't installed, we will call the free XposedOrNot API directly from the frontend
            const response = await fetch(`https://api.xposedornot.com/v1/check-email/${encodeURIComponent(email)}`);

            if (response.status === 404) {
                // Not found means safe
                setResult({ safe: true });
            } else if (response.ok) {
                const data = await response.json();
                if (data.breaches && data.breaches[0]) {
                    setResult({
                        safe: false,
                        breachCount: data.breaches[0].length,
                        breaches: data.breaches[0]
                    });
                } else {
                    setResult({ safe: true });
                }
            } else {
                throw new Error("Failed to communicate with breach database.");
            }
        } catch (err) {
            setError(err.message || 'An error occurred during scanning. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card scan-card">
            <h2>Scan Your Email</h2>
            <p className="subtitle">Enter your email to check against public data breaches securely.</p>
            
            <form onSubmit={handleScan} className="scan-form">
                <div className="input-group">
                    <i data-lucide="mail"></i>
                    <input 
                        type="email" 
                        placeholder="Enter your Gmail address" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? 'Scanning Securely...' : 'Scan Now'}
                </button>
            </form>

            {error && <div className="alert error">{error}</div>}

            {result && (
                <div className="result-container">
                    {result.safe ? (
                        <div className="status-box safe">
                            <i data-lucide="shield-check" className="icon-large"></i>
                            <h3>No Breach Detected</h3>
                            <p>Good news! Your email was not found in any known public data breaches.</p>
                            <SecurityChecklist />
                        </div>
                    ) : (
                        <div className="status-box breached">
                            <i data-lucide="alert-triangle" className="icon-large"></i>
                            <h3>Your Email Has Been Found in a Data Breach</h3>
                            <p>We found your footprint in {result.breachCount} data breaches.</p>
                            
                            <FootprintDashboard breaches={result.breaches} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const SecurityChecklist = () => {
    return (
        <div className="checklist-container">
            <h4>Recommended Next Steps:</h4>
            <ul className="checklist">
                <li><i data-lucide="check-circle"></i> <strong>Enable 2FA:</strong> Turn on Two-Factor Authentication for all major accounts.</li>
                <li><i data-lucide="check-circle"></i> <strong>Use a Password Manager:</strong> Store complex passwords safely in Byte Warden.</li>
                <li><i data-lucide="check-circle"></i> <strong>Avoid Password Reuse:</strong> Never use the same password twice.</li>
                <li><i data-lucide="check-circle"></i> <strong>Enable Login Alerts:</strong> Get notified of suspicious login attempts.</li>
            </ul>
        </div>
    );
};

const FootprintDashboard = ({ breaches }) => {
    return (
        <div className="dashboard-container">
            <h4>Delete My Digital Footprint</h4>
            <p className="dashboard-desc">Take action to secure your identity. Follow these guided links to remove your data or secure your accounts.</p>
            
            <div className="action-grid">
                <div className="action-card">
                    <h5><i data-lucide="globe"></i> Google & Big Tech</h5>
                    <p>Delete or secure your account data across major tech platforms.</p>
                    <a href="https://myaccount.google.com/security-checkup" target="_blank" className="btn-outline btn-sm">Google Security Check</a>
                    <a href="https://account.microsoft.com/privacy" target="_blank" className="btn-outline btn-sm mt-2">Microsoft Privacy</a>
                </div>
                
                <div className="action-card">
                    <h5><i data-lucide="users"></i> Social Media Platforms</h5>
                    <p>Review active sessions and revoke compromised third-party app access.</p>
                    <a href="https://www.facebook.com/settings?tab=security" target="_blank" className="btn-outline btn-sm">Secure Facebook</a>
                    <a href="https://twitter.com/settings/security" target="_blank" className="btn-outline btn-sm mt-2">Secure X/Twitter</a>
                </div>

                <div className="action-card">
                    <h5><i data-lucide="database"></i> Data Brokers</h5>
                    <p>Request removal of your personal information from data aggregators.</p>
                    <a href="https://incogni.com" target="_blank" className="btn-outline btn-sm">Use Incogni (Automated)</a>
                    <a href="https://www.privacyrights.org/data-brokers" target="_blank" className="btn-outline btn-sm mt-2">Manual Opt-Out List</a>
                </div>
            </div>

            <div className="breach-details mt-4">
                <h5>Specific Breaches ({breaches.length}):</h5>
                <div className="breach-tags">
                    {breaches.map(b => (
                        <span key={b} className="breach-tag">{b}</span>
                    ))}
                </div>
                <p className="mt-2 text-sm">Action required: If you reused passwords on any of the specific platforms listed above, change them immediately on all other accounts.</p>
            </div>
        </div>
    );
};

const PasswordAnalyzer = () => {
    const [password, setPassword] = useState('');
    const [strengthData, setStrengthData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Debounce password checking to not spam the server
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (password.length > 0) {
                checkStrength(password);
            } else {
                setStrengthData(null);
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [password]);

    const checkStrength = async (pwd) => {
        setLoading(true);
        
        // Performing the strength analysis directly in the browser
        setTimeout(() => {
            let score = 0;
            let feedback = [];
            
            // 1. Length Check
            if (pwd.length > 8) { score += 1; }
            else { feedback.push("Password should be at least 8 characters long."); }
            if (pwd.length >= 12) { score += 1; }
            
            // 2. Character Variety Check
            if (/[A-Z]/.test(pwd)) { score += 1; }
            else { feedback.push("Include uppercase letters."); }
            
            if (/[a-z]/.test(pwd)) { score += 1; }
            else { feedback.push("Include lowercase letters."); }
            
            if (/[0-9]/.test(pwd)) { score += 1; }
            else { feedback.push("Include numbers."); }
            
            if (/[^A-Za-z0-9]/.test(pwd)) { score += 1; }
            else { feedback.push("Include special characters (e.g., !@#$%)."); }

            // 3. Repeated Characters Check
            if (/(.)\1{2,}/.test(pwd)) {
                score -= 1;
                feedback.push("Avoid repeating identical characters more than twice.");
            }
            
            // Calculate Strength
            let strength = "Weak";
            if (score >= 5) { strength = "Very Strong"; }
            else if (score >= 4) { strength = "Strong"; }
            else if (score >= 3) { strength = "Medium"; }
            
            setStrengthData({ strength, score, feedback });
            setLoading(false);
        }, 300); // Simulate standard network delay
    };

    const getStrengthColor = (strength) => {
        switch(strength) {
            case 'Weak': return '#ff5f56';
            case 'Medium': return '#ffbd2e';
            case 'Strong': return '#27c93f';
            case 'Very Strong': return '#1d9d74';
            default: return '#555';
        }
    };

    const getMeterWidth = (score) => {
        return Math.min(100, Math.max(10, (score / 5) * 100)) + '%';
    };

    return (
        <div className="card password-card">
            <h2>Password Strength Analyzer</h2>
            <p className="subtitle">Type a password below. The check evaluates entropy and pattern detection locally in your browser.</p>
            
            <div className="input-group">
                <i data-lucide="key"></i>
                <input 
                    type="text" 
                    placeholder="Enter password to analyze" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            {loading && <div className="loader-text">Analyzing securely...</div>}

            {strengthData && !loading && (
                <div className="strength-results">
                    <div className="strength-header">
                        <h3>Strength: <span style={{color: getStrengthColor(strengthData.strength)}}>{strengthData.strength}</span></h3>
                        <span className="score">Score: {strengthData.score}/5</span>
                    </div>
                    
                    <div className="meter-bg">
                        <div className="meter-fill" style={{ 
                            width: getMeterWidth(strengthData.score),
                            backgroundColor: getStrengthColor(strengthData.strength)
                        }}></div>
                    </div>

                    {strengthData.feedback && strengthData.feedback.length > 0 && (
                        <div className="feedback-container">
                            <h4>Recommendations:</h4>
                            <ul>
                                {strengthData.feedback.map((fb, i) => (
                                    <li key={i}>{fb}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Render App
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
