# 📚 Complete API Guide - A to Z Documentation

## 🎯 **Table of Contents**

1. [🚀 Quick Start](#quick-start)
2. [🔐 Authentication APIs](#authentication-apis)
3. [📸 Face Analysis APIs](#face-analysis-apis)
4. [📊 Monitoring & Health APIs](#monitoring--health-apis)
5. [🧪 Testing Guide](#testing-guide)
6. [📱 Mobile App Integration](#mobile-app-integration)
7. [🔧 Configuration](#configuration)
8. [🚨 Error Handling](#error-handling)
9. [📈 Performance & Scaling](#performance--scaling)
10. [🛠️ Troubleshooting](#troubleshooting)

---

## 🚀 **Quick Start**

### **Base URL**
```
http://localhost:3001/api
```

### **Start Server**
```bash
cd D:/myidea/backend
npm start
```

### **Health Check**
```bash
curl http://localhost:3001/api/health
```

---

## 🔐 **Authentication APIs**

### **1. User Registration**

**Endpoint:** `POST /api/auth/register`
**Rate Limit:** 5 requests/hour per IP
**Authentication:** Not required

#### **Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123",
  "gender": "male"
}
```

#### **Validation Rules:**
- **name:** 2-50 characters, required
- **email:** Valid email format, unique, required
- **password:** Min 6 chars, must contain uppercase, lowercase, number
- **gender:** One of: `male`, `female`, `other`, `prefer_not_to_say`

#### **Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email for verification.",
  "user": {
    "id": "64f1234567890abcdef12345",
    "name": "John Doe",
    "email": "john@example.com",
    "gender": "male",
    "isEmailVerified": false
  }
}
```

#### **Error Responses:**
```json
// 400 - Validation Error
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter"
    }
  ]
}

// 400 - User Exists
{
  "success": false,
  "message": "User already exists with this email"
}

// 429 - Rate Limited
{
  "success": false,
  "message": "Too many registration attempts",
  "retryAfter": 3600,
  "limit": 5,
  "current": 6
}
```

#### **cURL Example:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123",
    "gender": "male"
  }'
```

### **2. User Login**

**Endpoint:** `POST /api/auth/login`
**Rate Limit:** 10 requests/15 minutes per IP (sliding window)
**Authentication:** Not required

#### **Request:**
```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```

#### **Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f1234567890abcdef12345",
    "name": "John Doe",
    "email": "john@example.com",
    "gender": "male",
    "isEmailVerified": false,
    "lastLogin": "2024-01-01T12:00:00.000Z",
    "createdAt": "2024-01-01T10:00:00.000Z"
  }
}
```

#### **Error Responses:**
```json
// 401 - Invalid Credentials
{
  "success": false,
  "message": "Invalid credentials"
}

// 401 - Account Deactivated
{
  "success": false,
  "message": "Account is deactivated"
}
```

#### **cURL Example:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'
```

### **3. Get Current User Profile**

**Endpoint:** `GET /api/auth/me`
**Rate Limit:** Global limit (1000/15min)
**Authentication:** Required (JWT Token)
**Caching:** 10 minutes

#### **Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### **Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "64f1234567890abcdef12345",
    "name": "John Doe",
    "email": "john@example.com",
    "gender": "male",
    "isEmailVerified": false,
    "lastLogin": "2024-01-01T12:00:00.000Z",
    "createdAt": "2024-01-01T10:00:00.000Z"
  }
}
```

#### **cURL Example:**
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **4. Email Verification**

**Endpoint:** `POST /api/auth/verify-email`
**Rate Limit:** 50 requests/15 minutes per IP
**Authentication:** Not required

#### **Request:**
```json
{
  "token": "email_verification_token_here"
}
```

#### **Success Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

### **5. Resend Email Verification**

**Endpoint:** `POST /api/auth/resend-verification`
**Rate Limit:** 50 requests/15 minutes per IP
**Authentication:** Not required

#### **Request:**
```json
{
  "email": "john@example.com"
}
```

### **6. Forgot Password**

**Endpoint:** `POST /api/auth/forgot-password`
**Rate Limit:** 50 requests/15 minutes per IP
**Authentication:** Not required

#### **Request:**
```json
{
  "email": "john@example.com"
}
```

#### **Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### **7. Reset Password**

**Endpoint:** `POST /api/auth/reset-password`
**Rate Limit:** 50 requests/15 minutes per IP
**Authentication:** Not required

#### **Request:**
```json
{
  "token": "password_reset_token_here",
  "password": "NewPassword123"
}
```

#### **Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successful",
  "token": "new_jwt_token_here",
  "user": {
    "id": "64f1234567890abcdef12345",
    "name": "John Doe",
    "email": "john@example.com",
    "gender": "male"
  }
}
```

### **8. Update Profile**

**Endpoint:** `PUT /api/auth/update-profile`
**Rate Limit:** Global limit
**Authentication:** Required

#### **Request:**
```json
{
  "name": "John Updated",
  "email": "john.updated@example.com"
}
```

### **9. Change Password**

**Endpoint:** `PUT /api/auth/change-password`
**Rate Limit:** Global limit
**Authentication:** Required

#### **Request:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123"
}
```

### **10. Logout**

**Endpoint:** `POST /api/auth/logout`
**Rate Limit:** Global limit
**Authentication:** Required

#### **Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 📸 **Face Analysis APIs**

### **1. Upload and Analyze Face**

**Endpoint:** `POST /api/face/analyze`
**Rate Limit:** 20 requests/hour per user
**Authentication:** Required
**Content-Type:** `multipart/form-data`

#### **Request (Form Data):**
- **Field Name:** `faceImage`
- **File Type:** Image file
- **Max Size:** 10MB
- **Formats:** JPEG, PNG, GIF, BMP, WebP
- **Min Dimensions:** 200x200 pixels

#### **Success Response (200):**
```json
{
  "success": true,
  "message": "Face analysis completed successfully",
  "data": {
    "analysisId": "64f1234567890abcdef12345",
    "imageUrl": "/uploads/face-images/face-1234567890-123456789.jpg",
    "faceDetected": true,
    "processingTime": 1250,
    "confidence": 0.8,
    "colors": {
      "hairColor": {
        "primary": "brown",
        "hex": "#8B4513",
        "rgb": {"r": 139, "g": 69, "b": 19},
        "confidence": 0.7
      },
      "skinTone": {
        "primary": "light",
        "hex": "#F5DEB3",
        "rgb": {"r": 245, "g": 222, "b": 179},
        "confidence": 0.8
      },
      "eyeColor": {
        "primary": "brown",
        "hex": "#8B4513",
        "rgb": {"r": 139, "g": 69, "b": 19},
        "confidence": 0.6
      },
      "lipColor": {
        "primary": "pink",
        "hex": "#FFC0CB",
        "rgb": {"r": 255, "g": 192, "b": 203},
        "confidence": 0.6
      }
    },
    "dimensions": {
      "faceLength": 300,
      "faceWidth": 250,
      "jawWidth": 200,
      "foreheadWidth": 225,
      "cheekboneWidth": 238,
      "lengthToWidthRatio": 1.2,
      "jawToForeheadRatio": 0.89,
      "cheekboneToJawRatio": 1.19
    },
    "features": {
      "faceShape": "oval",
      "eyeShape": "almond",
      "eyeDistance": "normal",
      "eyebrowShape": "arched",
      "noseShape": "straight",
      "lipShape": "full"
    },
    "imageInfo": {
      "originalFileName": "my-photo.jpg",
      "format": "jpeg",
      "dimensions": {"width": 800, "height": 1000},
      "fileSize": 245760
    },
    "metadata": {
      "errors": [],
      "warnings": [],
      "algorithm": "custom-v1"
    }
  }
}
```

#### **Error Responses:**
```json
// 400 - No File
{
  "success": false,
  "message": "No file uploaded. Please select an image file."
}

// 400 - Invalid File Type
{
  "success": false,
  "message": "Only image files are allowed (jpeg, jpg, png, gif, bmp, webp)"
}

// 400 - File Too Large
{
  "success": false,
  "message": "File too large. Maximum size is 10MB."
}

// 400 - Image Too Small
{
  "success": false,
  "message": "Image too small. Minimum dimensions: 200x200px"
}

// 429 - Rate Limited
{
  "success": false,
  "message": "Too many face analysis requests",
  "retryAfter": 3600
}
```

#### **cURL Example:**
```bash
curl -X POST http://localhost:3001/api/face/analyze \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "faceImage=@/path/to/your/image.jpg"
```

#### **JavaScript/Fetch Example:**
```javascript
const formData = new FormData();
formData.append('faceImage', fileInput.files[0]);

const response = await fetch('http://localhost:3001/api/face/analyze', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
```

### **2. Get Face Analysis History**

**Endpoint:** `GET /api/face/history`
**Rate Limit:** Global limit
**Authentication:** Required

#### **Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

#### **Success Response (200):**
```json
{
  "success": true,
  "data": {
    "analyses": [
      {
        "_id": "64f1234567890abcdef12345",
        "imageUrl": "/uploads/face-images/face-123.jpg",
        "faceDetected": true,
        "colors": {
          "hairColor": {"primary": "brown"},
          "skinTone": {"primary": "light"}
        },
        "createdAt": "2024-01-01T12:00:00.000Z"
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 3,
      "total": 25,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### **cURL Example:**
```bash
curl -X GET "http://localhost:3001/api/face/history?page=1&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **3. Get Specific Face Analysis**

**Endpoint:** `GET /api/face/analysis/:id`
**Rate Limit:** Global limit
**Authentication:** Required

#### **Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "64f1234567890abcdef12345",
    "imageUrl": "/uploads/face-images/face-123.jpg",
    "faceDetected": true,
    "colors": { /* full color analysis */ },
    "dimensions": { /* full dimensions */ },
    "features": { /* full features */ },
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### **4. Get Color Palette**

**Endpoint:** `GET /api/face/analysis/:id/colors`
**Rate Limit:** Global limit
**Authentication:** Required

#### **Success Response (200):**
```json
{
  "success": true,
  "data": {
    "palette": {
      "hair": {
        "color": "brown",
        "hex": "#8B4513",
        "rgb": {"r": 139, "g": 69, "b": 19}
      },
      "skin": {
        "tone": "light",
        "hex": "#F5DEB3",
        "rgb": {"r": 245, "g": 222, "b": 179}
      },
      "eyes": {
        "color": "brown",
        "hex": "#8B4513",
        "rgb": {"r": 139, "g": 69, "b": 19}
      },
      "lips": {
        "color": "pink",
        "hex": "#FFC0CB",
        "rgb": {"r": 255, "g": 192, "b": 203}
      }
    },
    "recommendations": [
      "Colors that complement your skin tone",
      "Hair color suggestions",
      "Eye makeup recommendations",
      "Lip color suggestions"
    ]
  }
}
```

### **5. Get Face Measurements**

**Endpoint:** `GET /api/face/analysis/:id/measurements`
**Rate Limit:** Global limit
**Authentication:** Required

#### **Success Response (200):**
```json
{
  "success": true,
  "data": {
    "measurements": {
      "dimensions": {
        "faceLength": 300,
        "faceWidth": 250,
        "lengthToWidthRatio": 1.2
      },
      "features": {
        "faceShape": "oval",
        "eyeShape": "almond",
        "noseShape": "straight"
      }
    },
    "analysis": {
      "faceShape": "oval",
      "symmetry": "Good",
      "proportions": "Balanced"
    }
  }
}
```

### **6. Delete Face Analysis**

**Endpoint:** `DELETE /api/face/analysis/:id`
**Rate Limit:** Global limit
**Authentication:** Required

#### **Success Response (200):**
```json
{
  "success": true,
  "message": "Face analysis deleted successfully"
}
```

### **7. Test Face Analysis API**

**Endpoint:** `GET /api/face/test`
**Rate Limit:** Global limit
**Authentication:** Required

#### **Success Response (200):**
```json
{
  "success": true,
  "message": "Face Analysis API is working",
  "user": {
    "id": "64f1234567890abcdef12345",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "endpoints": {
    "analyze": "POST /api/face/analyze - Upload and analyze face image",
    "history": "GET /api/face/history - Get analysis history",
    "getAnalysis": "GET /api/face/analysis/:id - Get specific analysis",
    "deleteAnalysis": "DELETE /api/face/analysis/:id - Delete analysis",
    "getColors": "GET /api/face/analysis/:id/colors - Get color palette",
    "getMeasurements": "GET /api/face/analysis/:id/measurements - Get measurements"
  },
  "uploadRequirements": {
    "fieldName": "faceImage",
    "maxSize": "10MB",
    "allowedFormats": ["jpeg", "jpg", "png", "gif", "bmp", "webp"],
    "minDimensions": "200x200px"
  }
}
```

---

## 📊 **Monitoring & Health APIs**

### **1. Health Check**

**Endpoint:** `GET /api/health`
**Rate Limit:** Global limit
**Authentication:** Not required

#### **Success Response (200):**
```json
{
  "success": true,
  "message": "Server is running successfully",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "performance": {
    "status": "healthy",
    "summary": {
      "totalRequests": 150,
      "successRate": "98.67%",
      "averageResponseTime": "245.32ms",
      "requestsPerSecond": "12.45",
      "cpuUsage": "23.45%",
      "memoryUsage": "67.89%",
      "cacheHitRate": "85.23%"
    },
    "alerts": {
      "critical": [],
      "warning": [],
      "info": []
    }
  },
  "cache": {
    "status": "healthy",
    "memoryCache": true,
    "redisConnected": false,
    "stats": {
      "hits": 125,
      "misses": 25,
      "hitRate": 0.8333
    }
  },
  "uptime": 3600,
  "memory": {
    "used": "145 MB",
    "total": "512 MB"
  }
}
```

#### **cURL Example:**
```bash
curl http://localhost:3001/api/health
```

### **2. Performance Metrics**

**Endpoint:** `GET /api/metrics`
**Rate Limit:** Global limit
**Authentication:** Not required

#### **Success Response (200):**
```json
{
  "success": true,
  "data": {
    "timestamp": "2024-01-01T12:00:00.000Z",
    "status": "healthy",
    "summary": {
      "totalRequests": 150,
      "successRate": "98.67",
      "averageResponseTime": "245.32ms",
      "requestsPerSecond": "12.45",
      "cpuUsage": "23.45%",
      "memoryUsage": "67.89%",
      "cacheHitRate": "85.23%"
    },
    "alerts": {
      "critical": [],
      "warning": ["Memory usage is high (>80%)"],
      "info": []
    },
    "detailed": {
      "requests": {
        "total": 150,
        "successful": 148,
        "failed": 2,
        "successRate": "98.67",
        "averageResponseTime": 245.32,
        "requestsPerSecond": 12.45,
        "responseTimePercentiles": {
          "p50": 180,
          "p90": 450,
          "p95": 650,
          "p99": 1200
        }
      },
      "system": {
        "cpuUsage": 23.45,
        "memoryUsage": 67.89,
        "loadAverage": 1.23,
        "uptime": 3600,
        "totalMemory": "8.00 GB",
        "freeMemory": "2.56 GB",
        "cpuCount": 8,
        "platform": "win32",
        "nodeVersion": "v20.10.0"
      },
      "cache": {
        "hits": 125,
        "misses": 25,
        "hitRate": 0.8333
      }
    }
  }
}
```

#### **cURL Example:**
```bash
curl http://localhost:3001/api/metrics
```

### **3. Cache Status**

**Endpoint:** `GET /api/cache/status`
**Rate Limit:** Global limit
**Authentication:** Not required

#### **Success Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "memoryCache": true,
    "redisConnected": false,
    "stats": {
      "hits": 125,
      "misses": 25,
      "memoryKeys": 45,
      "memoryHits": 120,
      "memoryMisses": 30,
      "redisConnected": false,
      "hitRate": 0.8333
    }
  }
}
```

---

## 🧪 **Testing Guide**

### **1. Manual API Testing**

#### **Test Authentication Flow:**
```bash
# 1. Register User
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPassword123",
    "gender": "male"
  }'

# 2. Login User
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'

# 3. Get Profile (use token from login response)
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### **Test Face Analysis:**
```bash
# 1. Test API
curl -X GET http://localhost:3001/api/face/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 2. Upload Image (replace with actual image path)
curl -X POST http://localhost:3001/api/face/analyze \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "faceImage=@/path/to/image.jpg"

# 3. Get Analysis History
curl -X GET http://localhost:3001/api/face/history \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **2. Automated Testing Scripts**

#### **Run Basic System Test:**
```bash
node test-enhanced-system.js
```

#### **Run Load Testing:**
```bash
# Basic load test
node tests/loadTest.js

# Custom load test
node -e "
const { LoadTester } = require('./tests/loadTest');
const tester = new LoadTester();
tester.testRegistration(5, 3).then(() => tester.printResults('Custom Test'));
"
```

#### **Test Face Analysis API:**
```bash
node test-face-api.js
```

### **3. Postman Testing**

#### **Import Collection:**
Create a Postman collection with these requests:

**Authentication Folder:**
- Register User: `POST /api/auth/register`
- Login User: `POST /api/auth/login`
- Get Profile: `GET /api/auth/me`
- Update Profile: `PUT /api/auth/update-profile`
- Change Password: `PUT /api/auth/change-password`
- Logout: `POST /api/auth/logout`

**Face Analysis Folder:**
- Test API: `GET /api/face/test`
- Analyze Face: `POST /api/face/analyze`
- Get History: `GET /api/face/history`
- Get Analysis: `GET /api/face/analysis/:id`
- Get Colors: `GET /api/face/analysis/:id/colors`
- Get Measurements: `GET /api/face/analysis/:id/measurements`
- Delete Analysis: `DELETE /api/face/analysis/:id`

**Monitoring Folder:**
- Health Check: `GET /api/health`
- Performance Metrics: `GET /api/metrics`
- Cache Status: `GET /api/cache/status`

#### **Environment Variables:**
```
baseUrl: http://localhost:3001/api
token: {{authToken}}
```

#### **Pre-request Script for Authentication:**
```javascript
// For requests that need authentication
pm.request.headers.add({
  key: 'Authorization',
  value: 'Bearer ' + pm.environment.get('token')
});
```

#### **Test Script for Login:**
```javascript
// Save token after login
if (pm.response.code === 200) {
  const response = pm.response.json();
  if (response.success && response.token) {
    pm.environment.set('token', response.token);
  }
}
```

### **4. Performance Testing**

#### **Monitor During Load Tests:**
```bash
# Terminal 1: Run load test
node tests/loadTest.js

# Terminal 2: Monitor performance
watch -n 2 "curl -s http://localhost:3001/api/health | jq '.performance.summary'"

# Terminal 3: Monitor detailed metrics
watch -n 5 "curl -s http://localhost:3001/api/metrics | jq '.data.detailed.system'"
```

#### **Performance Benchmarks:**
- **Good Performance:** >50 req/sec, <500ms avg response
- **Acceptable:** >20 req/sec, <1000ms avg response
- **Poor:** <10 req/sec, >2000ms avg response

---

## 📱 **Mobile App Integration**

### **1. React Native Example**

#### **Authentication Service:**
```javascript
class AuthService {
  constructor() {
    this.baseURL = 'http://localhost:3001/api';
    this.token = null;
  }

  async register(userData) {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return await response.json();
  }

  async login(email, password) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (data.success && data.token) {
      this.token = data.token;
      await AsyncStorage.setItem('authToken', data.token);
    }
    return data;
  }

  async getProfile() {
    const response = await fetch(`${this.baseURL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return await response.json();
  }

  async analyzeFace(imageUri) {
    const formData = new FormData();
    formData.append('faceImage', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'face.jpg'
    });

    const response = await fetch(`${this.baseURL}/face/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'multipart/form-data'
      },
      body: formData
    });

    return await response.json();
  }
}
```

#### **Usage Example:**
```javascript
const authService = new AuthService();

// Register user
const registerData = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'Password123',
  gender: 'male'
};
const registerResult = await authService.register(registerData);

