document.addEventListener('DOMContentLoaded', () => {
    // --- Dictionaries ---
    const adjectives = [
        "angry", "blue", "clumsy", "dizzy", "eager", "fuzzy", "giant", "happy", "icy", 
        "jolly", "kind", "loud", "magic", "nervous", "orange", "purple", "quiet", "red", 
        "silly", "tiny", "upset", "velvet", "wild", "yellow", "zesty", "glowing", "floating",
        "liquid", "spooky", "invisible", "crystal", "bouncing", "whispering", "golden"
    ];

    const nouns = [
        "apple", "bear", "cat", "dog", "elephant", "frog", "ghost", "hat", "igloo",
        "jet", "kite", "lion", "monkey", "ninja", "owl", "penguin", "queen", "robot",
        "snake", "tiger", "unicorn", "vampire", "wizard", "xylophone", "yeti", "zombie",
        "dragon", "castle", "sword", "mountain", "river", "telescope", "spaceship"
    ];

    const verbs = [
        "ate", "bit", "chased", "danced", "ate", "flew", "grabbed", "hugged", "jumped",
        "kicked", "laughed", "melted", "nodded", "opened", "pushed", "quit", "ran", "sang",
        "threw", "unlocked", "vanished", "walked", "yelled", "zoomed", "exploded", "tickled",
        "summoned", "teleported", "swallowed", "painted", "shattered", "lifted"
    ];

    const adverbs = [
        "angrily", "bravely", "calmly", "deeply", "eagerly", "fiercely", "gently",
        "happily", "instantly", "joyfully", "kindly", "loudly", "madly", "neatly",
        "oddly", "politely", "quickly", "rudely", "sadly", "tightly", "upwards",
        "viciously", "wildly", "yearly", "zealously", "silently", "blindly", "slowly"
    ];

    // --- Story Templates ---
    // The number of words requested determines which template we use to ensure grammatical logic.
    const templates = {
        // [adj]-[noun]-[verb]
        3: [
            "Picture a {0} {1} that suddenly {2} in front of you.",
            "Imagine opening a door and finding a {0} {1} that just {2}.",
            "In a dark room, a {0} {1} {2} right over your head."
        ],
        // [adj]-[noun]-[verb]-[adverb]
        4: [
            "Visualize a {0} {1} that {2} very {3}.",
            "Out of nowhere, a {0} {1} {2} quite {3}.",
            "You are holding a {0} {1}. Suddenly it {2} {3}!"
        ],
        // [adv]-[adj]-[noun]-[verb]-[noun2]
        5: [
            "Acting {0}, a {1} {2} {3} another {noun}.",
            "Watch {0} as the {1} {2} brutally {3} a massive {noun}.",
            "Moving {0}, a {1} {2} {3} a shiny {noun}."
        ]
    };

    // DOM Elements
    const wordCountInput = document.getElementById('word-count');
    const separatorSelect = document.getElementById('separator');
    const capitalizeCheck = document.getElementById('capitalize');
    const numbersCheck = document.getElementById('add-numbers');
    const generateBtn = document.getElementById('generate-btn');
    const copyBtn = document.getElementById('copy-btn');
    
    const outputEl = document.getElementById('passphrase-output');
    const storyEl = document.getElementById('memory-story');
    const entropyDisplay = document.getElementById('entropy-display');
    const displayBox = document.getElementById('display-box');

    // Utility: Pick random item from array
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    
    // Utility: Capitalize word
    const cap = (word) => word.charAt(0).toUpperCase() + word.slice(1);

    function generate() {
        const count = parseInt(wordCountInput.value);
        const sep = separatorSelect.value;
        const doCap = capitalizeCheck.checked;
        const doNum = numbersCheck.checked;

        let words = [];
        let template = "";
        
        // Decide word logic based on count to make stories work
        // For simple stories, we map specific word lists to specific indexes
        
        // Base logic for 3, 4, 5 words:
        if (count === 3) {
            words = [pick(adjectives), pick(nouns), pick(verbs)];
            template = pick(templates[3]);
        } else if (count === 4) {
            words = [pick(adjectives), pick(nouns), pick(verbs), pick(adverbs)];
            template = pick(templates[4]);
        } else if (count === 5) {
            words = [pick(adverbs), pick(adjectives), pick(nouns), pick(verbs), pick(nouns)];
            template = pick(templates[5]);
            // Re-pick if nouns match
            while(words[2] === words[4]) words[4] = pick(nouns);
        } else {
            // For > 5 or weird numbers, fallback to adj-noun pairs
            words = [];
            for(let i=0; i<count; i++) {
                words.push(i % 2 === 0 ? pick(adjectives) : pick(nouns));
            }
            template = "Try to picture these things falling from the sky: " + words.map((_, i) => `{${i}}`).join(", ") + ".";
        }

        // Keep a copy of the raw words for the story BEFORE we muddle them with numbers/caps
        const rawWords = [...words];

        // Format for Passphrase
        if (doCap) {
            words = words.map(w => cap(w));
        }

        if (doNum) {
            // Add a random 2 digit number to the end of a random word
            const idx = Math.floor(Math.random() * words.length);
            const num = Math.floor(Math.random() * 90) + 10;
            words[idx] += num;
        }

        const passphrase = words.join(sep);
        
        // Build Story
        let storyHTML = template;
        
        // Replace {0}, {1} etc with formatted words
        rawWords.forEach((rw, idx) => {
            // If the final passphrase word got a number added, show that in the story so they remember it!
            let displayWord = rw;
            if (words[idx].match(/\d+/)) {
                const match = words[idx].match(/\d+/)[0];
                displayWord = `${rw} <span style="font-size: 0.8em; color: var(--warning-color);">(number ${match})</span>`;
            }

            storyHTML = storyHTML.replace(`{${idx}}`, `<span class="highlight-word">${displayWord}</span>`);
        });

        // Special replacement for extra noun in 5-word template
        if (count === 5) {
            let displayNoun = rawWords[4];
            if (words[4] && words[4].match(/\d+/)) {
                displayNoun = `${rawWords[4]} <span style="font-size: 0.8em; color: var(--warning-color);">(number ${words[4].match(/\d+/)[0]})</span>`;
            }
            storyHTML = storyHTML.replace(`{noun}`, `<span class="highlight-word">${displayNoun}</span>`);
        }

        // Animate
        displayBox.parentElement.classList.remove('generating');
        void displayBox.offsetWidth; // trigger reflow
        displayBox.parentElement.classList.add('generating');

        // Update UI
        outputEl.textContent = passphrase;
        storyEl.innerHTML = storyHTML;

        // Calculate basic mathematically entropy
        calculateEntropy(count, doCap, doNum);
    }

    function calculateEntropy(words, capitalized, numbers) {
        // Average dictionary size we're using is ~30, but standard diceware is 7776.
        // Let's assume an attacker doesn't know our specific small dictionaries, 
        // but knows they are regular English words. Avg english words known ~10,000.
        // H = L * log2(N)
        let n = 10000;
        let bits = words * Math.log2(n);

        if (capitalized) bits += words * Math.log2(2); // case variants
        if (numbers) bits += Math.log2(90); // 10-99 = ~90 possibilities + placement
        
        bits = Math.round(bits);

        let strength = "";
        let color = "";

        if (bits < 45) {
            strength = "Weak";
            color = "var(--danger-color)";
        } else if (bits < 60) {
            strength = "Good";
            color = "var(--warning-color)";
        } else {
            strength = "Very Strong";
            color = "var(--success-color)";
        }

        entropyDisplay.textContent = `~${bits} bits (${strength})`;
        entropyDisplay.style.color = color;
    }

    // copy to clip
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(outputEl.textContent);
        
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = `✓ Copied!`;
        copyBtn.style.color = 'var(--success-color)';
        
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.style.color = '';
        }, 2000);
    });

    // Event Listeners
    generateBtn.addEventListener('click', generate);
    wordCountInput.addEventListener('change', generate);
    separatorSelect.addEventListener('change', generate);
    capitalizeCheck.addEventListener('change', generate);
    numbersCheck.addEventListener('change', generate);

    // Give an initial passphrase on load
    generate();
});
