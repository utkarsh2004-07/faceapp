# Complete Face Analysis & Color Recommendation API Reference

## 🚀 **Base Configuration**

**Base URL:** `http://192.168.1.100:3001/api`  
**Authentication:** All endpoints require `Authorization: Bearer <jwt_token>`  
**Content-Type:** `application/json` (unless specified otherwise)

---

## 📸 **FACE ANALYSIS APIs**

### **1. Upload and Analyze Face (Legacy)**
```http
POST /api/face/analyze
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body: FormData with image file
```

**Response:**
```json
{
  "success": true,
  "message": "Face analysis completed successfully",
  "data": {
    "analysisId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "imageUrl": "https://res.cloudinary.com/...",
    "faceDetected": true,
    "colors": {
      "hairColor": { "name": "Brown", "hex": "#8B4513", "confidence": 0.85 },
      "skinTone": { "name": "Medium", "hex": "#DEB887", "confidence": 0.92 },
      "eyeColor": { "name": "Brown", "hex": "#654321", "confidence": 0.78 },
      "lipColor": { "name": "Natural Pink", "hex": "#FFB6C1", "confidence": 0.81 }
    },
    "dimensions": { "faceWidth": 180, "faceHeight": 220 },
    "features": { "eyeShape": "almond", "faceShape": "oval" }
  }
}
```

### **2. Analyze Face from Image URL (Simplest - Recommended)**
```http
POST /api/face/analyze-url
Content-Type: application/json
Authorization: Bearer <token>

{
  "imageUrl": "https://res.cloudinary.com/dy1tsskkm/image/upload/v1234567890/faceapp-uploads/face-user123.jpg",
  "originalFileName": "face.jpg"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Face analysis completed successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "imageUrl": "https://res.cloudinary.com/...",
    "faceDetected": true,
    "colors": { /* same as above */ },
    "faceDimensions": { /* face measurements */ },
    "facialFeatures": { /* facial features */ }
  }
}
```

### **3. Analyze Face from Cloudinary (Direct Upload)**
```http
POST /api/face/analyze-direct
Content-Type: application/json
Authorization: Bearer <token>

{
  "publicId": "face-user123-1752148959",
  "imageUrl": "https://res.cloudinary.com/dy1tsskkm/image/upload/...",
  "originalFileName": "face.jpg",
  "imageData": {
    "width": 1200,
    "height": 1200,
    "bytes": 245760,
    "format": "jpg"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Face analysis completed successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "imageUrl": "https://res.cloudinary.com/...",
    "faceDetected": true,
    "colors": { /* same as above */ },
    "faceDimensions": { /* face measurements */ },
    "facialFeatures": { /* facial features */ }
  }
}
```

### **3. Get Face Analysis History**
```http
GET /api/face/history
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analyses": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "imageUrl": "https://res.cloudinary.com/...",
        "faceDetected": true,
        "colors": { /* color data */ },
        "createdAt": "2024-01-01T10:00:00.000Z"
      }
    ],
    "count": 5
  }
}
```

### **4. Get Specific Face Analysis**
```http
GET /api/face/analysis/:id
Authorization: Bearer <token>
```

### **5. Delete Face Analysis**
```http
DELETE /api/face/analysis/:id
Authorization: Bearer <token>
```

### **6. Get Color Palette**
```http
GET /api/face/analysis/:id/colors
Authorization: Bearer <token>
```

### **7. Get Face Measurements**
```http
GET /api/face/analysis/:id/measurements
Authorization: Bearer <token>
```

---

## 🎨 **COLOR RECOMMENDATION APIs**

