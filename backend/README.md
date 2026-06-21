# AudioStreaming - AI-Powered Audio Learning Platform

An intelligent audio-based learning platform that leverages Google's Gemini AI to provide personalized, interactive educational experiences through real-time voice conversations.

## 🌟 Features

### Core Functionality
- **Real-time AI Voice Conversations**: Interactive audio learning sessions powered by Google Gemini 2.0
- **Personalized AI Teachers**: Customizable AI personalities (Friendly Teacher, Strict Professor, Fun Buddy)
- **Audio Streaming**: Seamless real-time audio communication using WebSocket (Socket.io)
- **Multi-language Support**: Learn in your preferred language
- **Adaptive Learning**: AI adjusts difficulty based on your proficiency level

### User Management
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **User Profiles**: Comprehensive user profiles with learning preferences
- **Progress Tracking**: Detailed analytics on learning sessions, topics covered, and time spent
- **Conversation History**: Access and review past learning sessions

### Learning Features
- **Discussion Forums**: Participate in community discussions on various topics
- **AI-Powered Responses**: Get intelligent responses to discussion posts
- **Learning Analytics**: Track your progress with detailed statistics and insights
- **Custom Learning Paths**: Set focus areas and learning goals
- **Difficulty Levels**: Choose from beginner, intermediate, or advanced content

### Security Features
- **Rate Limiting**: Protection against API abuse
- **Input Sanitization**: XSS and injection attack prevention
- **HTTPS Enforcement**: Secure communication in production
- **Security Headers**: Helmet.js for enhanced security
- **CORS Protection**: Configurable cross-origin resource sharing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **MongoDB** (v6 or higher) - Local installation or MongoDB Atlas account
- **Google API Key** - For Gemini AI integration

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd AudioStreaming
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Server Configuration
PORT=8004
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/audiostreaming
# For MongoDB Atlas: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret_key_here
JWT_EXPIRE=7d

# Google API Configuration
GOOGLE_API_KEY=your_google_api_key_here
```

### 4. Build the Project
```bash
npm run build
```

## 🎯 Usage

### Development Mode
Start the server with hot-reload:
```bash
npm run dev
```

### Production Mode
Build and start the production server:
```bash
npm run prod
```

### Testing
Run the test suite:
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm run test:unit
npm run test:integration
```

### Manual Testing
Test individual components:
```bash
# Test database connection
npm run test:db

# Test authentication
npm run test:auth

# Test server integration
npm run test:server

# Test security features
npm run test:security

# Seed demo data for testing/demo
npm run seed:demo
```

## 🎬 Demo Mode

### Quick Demo Setup
For demonstrations and testing, use the demo data seeding feature:

```bash
# Seed demo data (creates 3 users with sample data)
npm run seed:demo

# Start server
npm run dev

# Access at http://localhost:8004
```

### Demo Credentials
```
Email: rahul.demo@example.com
Password: demo123
Class: 10

Email: priya.demo@example.com
Password: demo123
Class: 9

Email: amit.demo@example.com
Password: demo123
Class: 11
```

### Demo Features
- Pre-populated user profiles with different learning styles
- Sample conversations and discussions
- Progress data across multiple subjects
- Realistic learning analytics

For complete demo preparation, see [DEMO_PREPARATION.md](./DEMO_PREPARATION.md)

## 📱 Application Structure

```
AudioStreaming/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── server.ts        # Main server file
├── public/
│   ├── pages/           # HTML pages
│   ├── css/             # Stylesheets
│   └── js/              # Client-side JavaScript
├── tests/
│   ├── unit/            # Unit tests
│   └── integration/     # Integration tests
└── dist/                # Compiled JavaScript (generated)
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Configuration
- `GET /api/config` - Get user configuration
- `POST /api/config` - Create user configuration
- `PUT /api/config` - Update user configuration

### Discussions
- `GET /api/discussions` - Get all discussions
- `POST /api/discussions` - Create new discussion
- `GET /api/discussions/:id` - Get discussion by ID
- `POST /api/discussions/:id/posts` - Add post to discussion
- `POST /api/discussions/:id/ai-response` - Get AI response

### Progress
- `GET /api/progress` - Get user progress
- `POST /api/progress/session` - Log learning session
- `GET /api/progress/analytics` - Get learning analytics
- `GET /api/progress/insights` - Get AI-powered insights

### Health Check
- `GET /api/health` - Server health status

For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 🎨 User Interface

The application includes the following pages:
- **Login/Register**: User authentication
- **Dashboard**: Overview of learning progress and recent activities
- **Setup Wizard**: Initial configuration for new users
- **Audio Learning**: Real-time AI voice conversation interface
- **Discussions**: Community discussion forums
- **Progress**: Detailed learning analytics and insights
- **Profile**: User profile management
- **Settings**: Application and learning preferences

## 🔒 Security

The application implements multiple security layers:
- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input sanitization and validation
- CORS protection
- Helmet.js security headers
- HTTPS enforcement in production
- XSS and injection attack prevention

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details on:
- Code of conduct
- Development workflow
- Coding standards
- Pull request process

## 📚 Documentation

- [User Guide](./USER_GUIDE.md) - How to use the platform
- [Developer Guide](./DEVELOPER_GUIDE.md) - Technical documentation for developers
- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment instructions

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **Google Gemini AI** - AI-powered conversations

### Frontend
- **HTML5/CSS3** - Structure and styling
- **Vanilla JavaScript** - Client-side logic
- **Socket.io Client** - Real-time communication

### Security & Middleware
- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Express Rate Limit** - Rate limiting
- **Express Validator** - Input validation
- **Morgan** - HTTP request logging
- **Winston** - Application logging

### Testing
- **Jest** - Testing framework
- **Supertest** - HTTP assertion library
- **ts-jest** - TypeScript support for Jest

## 📊 Performance

- Real-time audio streaming with minimal latency
- Efficient WebSocket connections
- Optimized database queries with indexing
- Rate limiting to prevent abuse
- Graceful error handling and recovery

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Failed**
```bash
# Ensure MongoDB is running
mongod --version
# Check connection string in .env
```

**Google API Key Invalid**
```bash
# Verify your API key at https://makersuite.google.com/app/apikey
# Ensure the key has Gemini API access enabled
```

**Port Already in Use**
```bash
# Change PORT in .env file or kill the process using the port
lsof -ti:8004 | xargs kill -9
```

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

AudioStreaming Development Team

## 🙏 Acknowledgments

- Google Gemini AI for powering the conversational AI
- MongoDB for the robust database solution
- The open-source community for excellent tools and libraries

## 📞 Support

For support, please:
1. Check the [User Guide](./USER_GUIDE.md)
2. Review [Common Issues](#troubleshooting)
3. Open an issue on GitHub
4. Contact the development team

## 🗺️ Roadmap

- [ ] Mobile application (iOS/Android)
- [ ] Offline mode support
- [ ] Additional AI personality types
- [ ] Group learning sessions
- [ ] Gamification features
- [ ] Integration with external learning platforms
- [ ] Advanced analytics dashboard
- [ ] Multi-modal learning (text, audio, video)

---

**Built with ❤️ by the AudioStreaming Team**
