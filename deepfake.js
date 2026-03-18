document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('media-upload');
    const browseBtn = document.getElementById('browse-btn');
    
    const analysisZone = document.getElementById('analysis-zone');
    const mediaPreview = document.getElementById('media-preview');
    const progressBar = document.getElementById('scan-progress');
    const logsList = document.getElementById('logs-list');
    
    const resultsZone = document.getElementById('results-zone');
    const verdictBanner = document.getElementById('verdict-banner');
    const verdictText = document.getElementById('verdict-text');
    const verdictConfidence = document.getElementById('verdict-confidence');
    
    const scoreFace = document.getElementById('score-face');
    const scoreLight = document.getElementById('score-light');
    const scoreFreq = document.getElementById('score-freq');
    const scoreMeta = document.getElementById('score-meta');
    
    const resetBtn = document.getElementById('reset-btn');

    // Drag and drop handlers
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    browseBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });

    resetBtn.addEventListener('click', () => {
        resultsZone.classList.add('hidden');
        analysisZone.classList.add('hidden');
        dropZone.classList.remove('hidden');
        fileInput.value = '';
        logsList.innerHTML = '';
        progressBar.style.width = '0%';
        document.getElementById('status-title').textContent = 'Analyzing Media...';
    });

    function handleFile(file) {
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
            alert('Please upload a valid image or video file.');
            return;
        }

        dropZone.classList.add('hidden');
        analysisZone.classList.remove('hidden');
        resultsZone.classList.add('hidden');
        
        // Show preview
        mediaPreview.innerHTML = '';
        const fileUrl = URL.createObjectURL(file);
        
        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = fileUrl;
            mediaPreview.appendChild(img);
        } else {
            const video = document.createElement('video');
            video.src = fileUrl;
            video.controls = true;
            mediaPreview.appendChild(video);
        }

        startAnalysis(file.name);
    }

    function addLog(message, type = 'info') {
        const li = document.createElement('li');
        li.innerHTML = `<span class="${type}">[${new Date().toLocaleTimeString()}]</span> ${message}`;
        logsList.appendChild(li);
        logsList.scrollTop = logsList.scrollHeight;
    }

    async function startAnalysis(filename) {
        progressBar.style.width = '0%';
        logsList.innerHTML = '';
        
        addLog(`Started analysis for: ${filename}`, 'info');
        
        const stages = [
            { msg: 'Extracting file metadata...', progress: 15, delay: 800 },
            { msg: 'Scanning for EXIF anomalies...', progress: 30, delay: 1200 },
            { msg: 'Running facial landmark detection...', progress: 45, delay: 1500 },
            { msg: 'Analyzing lighting and shadow consistency...', progress: 65, delay: 1800 },
            { msg: 'Performing discrete cosine transform (DCT) frequency analysis...', progress: 85, delay: 2000 },
            { msg: 'Cross-referencing generative adversarial network signatures...', progress: 95, delay: 1500 },
            { msg: 'Finalizing confidence scores...', progress: 100, delay: 1000 }
        ];

        let currentProgress = 0;

        for (const stage of stages) {
            await new Promise(resolve => setTimeout(resolve, stage.delay));
            currentProgress = stage.progress;
            progressBar.style.width = `${currentProgress}%`;
            
            // Randomly pick a log type
            const logType = Math.random() > 0.8 ? 'warn' : 'info';
            addLog(stage.msg, logType);
        }

        document.getElementById('status-title').textContent = 'Analysis Complete';
        showResults();
    }

    function showResults() {
        resultsZone.classList.remove('hidden');
        
        // Generate random realistic scores for simulation
        const isFake = Math.random() > 0.5;
        
        let faceScore, lightScore, freqScore, metaScore;
        
        if (isFake) {
            faceScore = Math.floor(Math.random() * 40) + 60; // 60-100% fake
            lightScore = Math.floor(Math.random() * 50) + 50;
            freqScore = Math.floor(Math.random() * 40) + 60;
            metaScore = Math.floor(Math.random() * 60) + 40;
            
            verdictBanner.className = 'verdict-banner fake';
            verdictText.textContent = 'High Probability of Manipulation';
        } else {
            faceScore = Math.floor(Math.random() * 20); // 0-20% fake
            lightScore = Math.floor(Math.random() * 25);
            freqScore = Math.floor(Math.random() * 15);
            metaScore = Math.floor(Math.random() * 30);
            
            verdictBanner.className = 'verdict-banner authentic';
            verdictText.textContent = 'Likely Authentic Media';
        }

        const overallConfidence = Math.floor((faceScore + lightScore + freqScore + metaScore) / 4);
        
        verdictConfidence.textContent = `Anomaly Confidence: ${overallConfidence}%`;
        
        scoreFace.textContent = `${faceScore}%`;
        scoreFace.style.color = getScoreColor(faceScore);
        
        scoreLight.textContent = `${lightScore}%`;
        scoreLight.style.color = getScoreColor(lightScore);
        
        scoreFreq.textContent = `${freqScore}%`;
        scoreFreq.style.color = getScoreColor(freqScore);
        
        scoreMeta.textContent = `${metaScore}%`;
        scoreMeta.style.color = getScoreColor(metaScore);
        
        addLog(`Analysis complete. Overall anomaly score: ${overallConfidence}%`, isFake ? 'danger' : 'success');
    }

    function getScoreColor(score) {
        if (score > 70) return '#ef4444'; // Red
        if (score > 40) return '#f59e0b'; // Yellow
        return '#10b981'; // Green
    }
});
