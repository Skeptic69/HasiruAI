'use strict';

// State management
const createState = () => ({
    data: {
        currentRotation: 0,
        elements: {}
    },
    getElement: function(key) {
        return this.data.elements[key];
    },
    setElement: function(key, element) {
        if (element) {
            this.data.elements[key] = element;
        }
    },
    getRotation: function() {
        return this.data.currentRotation;
    },
    setRotation: function(degrees) {
        this.data.currentRotation = degrees;
    },
    reset: function() {
        this.data.currentRotation = 0;
        this.data.elements = {};
    }
});

const state = createState();

// Application initialization
window.addEventListener('DOMContentLoaded', () => app.init());
const app = {
    elementIds: {
        errorMessage: 'errorMessage',
        loadingOverlay: 'loadingOverlay',
        resultsSection: 'resultsSection',
        fileInput: 'fileInput',
        previewImage: 'previewImage',
        uploadArea: 'uploadArea',
        diseaseName: 'diseaseName',
        symptoms: 'symptoms',
        treatment: 'treatment',
        prevention: 'prevention',
        confidenceLevel: 'confidenceLevel'
    },
    init() {
        try {
            this.initElements();
            this.initEventListeners();
            dragAndDrop.setup();
        } catch (error) {
            console.error('Initialization error:', error);
        }
    },
    initElements() {
        Object.entries(this.elementIds).forEach(([key, id]) => {
            const element = document.getElementById(id);
            if (element) {
                state.setElement(key, element);
            }
        });
    },
    initEventListeners() {
        const fileInput = state.getElement('fileInput');
        const uploadArea = state.getElement('uploadArea');
        const rotateLeftBtn = document.getElementById('rotateLeftBtn');
        const rotateRightBtn = document.getElementById('rotateRightBtn');
        const removeBtn = document.getElementById('removeBtn');

        if (!fileInput || !uploadArea) {
            throw new Error('Required elements not found');
        }


        uploadArea.addEventListener('click', () => fileInput.click());

        if (rotateLeftBtn) {
            rotateLeftBtn.addEventListener('click', () => imageUtils.rotate('left'));
        }
        if (rotateRightBtn) {
            rotateRightBtn.addEventListener('click', () => imageUtils.rotate('right'));
        }
        if (removeBtn) {
            removeBtn.addEventListener('click', imageUtils.clear);
        }
    }
};

// UI state utilities
const ui = {
    error: {
        show: (message) => {
            const errorElement = state.getElement('errorMessage');
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.style.display = 'block';
            }
        },
        hide: () => {
            const errorElement = state.getElement('errorMessage');
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        }
    },
    loading: {
        toggle: (show) => {
            const loadingElement = state.getElement('loadingOverlay');
            if (loadingElement) {
                loadingElement.style.display = show ? 'flex' : 'none';
            }
        }
    },
    results: {
        toggle: (show) => {
            const resultsElement = state.getElement('resultsSection');
            if (resultsElement) {
                resultsElement.style.display = show ? 'block' : 'none';
            }
        },
        update: (data) => {
            if (!ui.results.validate(data)) {
                ui.error.show('Invalid response data');
                return;
            }

            const fields = ['diseaseName', 'symptoms', 'causes', 'treatment', 'prevention', 'confidenceLevel'];
            fields.forEach(field => {
                const element = state.getElement(field);
                if (element && typeof data[field] !== 'undefined') {
                    element.innerText = data[field] || '-';
                }
            });
            // Always show results section after update
            const resultsSection = state.getElement('resultsSection');
            if (resultsSection) resultsSection.style.display = '';
        },
        validate: (data) => {
            // Only require diseaseName and symptoms for minimal valid result
            return data && data.diseaseName && data.symptoms;
        }
    }
};

// File handling utilities
const fileHandler = {
    validateImage: (file) => {
        if (!file) return false;
        if (!file.type.startsWith('image/')) {
            showError('Please select an image file.');
            return false;
        }
        return true;
    },
    readImage: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result);
            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsDataURL(file);
        });
    },
    displayImage: (dataUrl) => {
        let previewImage = state.getElement('previewImage');
        let previewSection = document.getElementById('previewSection');
        // Fallback if state not yet initialized
        if (!previewImage) previewImage = document.getElementById('previewImage');
        if (!previewSection) previewSection = document.getElementById('previewSection');
        if (!previewImage || !previewSection) {
            console.error('Image preview element not found');
            return false;
        }

        state.setRotation(0);
        previewImage.src = dataUrl;
        previewImage.style.transform = '';
        previewImage.style.display = 'block';
        previewSection.style.display = 'block';
        return true;
    }
};

// Image manipulation utilities
const imageUtils = {
    clear: () => {
        const previewImage = state.getElement('previewImage');
        const fileInput = state.getElement('fileInput');
        const previewSection = document.getElementById('previewSection');

        if (previewImage) {
            previewImage.src = '';
            previewImage.style.display = 'none';
            previewImage.style.transform = '';
            state.setRotation(0);
        }

        if (previewSection) {
            previewSection.style.display = 'none';
        }

        if (fileInput) {
            fileInput.value = '';
        }

        ui.results.toggle(false);
        ui.error.hide();
    },
    rotate(direction) {
        const previewImage = state.getElement('previewImage');
        const currentRotation = state.getRotation();
        const newRotation = direction === 'left' ? 
            (currentRotation - 90) % 360 : 
            (currentRotation + 90) % 360;

        if (previewImage) {
            previewImage.style.transform = `rotate(${newRotation}deg)`;
            state.setRotation(newRotation);
        }
    }
};

