document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('password-input');
    const toggleBtn = document.getElementById('toggle-visibility');
    
    const strengthFill = document.getElementById('strength-fill');
    const strengthText = document.getElementById('strength-text');
    const entropyValue = document.getElementById('entropy-value');
    const crackTime = document.getElementById('crack-time');
    const lengthValue = document.getElementById('length-value');
    const feedbackList = document.getElementById('feedback-list');

    // Toggle Password Visibility
    toggleBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Update eye icon (simplified toggle)
        if (type === 'text') {
            toggleBtn.style.color = '#175DDC'; // Primary color when visible
        } else {
            toggleBtn.style.color = 'var(--text-secondary)';
        }
    });

    // Analyze Password on Input
    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        const analysis = analyzePassword(password);
        updateUI(analysis);
    });

    function analyzePassword(pwd) {
        if (!pwd) {
            return {
                score: 0,
                entropy: 0,
                crackTimeStr: 'Instant',
                length: 0,
                feedback: ['Start typing to see suggestions.'],
                color: 'var(--text-secondary)'
            };
        }

        const length = pwd.length;
        let poolSize = 0;
        let feedback = [];

        // Check character sets
        const hasLower = /[a-z]/.test(pwd);
        const hasUpper = /[A-Z]/.test(pwd);
        const hasNumbers = /[0-9]/.test(pwd);
        const hasSymbols = /[^a-zA-Z0-9]/.test(pwd);

        if (hasLower) poolSize += 26;
        if (hasUpper) poolSize += 26;
        if (hasNumbers) poolSize += 10;
        if (hasSymbols) poolSize += 32;

        // Entropy Calculation: E = L * log2(R)
        const entropy = poolSize > 0 ? (length * Math.log2(poolSize)) : 0;
        
        // Provide feedback
        if (length < 12) feedback.push("Use at least 12 characters for a stronger password.");
        if (!hasUpper) feedback.push("Add uppercase letters.");
        if (!hasNumbers) feedback.push("Add numbers.");
        if (!hasSymbols) feedback.push("Add special characters (e.g., !@#$%^&*).");
        if (feedback.length === 0) feedback.push("Great password! It contains a strong mix of characters.");

        // Estimate Crack Time (rough estimate based on high-end consumer hardware ~100B guesses/sec)
        // This is purely illustrative for the UI.
        const guessesPerSecond = 100000000000; // 100 Billion
        const permutations = Math.pow(poolSize, length);
        const secondsToCrack = permutations / guessesPerSecond;

        let crackTimeStr = '';
        if (entropy === 0) crackTimeStr = 'Instant';
        else if (secondsToCrack < 1) crackTimeStr = 'Instant';
        else if (secondsToCrack < 60) crackTimeStr = `${Math.round(secondsToCrack)} seconds`;
        else if (secondsToCrack < 3600) crackTimeStr = `${Math.round(secondsToCrack / 60)} minutes`;
        else if (secondsToCrack < 86400) crackTimeStr = `${Math.round(secondsToCrack / 3600)} hours`;
        else if (secondsToCrack < 31536000) crackTimeStr = `${Math.round(secondsToCrack / 86400)} days`;
        else if (secondsToCrack < 3153600000) crackTimeStr = `${Math.round(secondsToCrack / 31536000)} years`;
        else crackTimeStr = 'Centuries';

        // Scoring 0 to 4
        let score = 0;
        let color = 'var(--strength-1)';
        
        if (entropy > 80) {
            score = 4; // Strong
            color = 'var(--strength-4)';
        } else if (entropy > 60) {
            score = 3; // Good
            color = 'var(--strength-3)';
        } else if (entropy > 40) {
            score = 2; // Fair
            color = 'var(--strength-2)';
        } else if (entropy > 0) {
            score = 1; // Weak
            color = 'var(--strength-1)';
        }

        return {
            score: score,
            entropy: entropy,
            crackTimeStr: crackTimeStr,
            length: length,
            feedback: feedback,
            color: color
        };
    }

    function updateUI(analysis) {
        // Update lengths
        lengthValue.innerText = `${analysis.length} chars`;
        entropyValue.innerText = `${Math.round(analysis.entropy)} bits`;
        crackTime.innerText = analysis.crackTimeStr;

        // Update bar
        const widthPercentage = analysis.score === 0 ? 0 : (analysis.score / 4) * 100;
        strengthFill.style.width = `${widthPercentage}%`;
        strengthFill.style.backgroundColor = analysis.color;

        // Label
        const labels = ['Strength: Too Weak', 'Strength: Weak', 'Strength: Fair', 'Strength: Good', 'Strength: Very Strong'];
        strengthText.innerText = labels[analysis.score];
        strengthText.style.color = analysis.score > 0 ? analysis.color : 'var(--text-secondary)';

        // Feedback
        feedbackList.innerHTML = '';
        analysis.feedback.forEach(msg => {
            const li = document.createElement('li');
            li.innerText = msg;
            feedbackList.appendChild(li);
        });
    }
});
