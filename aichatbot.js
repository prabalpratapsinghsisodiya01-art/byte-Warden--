const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

const BOT_NAME = "Byte Warden";
const GREETING = "Hello! I am the Byte Warden Assistant, your personal password security expert. How can I help you today? You can ask me about password security best practices, or ask me to generate a strong password for you.";

const INTENTS = [
    {
        keywords: ["manager", "store", "save", "remember", "forget"],
        response: { text: "I highly recommend using a Password Manager like Bitwarden, 1Password, or Dashlane securely store your passwords. They encrypt your data, meaning you only have to remember one master password!" }
    },
    {
        keywords: ["change", "how often", "expire", "update"],
        response: { text: "NIST guidelines actually recommend *against* forcing regular password changes unless you suspect a breach. It is better to have one very strong password than to frequently change to weaker ones just to meet an expiration deadline." }
    },
    {
        keywords: ["two factor", "2fa", "mfa", "authenticator", "sms"],
        response: { text: "Two-Factor Authentication (2FA) is essential. It adds a second layer of security (like an app code or security key) so even if someone guesses your password, they can't log in without the second factor." }
    },
    {
        keywords: ["biometrics", "fingerprint", "face id", "faceid"],
        response: { text: "Biometrics like fingerprint or Face ID are convenient and secure for unlocking local devices, but your underlying password or PIN must still be strong in case biometrics fail." }
    },
    {
        keywords: ["thanks", "thank you", "appreciate", "helpful", "good bot"],
        response: { text: "You're very welcome! Let me know if you need anything else to keep your accounts secure." }
    },
    {
        keywords: ["how are you", "doing", "what's up", "whats up"],
        response: { text: "I'm functioning perfectly, thank you! Always ready to talk about digital security and generate some strong passwords for you." }
    },
    {
        keywords: ["who are you", "what are you", "your name", "about you"],
        response: { text: "I am Byte Warden Assistant, an AI built specifically to help you with password security, generation, and analysis. Think of me as your personal cybersecurity advisor." }
    },
    {
        keywords: ["entropy", "math", "crack", "calculate"],
        response: { text: "Password entropy is a measurement of how unpredictable a password is. A longer password with a larger variety of characters (uppercase, symbols, etc.) has higher entropy. This means it takes exponentially longer for a computer to brute-force or 'crack' it." }
    },
    {
        keywords: ["dictionary", "common", "123456", "password123"],
        response: { text: "Using dictionary words or common patterns (like '123456', 'qwerty', or 'password') is extremely dangerous. Hackers use massive lists of these common terms to instantly break into accounts." }
    },
    {
        keywords: ["tips", "best practices", "how to", "secure password", "good password"],
        response: { text: "Here are some top best practices:\n1. Use at least 12-16 characters.\n2. Mix uppercase, lowercase, numbers, and special symbols.\n3. Avoid dictionary words, names, or predictable patterns.\n4. Use a unique password for every single account.\n5. Enable 2FA (Two-Factor Authentication) everywhere." }
    },
    {
        keywords: ["why", "important", "reason", "care"],
        response: { text: "Password security is crucial because passwords are the primary line of defense against unauthorized access. A weak password could lead to identity theft, financial loss, or compromised personal data." }
    },
    {
        keywords: ["hello", "hi", "hey", "greetings", "good morning", "good evening"],
        response: { text: "Hello there! Need help with your passwords? Ask me for tips, to generate one, or analyze an existing password." }
    }
];

function addMessage(text, sender, copyValue = null) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);
    msgDiv.textContent = text;
    
    if (copyValue && sender === 'bot') {
        const pwdBox = document.createElement('div');
        pwdBox.classList.add('password-box');
        
        const pwdText = document.createElement('span');
        pwdText.classList.add('password-text');
        pwdText.textContent = copyValue;
        
        const copyBtn = document.createElement('button');
        copyBtn.classList.add('copy-btn');
        copyBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
        copyBtn.title = 'Copy to clipboard';
        
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(copyValue);
            copyBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="#4da6ff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            setTimeout(() => {
                copyBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
            }, 2000);
        });
        
        pwdBox.appendChild(pwdText);
        pwdBox.appendChild(copyBtn);
        msgDiv.appendChild(pwdBox);
    }

    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.classList.add('typing-indicator');
    indicator.id = 'typing-indicator';
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.classList.add('typing-dot');
        indicator.appendChild(dot);
    }
    chatMessages.appendChild(indicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

function generateStrongPassword(length = 16) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let password = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
        password += charset.charAt(Math.floor(Math.random() * n));
    }
    return password;
}

