// API Configuration
const API_BASE_URL = 'https://api.weatherapi.com/v1';
const API_KEY = 'YOUR_WEATHER_API_KEY'; // You'll need to get this from weatherapi.com

// Weather API Service
const weatherService = {
    async getCurrentWeather(latitude, longitude) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/current.json?key=${API_KEY}&q=${latitude},${longitude}&aqi=no`
            );
            const data = await response.json();
            return {
                temperature: data.current.temp_c,
                humidity: data.current.humidity,
                rainfall: data.current.precip_mm,
                windSpeed: data.current.wind_kph,
                condition: data.current.condition.text,
                icon: data.current.condition.icon
            };
        } catch (error) {
            console.error('Error fetching weather data:', error);
            return null;
        }
    },

    async getForecast(latitude, longitude) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/forecast.json?key=${API_KEY}&q=${latitude},${longitude}&days=7&aqi=no`
            );
            const data = await response.json();
            return data.forecast.forecastday;
        } catch (error) {
            console.error('Error fetching forecast:', error);
            return null;
        }
    }
};

// Notifications Service
const notificationService = {
    async getNotifications() {
        try {
            // In a real application, this would be your backend API
            const response = await fetch('/api/notifications');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }
    },

    async markAsRead(notificationId) {
        try {
            await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'PUT'
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    },

    // WebSocket connection for real-time notifications
    connectWebSocket() {
        const ws = new WebSocket('wss://your-websocket-server.com');
        
        ws.onmessage = (event) => {
            const notification = JSON.parse(event.data);
            this.handleNewNotification(notification);
        };

        return ws;
    },

    handleNewNotification(notification) {
        // Dispatch a custom event that the UI can listen to
        const event = new CustomEvent('newNotification', { detail: notification });
        document.dispatchEvent(event);
    }
};

// Market Data Service
const marketService = {
    async getMarketPrices(crop) {
        try {
            // In a real application, this would be your backend API
            const response = await fetch(`/api/market-prices?crop=${crop}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching market prices:', error);
            return null;
        }
    },

    async getPriceTrends(crop, days = 30) {
        try {
            const response = await fetch(`/api/price-trends?crop=${crop}&days=${days}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching price trends:', error);
            return null;
        }
    }
};

// Plant Disease Detection Service
const diseaseDetectionService = {
    async detectDisease(imageFile) {
        try {
            const formData = new FormData();
            formData.append('image', imageFile);

            const response = await fetch('/api/detect-disease', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Disease detection failed');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error detecting disease:', error);
            throw error;
        }
    }
};

// Export services
export { weatherService, notificationService, marketService, diseaseDetectionService }; 