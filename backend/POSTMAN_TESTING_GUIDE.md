# 📸 Face Analysis API - Postman Testing Guide

This guide shows you how to test the Face Analysis API using Postman.

## 🚀 Setup

### Base URL
```
http://localhost:3001/api
```

### Required Headers for Protected Routes
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json (for JSON requests)
```

## 🔐 Step 1: Authentication

### 1.1 Register User (if needed)
```
POST http://localhost:3001/api/auth/register

Body (JSON):
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "Password123"
}
```

### 1.2 Login to Get JWT Token
```
POST http://localhost:3001/api/auth/login

Body (JSON):
{
  "email": "test@example.com",
  "password": "Password123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

**📝 Copy the `token` from the response - you'll need it for all face analysis requests!**

## 📸 Step 2: Face Analysis API Testing

### 2.1 Test Face Analysis Endpoint
```
GET http://localhost:3001/api/face/test

Headers:
Authorization: Bearer YOUR_JWT_TOKEN

Expected Response:
{
  "success": true,
  "message": "Face Analysis API is working",
  "user": { ... },
  "endpoints": { ... },
  "uploadRequirements": { ... }
}
```

### 2.2 Upload and Analyze Face Image
```
POST http://localhost:3001/api/face/analyze

Headers:
Authorization: Bearer YOUR_JWT_TOKEN

Body (form-data):
Key: faceImage
Type: File
Value: [Select an image file]
```

**📋 Postman Setup for File Upload:**

1. **Method:** POST
2. **URL:** `http://localhost:3001/api/face/analyze`
3. **Headers:**
   - `Authorization: Bearer YOUR_JWT_TOKEN`
4. **Body:**
   - Select "form-data"
   - Key: `faceImage`
   - Type: File (click dropdown next to key)
   - Value: Click "Select Files" and choose an image

**✅ Supported Image Formats:**
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- BMP (.bmp)
- WebP (.webp)

**📏 Image Requirements:**
- Minimum size: 200x200 pixels
- Maximum file size: 10MB
- Should contain a clear face

**Expected Response:**
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
        "rgb": { "r": 139, "g": 69, "b": 19 },
        "confidence": 0.7
      },
      "skinTone": {
        "primary": "light",
        "hex": "#F5DEB3",
        "rgb": { "r": 245, "g": 222, "b": 179 },
        "confidence": 0.8
      },
      "eyeColor": {
        "primary": "brown",
        "hex": "#8B4513",
        "rgb": { "r": 139, "g": 69, "b": 19 },
        "confidence": 0.6
      },
      "lipColor": {
        "primary": "pink",
        "hex": "#FFC0CB",
        "rgb": { "r": 255, "g": 192, "b": 203 },
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
      "dimensions": { "width": 800, "height": 1000 },
      "fileSize": 245760
    }
  }
}
```

### 2.3 Get Analysis History
```
GET http://localhost:3001/api/face/history

Headers:
Authorization: Bearer YOUR_JWT_TOKEN

Query Parameters (optional):
page: 1
limit: 10
```

### 2.4 Get Specific Analysis
```
GET http://localhost:3001/api/face/analysis/ANALYSIS_ID

Headers:
Authorization: Bearer YOUR_JWT_TOKEN

Replace ANALYSIS_ID with the actual ID from previous response
```

### 2.5 Get Color Palette
```
GET http://localhost:3001/api/face/analysis/ANALYSIS_ID/colors

Headers:
Authorization: Bearer YOUR_JWT_TOKEN
```

### 2.6 Get Face Measurements
```
GET http://localhost:3001/api/face/analysis/ANALYSIS_ID/measurements

Headers:
Authorization: Bearer YOUR_JWT_TOKEN
```

### 2.7 Delete Analysis
```
DELETE http://localhost:3001/api/face/analysis/ANALYSIS_ID

Headers:
Authorization: Bearer YOUR_JWT_TOKEN
```

## 🔧 Troubleshooting

### Common Errors:

**1. "Not authorized to access this route"**
- Make sure you include the Authorization header
- Check that your JWT token is valid and not expired

**2. "No file uploaded"**
- Ensure you're using form-data in Postman
- Field name must be exactly "faceImage"
- Make sure you selected a file

**3. "Only image files are allowed"**
- Check file format (must be jpeg, jpg, png, gif, bmp, or webp)
- Verify the file is not corrupted

**4. "File too large"**
- Image must be under 10MB
- Consider compressing the image

**5. "Image too small"**
- Image must be at least 200x200 pixels
- Use a higher resolution image

## 📊 Testing Different Images

### Good Test Images:
- Clear, well-lit face photos
- Front-facing portraits
- High resolution (at least 400x400px)
- Single person in frame

### Images to Avoid:
- Group photos with multiple faces
- Very dark or blurry images
- Side profiles or angled faces
- Images with heavy filters or makeup

## 🎯 Expected Analysis Results

The API will analyze and return:

### Colors:
- **Hair Color:** black, brown, blonde, red, gray, white
- **Skin Tone:** fair, light, medium, olive, tan, dark, deep
- **Eye Color:** blue, green, brown, hazel, gray, amber
- **Lip Color:** pink, red, coral, nude, berry

### Face Shape:
- oval, round, square, heart, diamond, oblong, triangle

### Features:
- Eye shape, nose shape, lip shape
- Face dimensions and ratios
- Symmetry analysis

## 📝 Sample Postman Collection

You can create a Postman collection with these requests:

1. **Auth Folder:**
   - Register User
   - Login User

2. **Face Analysis Folder:**
   - Test API
   - Analyze Face
   - Get History
   - Get Analysis
   - Get Colors
   - Get Measurements
   - Delete Analysis

## 🌐 Viewing Uploaded Images

After successful upload, you can view the image at:
```
http://localhost:3001/uploads/face-images/FILENAME
```

The filename is returned in the `imageUrl` field of the analysis response.

## 📱 Mobile App Integration

For mobile apps, use the same endpoints with:
- JWT token in Authorization header
- FormData for file uploads
- Handle multipart/form-data content type

Example JavaScript/React Native:
```javascript
const formData = new FormData();
formData.append('faceImage', {
  uri: imageUri,
  type: 'image/jpeg',
  name: 'face.jpg'
});

fetch('http://localhost:3001/api/face/analyze', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData
});
```
