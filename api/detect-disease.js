const { ImageAnnotatorClient } = require('@google-cloud/vision');
const fs = require('fs');
const path = require('path');

// Disease database
const diseaseDatabase = {
    'leaf blight': {
        synonyms: ['blight', 'leaf blight', 'brown blight'],
        symptoms: 'Leaf blight often starts as small, water-soaked lesions on the leaves that expand into large, irregular brown spots.',
        causes: 'Fungal pathogens such as Helminthosporium and Alternaria.',
        treatment: 'Remove infected leaves, apply copper-based fungicide.',
        prevention: 'Crop rotation, proper spacing, avoid overhead watering.'
    },
    'powdery mildew': {
        synonyms: ['powdery mildew', 'mildew', 'white mildew'],
        symptoms: 'White or grayish powdery spots on leaves.',
        causes: 'Fungi called Erysiphales.',
        treatment: 'Apply fungicides, improve air circulation.',
        prevention: 'Space plants properly, avoid overhead watering.'
    }
};

// Write service account credentials from env to a temp file (Vercel only allows env vars, not local files)
function getServiceAccountKeyFile() {
    const keyFilePath = '/tmp/gcp-key.json';
    if (!fs.existsSync(keyFilePath)) {
        fs.writeFileSync(keyFilePath, process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    }
    return keyFilePath;
}

// Helper function to detect diseases from labels
function detectDisease(labels) {
    const detectedDiseases = [];
    for (const label of labels) {
        for (const [disease, info] of Object.entries(diseaseDatabase)) {
            if (info.synonyms.some(synonym => 
                label.description.toLowerCase().includes(synonym.toLowerCase()))) {
                detectedDiseases.push({ disease, confidence: label.score, ...info });
            }
        }
    }
    return detectedDiseases;
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }
    
    try {
        // Accept base64 image string in req.body.image
        const { image } = req.body;
        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        // Write service account credentials to temp file
        const keyFile = getServiceAccountKeyFile();
        const client = new ImageAnnotatorClient({ keyFilename: keyFile });

        // Vision API analysis
        const [labelResponse] = await client.labelDetection({ 
            image: { content: Buffer.from(image, 'base64') } 
        });

        // Detect diseases from labels
        const diseases = detectDisease(labelResponse.labelAnnotations);

        // Response
        res.status(200).json({
            success: true,
            diseases,
            labels: labelResponse.labelAnnotations
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message || 'An unexpected error occurred'
        });
    }
};
