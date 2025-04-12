const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function testConnection() {
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash",
            systemInstruction: "You are a helpful assistant."
        });
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        const text = response.text();
        console.log("API Test Successful!");
        console.log("Response:", text);
    } catch (error) {
        console.error("API Test Failed!");
        console.error("Error:", error.message);
    }
}

testConnection(); 