# 🚀 Quick API Reference

## 📋 **Base URL**
```
http://localhost:3001/api
```

## 🔐 **Authentication APIs**

| Method | Endpoint | Rate Limit | Auth Required | Description |
|--------|----------|------------|---------------|-------------|
| POST | `/auth/register` | 5/hour | ❌ | Register with gender field |
| POST | `/auth/login` | 10/15min | ❌ | Login user |
| GET | `/auth/me` | Global | ✅ | Get profile (cached) |
| POST | `/auth/logout` | Global | ✅ | Logout user |
| POST | `/auth/verify-email` | 50/15min | ❌ | Verify email |
| POST | `/auth/resend-verification` | 50/15min | ❌ | Resend verification |
| POST | `/auth/forgot-password` | 50/15min | ❌ | Request password reset |
| POST | `/auth/reset-password` | 50/15min | ❌ | Reset password |
| PUT | `/auth/update-profile` | Global | ✅ | Update profile |
| PUT | `/auth/change-password` | Global | ✅ | Change password |

## 📸 **Face Analysis APIs**

| Method | Endpoint | Rate Limit | Auth Required | Description |
|--------|----------|------------|---------------|-------------|
| POST | `/face/analyze` | 20/hour | ✅ | Upload & analyze face |
| GET | `/face/history` | Global | ✅ | Get analysis history |
| GET | `/face/analysis/:id` | Global | ✅ | Get specific analysis |
| GET | `/face/analysis/:id/colors` | Global | ✅ | Get color palette |
| GET | `/face/analysis/:id/measurements` | Global | ✅ | Get measurements |
| DELETE | `/face/analysis/:id` | Global | ✅ | Delete analysis |
| GET | `/face/test` | Global | ✅ | Test API endpoint |

## 📊 **Monitoring APIs**

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/health` | ❌ | Health check with performance |
| GET | `/metrics` | ❌ | Detailed performance metrics |
| GET | `/cache/status` | ❌ | Cache performance status |

## 🧪 **Quick Test Commands**

### **Register User:**
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

### **Login User:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'
```

### **Get Profile:**
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Upload Face Image:**
```bash
curl -X POST http://localhost:3001/api/face/analyze \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "faceImage=@/path/to/image.jpg"
```

### **Check Health:**
```bash
curl http://localhost:3001/api/health
```

## 📱 **Mobile App Integration**

### **JavaScript/React Native:**
```javascript
// Register
const response = await fetch('http://localhost:3001/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'Password123',
    gender: 'male'
  })
});

// Login
const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'Password123'
  })
});

// Face Analysis
const formData = new FormData();
formData.append('faceImage', {
  uri: imageUri,
  type: 'image/jpeg',
  name: 'face.jpg'
});

const analysisResponse = await fetch('http://localhost:3001/api/face/analyze', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

## 🔧 **Rate Limits**

- **Registration:** 5 requests/hour per IP
- **Login:** 10 requests/15 minutes per IP
- **Face Analysis:** 20 requests/hour per user
- **Global:** 1000 requests/15 minutes per IP

## 📁 **File Upload Requirements**

- **Field Name:** `faceImage`
- **Max Size:** 10MB
- **Formats:** JPEG, PNG, GIF, BMP, WebP
- **Min Dimensions:** 200x200 pixels

## 🚨 **Common HTTP Status Codes**

- **200:** Success
- **201:** Created
- **400:** Bad Request
- **401:** Unauthorized
- **403:** Forbidden
- **404:** Not Found
- **429:** Rate Limited
- **500:** Server Error

## 🧪 **Testing Scripts**

```bash
# Test enhanced system
node test-enhanced-system.js

# Run load tests
node tests/loadTest.js

# Test face analysis
node test-face-api.js
```

## 📊 **Performance Monitoring**

```bash
# Real-time health monitoring
watch -n 2 "curl -s http://localhost:3001/api/health | jq '.performance.summary'"

# Detailed metrics
curl http://localhost:3001/api/metrics

# Cache status
curl http://localhost:3001/api/cache/status
```

## 🔑 **Authentication Headers**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

## 📈 **Performance Benchmarks**

- **Good:** >50 req/sec, <500ms avg response
- **Acceptable:** >20 req/sec, <1000ms avg response  
- **Poor:** <10 req/sec, >2000ms avg response

## 🛠️ **Troubleshooting**

```bash
# Check server status
curl http://localhost:3001/api/health

# Check if port is in use
netstat -ano | findstr :3001

# Kill process on port
taskkill /PID <PID> /F

# Restart server
npm start
```

## 📝 **Environment Variables**

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/augument
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
EMAIL_USER=us59908@gmail.com
EMAIL_PASS=evgv sbcp ynow fecj
ENABLE_REDIS=false
```

---

For complete documentation, see: **COMPLETE_API_GUIDE.md**
