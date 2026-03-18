document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('audit-form');
    const input = document.getElementById('url-input');
    const btn = document.getElementById('audit-btn');
    const loader = document.getElementById('audit-loader');
    const resultsDashboard = document.getElementById('results-dashboard');

    // UI Elements
    const gradeDisplay = document.getElementById('grade-display');
    const targetUrlDisplay = document.getElementById('target-url-display');
    const fieldsCount = document.getElementById('fields-count');
    const violationsCount = document.getElementById('violations-count');
    
    const passedList = document.getElementById('passed-list');
    const failedList = document.getElementById('failed-list');
    const fixesList = document.getElementById('fixes-list');

    const passedSection = document.getElementById('passed-section');
    const failedSection = document.getElementById('failed-section');
    const fixesSection = document.getElementById('fixes-section');

    const API_BASE = 'http://localhost:3000/api';

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = input.value.trim();
        if (!url) return;

        // Loading State
        btn.querySelector('span').style.display = 'none';
        loader.style.display = 'block';
        btn.disabled = true;
        resultsDashboard.style.display = 'none';

        try {
            const response = await fetch(`${API_BASE}/analyze-ux?url=${encodeURIComponent(url)}`);
            const data = await response.json();

            if (response.ok) {
                renderResults(data);
            } else {
                throw new Error(data.error || 'Failed to analyze URL');
            }

        } catch (error) {
            console.error('Audit Error:', error);
            alert(`Error: ${error.message}`);
        } finally {
            btn.querySelector('span').style.display = 'inline';
            loader.style.display = 'none';
            btn.disabled = false;
        }
    });

    function renderResults(data) {
        targetUrlDisplay.textContent = `Auditing: ${data.url}`;
        fieldsCount.textContent = data.foundFieldsCount;
        violationsCount.textContent = data.failedChecks.length;

        // Render Grade
        gradeDisplay.className = `grade-circle ${data.grade}`;
        gradeDisplay.innerHTML = `${data.grade}<span>Score: ${data.score}</span>`;

        // Render Lists
        renderList(passedList, data.passedChecks);
        renderList(failedList, data.failedChecks);
        renderList(fixesList, data.fixes);

        // Hide sections if empty
        passedSection.style.display = data.passedChecks.length ? 'block' : 'none';
        failedSection.style.display = data.failedChecks.length ? 'block' : 'none';
        fixesSection.style.display = data.fixes.length ? 'block' : 'none';

        resultsDashboard.style.display = 'block';

        // Scroll to results smoothly
        resultsDashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function renderList(ulElement, items) {
        ulElement.innerHTML = '';
        if (!items || items.length === 0) return;

        items.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = item; // Using innerHTML if we sent bolding/code blocks from backend
            ulElement.appendChild(li);
        });
    }
});