### **1. Generate Color Recommendations (Gemini AI)**
```http
POST /api/face/analysis/:id/recommendations
Content-Type: application/json
Authorization: Bearer <token>

{
  "preferences": {
    "style": "casual",      // casual|formal|business|evening
    "occasion": "everyday", // everyday|work|party|date
    "season": "spring"      // spring|summer|autumn|winter
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Generated new recommendations",
  "data": {
    "recommendationId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "faceAnalysisId": "64f8a1b2c3d4e5f6a7b8c9d1",
    "aiService": "gemini",
    "processingTime": 2500,
    "cached": false,
    "outfits": [
      {
        "outfitName": "Casual Everyday",
        "shirt": {
          "color": "Navy Blue",
          "hex": "#1e3a8a",
          "reason": "Complements your skin tone and creates nice contrast"
        },
        "pants": {
          "color": "Khaki",
          "hex": "#c3b091",
          "reason": "Neutral tone that works with your warm undertones"
        },
        "shoes": {
          "color": "Brown Leather",
          "hex": "#8b4513",
          "reason": "Earthy tone that ties the outfit together"
        },
        "overallReason": "This combination creates a balanced, approachable look"
      }
    ],
    "colorPalette": {
      "seasonalType": "Warm Autumn",
      "primaryColors": ["#8b4513", "#d2691e", "#cd853f"],
      "accentColors": ["#1e3a8a", "#228b22"],
      "neutralColors": ["#f5f5dc", "#deb887", "#d2b48c"]
    },
    "advice": {
      "general": "Your warm undertones work best with earth tones",
      "colorsToAvoid": ["Very bright pinks", "Cool blues"],
      "seasonalTips": "In autumn, embrace deeper, richer colors"
    },
    "confidence": 0.92
  }
}
```

### **2. Regenerate Color Recommendations**
```http
POST /api/face/analysis/:id/recommendations/regenerate
Content-Type: application/json
Authorization: Bearer <token>

{
  "preferences": {
    "style": "formal",
    "occasion": "work",
    "season": "autumn"
  }
}
```

**Response:** Same structure as generate recommendations

### **3. Get Recommendation History**
```http
GET /api/face/recommendations/history?limit=10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "faceAnalysisId": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
          "colors": { /* face analysis colors */ },
          "createdAt": "2024-01-01T11:00:00.000Z"
        },
        "recommendations": [ /* outfit recommendations */ ],
        "colorPalette": { /* color palette */ },
        "userRating": 5,
        "createdAt": "2024-01-01T12:00:00.000Z"
      }
    ],
    "count": 5
  }
}
```

### **4. Get Most Recent Recommendation**
```http
GET /api/face/recommendations/latest
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "faceAnalysisId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "colors": { /* face analysis colors */ },
      "facialFeatures": { /* face features */ },
      "createdAt": "2024-01-01T11:00:00.000Z"
    },
    "recommendations": [ /* outfit recommendations */ ],
    "colorPalette": { /* color palette */ },
    "generalAdvice": "Your warm undertones work best with earth tones.",
    "userRating": 5,
    "confidence": 0.9,
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### **5. Add User Feedback**
```http
POST /api/face/recommendations/:id/feedback
Content-Type: application/json
Authorization: Bearer <token>

{
  "rating": 5,
  "feedback": "Great color recommendations! Love the combinations.",
  "favoriteOutfits": [0, 1]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feedback added successfully",
  "data": {
    "recommendationId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "userRating": 5,
    "feedback": "Great color recommendations!",
    "favoriteOutfits": [0, 1],
    "updatedAt": "2024-01-01T13:00:00.000Z"
  }
}
```

---

## 📤 **UPLOAD APIs**

### **1. Generate Mobile Upload Signature**
```http
POST /api/upload/mobile-signature
Content-Type: application/json
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "signature": "generated_signature_here",
  "timestamp": 1752148959,
  "public_id": "face-user123-1752148959-145365044",
  "api_key": "your_api_key",
  "cloud_name": "dy1tsskkm",
  "upload_url": "https://api.cloudinary.com/v1_1/dy1tsskkm/image/upload",
  "allowed_formats": "jpg,jpeg,png,gif,bmp,webp",
  "folder": "faceapp-uploads",
  "tags": "face-analysis,auto-delete,user-123",
  "transformation": "q_auto:good,f_auto,w_1200,h_1200,c_limit"
}
```

### **2. Generate Standard Upload Signature**
```http
POST /api/upload/signature
Content-Type: application/json
Authorization: Bearer <token>
```

### **3. Get Upload Configuration**
```http
GET /api/upload/config
Authorization: Bearer <token>
```

### **4. Verify Upload**
```http
POST /api/upload/verify
Content-Type: application/json
Authorization: Bearer <token>