// Drag and drop functionality
const dragAndDrop = {
    setup: () => {
        const uploadArea = state.getElement('uploadArea');
        if (!uploadArea) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => dragAndDrop.highlight());
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => dragAndDrop.unhighlight());
        });

        uploadArea.addEventListener('drop', (e) => dragAndDrop.handleDrop(e));
    },
    highlight: () => {
        const uploadArea = state.getElement('uploadArea');
        if (uploadArea) {
            uploadArea.style.borderColor = '#2D5A27';
            uploadArea.style.background = 'rgba(255, 255, 255, 0.6)';
        }
    },
    unhighlight: () => {
        const uploadArea = state.getElement('uploadArea');
        if (uploadArea) {
            uploadArea.style.borderColor = 'rgba(45, 90, 39, 0.3)';
            uploadArea.style.background = 'rgba(255, 255, 255, 0.5)';
        }
    },
    handleDrop: (e) => {
        dragAndDrop.unhighlight();
        const dt = e.dataTransfer;
        const files = dt?.files;
        const fileInput = state.getElement('fileInput');

        if (files?.length && fileInput) {
            fileInput.files = files;
            handleFileSelect({ target: { files } });
        }
    }
};

// Function to analyze the uploaded image
async function analyzeImage(base64Image) {
    try {
        ui.loading.toggle(true);
        ui.error.hide();
        // Send base64 image to backend
        const result = await fetch('/api/detect-disease', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: base64Image
            })
        });
        let data;
        try {
            data = await result.json();
        } catch (e) {
            throw new Error('Unexpected server response. Please check backend logs.');
        }
        if (!result.ok) {
            throw new Error(data.message || 'Failed to analyze image');
        }
        if (!data.success) {
            throw new Error(data.message || 'Failed to analyze image');
        }
        // Show detected labels in frontend for debugging/UX
        const labelsBox = document.getElementById('labelsBox');
        if (labelsBox && data.labels) {
            labelsBox.innerHTML = '<strong>Detected Labels:</strong> ' + data.labels.map(l => `${l.description} (${Math.round(l.score*100)}%)`).join(', ');
        }
        // Use Gemini AI to generate detailed info based on top detected labels
        let aiInfo = {symptoms: '', causes: '', treatment: '', prevention: ''};
        if (data.labels && data.labels.length > 0) {
            try {
                const apiKey = 'AIzaSyDF322wMDlK6cMiiUSz5JBLGXAXWUNHgUE';
                const geminiUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=' + apiKey;
                const labelNames = data.labels.slice(0, 5).map(l => l.description).join(', ');
                const prompt = `You are a plant pathology expert. For the following possible plant diseases or conditions: ${labelNames}, provide a JSON object with these keys: symptoms, causes, treatment, prevention. For each key, give a long, detailed, multi-paragraph explanation suitable for farmers and agronomists. For 'treatment', provide a clear, step-by-step actionable plan, including both organic and chemical options where applicable. Include practical advice, background information, and examples where possible. Use clear, accessible language, but do not be brief.`;
                const geminiReq = {
                    contents: [
                        { parts: [ { text: prompt } ] }
                    ]
                };
                const geminiRes = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(geminiReq)
                });
                if (geminiRes.ok) {
                    const geminiData = await geminiRes.json();
                    let resultText = '';
                    try {
                        resultText = geminiData.candidates[0].content.parts[0].text;
                        resultText = resultText.replace(/^```json|```$/g, '').trim();
                        aiInfo = JSON.parse(resultText);
                    } catch {}
                }
            } catch {}
        }
        // Update UI with results (prefer Gemini AI if available)
        ui.results.update({
            diseaseName: data.disease,
            symptoms: aiInfo.symptoms || data.symptoms,
            causes: aiInfo.causes || data.causes,
            treatment: aiInfo.treatment || data.treatment,
            prevention: aiInfo.prevention || data.prevention,
            confidenceLevel: `${data.confidence}%`
        });
        ui.results.toggle(true);
    } catch (error) {
        console.error('Error analyzing image:', error);
        ui.error.show(error.message || 'Failed to analyze image. Please try again.');
    } finally {
        ui.loading.toggle(false);
    }
}


const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const labelsBox = document.getElementById('labelsBox');

function resetUI() {
    ui.results.toggle(false);
    ui.error.hide();
    if (labelsBox) labelsBox.innerHTML = '';
}

uploadArea.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', async (event) => {
    resetUI();
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        ui.error.show('Please select an image file.');
        return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
        const dataUrl = e.target.result;
        fileHandler.displayImage(dataUrl);
        const base64Image = dataUrl.split(',')[1];
        try {
            await analyzeImage(base64Image);
        } catch (err) {
            // Error already handled in analyzeImage
        }
    };
    reader.onerror = () => {
        ui.error.show('Error reading file. Please try again.');
    };
    reader.readAsDataURL(file);
});
