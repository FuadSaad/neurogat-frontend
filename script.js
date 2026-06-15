document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('mri-image');
    const previewImage = document.getElementById('preview-image');
    const form = document.getElementById('prediction-form');
    
    const resultsPanel = document.getElementById('results-panel');
    const loader = document.getElementById('loader');
    const resultContent = document.getElementById('result-content');

    // Drag and Drop Logic
    dropZone.addEventListener('click', () => fileInput.click());

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
        
        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            handleFilePreview(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFilePreview(e.target.files[0]);
        }
    });

    function handleFilePreview(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file (PNG/JPG)');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            previewImage.style.display = 'block';
            dropZone.querySelector('i').style.opacity = '0';
            dropZone.querySelector('h3').style.opacity = '0';
            dropZone.querySelector('p').style.opacity = '0';
        };
        reader.readAsDataURL(file);
    }

    // Configuration for Deployment
    const BACKEND_URL = 'https://neurogat-api.onrender.com';

    // Form Submission Logic
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (fileInput.files.length === 0) {
            alert('Please upload an MRI image first.');
            return;
        }

        // Show Loading State
        resultsPanel.style.display = 'block';
        loader.style.display = 'flex';
        resultContent.style.display = 'none';

        // Prepare Data
        const formData = new FormData();
        formData.append('image', fileInput.files[0]);
        formData.append('age', document.getElementById('age').value);
        formData.append('sex', document.getElementById('sex').value);
        formData.append('mmse', document.getElementById('mmse').value);

        try {
            // Call Python Backend API
            const response = await fetch(`${BACKEND_URL}/predict`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                loader.style.display = 'none';
                resultContent.style.display = 'block';
                updateDashboard(data);
            } else {
                alert('Error: ' + data.error);
                resultsPanel.style.display = 'none';
            }
        } catch (error) {
            console.error('Error connecting to backend:', error);
            alert('Could not connect to the Python Backend. Please wait for the Render backend to go live.');
            resultsPanel.style.display = 'none';
        }
    });

    function updateDashboard(data) {
        // Set Primary Diagnosis
        const diagnosisBadge = document.getElementById('diagnosis-text');
        diagnosisBadge.textContent = data.prediction;
        document.getElementById('primary-confidence').textContent = data.confidence + '%';

        // Color coding based on prediction
        const colors = {
            'AD': 'rgba(239, 68, 68, 0.2)', // Red
            'CN': 'rgba(74, 222, 128, 0.2)', // Green
            'EMCI': 'rgba(245, 158, 11, 0.2)', // Yellow
            'LMCI': 'rgba(14, 165, 233, 0.2)'  // Blue
        };
        
        const textColors = {
            'AD': '#ef4444',
            'CN': '#4ade80',
            'EMCI': '#f59e0b',
            'LMCI': '#0ea5e9'
        };

        diagnosisBadge.style.backgroundColor = colors[data.prediction];
        diagnosisBadge.style.color = textColors[data.prediction];
        diagnosisBadge.style.borderColor = textColors[data.prediction];
        diagnosisBadge.style.boxShadow = `0 0 20px ${colors[data.prediction]}`;

        // Animate Progress Bars
        setTimeout(() => {
            document.getElementById('ad-bar').style.width = data.all_scores['AD'] + '%';
            document.getElementById('cn-bar').style.width = data.all_scores['CN'] + '%';
            document.getElementById('emci-bar').style.width = data.all_scores['EMCI'] + '%';
            document.getElementById('lmci-bar').style.width = data.all_scores['LMCI'] + '%';

            document.getElementById('ad-score-text').textContent = data.all_scores['AD'] + '%';
            document.getElementById('cn-score-text').textContent = data.all_scores['CN'] + '%';
            document.getElementById('emci-score-text').textContent = data.all_scores['EMCI'] + '%';
            document.getElementById('lmci-score-text').textContent = data.all_scores['LMCI'] + '%';
        }, 100); // Small delay to trigger CSS transition
    }
});