// Login user
const loginResult = await authService.login('john@example.com', 'Password123');

// Get profile
const profile = await authService.getProfile();

// Analyze face
const analysisResult = await authService.analyzeFace(imageUri);
```

### **2. Flutter/Dart Example**

```dart
class ApiService {
  static const String baseUrl = 'http://localhost:3001/api';
  String? token;

  Future<Map<String, dynamic>> register(Map<String, dynamic> userData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(userData),
    );
    return json.decode(response.body);
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'email': email, 'password': password}),
    );

    final data = json.decode(response.body);
    if (data['success'] && data['token'] != null) {
      token = data['token'];
      // Save token to secure storage
    }
    return data;
  }

  Future<Map<String, dynamic>> analyzeFace(File imageFile) async {
    var request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/face/analyze'),
    );

    request.headers['Authorization'] = 'Bearer $token';
    request.files.add(await http.MultipartFile.fromPath(
      'faceImage',
      imageFile.path,
    ));

    final response = await request.send();
    final responseBody = await response.stream.bytesToString();
    return json.decode(responseBody);
  }
}
```

### **3. Token Storage Options**

#### **React Native - Secure Storage:**
```javascript
import * as Keychain from 'react-native-keychain';

// Save token securely
await Keychain.setInternetCredentials(
  'authToken',
  'user',
  token
);

