# API Documentation

## Hate Speech Detection Plugin API

This document provides comprehensive API documentation for the Hate Speech Detection Plugin.

## Base URL

```
http://localhost:3000/api/v1
```

## Authentication

The API supports optional API key authentication. Include the API key in the request headers:

```http
Authorization: Bearer your_api_key_here
```

## Rate Limiting

- **General endpoints**: 100 requests per 15 minutes
- **Analysis endpoints**: 10 requests per minute
- **Strict endpoints**: 5 requests per minute

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

## Error Handling

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Invalid API key |
| 404 | Not Found - Resource not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable - Health check failed |

---

## Endpoints

### 1. Text Analysis

Analyze text content for hate speech, toxicity, harassment, and profanity.

**Endpoint:** `POST /analysis/text`

**Request Body:**
```json
{
  "text": "string (required, 1-10000 characters)",
  "userId": "string (optional)",
  "platform": "string (optional)",
  "language": "string (optional, default: 'en')"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "analysis_1234567890_abc123",
    "content": "Your analyzed text",
    "contentType": "text",
    "analysis": {
      "hateSpeech": {
        "score": 25,
        "level": "low",
        "detected": false
      },
      "toxicity": {
        "score": 45,
        "level": "medium",
        "detected": true
      },
      "harassment": {
        "score": 10,
        "level": "low",
        "detected": false
      },
      "profanity": {
        "score": 30,
        "level": "low",
        "detected": true
      },
      "overallRisk": "warning",
      "confidence": 85,
      "flaggedWords": ["stupid", "annoying"],
      "suggestions": ["Consider reviewing content before publication"]
    },
    "metadata": {
      "userId": "user123",
      "platform": "myapp",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "processingTime": 1250
    }
  },
  "message": "Text analysis completed successfully"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/v1/analysis/text \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is a test message with some potentially offensive content",
    "userId": "user123",
    "platform": "myapp"
  }'
```

### 2. Image Analysis

Analyze image content for offensive material using OpenAI Vision API.

**Endpoint:** `POST /analysis/image`

**Request Body:**
```json
{
  "imageUrl": "string (required, valid URL)",
  "userId": "string (optional)",
  "platform": "string (optional)",
  "description": "string (optional, max 1000 characters)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "image_analysis_1234567890_abc123",
    "content": "https://example.com/image.jpg",
    "contentType": "image",
    "analysis": {
      "hateSpeech": {
        "score": 0,
        "level": "low",
        "detected": false
      },
      "toxicity": {
        "score": 20,
        "level": "low",
        "detected": false
      },
      "harassment": {
        "score": 0,
        "level": "low",
        "detected": false
      },
      "profanity": {
        "score": 0,
        "level": "low",
        "detected": false
      },
      "overallRisk": "safe",
      "confidence": 90,
      "flaggedWords": [],
      "suggestions": ["Content appears safe for publication"]
    },
    "metadata": {
      "userId": "user123",
      "platform": "myapp",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "processingTime": 2500
    }
  },
  "message": "Image analysis completed successfully"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/v1/analysis/image \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/image.jpg",
    "userId": "user123",
    "platform": "myapp",
    "description": "A photo of a peaceful landscape"
  }'
```

### 3. Analysis History

Retrieve analysis history with optional filtering.

**Endpoint:** `GET /analysis/history`

**Query Parameters:**
- `userId` (optional): Filter by user ID
- `platform` (optional): Filter by platform
- `limit` (optional): Number of results (default: 50, max: 100)
- `offset` (optional): Number of results to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "analyses": [
      {
        "id": "analysis_1234567890_abc123",
        "content": "Sample content",
        "contentType": "text",
        "analysis": { ... },
        "metadata": { ... },
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  },
  "message": "Analysis history retrieved successfully"
}
```

**Example Request:**
```bash
curl "http://localhost:3000/api/v1/analysis/history?userId=user123&limit=20&offset=0"
```

### 4. Get Analysis by ID

Retrieve a specific analysis by its ID.

**Endpoint:** `GET /analysis/{id}`

**Path Parameters:**
- `id` (required): Analysis ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "analysis_1234567890_abc123",
    "content": "Sample content",
    "contentType": "text",
    "analysis": { ... },
    "metadata": { ... },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Analysis retrieved successfully"
}
```

**Example Request:**
```bash
curl "http://localhost:3000/api/v1/analysis/analysis_1234567890_abc123"
```

### 5. Statistics

Get comprehensive statistics and analytics.

**Endpoint:** `GET /analysis/stats/overview`

