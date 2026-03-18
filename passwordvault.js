const authView = document.getElementById('auth-view');
const dashboardView = document.getElementById('dashboard-view');
const masterPasswordInput = document.getElementById('master-password');
const confirmMasterInput = document.getElementById('confirm-master');
const confirmGroup = document.getElementById('confirm-group');
const authBtn = document.getElementById('auth-btn');
const authTitle = document.querySelector('.vault-header h2');
const authDescription = document.getElementById('auth-description');
const authError = document.getElementById('auth-error');

const lockBtn = document.getElementById('lock-btn');
const passwordListContainer = document.getElementById('password-list');
const addNewBtn = document.getElementById('add-new-btn');
const entryModal = document.getElementById('entry-modal');
const closeModalBtn = document.getElementById('close-modal');
const saveEntryBtn = document.getElementById('save-entry-btn');

const entryTitle = document.getElementById('entry-title');
const entryUsername = document.getElementById('entry-username');
const entryPassword = document.getElementById('entry-password');
const modalError = document.getElementById('modal-error');
const searchInput = document.getElementById('search-input');


// --- Cryptography & State ---
// We simulate encryption by AES-GCM via Web Crypto API.

let isVaultSetup = localStorage.getItem('vault_salt') !== null;
let currentKey = null; // The derived key
let vaultData = []; // In-memory plaintext passwords while unlocked

/** 
 * Derives an AES-GCM key from a password.
 * If salt is not provided, one is generated. 
 */
async function deriveKey(password, existingSalt = null) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );

    let salt;
    if (existingSalt) {
        salt = Uint8Array.from(atob(existingSalt), c => c.charCodeAt(0));
    } else {
        salt = window.crypto.getRandomValues(new Uint8Array(16));
    }

    const key = await window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );

    return { key, saltBase64: existingSalt || btoa(String.fromCharCode.apply(null, salt)) };
}

/** Utility: ArrayBuffer to Base64 String */
function bufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

/** Utility: Base64 to ArrayBuffer */
function base64ToBuffer(base64) {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

/** Encrypts data and returns an object { iv, ciphertext } in base64 */
async function encryptData(dataObject, key) {
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptedContent = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        enc.encode(JSON.stringify(dataObject))
    );
    return {
        iv: bufferToBase64(iv),
        ciphertext: bufferToBase64(encryptedContent)
    };
}

/** Decrypts base64 iv/ciphertext string back to object */
async function decryptData(encryptedObj, key) {
    const iv = base64ToBuffer(encryptedObj.iv);
    const ciphertext = base64ToBuffer(encryptedObj.ciphertext);
    const decryptedContent = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        ciphertext
    );
    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decryptedContent));
}


// --- Auth Logic ---

function setupAuthUI() {
    isVaultSetup = localStorage.getItem('vault_salt') !== null;
    if (isVaultSetup) {
        authTitle.textContent = "Unlock Vault";
        authDescription.textContent = "Enter your Master Password to access your items.";
        authBtn.textContent = "Unlock Vault";
        confirmGroup.style.display = 'none';
    } else {
        authTitle.textContent = "Create Master Password";
        authDescription.textContent = "Welcome. Set a strong Master Password. If you forget it, your vault cannot be recovered.";
        authBtn.textContent = "Create Vault";
        confirmGroup.style.display = 'block';
    }
}

async function handleAuth() {
    authError.textContent = "";
    const pwd1 = masterPasswordInput.value;
    
    if (!pwd1) {
        authError.textContent = "Please enter a password.";
        return;
    }

    try {
        if (!isVaultSetup) {
            // Setup flow
            const pwd2 = confirmMasterInput.value;
            if (pwd1 !== pwd2) {
                authError.textContent = "Passwords do not match.";
                return;
            }
            if (pwd1.length < 8) {
                authError.textContent = "Master password must be at least 8 characters.";
                return;
            }

            const { key, saltBase64 } = await deriveKey(pwd1);
            
            // create initial ciphertext of an empty array to verify password later
            const initialData = await encryptData([], key);
            
            localStorage.setItem('vault_salt', saltBase64);
            localStorage.setItem('vault_data', JSON.stringify(initialData));
            
            currentKey = key;
            vaultData = [];
            showDashboard();
            
        } else {
            // Unlock flow
            const salt = localStorage.getItem('vault_salt');
            const dataStr = localStorage.getItem('vault_data');
            
            if (!salt || !dataStr) { throw new Error("Vault corrupted."); }

            const { key } = await deriveKey(pwd1, salt);
            
            // attempt decrypt
            const encryptedObj = JSON.parse(dataStr);
            try {
                vaultData = await decryptData(encryptedObj, key);
                currentKey = key;
                showDashboard();
            } catch (decErr) {
                authError.textContent = "Incorrect Master Password.";
            }
        }
    } catch (err) {
        console.error(err);
        authError.textContent = "An error occurred during authentication.";
    }
}

