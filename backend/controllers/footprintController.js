const axios = require('axios');

// @desc    Analyze password strength
// @route   POST /api/footprint/analyze-password
// @access  Public
exports.analyzePassword = (req, res) => {
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
};

// @desc    Check email for data breaches using XposedOrNot
// @route   POST /api/footprint/check-breach
// @access  Public
exports.checkBreach = async (req, res) => {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email address is required' });
    }

    try {
        const url = `https://api.xposedornot.com/v1/check-email/${encodeURIComponent(email)}`;
        
        try {
            const response = await axios.get(url);
            
            if (response.data && response.data.breaches && response.data.breaches[0]) {
                const breaches = response.data.breaches[0];
                return res.json({ 
                    safe: false, 
                    breachCount: breaches.length,
                    breaches: breaches 
                });
            }
        } catch (apiError) {
            if (apiError.response && apiError.response.status === 404) {
                return res.json({ 
                    safe: true, 
                    message: "Good news. No data breaches found." 
                });
            }
            throw apiError;
        }

    } catch (error) {
        console.error('Breach API Error:', error.message);
        res.status(500).json({ error: 'Failed to verify email against breach database' });
    }
};
