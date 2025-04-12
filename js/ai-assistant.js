import { GoogleGenerativeAI } from 'https://esm.run/@google/generative-ai';

// Initialize the Google Generative AI client with the API key
const API_KEY = 'AIzaSyDF322wMDlK6cMiiUSz5JBLGXAXWUNHgUE';
const genAI = new GoogleGenerativeAI(API_KEY);

// Initialize the model with the correct configuration
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: "You are a helpful, respectful, and easy-to-understand assistant made to support farmers across India. Your job is to provide practical farming guidance in simple English or regional Indian languages like Hindi, Kannada, Tamil, Telugu, Marathi, Bengali, and others, based on the user's input.\n\nYou help farmers with:\n\nCrop recommendations based on region, season, and soil type\n\nOrganic and traditional farming practices\n\nFertilizers and natural pest control methods\n\nWeather-based advice and irrigation suggestions\n\nLatest government schemes, subsidies, PM Kisan updates, and loan information\n\nMandi (market) prices and selling tips\n\nGuidance for dairy, poultry, and fish farming if asked\n\nAlways be supportive and polite. Avoid complex technical language. Do not give legal, medical, or unrelated advice. If a question is outside your scope, politely inform the user. Your mission is to make farming easier, more successful, and more sustainable for every farmer in India."
});

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
};

class AIAssistant {
    constructor() {
        this.chatSession = null;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.isSpeaking = false;
        this.currentLanguage = 'en-IN';
        this.initializeVoiceRecognition();
        this.initializeChatSession();
        this.initializeVoiceControls();
    }

    async initializeChatSession() {
        try {
            this.chatSession = model.startChat({
                generationConfig,
                history: []
            });
        } catch (error) {
            console.error('Error initializing chat session:', error);
            this.displayMessage('Error initializing chat. Please refresh the page.', 'bot');
        }
    }

    initializeVoiceRecognition() {
        // Check for speech recognition support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            
            // Configure for better Indian language recognition
            this.recognition.continuous = false;
            this.recognition.interimResults = true; // Enable interim results for better accuracy
            this.recognition.maxAlternatives = 3; // Get multiple alternatives
            this.recognition.lang = 'en-IN'; // Default to English (India)

            let finalTranscript = '';

            this.recognition.onresult = (event) => {
                let interimTranscript = '';
                
                // Process both interim and final results
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript = transcript;
                        // Update input and send when we have final result
                        document.getElementById('user-input').value = finalTranscript;
                        this.handleUserInput(finalTranscript);
                        this.stopListening();
                    } else {
                        interimTranscript = transcript;
                        // Show interim results in input field but don't send
                        document.getElementById('user-input').value = interimTranscript;
                    }
                }

                // Update status with confidence level for debugging
                if (event.results[0] && event.results[0][0]) {
                    const confidence = Math.round(event.results[0][0].confidence * 100);
                    this.updateStatus(`Recognition confidence: ${confidence}%`);
                }
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                let errorMessage = 'Error: ';
                
                // Provide more helpful error messages
                switch(event.error) {
                    case 'no-speech':
                        errorMessage += 'No speech detected. Please try again.';
                        break;
                    case 'aborted':
                        errorMessage += 'Recognition was aborted.';
                        break;
                    case 'audio-capture':
                        errorMessage += 'No microphone detected.';
                        break;
                    case 'network':
                        errorMessage += 'Network error occurred.';
                        break;
                    case 'not-allowed':
                        errorMessage += 'Microphone access denied.';
                        break;
                    default:
                        errorMessage += event.error;
                }
                