function showDashboard() {
    authView.style.display = 'none';
    dashboardView.style.display = 'block';
    masterPasswordInput.value = '';
    confirmMasterInput.value = '';
    renderVaultList();
}

function lockVault() {
    currentKey = null;
    vaultData = [];
    dashboardView.style.display = 'none';
    authView.style.display = 'block';
    setupAuthUI();
}

// --- Vault UI Logic ---

async function saveVaultDataToDisk() {
    try {
        const encrypted = await encryptData(vaultData, currentKey);
        localStorage.setItem('vault_data', JSON.stringify(encrypted));
    } catch(err) {
        console.error("Failed to save data: ", err);
        alert("Failed to securely save your vault.");
    }
}

function renderVaultList(filter = '') {
    passwordListContainer.innerHTML = '';
    
    if (vaultData.length === 0) {
        passwordListContainer.innerHTML = `<div class="empty-state">Your vault is empty. Add a password!</div>`;
        return;
    }

    const lowerFilter = filter.toLowerCase();

    vaultData.forEach((item, index) => {
        if (filter && !item.title.toLowerCase().includes(lowerFilter)) return;

        const li = document.createElement('li');
        li.classList.add('password-item');
        
        li.innerHTML = `
            <div class="password-info">
                <h4>${escapeHTML(item.title)}</h4>
                <p>${escapeHTML(item.username)}</p>
            </div>
            <div class="password-actions">
                <button class="icon-btn copy-btn" data-pwd="${escapeHTML(item.password)}" title="Copy Password">📋</button>
                <button class="icon-btn delete-btn" data-idx="${index}" title="Delete">🗑️</button>
            </div>
        `;
        passwordListContainer.appendChild(li);
    });

    // Event listeners for copy
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const pwd = e.currentTarget.getAttribute('data-pwd');
            navigator.clipboard.writeText(pwd);
            const originalHTML = e.currentTarget.innerHTML;
            e.currentTarget.innerHTML = "✅";
            setTimeout(() => e.currentTarget.innerHTML = originalHTML, 1500);
        });
    });

    // Event listeners for delete
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if(confirm("Are you sure you want to delete this specific password?")) {
                const idx = parseInt(e.currentTarget.getAttribute('data-idx'));
                vaultData.splice(idx, 1);
                await saveVaultDataToDisk();
                renderVaultList(searchInput.value);
            }
        });
    });
}

function openModal() {
    entryModal.style.display = 'flex';
    entryTitle.value = '';
    entryUsername.value = '';
    entryPassword.value = '';
    modalError.textContent = '';
}

function closeModal() {
    entryModal.style.display = 'none';
}

async function saveNewEntry() {
    const title = entryTitle.value.trim();
    const username = entryUsername.value.trim();
    const pwd = entryPassword.value;

    if (!title || !pwd) {
        modalError.textContent = "Title and Password are required.";
        return;
    }

    vaultData.push({ title, username, password: pwd });
    await saveVaultDataToDisk();
    renderVaultList(searchInput.value);
    closeModal();
}


// --- Event Wiring ---

authBtn.addEventListener('click', handleAuth);
masterPasswordInput.addEventListener('keypress', (e) => {
     if (e.key === 'Enter') handleAuth();
});
confirmMasterInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAuth();
});

lockBtn.addEventListener('click', lockVault);
addNewBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);
saveEntryBtn.addEventListener('click', saveNewEntry);

searchInput.addEventListener('input', (e) => {
    renderVaultList(e.target.value);
});


document.getElementById('toggle-vis-btn').addEventListener('click', () => {
    if (entryPassword.type === "password") {
        entryPassword.type = "text";
    } else {
        entryPassword.type = "password";
    }
});

// Utilities to prevent basic XSS when rendering passwords
function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// init
setupAuthUI();