{
  "publicId": "face-user123-1752148959",
  "version": "1234567890",
  "signature": "upload_signature"
}
```

---

## 🔍 **UTILITY APIs**

### **1. API Health Check**
```http
GET /api/health
```

### **2. Face Analysis API Info**
```http
GET /api/face/info
Authorization: Bearer <token>
```

---

## 📱 **MOBILE APP WORKFLOW**

### **Complete Integration Example:**

```javascript
// 1. Get upload signature
const getUploadSignature = async () => {
  const response = await fetch('http://192.168.1.100:3001/api/upload/mobile-signature', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// 2. Upload to Cloudinary
const uploadToCloudinary = async (imageFile) => {
  const signatureData = await getUploadSignature();
  
  const formData = new FormData();
  formData.append('file', imageFile);
  formData.append('signature', signatureData.signature);
  formData.append('timestamp', signatureData.timestamp);
  formData.append('public_id', signatureData.public_id);
  formData.append('api_key', signatureData.api_key);
  formData.append('folder', signatureData.folder);
  formData.append('tags', signatureData.tags);
  formData.append('transformation', signatureData.transformation);
  
  const response = await fetch(signatureData.upload_url, {
    method: 'POST',
    body: formData
  });
  
  return response.json();
};

// 3. Analyze face from Cloudinary (SIMPLEST METHOD)
const analyzeFaceFromUrl = async (cloudinaryResult) => {
  const response = await fetch('http://192.168.1.100:3001/api/face/analyze-url', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      imageUrl: cloudinaryResult.secure_url,
      originalFileName: 'face.jpg'
    })
  });

  return response.json();
};

// 4. Get color recommendations
const getColorRecommendations = async (analysisId) => {
  const response = await fetch(`http://192.168.1.100:3001/api/face/analysis/${analysisId}/recommendations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      preferences: {
        style: 'casual',
        occasion: 'everyday',
        season: 'spring'
      }
    })
  });
  
  return response.json();
};

// 5. Complete workflow
const completeWorkflow = async (imageFile) => {
  try {
    // Upload image
    const uploadResult = await uploadToCloudinary(imageFile);
    console.log('✅ Image uploaded:', uploadResult.secure_url);
    
    // Analyze face (using simple URL method)
    const analysisResult = await analyzeFaceFromUrl(uploadResult);
    const analysisId = analysisResult.data._id;
    console.log('✅ Face analyzed:', analysisId);
    
    // Get recommendations
    const recommendations = await getColorRecommendations(analysisId);
    console.log('🎨 Recommendations:', recommendations.data.outfits.length, 'outfits');
    
    return {
      analysis: analysisResult.data,
      recommendations: recommendations.data
    };
    
  } catch (error) {
    console.error('❌ Workflow error:', error);
    throw error;
  }
};
```

---

## ⚡ **RATE LIMITS**

| Endpoint | Limit | Window |
|----------|-------|--------|
| Face Analysis | 50 requests | 1 hour |
| Color Recommendations | 30 requests | 1 hour |
| Recommendation Regeneration | 10 requests | 1 hour |
| Upload Signature | 100 requests | 1 hour |
| Other endpoints | 200 requests | 1 hour |

---

## 🚨 **ERROR HANDLING**

### **Common Error Responses:**

```json
{
  "success": false,
  "message": "Face analysis not found",
  "error": "ANALYSIS_NOT_FOUND"
}
```

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "publicId",
      "message": "Public ID is required"
    }
  ]
}
```

```json
{
  "success": false,
  "message": "Rate limit exceeded",
  "retryAfter": 3600
}
```

---

## 🎯 **QUICK REFERENCE**

### **Key Points:**
- ✅ All endpoints require JWT authentication
- ✅ Use `/analyze-direct` for Cloudinary uploads
- ✅ Analysis ID can be `analysisId` or `_id` depending on endpoint
- ✅ Color recommendations use Gemini AI
- ✅ Recommendations are cached for 24 hours
- ✅ User feedback improves future recommendations

### **Environment Variables Required:**
```env
CLOUDINARY_CLOUD_NAME=dy1tsskkm
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GEMINI_API_KEY=your_gemini_api_key
```

**This is your complete API reference for Face Analysis and Color Recommendations!** 🚀📱