**Query Parameters:**
- `userId` (optional): Filter by user ID
- `platform` (optional): Filter by platform
- `days` (optional): Number of days to analyze (default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalAnalyses": 1250,
    "detections": {
      "hateSpeech": 45,
      "toxicity": 120,
      "harassment": 30,
      "profanity": 200,
      "criticalRisk": 15
    },
    "rates": {
      "hateSpeechRate": "3.60",
      "toxicityRate": "9.60",
      "harassmentRate": "2.40",
      "profanityRate": "16.00",
      "criticalRiskRate": "1.20"
    },
    "performance": {
      "averageProcessingTime": 1250.5
    }
  },
  "message": "Statistics retrieved successfully"
}
```

**Example Request:**
```bash
curl "http://localhost:3000/api/v1/analysis/stats/overview?userId=user123&days=7"
```

### 6. Health Check

Check the health status of the service.

**Endpoint:** `GET /analysis/health`

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "1.0.0",
    "services": {
      "database": "connected",
      "textAnalysis": "available",
      "imageAnalysis": "available"
    }
  },
  "message": "Service is healthy"
}
```

**Example Request:**
```bash
curl "http://localhost:3000/api/v1/analysis/health"
```

### 7. Plugin Information

Get plugin information and capabilities.

**Endpoint:** `GET /plugin/info`

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "hate-speech-detection",
    "version": "1.0.0",
    "description": "AI-powered hate speech and offensive content detection",
    "endpoints": {
      "textAnalysis": "/api/v1/analysis/text",
      "imageAnalysis": "/api/v1/analysis/image",
      "healthCheck": "/api/v1/analysis/health",
      "statistics": "/api/v1/analysis/stats/overview",
      "history": "/api/v1/analysis/history"
    },
    "features": {
      "textAnalysis": true,
      "imageAnalysis": true,
      "realTimeAnalysis": true,
      "scoringSystem": "1-100 scale",
      "supportedLanguages": ["en", "es", "fr", "de", "it", "pt", "ru", "zh", "ja", "ko"]
    },
    "thresholds": {
      "hateSpeech": 70,
      "toxicity": 60,
      "harassment": 65,
      "profanity": 50
    }
  },
  "message": "Plugin information retrieved successfully"
}
```

**Example Request:**
```bash
curl "http://localhost:3000/api/v1/plugin/info"
```

---

## Data Models

### ContentAnalysisResult

```typescript
interface ContentAnalysisResult {
  id: string;
  content: string;
  contentType: 'text' | 'image';
  analysis: {
    hateSpeech: {
      score: number; // 1-100
      level: 'low' | 'medium' | 'high' | 'critical';
      detected: boolean;
    };
    toxicity: {
      score: number; // 1-100
      level: 'low' | 'medium' | 'high' | 'critical';
      detected: boolean;
    };
    harassment: {
      score: number; // 1-100
      level: 'low' | 'medium' | 'high' | 'critical';
      detected: boolean;
    };
    profanity: {
      score: number; // 1-100
      level: 'low' | 'medium' | 'high' | 'critical';
      detected: boolean;
    };
    overallRisk: 'safe' | 'warning' | 'danger' | 'critical';
    confidence: number; // 0-100
    flaggedWords?: string[];
    suggestions?: string[];
  };
  metadata: {
    userId?: string;
    platform?: string;
    timestamp: Date;
    processingTime: number;
  };
}
```

### Risk Levels

| Level | Score Range | Description |
|-------|-------------|-------------|
| `low` | 0-39 | Minimal risk, content appears safe |
| `medium` | 40-59 | Moderate risk, some concerns |
| `high` | 60-79 | High risk, significant concerns |
| `critical` | 80-100 | Critical risk, severe violations |

### Overall Risk Assessment

| Risk Level | Description | Action Recommended |
|------------|-------------|-------------------|
| `safe` | Content appears safe for publication | Allow |
| `warning` | Content may need review | Review before publishing |
| `danger` | Content likely violates guidelines | Block or require moderation |
| `critical` | Content contains severe violations | Block immediately |

---

## Integration Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

class HateSpeechDetector {
  constructor(baseUrl, apiKey) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async analyzeText(text, options = {}) {
    try {
      const response = await this.client.post('/api/v1/analysis/text', {
        text,
        ...options
      });
      return response.data;
    } catch (error) {
      throw new Error(`Analysis failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async analyzeImage(imageUrl, options = {}) {
    try {
      const response = await this.client.post('/api/v1/analysis/image', {
        imageUrl,
        ...options
      });
      return response.data;
    } catch (error) {
      throw new Error(`Analysis failed: ${error.response?.data?.message || error.message}`);
    }
  }
}

