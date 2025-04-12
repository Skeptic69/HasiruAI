const express = require('express');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname)));

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

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 