// Get token securely
const credentials = await Keychain.getInternetCredentials('authToken');
const token = credentials ? credentials.password : null;

// Remove token
await Keychain.resetInternetCredentials('authToken');
```

#### **React Native - AsyncStorage:**
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save token
await AsyncStorage.setItem('authToken', token);

// Get token
const token = await AsyncStorage.getItem('authToken');

// Remove token
await AsyncStorage.removeItem('authToken');
```

---

## 🔧 **Configuration**

### **1. Environment Variables (.env)**

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/augument

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
JWT_EXPIRE=7d

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=us59908@gmail.com
EMAIL_PASS=evgv sbcp ynow fecj

# Frontend URL (for CORS and email links)
FRONTEND_URL=http://localhost:3000

# Redis Configuration (Optional)
ENABLE_REDIS=false
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Performance Settings
ENABLE_COMPRESSION=true
CACHE_TTL=600
MAX_REQUEST_SIZE=10mb
```

### **2. Rate Limiting Configuration**

```javascript
// Current Rate Limits
const limits = {
  global: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // requests per window
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50 // requests per window
  },
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10 // requests per window
  },
  register: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5 // requests per window
  },
  faceAnalysis: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20 // requests per window
  }
};
```

### **3. Caching Configuration**

```javascript
// Cache TTL Settings
const cacheTTL = {
  userProfile: 600,      // 10 minutes
  sessionData: 3600,     // 1 hour
  faceAnalysis: 86400,   // 24 hours
  rateLimit: 900         // 15 minutes
};
```

---

## 🚨 **Error Handling**

### **1. Standard Error Response Format**

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ],
  "code": "VALIDATION_ERROR",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### **2. HTTP Status Codes**

- **200 OK:** Successful request
- **201 Created:** Resource created successfully
- **400 Bad Request:** Invalid request data
- **401 Unauthorized:** Authentication required
- **403 Forbidden:** Access denied
- **404 Not Found:** Resource not found
- **429 Too Many Requests:** Rate limit exceeded
- **500 Internal Server Error:** Server error

### **3. Common Error Scenarios**

#### **Authentication Errors:**
```json
// Invalid token
{
  "success": false,
  "message": "Not authorized to access this route"
}

