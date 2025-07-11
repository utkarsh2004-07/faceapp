# 🎨 Color Recommendation API Guide

## Overview

The Color Recommendation API uses AI-powered analysis to provide personalized clothing color suggestions based on face analysis data. The system integrates with Google Gemini AI to deliver intelligent color combinations for shirts, pants, and shoes.

## Features

- 🤖 **AI-Powered Recommendations** - Uses Google Gemini AI for intelligent color suggestions
- 🎯 **Personalized Results** - Based on skin tone, hair color, eye color, and face shape
- 💾 **Persistent Storage** - Recommendations saved for future access
- 📊 **User Feedback** - Rating and favorite outfit tracking
- 🔄 **Regeneration** - Ability to generate new recommendations
- ⚡ **Fallback System** - Works even without AI service configured

## API Endpoints

### 1. Generate Color Recommendations

**Endpoint:** `POST /api/face/analysis/:id/recommendations`

**Description:** Generate AI-powered color recommendations for a face analysis.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "preferences": {
    "style": "casual|formal|business|evening",
    "occasion": "everyday|work|party|date",
    "season": "spring|summer|autumn|winter"
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
      "bestColors": ["#1e3a8a", "#c3b091", "#8b4513"],
      "avoidColors": ["#ff0000", "#ffff00"],
      "seasonalType": "Autumn"
    },
    "advice": "Based on your warm undertones, these colors will enhance your natural features...",
    "confidence": 0.85,
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### 2. Regenerate Recommendations

**Endpoint:** `POST /api/face/analysis/:id/recommendations/regenerate`

**Description:** Force generation of new recommendations (bypasses cache).

**Headers:** Same as above

**Request Body:** Same as above

**Response:** Same structure as generate recommendations

### 3. Get Recommendation History

**Endpoint:** `GET /api/face/recommendations/history`

**Description:** Get user's color recommendation history.

**Query Parameters:**
- `limit` (optional): Number of recommendations to return (default: 10)

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
          "facialFeatures": { /* face features */ },
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

### 4. Get Most Recent Recommendation

**Endpoint:** `GET /api/face/recommendations/latest`

**Description:** Get user's most recent color recommendation. This endpoint always returns the newest recommendation from the user's history, making it perfect for displaying the current/latest color analysis results.

**Headers:** Same as above

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "faceAnalysisId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "colors": {
        "dominantColors": ["#8B4513", "#D2691E"],
        "skinTone": "#F5DEB3",
        "eyeColor": "#8B4513",
        "hairColor": "#654321"
      },
      "facialFeatures": {
        "faceShape": "oval",
        "eyeShape": "almond"
      },
      "createdAt": "2024-01-01T11:00:00.000Z"
    },
    "recommendations": [
      {
        "outfitName": "Professional Business Look",
        "shirt": {
          "color": "Navy Blue",
          "hex": "#000080",
          "reason": "Complements your warm skin tone"
        },
        "pants": {
          "color": "Charcoal Gray",
          "hex": "#36454F",
          "reason": "Classic neutral that works with navy"
        },
        "shoes": {
          "color": "Brown Leather",
          "hex": "#8B4513",
          "reason": "Matches your eye color beautifully"
        },
        "overallReason": "This combination enhances your natural coloring"
      }
    ],
    "colorPalette": {
      "bestColors": ["#000080", "#8B4513", "#228B22"],
      "avoidColors": ["#FF69B4", "#00FFFF"],
      "seasonalType": "Autumn"
    },
    "generalAdvice": "Your warm undertones work best with earth tones and deep colors.",
    "userRating": 5,
    "confidence": 0.9,
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**Response (No Recommendations Found):**
```json
{
  "success": false,
  "message": "No color recommendations found for this user"
}
```

### 5. Add User Feedback

**Endpoint:** `POST /api/face/recommendations/:id/feedback`

**Description:** Add user rating and feedback to recommendations.

**Request Body:**
```json
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
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "userRating": 5,
    "userFeedback": "Great color recommendations! Love the combinations.",
    "favoriteOutfits": [0, 1]
  }
}
```

## Complete Workflow Example

### Step 1: Upload and Analyze Face Image

```bash
curl -X POST http://localhost:3001/api/face/analyze \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "faceImage=@path/to/face-image.jpg"
```

### Step 2: Generate Color Recommendations

```bash
curl -X POST http://localhost:3001/api/face/analysis/ANALYSIS_ID/recommendations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "style": "casual",
      "occasion": "everyday"
    }
  }'
```

### Step 3: Add User Feedback

```bash
curl -X POST http://localhost:3001/api/face/recommendations/RECOMMENDATION_ID/feedback \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "feedback": "Perfect color combinations!",
    "favoriteOutfits": [0, 2]
  }'
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Google Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
```

### Getting Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file

## Rate Limiting

- **Color Recommendations:** 30 requests per hour
- **Recommendation Regeneration:** 10 requests per hour
- **Other endpoints:** Standard rate limits apply

## Error Handling

### Common Error Responses

**Face Analysis Not Found:**
```json
{
  "success": false,
  "message": "Face analysis not found"
}
```

**Invalid Rating:**
```json
{
  "success": false,
  "message": "Rating must be between 1 and 5"
}
```

**Rate Limit Exceeded:**
```json
{
  "success": false,
  "message": "Too many color recommendation requests"
}
```

## Testing

Run the comprehensive test suite:

```bash
node test-color-recommendations.js
```

This will test:
- User registration and authentication
- Face image analysis
- Color recommendation generation
- Recommendation caching and regeneration
- User feedback system
- Recommendation history

## Data Models

### Color Recommendation Structure

```javascript
{
  userId: ObjectId,
  faceAnalysisId: ObjectId,
  aiService: "gemini" | "fallback",
  recommendations: [
    {
      outfitName: String,
      shirt: { color: String, hex: String, reason: String },
      pants: { color: String, hex: String, reason: String },
      shoes: { color: String, hex: String, reason: String },
      overallReason: String
    }
  ],
  colorPalette: {
    bestColors: [String],
    avoidColors: [String],
    seasonalType: String
  },
  generalAdvice: String,
  userRating: Number,
  userFeedback: String,
  favoriteOutfits: [Number],
  confidence: Number,
  processingTime: Number
}
```

## Best Practices

1. **Cache Management:** Recommendations are automatically cached per face analysis
2. **User Experience:** Always show loading states during AI processing
3. **Fallback Handling:** System gracefully handles AI service unavailability
4. **Feedback Collection:** Encourage users to rate recommendations for improvement
5. **Error Recovery:** Implement retry logic for temporary AI service failures

## Support

For issues or questions:
- Check server logs for detailed error information
- Verify Gemini API key configuration
- Ensure face analysis completed successfully before requesting recommendations
- Monitor rate limiting to avoid request throttling
