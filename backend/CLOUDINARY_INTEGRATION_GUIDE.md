# Cloudinary Integration Guide

## Overview

This backend now uses Cloudinary for image storage instead of local file storage. This provides several benefits:

- **Scalable Storage**: No local disk space limitations
- **Global CDN**: Fast image delivery worldwide
- **Automatic Optimization**: Images are automatically optimized for web delivery
- **Automatic Cleanup**: Images are automatically deleted after 5-6 days
- **Better Performance**: Reduced server load and faster response times

## Configuration

### Environment Variables

Add the following variables to your `.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dy1tsskkm
CLOUDINARY_API_KEY=your_cloudinary_api_key_here
CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here
CLOUDINARY_FOLDER=faceapp-uploads
CLOUDINARY_AUTO_DELETE_DAYS=5
```

### Getting Cloudinary Credentials

1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Go to your Dashboard
3. Copy your Cloud Name, API Key, and API Secret
4. Replace the placeholder values in your `.env` file

## Implementation Details

### Key Changes

1. **Upload Middleware** (`middleware/upload.js`):
   - Now uploads to Cloudinary instead of local storage
   - Maintains the same interface for backward compatibility
   - Automatically validates images before upload
   - Cleans up temporary files after upload

2. **Face Analysis Service** (`utils/faceAnalysisService.js`):
   - Updated to work with Cloudinary URLs
   - Can process images from URLs instead of just local files

3. **Face Analysis Controller** (`controllers/faceAnalysisController.js`):
   - Stores Cloudinary URLs in the database
   - Includes Cloudinary metadata in analysis records
   - Handles cleanup on errors

4. **Server Configuration** (`server.js`):
   - Removed static file serving (no longer needed)

### New Cloudinary Service

The `utils/cloudinaryService.js` provides:

- **Image Upload**: Uploads with automatic optimization
- **Image Deletion**: Manual and automatic cleanup
- **URL Generation**: Optimized URLs for different use cases
- **Metadata Retrieval**: Get image information
- **Validation**: Pre-upload image validation

## API Usage

### Upload and Analyze Face Image

**Endpoint**: `POST /api/face/analyze`

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

**Body**:
```
faceImage: [image file]
```

**Response**:
```json
{
  "success": true,
  "message": "Face analysis completed successfully",
  "data": {
    "_id": "analysis_id",
    "imageUrl": "https://res.cloudinary.com/dy1tsskkm/image/upload/v1234567890/faceapp-uploads/face-123.jpg",
    "faceDetected": true,
    "colors": { /* color analysis */ },
    "analysisMetadata": {
      "cloudinaryPublicId": "faceapp-uploads/face-123",
      "autoDeleteDate": "2024-01-06T12:00:00.000Z",
      "storageProvider": "cloudinary"
    }
  }
}
```

## Testing

### Test Cloudinary Configuration

Run the test script:

```bash
node test-cloudinary.js
```

This will verify:
- Cloudinary configuration
- Image validation functionality
- Cleanup functionality

### Test Face Analysis Endpoint

Use curl to test the complete flow:

```bash
curl -X POST http://localhost:3001/api/face/analyze \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "faceImage=@path/to/test-image.jpg"
```

## Storage Management

### Automatic Deletion

Images are automatically scheduled for deletion after 5-6 days (configurable via `CLOUDINARY_AUTO_DELETE_DAYS`).

**How it works**:
1. When an image is uploaded, a deletion date is calculated
2. The deletion date is stored in Cloudinary metadata
3. A cleanup process can be run to delete expired images

### Manual Cleanup

To manually clean up old images:

```javascript
const cloudinaryService = require('./utils/cloudinaryService');
await cloudinaryService.cleanupOldImages();
```

### Production Considerations

For production environments, consider:

1. **Job Queue**: Use a job queue (Bull, Agenda) instead of setTimeout for deletion scheduling
2. **Cron Jobs**: Set up cron jobs to run cleanup regularly
3. **Monitoring**: Monitor Cloudinary usage and costs
4. **Backup**: Consider backing up important images before deletion

## Benefits of This Approach

### Storage Management
- ✅ **Automatic cleanup**: No manual intervention needed
- ✅ **Scalable**: No server disk space limitations
- ✅ **Cost-effective**: Only pay for what you use
- ✅ **Global delivery**: Fast access worldwide

