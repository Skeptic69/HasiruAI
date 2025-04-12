# AI-Powered Farming Platform 🌾

A comprehensive web platform designed to empower smallholder farmers with AI-driven insights and tools.

## Features

- 🌿 AI-powered plant disease detection using image analysis
- 🌤️ Weather-based crop recommendations
- 💰 Market price predictions
- 💬 Multilingual AI chatbot for farming advice
- 📱 SMS/WhatsApp alerts for weather & crop insights

## Tech Stack

### Frontend
- Next.js 14 (React)
- TailwindCSS
- TypeScript
- PWA support

### Backend
- Node.js with Express
- MongoDB
- Firebase (Storage & Authentication)

### AI & External Services
- Google Vision API
- OpenWeather API
- AgriMarket API
- Google Gemini AI
- Twilio API (SMS/WhatsApp)

## Project Structure

```
├── frontend/           # Next.js frontend application
├── backend/           # Express.js backend API
├── shared/           # Shared types and utilities
└── docs/             # Documentation
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- Firebase account
- API keys for external services

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-farming-platform.git
cd ai-farming-platform
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd ../backend
npm install
```

4. Set up environment variables:
```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_FIREBASE_CONFIG={...}

# Backend (.env)
MONGODB_URI=...
GOOGLE_VISION_API_KEY=...
OPENWEATHER_API_KEY=...
AGRI_MARKET_API_KEY=...
GEMINI_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
```

5. Start the development servers:
```bash
# Frontend
cd frontend
npm run dev

# Backend
cd backend
npm run dev
```

## Deployment

- Frontend: Vercel
- Backend: Google Cloud Run
- Database: MongoDB Atlas
- Storage: Firebase Storage

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Google Cloud Platform
- Vercel
- MongoDB
- Firebase
- All the farmers who provided feedback during development 