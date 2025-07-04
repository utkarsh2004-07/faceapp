# Augument Backend API

A full-featured Node.js backend with authentication, email services, and MongoDB integration designed for mobile applications.

## Features

- 🔐 **User Authentication** (JWT-based)
- 📧 **Email Services** (Registration, Verification, Password Reset)
- 🗄️ **MongoDB Integration** with Mongoose
- 🛡️ **Security Middleware** (Helmet, Rate Limiting, CORS)
- 📱 **Mobile App Ready** (JWT tokens, no cookie dependency)
- ✅ **Input Validation** with express-validator
- 🔄 **Password Reset** functionality
- 📬 **Email Verification** system
- 📸 **Face Analysis** (Hair, Skin, Eye, Lip Color Detection)
- 📏 **Face Measurements** (Dimensions, Shape Analysis)
- 🎨 **Color Palette** Generation
- 🖼️ **Image Upload** and Processing

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally on default port 27017)
- Gmail account for email services

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
   - Copy `.env` file and update the values as needed
   - The Gmail credentials are already configured in the `.env` file

3. **Start MongoDB:**
   - Make sure MongoDB is running on `mongodb://localhost:27017`
   - The database `augument` will be created automatically

4. **Run the server:**
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |
| POST | `/api/auth/logout` | Logout user | Yes |
| POST | `/api/auth/verify-email` | Verify email address | No |
| POST | `/api/auth/resend-verification` | Resend verification email | No |
| POST | `/api/auth/forgot-password` | Request password reset | No |
| POST | `/api/auth/reset-password` | Reset password | No |
| PUT | `/api/auth/update-profile` | Update user profile | Yes |
| PUT | `/api/auth/change-password` | Change password | Yes |

### Face Analysis Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/face/analyze` | Upload and analyze face image | Yes |
| GET | `/api/face/history` | Get analysis history | Yes |
| GET | `/api/face/analysis/:id` | Get specific analysis | Yes |
| DELETE | `/api/face/analysis/:id` | Delete analysis | Yes |
| GET | `/api/face/analysis/:id/colors` | Get color palette | Yes |
| GET | `/api/face/analysis/:id/measurements` | Get face measurements | Yes |
| GET | `/api/face/test` | Test face analysis API | Yes |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |

## 📸 Face Analysis Features

### Color Detection
- **Hair Color:** black, brown, blonde, red, gray, white
- **Skin Tone:** fair, light, medium, olive, tan, dark, deep
- **Eye Color:** blue, green, brown, hazel, gray, amber
- **Lip Color:** pink, red, coral, nude, berry

### Face Shape Analysis
- **Shapes:** oval, round, square, heart, diamond, oblong, triangle
- **Measurements:** face length, width, jaw width, forehead width
- **Ratios:** length-to-width, jaw-to-forehead, cheekbone-to-jaw

### Facial Features
- **Eye Shape:** almond, round, hooded, monolid, upturned, downturned
- **Nose Shape:** straight, roman, button, hawk, snub
- **Lip Shape:** full, thin, heart, wide, small
- **Face Dimensions:** detailed measurements in pixels

### Image Requirements
- **Formats:** JPEG, PNG, GIF, BMP, WebP
- **Size:** Maximum 10MB
- **Dimensions:** Minimum 200x200 pixels
- **Content:** Clear front-facing face photo

## API Usage Examples

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123"
  }'
```

### Login User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'
```

### Access Protected Route
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Mobile App Integration

### JWT Token Usage

For mobile apps, use the JWT token in the Authorization header:

```javascript
// Example for React Native or mobile app
const token = 'your_jwt_token_here';

fetch('http://localhost:5000/api/auth/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

### Token Storage Options

1. **Secure Storage (Recommended):**
   - iOS: Keychain Services
   - Android: Android Keystore
   - React Native: `@react-native-async-storage/async-storage` with encryption

2. **Alternative Storage:**
   - AsyncStorage (less secure but simpler)
   - SecureStore (Expo)

### Cookie Support

The backend also supports cookies for web applications, but for mobile apps, JWT tokens in headers are recommended.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/augument |
| `JWT_SECRET` | JWT secret key | (change in production) |
| `JWT_EXPIRE` | JWT expiration time | 7d |
| `EMAIL_USER` | Gmail email address | us59908@gmail.com |
| `EMAIL_PASS` | Gmail app password | evgv sbcp ynow fecj |

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting (100 requests per 15 minutes)
- CORS configuration
- Helmet security headers
- Input validation and sanitization
- Email verification system

## Database Schema

### User Model
```javascript
{
  name: String (required, 2-50 chars),
  email: String (required, unique, validated),
  password: String (required, min 6 chars, hashed),
  isEmailVerified: Boolean (default: false),
  lastLogin: Date,
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Validation errors if applicable
}
```

## Testing

Test the API endpoints using the health check:

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure proper MongoDB connection
4. Set up SSL/HTTPS
5. Configure proper CORS origins
6. Use environment-specific email credentials

## Support

For issues or questions, please check the logs and ensure:
- MongoDB is running
- Environment variables are set correctly
- Gmail credentials are valid
- Network connectivity is available