                this.updateStatus(errorMessage);
                this.stopListening();
            };

            this.recognition.onend = () => {
                this.isListening = false;
                document.getElementById('voice-button').classList.remove('listening');
                
                // If no final result was obtained and we're still supposed to be listening,
                // restart recognition
                if (this.isListening && !finalTranscript) {
                    this.recognition.start();
                } else {
                    this.updateStatus('Voice recognition ended');
                }
            };

            // Add onstart handler for better user feedback
            this.recognition.onstart = () => {
                this.updateStatus('Listening... Speak in ' + this.getLanguageName());
                finalTranscript = '';
            };

        } else {
            console.warn('Speech recognition not supported in this browser');
            const voiceButton = document.getElementById('voice-button');
            if (voiceButton) {
                voiceButton.style.display = 'none';
            }
            this.updateStatus('Voice input is not supported in your browser');
        }
    }

    async handleUserInput(input) {
        if (!input.trim()) return;

        try {
            this.displayMessage(input, 'user');
            this.updateStatus('Processing...');

            if (!this.chatSession) {
                await this.initializeChatSession();
            }

            const result = await this.chatSession.sendMessage(input);
            const response = await result.response;
            const text = response.text();
            
            this.displayMessage(text, 'bot');
            this.updateStatus('');
        } catch (error) {
            console.error('Error getting AI response:', error);
            this.displayMessage('Sorry, I encountered an error. Please try again.', 'bot');
            this.updateStatus('Error occurred');
        }
    }

    startListening() {
        if (this.recognition && !this.isListening) {
            try {
                // Stop any ongoing speech before listening
                this.stopSpeaking();
                
                this.recognition.start();
                this.isListening = true;
                document.getElementById('voice-button').classList.add('listening');
                this.updateStatus('Listening... Speak in ' + this.getLanguageName());
            } catch (error) {
                console.error('Error starting speech recognition:', error);
                this.updateStatus('Error starting voice input');
            }
        }
    }

    getLanguageName() {
        const langMap = {
            'en-IN': 'English',
            'hi-IN': 'हिंदी',
            'bn-IN': 'বাংলা',
            'te-IN': 'తెలుగు',
            'ta-IN': 'தமிழ்',
            'ml-IN': 'മലയാളം',
            'kn-IN': 'ಕನ್ನಡ',
            'mr-IN': 'मराठी',
            'gu-IN': 'ગુજરાતી',
            'pa-IN': 'ਪੰਜਾਬੀ',
            'or-IN': 'ଓଡ଼ିଆ'
        };
        return langMap[this.currentLanguage] || 'English';
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
                this.isListening = false;
                document.getElementById('voice-button').classList.remove('listening');
                this.updateStatus('');
            } catch (error) {
                console.error('Error stopping speech recognition:', error);
            }
        }
    }

    setLanguage(language) {
        const langMap = {
            'en': { voice: 'en-IN', name: 'English' },
            'hi': { voice: 'hi-IN', name: 'हिंदी' },
            'bn': { voice: 'bn-IN', name: 'বাংলা' },
            'te': { voice: 'te-IN', name: 'తెలుగు' },
            'ta': { voice: 'ta-IN', name: 'தமிழ్' },
            'ml': { voice: 'ml-IN', name: 'മലയാളം' },
            'kn': { voice: 'kn-IN', name: 'ಕನ್ನಡ' },
            'mr': { voice: 'mr-IN', name: 'मराठी' },
            'gu': { voice: 'gu-IN', name: 'ગુજરાતી' },
            'pa': { voice: 'pa-IN', name: 'ਪੰਜਾਬੀ' },
            'or': { voice: 'or-IN', name: 'ଓଡ଼ିଆ' }
        };

        const langConfig = langMap[language] || langMap['en'];
        this.currentLanguage = langConfig.voice;

        if (this.recognition) {
            // Stop any ongoing recognition before changing language
            if (this.isListening) {
                this.stopListening();
            }
            
            // Reset recognition instance with new language
            this.recognition.lang = this.currentLanguage;
            
            // Adjust recognition parameters based on language
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            
            // Some languages might need different parameters for better recognition
            if (['hi-IN', 'bn-IN', 'ta-IN'].includes(this.currentLanguage)) {
                this.recognition.maxAlternatives = 5; // Increase alternatives for these languages
            } else {
                this.recognition.maxAlternatives = 3;
            }
        }

        // Update status to show selected language
        this.updateStatus(`Selected language: ${langConfig.name}`);
    }

    displayMessage(text, sender) {
        const chatContainer = document.getElementById('chat-container');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender} p-4 rounded-lg animate-fade-in`;
        messageDiv.textContent = text;
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        // Speak the bot's response
        if (sender === 'bot') {
            this.speakText(text);
        }
    }

    updateStatus(status) {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    initializeVoiceControls() {
        const stopSpeechButton = document.getElementById('stop-speech');
        if (stopSpeechButton) {
            stopSpeechButton.addEventListener('click', () => this.stopSpeaking());
        }

        // Load voices when they are available
        if (this.synthesis.onvoiceschanged !== undefined) {
            this.synthesis.onvoiceschanged = () => {
                this.voices = this.synthesis.getVoices();
            };
        }
    }

    stopSpeaking() {
        if (this.synthesis) {
            this.synthesis.cancel();
            this.isSpeaking = false;
            this.updateStatus('');
            document.getElementById('stop-speech').style.display = 'none';
        }
    }

    speakText(text) {
        // Cancel any ongoing speech
        this.stopSpeaking();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this.currentLanguage;

        // Get available voices if not already loaded
        if (!this.voices) {
            this.voices = this.synthesis.getVoices();
        }
        
        // Try to find a matching voice for the current language
        const voice = this.voices.find(v => v.lang.startsWith(this.currentLanguage.split('-')[0]));
        if (voice) {
            utterance.voice = voice;
        }

        // Adjust speech parameters for better clarity
        utterance.rate = 0.9; // Slightly slower than normal
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onstart = () => {
            this.isSpeaking = true;
            this.updateStatus('Speaking...');
            document.getElementById('stop-speech').style.display = 'inline-block';
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            this.updateStatus('');
            document.getElementById('stop-speech').style.display = 'none';
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            this.updateStatus('Error speaking response');
            document.getElementById('stop-speech').style.display = 'none';
        };

        this.synthesis.speak(utterance);
    }
}

// Initialize the AI Assistant when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const voiceButton = document.getElementById('voice-button');
    const sendButton = document.getElementById('send-button');
    const userInput = document.getElementById('user-input');
    const languageSelect = document.getElementById('languageSelect');

    window.aiAssistant = new AIAssistant();

    if (voiceButton) {
        voiceButton.addEventListener('click', () => {
            if (window.aiAssistant.isListening) {
                window.aiAssistant.stopListening();
            } else {
                window.aiAssistant.startListening();
            }
        });
    }

    if (sendButton) {
        sendButton.addEventListener('click', () => {
            const message = userInput.value.trim();
            if (message) {
                window.aiAssistant.handleUserInput(message);
                userInput.value = '';
            }
        });
    }

    if (userInput) {
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const message = userInput.value.trim();
                if (message) {
                    window.aiAssistant.handleUserInput(message);
                    userInput.value = '';
                }
            }
        });
    }

    if (languageSelect) {
        languageSelect.addEventListener('change', (e) => {
            window.aiAssistant.setLanguage(e.target.value);
        });
    }
}); 