// Usage
const detector = new HateSpeechDetector('http://localhost:3000', 'your-api-key');

detector.analyzeText('This is a test message')
  .then(result => {
    console.log('Analysis result:', result.data.analysis);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
```

### Python

```python
import requests
import json

class HateSpeechDetector:
    def __init__(self, base_url, api_key=None):
        self.base_url = base_url
        self.headers = {
            'Content-Type': 'application/json'
        }
        if api_key:
            self.headers['Authorization'] = f'Bearer {api_key}'
    
    def analyze_text(self, text, **options):
        url = f"{self.base_url}/api/v1/analysis/text"
        data = {
            'text': text,
            **options
        }
        
        response = requests.post(url, headers=self.headers, json=data)
        response.raise_for_status()
        return response.json()
    
    def analyze_image(self, image_url, **options):
        url = f"{self.base_url}/api/v1/analysis/image"
        data = {
            'imageUrl': image_url,
            **options
        }
        
        response = requests.post(url, headers=self.headers, json=data)
        response.raise_for_status()
        return response.json()

# Usage
detector = HateSpeechDetector('http://localhost:3000', 'your-api-key')

try:
    result = detector.analyze_text('This is a test message')
    print('Analysis result:', result['data']['analysis'])
except requests.exceptions.RequestException as e:
    print('Error:', e)
```

### PHP

```php
<?php

class HateSpeechDetector {
    private $baseUrl;
    private $apiKey;
    private $headers;

    public function __construct($baseUrl, $apiKey = null) {
        $this->baseUrl = $baseUrl;
        $this->apiKey = $apiKey;
        $this->headers = [
            'Content-Type: application/json'
        ];
        
        if ($apiKey) {
            $this->headers[] = "Authorization: Bearer $apiKey";
        }
    }

    public function analyzeText($text, $options = []) {
        $url = $this->baseUrl . '/api/v1/analysis/text';
        $data = array_merge(['text' => $text], $options);
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, $this->headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            throw new Exception("Analysis failed: HTTP $httpCode");
        }
        
        return json_decode($response, true);
    }

    public function analyzeImage($imageUrl, $options = []) {
        $url = $this->baseUrl . '/api/v1/analysis/image';
        $data = array_merge(['imageUrl' => $imageUrl], $options);
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, $this->headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            throw new Exception("Analysis failed: HTTP $httpCode");
        }
        
        return json_decode($response, true);
    }
}

// Usage
$detector = new HateSpeechDetector('http://localhost:3000', 'your-api-key');

try {
    $result = $detector->analyzeText('This is a test message');
    echo 'Analysis result: ' . json_encode($result['data']['analysis']);
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage();
}
?>
```

---

## Best Practices

### 1. Error Handling
Always implement proper error handling for API calls:
- Check HTTP status codes
- Handle network timeouts
- Implement retry logic for transient failures
- Log errors for debugging

### 2. Rate Limiting
Respect rate limits to avoid service disruption:
- Monitor rate limit headers
- Implement exponential backoff
- Cache results when appropriate
- Use batch processing for multiple requests

### 3. Content Validation
Validate content before sending to the API:
- Check text length limits
- Validate image URLs
- Sanitize user input
- Handle special characters properly

### 4. Performance Optimization
Optimize API usage for better performance:
- Use appropriate timeouts
- Implement connection pooling
- Cache frequently accessed data
- Use compression for large payloads

### 5. Security
Implement security best practices:
- Use HTTPS in production
- Validate API keys
- Sanitize all inputs
- Implement proper authentication

---

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if the service is running
   - Verify the correct port and URL
   - Check firewall settings

2. **Rate Limit Exceeded**
   - Implement rate limiting in your application
   - Use exponential backoff
   - Consider upgrading your plan

3. **Invalid API Key**
   - Verify the API key is correct
   - Check if the key has expired
   - Ensure proper header format

4. **Analysis Timeout**
   - Increase timeout settings
   - Check network connectivity
   - Verify service health

5. **Validation Errors**
   - Check request format
   - Verify required fields
   - Validate data types

### Debug Mode

Enable debug mode by setting the environment variable:
```bash
NODE_ENV=development
```

This will provide additional error details and logging information.

---

## Support

For additional support:
- Check the GitHub repository for issues and discussions
- Review the README.md for setup instructions
- Contact the development team for enterprise support