// Expired token
{
  "success": false,
  "message": "Token has expired"
}

// Missing token
{
  "success": false,
  "message": "No token provided"
}
```

#### **Validation Errors:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "password",
      "message": "Password must be at least 6 characters long"
    },
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

#### **Rate Limiting Errors:**
```json
{
  "success": false,
  "message": "Too many requests from this IP",
  "retryAfter": 900,
  "limit": 100,
  "current": 101
}
```

#### **File Upload Errors:**
```json
// File too large
{
  "success": false,
  "message": "File too large. Maximum size is 10MB."
}

// Invalid file type
{
  "success": false,
  "message": "Only image files are allowed (jpeg, jpg, png, gif, bmp, webp)"
}

// No file uploaded
{
  "success": false,
  "message": "No file uploaded. Please select an image file."
}
```

### **4. Error Handling in Client Code**

#### **JavaScript/React:**
```javascript
try {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (!data.success) {
    // Handle API error
    if (response.status === 429) {
      alert('Too many attempts. Please try again later.');
    } else if (response.status === 401) {
      alert('Invalid credentials');
    } else {
      alert(data.message || 'An error occurred');
    }
    return;
  }

  // Handle success
  console.log('Login successful:', data.user);
} catch (error) {
  // Handle network error
  console.error('Network error:', error);
  alert('Network error. Please check your connection.');
}
```

---

## 📈 **Performance & Scaling**

### **1. Performance Monitoring**

#### **Key Metrics to Monitor:**
- **Response Time:** Average, P50, P90, P95, P99
- **Throughput:** Requests per second
- **Error Rate:** Percentage of failed requests
- **CPU Usage:** Server CPU utilization
- **Memory Usage:** RAM consumption
- **Cache Hit Rate:** Caching effectiveness

#### **Performance Alerts:**
```javascript
// Critical Alerts (Immediate Action Required)
- CPU usage > 90%
- Memory usage > 90%
- Average response time > 5000ms
- Error rate > 10%

