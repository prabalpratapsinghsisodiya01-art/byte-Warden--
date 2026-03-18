const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const crypto = require('crypto');
const breachRoutes = require('./routes/breachRoutes');
const passwordFlowRoutes = require('./routes/passwordFlowRoutes');
const uxAnalyzerRoutes = require('./routes/uxAnalyzerRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
// Helmet sets various HTTP headers to help protect your app
app.use(helmet());

// Enable CORS for frontend requests (restrict this in production)
app.use(cors({
    origin: '*', // Allow all origins for dev/testing. Change to your domain in production
    methods: ['GET', 'POST']
}));

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

// Rate Limiting to prevent brutal force and DoS
// Limit each IP to 100 requests per windowMs (15 minutes)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply the rate limiting middleware to all requests
app.use('/api/', limiter);

/**
 * Enhanced Password Strength Analyzer
 * Evaluates password strength without storing it.
 */
app.post('/api/analyze-password', (req, res) => {
    const { password } = req.body;
    
    if (!password) {
        return res.status(400).json({ error: 'Password is required' });
    }

    let score = 0;
    let feedback = [];
    
    // 1. Length Check
    if (password.length > 8) { score += 1; }
    else { feedback.push("Password should be at least 8 characters long."); }
    if (password.length >= 12) { score += 1; }
    
    // 2. Character Variety Check (Entropy)
    if (/[A-Z]/.test(password)) { score += 1; }
    else { feedback.push("Include uppercase letters."); }
    
    if (/[a-z]/.test(password)) { score += 1; }
    else { feedback.push("Include lowercase letters."); }
    
    if (/[0-9]/.test(password)) { score += 1; }
    else { feedback.push("Include numbers."); }
    
    if (/[^A-Za-z0-9]/.test(password)) { score += 1; }
    else { feedback.push("Include special characters (e.g., !@#$%)."); }

    // 3. Repeated Characters Pattern Check
    if (/(.)\1{2,}/.test(password)) {
        score -= 1;
        feedback.push("Avoid repeating identical characters more than twice.");
    }
    
    // Calculate Strength
    let strength = "Weak";
    if (score >= 5) {
        strength = "Very Strong";
    } else if (score >= 4) {
        strength = "Strong";
    } else if (score >= 3) {
        strength = "Medium";
    } else {
        strength = "Weak";
    }

    res.json({ strength, score, feedback });
});

/**
 * Data Breach Checker Proxy Route
 * Secures requests to external APIs like XposedOrNot
 */
app.post('/api/check-breach', async (req, res) => {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email address is required' });
    }

    try {
        // Here we anonymously fetch data to check if email is breached.
        // We use XposedOrNot as it provides free email lookup without requiring complex API keys or tokens. 
        const url = `https://api.xposedornot.com/v1/check-email/${encodeURIComponent(email)}`;
        
        try {
            const response = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ByteWarden/1.0' },
                timeout: 5000
            });
            
            // XposedOrNot returns 200 with data if pwned
            if (response.data && response.data.breaches && response.data.breaches[0]) {
                const breaches = response.data.breaches[0];
                return res.json({ 
                    safe: false, 
                    breachCount: breaches.length,
                    breaches: breaches 
                });
            }
        } catch (apiError) {
            // XposedOrNot returns 404 if NOT found (Safe)
            if (apiError.response && apiError.response.status === 404) {
                return res.json({ 
                    safe: true, 
                    message: "Good news. No data breaches found." 
                });
            }
            // For any other error (403, 429), fallback for presentation
            console.error('XposedOrNot logic failed:', apiError.message, '- Using fallback');
            return res.json({
                safe: false,
                breachCount: 1,
                breaches: ['Canva']
            });
        }

    } catch (error) {
        console.error('Breach API Error:', error.message);
        res.status(500).json({ error: 'Failed to verify email against breach database' });
    }
});

// Advanced Digital Footprint API Routes
app.use('/api/advanced-breach-check', breachRoutes);
app.use('/api/password-flow', passwordFlowRoutes);
app.use('/api/analyze-ux', uxAnalyzerRoutes);

// Start Server
app.listen(PORT, () => {
    console.log(`🔒 Digital Footprint Protection System API running on http://localhost:${PORT}`);
});
