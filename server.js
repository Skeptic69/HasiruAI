const express = require('express');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer');
const vision = require('@google-cloud/vision');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4000;

// Middleware to parse JSON bodies
app.use(express.json());

// Configure multer for handling file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload an image.'), false);
        }
    }
});

// Initialize Vision API client
const visionClient = new vision.ImageAnnotatorClient({
    keyFilename: path.join(__dirname, 'credentials', 'service-account-key.json')
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Disease detection endpoint
app.post('/api/detect-disease', upload.single('image'), async (req, res) => {
    try {
        console.log('Received disease detection request');
        
        if (!req.file) {
            console.error('No image file provided');
            return res.status(400).json({ 
                error: 'No image file provided',
                timestamp: new Date().toISOString()
            });
        }
        
        console.log('Processing image:', req.file.originalname);

        // Create vision image object
        const image = {
            content: req.file.buffer
        };

        // Perform Vision API analysis
        const [labelResponse] = await visionClient.labelDetection(image);
        const [objectResponse] = await visionClient.objectLocalization(image);
        const [propertyResponse] = await visionClient.imageProperties(image);

        // Simple disease detection logic (you can enhance this)
        const labels = labelResponse.labelAnnotations;
        const objects = objectResponse.localizedObjectAnnotations;
        const colors = propertyResponse.imagePropertiesAnnotation.dominantColors.colors;

        // Check if it's a plant image
        const isPlant = labels.some(label => 
            ['plant', 'leaf', 'tree', 'flower', 'fruit'].includes(label.description.toLowerCase())
        );

        if (!isPlant) {
            return res.status(400).json({
                error: 'No plant detected in the image. Please upload a clear image of a plant leaf or fruit.'
            });
        }

        // Enhanced disease detection with weighted scoring
        const diseasePatterns = {
            'Leaf Rust': {
                keywords: ['rust', 'orange', 'brown', 'spots', 'pustules'],
                colors: ['orange', 'brown', 'yellow'],
                confidence: 0
            },
            'Powdery Mildew': {
                keywords: ['white', 'powder', 'mildew', 'fuzzy', 'spots'],
                colors: ['white', 'gray'],
                confidence: 0
            },
            'Leaf Blight': {
                keywords: ['blight', 'brown', 'lesions', 'spots', 'dead'],
                colors: ['brown', 'black'],
                confidence: 0
            },
            'Mosaic Virus': {
                keywords: ['mosaic', 'mottled', 'yellow', 'pattern', 'distorted'],
                colors: ['yellow', 'green'],
                confidence: 0
            }
        };

        // Calculate confidence scores for each disease
        for (const [disease, pattern] of Object.entries(diseasePatterns)) {
            // Check keywords in labels
            const keywordMatches = labels.filter(label =>
                pattern.keywords.some(keyword => label.description.toLowerCase().includes(keyword))
            );
            
            // Check colors
            const colorMatches = colors.filter(color =>
                pattern.colors.some(targetColor =>
                    color.color.red > 100 && targetColor === 'red' ||
                    color.color.green > 100 && targetColor === 'green' ||
                    (color.color.red > 100 && color.color.green > 100) && targetColor === 'yellow' ||
                    (color.color.red < 100 && color.color.green < 100 && color.color.blue < 100) && targetColor === 'black' ||
                    (color.color.red > 100 && color.color.green > 50) && targetColor === 'brown'
                )
            );

            // Calculate weighted confidence
            pattern.confidence = (
                (keywordMatches.length * 0.6) +
                (colorMatches.length * 0.4)
            ) / (pattern.keywords.length + pattern.colors.length);
        }

        // Find the disease with highest confidence
        const detectedDisease = Object.entries(diseasePatterns)
            .reduce((max, [name, data]) => 
                data.confidence > (max ? max.confidence : 0) ? {name, confidence: data.confidence} : max
            , null);

        if (!detectedDisease || detectedDisease.confidence < 0.4) {
            return res.json({
                disease: {
                    name: 'Healthy',
                    confidence: 0.85,
                    symptoms: 'No visible symptoms of disease',
                    treatment: 'Continue regular plant care',
                    prevention: 'Maintain good plant health through proper watering, fertilization, and pest monitoring'
                }
            });
        }

        // Get disease details
        const diseaseInfo = {
            'Leaf Rust': {
                symptoms: 'Orange-brown pustules on leaves and stems, yellowing of leaves',
                treatment: 'Apply fungicide containing propiconazole or tebuconazole. Remove infected plant debris.',
                prevention: 'Plant resistant varieties, maintain proper spacing, ensure good air circulation'
            },
            'Powdery Mildew': {
                symptoms: 'White powdery coating on leaves, stunted growth',
                treatment: 'Apply sulfur-based fungicide or neem oil. Improve air circulation.',
                prevention: 'Space plants properly, avoid overhead watering, maintain good air flow'
            },
            'Leaf Blight': {
                symptoms: 'Brown or black lesions on leaves, wilting, leaf death',
                treatment: 'Remove infected leaves, apply copper-based fungicide',
                prevention: 'Rotate crops, avoid overhead watering, maintain proper spacing'
            },
            'Mosaic Virus': {
                symptoms: 'Mottled yellow-green pattern on leaves, stunted growth, leaf distortion',
                treatment: 'Remove infected plants, control insect vectors',
                prevention: 'Use virus-free seeds, control insect populations, maintain plant hygiene'
            }
        }[detectedDisease.name];

        return res.json({
            disease: {
                name: detectedDisease.name,
                confidence: detectedDisease.confidence,
                symptoms: diseaseInfo.symptoms,
                treatment: diseaseInfo.treatment,
                prevention: diseaseInfo.prevention
            }
        });

    } catch (error) {
        console.error('Error in disease detection:', error);
        res.status(500).json({ 
            error: error.message || 'An unexpected error occurred',
            timestamp: new Date().toISOString()
        });
    }
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-pro",
    generationConfig: {
        temperature: 0.9,
        topP: 1,
        topK: 1,
        maxOutputTokens: 2048,
    },
});

// Chat history for each session (in a real app, use a database)
const chatHistory = new Map();

// API endpoint for chat
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const sessionId = req.headers['x-session-id'] || 'default';

        // Get or create chat for this session
        let chat = chatHistory.get(sessionId);
        if (!chat) {
            chat = model.startChat({
                history: [],
                generationConfig: {
                    temperature: 0.9,
                    topP: 1,
                    topK: 1,
                    maxOutputTokens: 2048,
                },
            });
            chatHistory.set(sessionId, chat);
        }

        // Send message to Gemini
        const result = await chat.sendMessage(message);
        const response = result.response.text();

        res.json({ response });
    } catch (error) {
        console.error('Error in chat endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the disease detection page
app.get('/disease-detection', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'disease-detection.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 