// Warning Alerts (Monitor Closely)
- CPU usage > 70%
- Memory usage > 80%
- Average response time > 2000ms
- Error rate > 5%
- Cache hit rate < 50%
```

### **2. Scaling Strategies**

#### **Vertical Scaling (Scale Up):**
- Increase CPU cores
- Add more RAM
- Use faster storage (SSD)
- Optimize database queries

#### **Horizontal Scaling (Scale Out):**
- Multiple server instances
- Load balancer (Nginx/HAProxy)
- Database clustering
- Redis cluster for caching

#### **Production Deployment:**
```bash
# Using PM2 for clustering
npm install -g pm2

# Start with cluster mode (uses all CPU cores)
pm2 start server.js -i max --name "api-server"

# Monitor processes
pm2 monit

# View logs
pm2 logs
```

### **3. Database Optimization**

#### **MongoDB Indexing:**
```javascript
// User collection indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ createdAt: -1 })

// Face analysis collection indexes
db.faceanalyses.createIndex({ userId: 1, createdAt: -1 })
db.faceanalyses.createIndex({ "colors.hairColor.primary": 1 })
db.faceanalyses.createIndex({ "colors.skinTone.primary": 1 })
```

#### **Connection Pooling:**
```javascript
// MongoDB connection with pooling
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,        // Maximum connections
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