### Performance
- ✅ **Reduced server load**: No file serving from your server
- ✅ **Optimized delivery**: Automatic format and quality optimization
- ✅ **CDN benefits**: Cached delivery from edge locations

### Maintenance
- ✅ **No local cleanup**: No need to manage local file storage
- ✅ **Automatic optimization**: Images optimized for web delivery
- ✅ **Backup included**: Cloudinary provides redundancy

## Troubleshooting

### Common Issues

1. **Configuration Error**: Ensure all Cloudinary environment variables are set
2. **Upload Failures**: Check API key permissions and account limits
3. **Image Not Found**: Verify the Cloudinary URL is accessible
4. **Cleanup Issues**: Check Cloudinary API limits and permissions

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

This will show detailed error messages and upload progress.

## Migration from Local Storage

If you have existing local images, you can migrate them:

1. Upload existing images to Cloudinary
2. Update database records with new Cloudinary URLs
3. Remove local image files
4. Update any hardcoded local paths

The implementation maintains backward compatibility, so existing code should work without changes.

---

# Frontend/Mobile App Integration Guide

## Overview

This section provides complete integration instructions for frontend applications (React, React Native, Flutter, etc.) to use direct Cloudinary uploads with automatic compression.

## Direct Upload Flow

### 1. Get Upload Configuration

**Endpoint**: `GET /api/upload/config`

```javascript
// Get upload configuration
const getUploadConfig = async () => {
  const response = await fetch('/api/upload/config', {
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });
  return response.json();
};
```

**Response**:
```json
{
  "success": true,
  "data": {
    "cloudName": "dy1tsskkm",
    "uploadUrl": "https://api.cloudinary.com/v1_1/dy1tsskkm/image/upload",
    "maxFileSize": 10485760,
    "allowedFormats": ["jpg", "jpeg", "png", "gif", "bmp", "webp"],
    "minDimensions": { "width": 200, "height": 200 },
    "compression": {
      "quality": "auto:good",
      "maxWidth": 1200,
      "maxHeight": 1200
    },
    "autoDeleteDays": 5
  }
}
```

### 2. Generate Signed Upload Parameters

**Endpoint**: `POST /api/upload/signature`

```javascript
// Generate signed upload parameters
const getUploadSignature = async () => {
  const response = await fetch('/api/upload/signature', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

**Response**:
```json
{
  "success": true,
  "data": {
    "signature": "abc123...",
    "timestamp": 1640995200,
    "publicId": "face-user123-1640995200-987654321",
    "cloudName": "dy1tsskkm",
    "apiKey": "845224528141188",
    "uploadUrl": "https://api.cloudinary.com/v1_1/dy1tsskkm/image/upload",
    "formData": {
      "public_id": "face-user123-1640995200-987654321",
      "folder": "faceapp-uploads",
      "timestamp": 1640995200,
      "signature": "abc123...",
      "api_key": "845224528141188",
      "transformation": "[{\"quality\":\"auto:good\",\"fetch_format\":\"auto\",\"width\":1200,\"height\":1200,\"crop\":\"limit\"}]",
      "tags": "face-analysis,auto-delete,user-123",
      "context": "user_id=123|original_upload=true|upload_date=2024-01-01T12:00:00.000Z|auto_delete_date=2024-01-06T12:00:00.000Z|source=direct-upload|compressed=true",
      "resource_type": "image",
      "allowed_formats": "jpg,jpeg,png,gif,bmp,webp"
    },
    "autoDeleteDate": "2024-01-06T12:00:00.000Z"
  }
}
```

### 3. Upload Image Directly to Cloudinary

#### React/JavaScript Example

```javascript
const uploadImageToCloudinary = async (imageFile) => {
  try {
    // Step 1: Get upload signature
    const signatureResponse = await getUploadSignature();
    if (!signatureResponse.success) {
      throw new Error('Failed to get upload signature');
    }

    const { formData, uploadUrl } = signatureResponse.data;

    // Step 2: Create FormData for upload
    const uploadFormData = new FormData();

    // Add all required fields
    Object.keys(formData).forEach(key => {
      uploadFormData.append(key, formData[key]);
    });

    // Add the image file
    uploadFormData.append('file', imageFile);

    // Step 3: Upload to Cloudinary
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: uploadFormData
    });

    if (!uploadResponse.ok) {
      throw new Error('Upload failed');
    }

    const uploadResult = await uploadResponse.json();

    return {
      success: true,
      data: {
        publicId: uploadResult.public_id,
        url: uploadResult.secure_url,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
        version: uploadResult.version,
        signature: uploadResult.signature,
        timestamp: uploadResult.created_at
      }
    };

  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
