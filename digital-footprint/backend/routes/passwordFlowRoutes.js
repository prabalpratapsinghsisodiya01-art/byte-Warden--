const express = require('express');
const crypto = require('crypto');

const router = express.Router();

/**
 * @route GET /api/password-flow/generate
 * @desc Generate a secure, high-entropy password
 * @access Public (Consider securing in production if needed)
 */
router.get('/generate', (req, res) => {
    try {
        const length = parseInt(req.query.length) || 16;
        
        // Define character sets
        const charset = {
            uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            lowercase: 'abcdefghijklmnopqrstuvwxyz',
            numbers: '0123456789',
            symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
        };

        // Ensure at least one character from each set
        let password = '';
        password += charset.uppercase[Math.floor(Math.random() * charset.uppercase.length)];
        password += charset.lowercase[Math.floor(Math.random() * charset.lowercase.length)];
        password += charset.numbers[Math.floor(Math.random() * charset.numbers.length)];
        password += charset.symbols[Math.floor(Math.random() * charset.symbols.length)];

        // Fill the rest randomly
        const allChars = Object.values(charset).join('');
        for (let i = password.length; i < length; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }

        // Shuffle the password to make it unpredictable
        password = password.split('').sort(() => 0.5 - Math.random()).join('');

        res.json({ password, length, entropy: getEntropy(password) });
    } catch (error) {
        console.error('Password generation error:', error);
        res.status(500).json({ error: 'Failed to generate password' });
    }
});

/**
 * @route POST /api/password-flow/save
 * @desc Mock endpoint to save credential to encrypted vault
 * @access Public (In a real app, this must be behind auth middleware)
 */
router.post('/save', (req, res) => {
    try {
        const { platform, email, password } = req.body;

        if (!platform || !email || !password) {
            return res.status(400).json({ error: 'Missing required configuration fields.' });
        }

        // --- Simulated Database Save ---
        // In a real application, the password would be encrypted client-side 
        // with the master password, or stored securely on the backend in an 
        // encrypted state using PBKDF2/AES-256 zero-knowledge architecture.
        
        console.log(`[VAULT] Saved updated credential for ${platform} (${email}). Password is ${password.length} characters.`);
        
        setTimeout(() => {
            res.status(200).json({ 
                success: true, 
                message: 'Credential securely saved to vault.',
                savedAt: new Date().toISOString()
            });
        }, 500); // simulate network/crypto latency
        
    } catch (error) {
         console.error('Vault save error:', error);
         res.status(500).json({ error: 'Failed to save credential to vault.' });
    }
});

// Helper for entropy calculation
function getEntropy(password) {
    let charsetSize = 0;
    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/[0-9]/.test(password)) charsetSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;

    const entropy = password.length * Math.log2(charsetSize);
    
    if (entropy < 40) return 'Weak';
    if (entropy < 60) return 'Good';
    if (entropy < 80) return 'Strong';
    return 'Very Strong';
}

module.exports = router;