### **4. Caching Strategies**

#### **Cache Layers:**
1. **Memory Cache:** Fast access for frequently used data
2. **Redis Cache:** Distributed caching for multiple servers
3. **Database Query Cache:** Reduce database load
4. **CDN Cache:** Static file delivery

#### **Cache Invalidation:**
```javascript
// Invalidate user cache on profile update
await cacheService.deleteUserCache(userId);

// Invalidate analysis cache on deletion
await cacheService.del(`face_analysis:${analysisId}`);
```

---

## 🛠️ **Troubleshooting**

### **1. Common Issues**

#### **Server Won't Start:**
```bash
# Check if port is in use
netstat -ano | findstr :3001

# Kill process using port
taskkill /PID <PID> /F

# Check MongoDB connection
mongo --eval "db.adminCommand('ismaster')"
```

#### **Database Connection Issues:**
```bash
# Check MongoDB status
net start MongoDB

# Check connection string
echo $MONGODB_URI

# Test connection
mongo mongodb://localhost:27017/augument
```

#### **Authentication Issues:**
```bash
# Check JWT secret
echo $JWT_SECRET

# Verify token format
node -e "console.log(require('jsonwebtoken').decode('YOUR_TOKEN'))"
```

#### **File Upload Issues:**
```bash
# Check upload directory permissions
ls -la uploads/

# Check file size limits
curl -F "faceImage=@large-file.jpg" http://localhost:3001/api/face/analyze
```