function generatePassphrase() {
    const words = ["apple", "river", "mountain", "eagle", "shadow", "whisper", "horizon", "crystal", "forest", "galaxy", "journey", "ocean", "thunder", "velvet", "window", "yellow", "zeppelin", "brave", "candy", "delta", "echo", "frost", "ghost", "hunter"];
    let phrase = [];
    for(let i=0; i<4; i++) {
        phrase.push(words[Math.floor(Math.random() * words.length)]);
    }
    return phrase.join("-") + "-" + Math.floor(Math.random() * 100);
}

function analyzePassword(pwd) {
    let score = 0;
    let feedback = [];
    if (pwd.length < 8) feedback.push("It is too short (aim for 12+).");
    else if (pwd.length >= 12) score += 2;
    else score += 1;

    if (/[A-Z]/.test(pwd)) score += 1;
    else feedback.push("Add uppercase letters.");

    if (/[a-z]/.test(pwd)) score += 1;
    else feedback.push("Add lowercase letters.");

    if (/[0-9]/.test(pwd)) score += 1;
    else feedback.push("Add numbers.");

    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    else feedback.push("Add special characters.");

    let strength = "Weak";
    if (score >= 5) strength = "Very Strong";
    else if (score >= 4) strength = "Strong";
    else if (score >= 3) strength = "Moderate";

    let response = `Password Strength: ${strength} (${score}/6)\n`;
    if (feedback.length > 0) {
        response += "Suggestions to improve:\n- " + feedback.join("\n- ");
    } else {
        response += "Great job! This is a very secure password.";
    }
    return response;
}

function getBotResponse(userText) {
    const lowerText = userText.toLowerCase();

    // 1. Check for specific rigid commands first
    if (lowerText.startsWith("analyze password:")) {
        const pwdToAnalyze = userText.substring("analyze password:".length).trim();
        if (!pwdToAnalyze) return { text: "Please provide a password to analyze. Example: 'analyze password: MySecret123!'" };
        return { text: analyzePassword(pwdToAnalyze) };
    }

    if (["passphrase", "memorable", "words"].some(keyword => lowerText.includes(keyword)) && lowerText.includes("generate")) {
        const newPassphrase = generatePassphrase();
        return { 
            text: "Here is a memorable passphrase. It's often easier to remember than a random string but still highly secure:", 
            copyValue: newPassphrase 
        };
    }

    if (["generate", "create", "make a password", "new password", "suggest", "give me a password", "random password"].some(keyword => lowerText.includes(keyword))) {
        const newPassword = generateStrongPassword(16);
        return { 
            text: "Here is a strong, randomly generated 16-character password for you. Make sure to store it safely in a password manager!",
            copyValue: newPassword
        };
    }

    // 2. Scan conversational intents
    for (let intent of INTENTS) {
        if (intent.keywords.some(keyword => lowerText.includes(keyword))) {
            return intent.response;
        }
    }

    // 3. Ultimate Fallback
    return { text: "I'm not exactly sure how to answer that specific question. However, I am specialized in password security! Try clicking one of the quick actions above, ask me for a password, or ask me for 'password tips'." };
}

function handleSendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    chatInput.value = '';

    showTypingIndicator();
    
    setTimeout(() => {
        removeTypingIndicator();
        const responseData = getBotResponse(text);
        addMessage(responseData.text, 'bot', responseData.copyValue);
    }, 800 + Math.random() * 800); 
}

sendBtn.addEventListener('click', handleSendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSendMessage();
    }
});

const chips = document.querySelectorAll('.chip');
chips.forEach(chip => {
    chip.addEventListener('click', () => {
        chatInput.value = chip.getAttribute('data-query');
        if (!chatInput.value.includes(':')) {
            handleSendMessage();
        } else {
            chatInput.focus();
        }
    });
});

window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        showTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            addMessage(GREETING, 'bot');
        }, 1200);
    }, 500);
});
