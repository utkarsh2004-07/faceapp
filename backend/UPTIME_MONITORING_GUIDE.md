# Uptime Monitoring Configuration Guide

## Overview

This document explains how to properly configure uptime monitoring for your Face App backend hosted on Render. The implementation includes special endpoints and rate limiting exceptions to ensure your server stays alive while maintaining security.

## Uptime Monitoring Endpoints

### Primary Health Check Endpoint
```
GET https://faceapp-ttwh.onrender.com/ping
```

This lightweight endpoint returns a simple JSON response:
```json
{
  "success": true,
  "message": "pong",
  "timestamp": "2023-12-25T12:34:56.789Z"
}
```

### Detailed Health Check Endpoint
```
GET https://faceapp-ttwh.onrender.com/api/health
```

This endpoint returns detailed server health information:
```json
{
  "success": true,
  "message": "Server is running successfully",
  "timestamp": "2023-12-25T12:34:56.789Z",
  "performance": {
    "requestCount": 1234,
    "averageResponseTime": 120,
    "errorRate": 0.02
  },
  "cache": {
    "status": "healthy",
    "memoryCache": true,
    "redisCache": false
  },
  "uptime": 3600,
  "memory": {
    "used": "120 MB",
    "total": "512 MB"
  }
}
```

## Configuring UptimeRobot

1. **Create a new monitor in UptimeRobot**
   - Type: HTTP(s)
   - Friendly Name: "Face App Backend"
   - URL: `https://faceapp-ttwh.onrender.com/ping`
   - Monitoring Interval: 5 minutes

2. **Advanced Settings**
   - Set HTTP Method to: GET
   - Follow redirects: Yes
   - Monitor timeout: 30 seconds
   - Enable "Alert when DOWN"
   - Set "Alert when back UP"

## Rate Limiting Configuration

The server has been configured to automatically detect and allow uptime monitoring requests without applying rate limits. This is done through:

1. **User-Agent Detection**: Common uptime monitoring services are detected by their user-agent strings
2. **Path-Based Exclusion**: Requests to `/ping` and `/api/health` bypass rate limiting
3. **IP Handling**: Improved IP detection for proxy environments like Render

## How It Works

1. When UptimeRobot or any monitoring service sends a request to `/ping`:
   - The request is identified as an uptime monitoring request
   - Rate limiting is bypassed for this request
   - A lightweight response is returned quickly
   - Render keeps your server instance alive

2. Regular API requests continue to be protected by rate limiting:
   - Global limit: 2000 requests per 15-minute window
   - Endpoint-specific limits for sensitive operations
   - IP-based rate limiting for unauthenticated requests
   - User ID-based rate limiting for authenticated requests

## Troubleshooting

If you're still experiencing rate limiting issues with uptime monitoring:

1. **Check User-Agent**: Ensure your monitoring service isn't using a custom user-agent that's not in our detection list
2. **Verify Endpoint**: Make sure you're using `/ping` or `/api/health` for monitoring
3. **Check Logs**: Look for "Rate limit error" messages in your server logs
4. **Adjust Frequency**: Reduce monitoring frequency if needed (5-10 minutes is recommended)

## Adding Custom Monitoring Services

If you're using a monitoring service not automatically detected, you can add its user-agent to the `uptimeMonitoringAgents` array in `middleware/advancedRateLimit.js`:

```javascript
const uptimeMonitoringAgents = [
  'uptimerobot',
  'pingdom',
  'statuscake',
  'site24x7',
  'monitor',
  'uptime',
  'healthcheck',
  'curl',
  'wget',
  // Add your custom monitoring service user-agent here
  'mycustommonitor'
];
```

## Best Practices

1. **Use the `/ping` endpoint** for regular uptime monitoring (lightweight)
2. **Use the `/api/health` endpoint** for detailed health checks (more resource-intensive)
3. **Set monitoring interval to 5+ minutes** to reduce unnecessary load
4. **Configure alerts** for downtime to be notified of issues
5. **Monitor response times** to detect performance degradation

## Security Considerations

The rate limiting bypass for uptime monitoring is designed to be secure:

1. It only affects specific health check endpoints
2. It requires matching specific patterns in the request
3. It doesn't disable other security measures like authentication
4. Regular API endpoints remain fully protected

By following this guide, your Face App backend will stay alive on Render while maintaining proper security through rate limiting for regular API usage.