### **2. Performance Issues**

#### **High Response Times:**
1. Check cache hit rates
2. Monitor database query performance
3. Review server resource usage
4. Optimize slow endpoints

#### **Memory Leaks:**
```bash
# Monitor memory usage
watch -n 5 "curl -s http://localhost:3001/api/metrics | jq '.data.detailed.system.memoryUsage'"

# Check for memory leaks
node --inspect server.js
```

#### **High CPU Usage:**
1. Check for infinite loops
2. Optimize image processing
3. Review rate limiting effectiveness
4. Monitor concurrent requests

### **3. Debugging Tools**

#### **Enable Debug Logging:**
```javascript
// Add to server.js
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
  });
}
```

#### **API Testing Tools:**
- **Postman:** GUI-based API testing
- **curl:** Command-line testing
- **HTTPie:** User-friendly HTTP client
- **Insomnia:** Alternative to Postman

#### **Performance Monitoring:**
- **PM2 Monitor:** Built-in process monitoring
- **New Relic:** APM solution
- **DataDog:** Infrastructure monitoring
- **Custom metrics:** Built-in performance endpoints

### **4. Log Analysis**

#### **Server Logs:**
```bash
# View real-time logs
tail -f logs/server.log

# Search for errors
grep "ERROR" logs/server.log

# Monitor specific endpoint
grep "/api/face/analyze" logs/access.log
```

#### **Error Tracking:**
```javascript
// Add error tracking
app.use((err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});
```

---

## 🎯 **Quick Reference**

### **Essential Commands**
```bash
# Start server
npm start

# Run tests
node test-enhanced-system.js
node tests/loadTest.js

# Check health
curl http://localhost:3001/api/health

# Monitor performance
curl http://localhost:3001/api/metrics
```

### **Important URLs**
- **Health Check:** `http://localhost:3001/api/health`
- **Performance Metrics:** `http://localhost:3001/api/metrics`
- **Cache Status:** `http://localhost:3001/api/cache/status`

### **Rate Limits Summary**
- **Registration:** 5/hour
- **Login:** 10/15min
- **Face Analysis:** 20/hour
- **Global:** 1000/15min

### **File Upload Specs**
- **Max Size:** 10MB
- **Formats:** JPEG, PNG, GIF, BMP, WebP
- **Min Dimensions:** 200x200px
- **Field Name:** `faceImage`

---

This comprehensive guide covers every aspect of your backend API system. Use it as your complete reference for development, testing, and production deployment!
```