```

#### React Native Example

```javascript
const uploadImageToCloudinary = async (imageUri) => {
  try {
    // Step 1: Get upload signature
    const signatureResponse = await getUploadSignature();
    if (!signatureResponse.success) {
      throw new Error('Failed to get upload signature');
    }

    const { formData, uploadUrl } = signatureResponse.data;

    // Step 2: Create FormData for upload
    const uploadFormData = new FormData();

    // Add all required fields
    Object.keys(formData).forEach(key => {
      uploadFormData.append(key, formData[key]);
    });

    // Add the image file
    uploadFormData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'face-image.jpg'
    });

    // Step 3: Upload to Cloudinary
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: uploadFormData,
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });

    const uploadResult = await uploadResponse.json();

    if (uploadResult.error) {
      throw new Error(uploadResult.error.message);
    }

    return {
      success: true,
      data: {
        publicId: uploadResult.public_id,
        url: uploadResult.secure_url,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
        version: uploadResult.version,
        signature: uploadResult.signature,
        timestamp: uploadResult.created_at
      }
    };

  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
```

### 4. Verify Upload (Optional but Recommended)

```javascript
const verifyUpload = async (uploadData) => {
  const response = await fetch('/api/upload/verify', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      publicId: uploadData.publicId,
      version: uploadData.version,
      signature: uploadData.signature,
      timestamp: uploadData.timestamp
    })
  });
  return response.json();
};
```

### 5. Analyze Face from Direct Upload

```javascript
const analyzeFaceFromDirectUpload = async (uploadData, originalFileName) => {
  const response = await fetch('/api/face/analyze-direct', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      publicId: uploadData.publicId,
      imageUrl: uploadData.url,
      originalFileName: originalFileName,
      imageData: {
        width: uploadData.width,
        height: uploadData.height,
        bytes: uploadData.bytes,
        format: uploadData.format
      }
    })
  });
  return response.json();
};
```

## Complete Integration Example

### React Component

```jsx
import React, { useState } from 'react';

const FaceAnalysisUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      // Upload to Cloudinary
      const uploadResult = await uploadImageToCloudinary(file);
      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      setUploading(false);
      setAnalyzing(true);

      // Analyze face
      const analysisResult = await analyzeFaceFromDirectUpload(
        uploadResult.data,
        file.name
      );

      if (!analysisResult.success) {
        throw new Error(analysisResult.message);
      }

      setResult(analysisResult.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        disabled={uploading || analyzing}
      />

      {uploading && <p>Uploading image...</p>}
      {analyzing && <p>Analyzing face...</p>}
      {error && <p style={{color: 'red'}}>Error: {error}</p>}

      {result && (
        <div>
          <h3>Analysis Complete!</h3>
          <img src={result.imageUrl} alt="Analyzed face" style={{maxWidth: '300px'}} />
          <p>Face detected: {result.faceDetected ? 'Yes' : 'No'}</p>
          {result.colors && (
            <div>
              <p>Hair color: {result.colors.hairColor?.primary}</p>
              <p>Skin tone: {result.colors.skinTone?.primary}</p>
              <p>Eye color: {result.colors.eyeColor?.primary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FaceAnalysisUpload;
```

### React Native Component

```jsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const FaceAnalysisUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      await handleImageUpload(result.assets[0]);
    }
  };

  const handleImageUpload = async (imageAsset) => {
    try {
      setUploading(true);

      // Upload to Cloudinary
      const uploadResult = await uploadImageToCloudinary(imageAsset.uri);
      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      setUploading(false);
      setAnalyzing(true);

      // Analyze face
      const analysisResult = await analyzeFaceFromDirectUpload(
        uploadResult.data,
        'face-image.jpg'
      );

      if (!analysisResult.success) {
        throw new Error(analysisResult.message);
      }

      setResult(analysisResult.data);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TouchableOpacity
        onPress={pickImage}
        disabled={uploading || analyzing}
        style={{
          backgroundColor: '#007AFF',
          padding: 15,
          borderRadius: 8,
          alignItems: 'center'
        }}
      >
        <Text style={{ color: 'white', fontSize: 16 }}>
          {uploading ? 'Uploading...' : analyzing ? 'Analyzing...' : 'Select Image'}
        </Text>
      </TouchableOpacity>

      {result && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Analysis Complete!</Text>
          <Image
            source={{ uri: result.imageUrl }}
            style={{ width: 200, height: 200, marginTop: 10 }}
          />
          <Text>Face detected: {result.faceDetected ? 'Yes' : 'No'}</Text>
          {result.colors && (
            <View style={{ marginTop: 10 }}>
              <Text>Hair color: {result.colors.hairColor?.primary}</Text>
              <Text>Skin tone: {result.colors.skinTone?.primary}</Text>
              <Text>Eye color: {result.colors.eyeColor?.primary}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default FaceAnalysisUpload;
```

## Image Compression Features

### Automatic Compression

All uploaded images are automatically compressed with:
- **Quality**: `auto:good` (Cloudinary automatically optimizes)
- **Format**: `auto` (Cloudinary chooses best format - WebP, AVIF, etc.)
- **Size limit**: Maximum 1200x1200px (larger images are downscaled)
- **File size**: Significantly reduced while maintaining quality

### Multiple Image Variants

Each uploaded image automatically gets multiple optimized versions:

```javascript
// Get different image variants
const getImageVariants = (publicId) => {
  const baseUrl = `https://res.cloudinary.com/dy1tsskkm/image/upload`;

  return {
    original: `${baseUrl}/${publicId}`,
    standard: `${baseUrl}/q_auto:good,f_auto,w_1200,h_1200,c_limit/${publicId}`,
    thumbnail: `${baseUrl}/q_auto:low,f_auto,w_300,h_300,c_fill,g_face/${publicId}`,
    webp: `${baseUrl}/q_auto:good,f_webp,w_1200,h_1200,c_limit/${publicId}`,
    avif: `${baseUrl}/q_auto:good,f_avif,w_1200,h_1200,c_limit/${publicId}`
  };
};
```

## Error Handling

### Common Errors and Solutions

1. **Upload Signature Failed**
   ```javascript
   // Check authentication token
   // Verify API endpoints are accessible
   ```

2. **Cloudinary Upload Failed**
   ```javascript
   // Check file size (max 10MB)
   // Verify file format is supported
   // Check network connection
   ```

3. **Image Too Small**
   ```javascript
   // Minimum dimensions: 200x200px
   // Use image picker with quality settings
   ```

4. **Analysis Failed**
   ```javascript
   // Verify image contains a face
   // Check image quality and lighting
   ```

## Security Considerations

1. **Signed Uploads**: All uploads use signed URLs for security
2. **User Authentication**: All endpoints require valid JWT tokens
3. **File Validation**: Server validates file types and sizes
4. **Auto Deletion**: Images automatically deleted after 5-6 days
5. **Rate Limiting**: Upload endpoints are rate-limited

## Performance Optimization

1. **Direct Upload**: No server storage, faster uploads
2. **CDN Delivery**: Images served from Cloudinary's global CDN
3. **Automatic Compression**: Reduced file sizes
4. **Format Optimization**: Best format chosen automatically
5. **Lazy Loading**: Use optimized URLs for better performance

## Testing

### Test the Integration

1. **Get upload config**: `GET /api/upload/config`
2. **Generate signature**: `POST /api/upload/signature`
3. **Upload to Cloudinary**: Direct upload with signed parameters
4. **Verify upload**: `POST /api/upload/verify`
5. **Analyze face**: `POST /api/face/analyze-direct`

### Example Test Script

```javascript
const testDirectUpload = async () => {
  try {
    // 1. Get config
    const config = await getUploadConfig();
    console.log('Config:', config);

    // 2. Get signature
    const signature = await getUploadSignature();
    console.log('Signature:', signature);

    // 3. Upload image (you need to provide an actual image file)
    // const uploadResult = await uploadImageToCloudinary(imageFile);
    // console.log('Upload result:', uploadResult);

    // 4. Analyze face
    // const analysisResult = await analyzeFaceFromDirectUpload(uploadResult.data, 'test.jpg');
    // console.log('Analysis result:', analysisResult);

  } catch (error) {
    console.error('Test failed:', error);
  }
};
```

## Migration from Server Upload

If you're migrating from server-side uploads:

1. **Update frontend code** to use direct upload flow
2. **Keep legacy endpoint** for backward compatibility
3. **Test thoroughly** with different image types and sizes
4. **Monitor performance** and error rates
5. **Update mobile apps** gradually

The new direct upload method is much faster and more efficient than the legacy server-side upload method.
