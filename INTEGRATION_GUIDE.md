# Integration Guide

## Hate Speech Detection Plugin Integration

This guide provides step-by-step instructions for integrating the Hate Speech Detection Plugin with your social media platform or application.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Plugin Architecture](#plugin-architecture)
3. [Integration Methods](#integration-methods)
4. [Platform-Specific Guides](#platform-specific-guides)
5. [Advanced Configuration](#advanced-configuration)
6. [Testing and Validation](#testing-and-validation)
7. [Production Deployment](#production-deployment)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)

---

## Quick Start

### 1. Install the Plugin

```bash
# Clone the repository
git clone <repository-url>
cd hate-speech-detection-plugin

# Install dependencies
npm install

# Set up environment
cp env.example .env
# Edit .env with your configuration

# Start the service
npm run dev
```

### 2. Test the Connection

```bash
# Health check
curl http://localhost:3000/api/v1/analysis/health

# Test text analysis
curl -X POST http://localhost:3000/api/v1/analysis/text \
  -H "Content-Type: application/json" \
  -d '{"text": "This is a test message"}'
```

### 3. Basic Integration

```javascript
// Simple integration example
const plugin = new HateSpeechDetectionPlugin('http://localhost:3000');

async function moderateContent(text) {
  try {
    const analysis = await plugin.analyzeText(text);
    const shouldBlock = plugin.shouldBlockContent(analysis);
    
    if (shouldBlock.shouldBlock) {
      console.log('Content blocked:', shouldBlock.reason);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Moderation failed:', error);
    return true; // Allow content if moderation fails
  }
}
```

---

## Plugin Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Application                       │
├─────────────────────────────────────────────────────────────┤
│  Plugin Interface  │  Integration Examples  │  Middleware   │
├─────────────────────────────────────────────────────────────┤
│                    Hate Speech Detection Plugin             │
├─────────────────────────────────────────────────────────────┤
│  Text Analysis     │  Image Analysis      │  API Endpoints │
├─────────────────────────────────────────────────────────────┤
│  ML Models         │  OpenAI API          │  Database      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Content Submission**: User submits content (text/image)
2. **Pre-processing**: Content is validated and prepared
3. **Analysis**: Content is analyzed using ML models
4. **Scoring**: Risk scores are calculated (1-100)
5. **Decision**: Block/allow decision is made
6. **Response**: Result is returned to client
7. **Storage**: Analysis results are stored for analytics

---

## Integration Methods

### 1. Direct API Integration

#### Node.js/Express

```javascript
const express = require('express');
const { HateSpeechDetectionPlugin } = require('./src/plugin/PluginInterface');

const app = express();
const plugin = new HateSpeechDetectionPlugin('http://localhost:3000');

app.use(express.json());

// Middleware for content moderation
app.use('/api/posts', async (req, res, next) => {
  const { content, userId } = req.body;
  
  if (content) {
    try {
      const analysis = await plugin.analyzeText(content, { userId, platform: 'myapp' });
      const shouldBlock = plugin.shouldBlockContent(analysis);
      
      if (shouldBlock.shouldBlock) {
        return res.status(400).json({
          error: 'Content blocked',
          reason: shouldBlock.reason,
          analysis: analysis.analysis
        });
      }
      
      req.moderationAnalysis = analysis;
    } catch (error) {
      console.error('Moderation error:', error);
      // Continue without blocking if moderation fails
    }
  }
  
  next();
});

app.post('/api/posts', (req, res) => {
  // Post creation logic
  res.json({ 
    success: true, 
    analysis: req.moderationAnalysis 
  });
});
```

#### Python/Django

```python
# settings.py
HATE_SPEECH_PLUGIN_URL = 'http://localhost:3000'
HATE_SPEECH_PLUGIN_KEY = 'your-api-key'

# moderation.py
import requests
import json

class HateSpeechModerator:
    def __init__(self, base_url, api_key=None):
        self.base_url = base_url
        self.headers = {'Content-Type': 'application/json'}
        if api_key:
            self.headers['Authorization'] = f'Bearer {api_key}'
    
    def analyze_text(self, text, **options):
        url = f"{self.base_url}/api/v1/analysis/text"
        data = {'text': text, **options}
        
        response = requests.post(url, headers=self.headers, json=data)
        response.raise_for_status()
        return response.json()
    
    def should_block(self, analysis):
        analysis_data = analysis['data']['analysis']
        thresholds = {
            'hateSpeech': 70,
            'toxicity': 60,
            'harassment': 65,
            'profanity': 50
        }
        
        for category, threshold in thresholds.items():
            if analysis_data[category]['score'] >= threshold:
                return True, f"{category} threshold exceeded"
        
        if analysis_data['overallRisk'] == 'critical':
            return True, "Critical risk level"
        
        return False, None

# middleware.py
from django.utils.deprecation import MiddlewareMixin
from .moderation import HateSpeechModerator
from django.conf import settings

class HateSpeechMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if request.method == 'POST' and 'content' in request.POST:
            moderator = HateSpeechModerator(
                settings.HATE_SPEECH_PLUGIN_URL,
                settings.HATE_SPEECH_PLUGIN_KEY
            )
            
            try:
                analysis = moderator.analyze_text(
                    request.POST['content'],
                    userId=request.user.id if request.user.is_authenticated else None,
                    platform='django-app'
                )
                
                should_block, reason = moderator.should_block(analysis)
                if should_block:
                    from django.http import JsonResponse
                    return JsonResponse({
                        'error': 'Content blocked',
                        'reason': reason
                    }, status=400)
                
                request.moderation_analysis = analysis
            except Exception as e:
                print(f"Moderation error: {e}")
                # Continue without blocking
```

### 2. Plugin Interface Integration

```javascript
// Using the provided plugin interface
import { HateSpeechDetectionPlugin } from './src/plugin/PluginInterface';

const plugin = new HateSpeechDetectionPlugin('http://localhost:3000', 'api-key', {
  thresholds: {
    hateSpeech: 70,
    toxicity: 60,
    harassment: 65,
    profanity: 50
  },
  enabledFeatures: {
    textAnalysis: true,
    imageAnalysis: true,
    realTimeAnalysis: true
  }
});

// Analyze content
async function moderateContent(content, userId, platform) {
  try {
    let analysis;
    
    if (content.text) {
      analysis = await plugin.analyzeText(content.text, { userId, platform });
    }
    
    if (content.imageUrl) {
      const imageAnalysis = await plugin.analyzeImage(content.imageUrl, { userId, platform });
      analysis = analysis ? combineAnalyses(analysis, imageAnalysis) : imageAnalysis;
    }
    
    const blockDecision = plugin.shouldBlockContent(analysis);
    const recommendations = plugin.getModerationRecommendations(analysis);
    
    return {
      approved: !blockDecision.shouldBlock,
      reason: blockDecision.reason,
      analysis: analysis.analysis,
      recommendations: recommendations.suggestions
    };
  } catch (error) {
    console.error('Moderation error:', error);
    return { approved: true, reason: 'Moderation service unavailable' };
  }
}
```

### 3. Middleware Integration

```javascript
// Express middleware
import { createModerationMiddleware } from './src/plugin/IntegrationExamples';

const moderation = createModerationMiddleware('http://localhost:3000', 'api-key');

app.post('/api/posts', moderation.moderateText, (req, res) => {
  // Post creation logic
  res.json({ success: true });
});

app.post('/api/images', moderation.moderateImage, (req, res) => {
  // Image upload logic
  res.json({ success: true });
});
```

---

## Platform-Specific Guides

### WordPress Plugin

```php
<?php
/*
Plugin Name: Hate Speech Detection
Description: AI-powered content moderation for WordPress
Version: 1.0.0
*/

class HateSpeechDetectionPlugin {
    private $api_url;
    private $api_key;
    
    public function __construct() {
        $this->api_url = get_option('hate_speech_api_url', 'http://localhost:3000');
        $this->api_key = get_option('hate_speech_api_key', '');
        
        add_action('init', [$this, 'init']);
        add_action('wp_ajax_moderate_content', [$this, 'moderate_content']);
        add_action('wp_ajax_nopriv_moderate_content', [$this, 'moderate_content']);
    }
    
    public function init() {
        // Add admin menu
        add_action('admin_menu', [$this, 'add_admin_menu']);
        
        // Add moderation to post save
        add_action('save_post', [$this, 'moderate_post_content'], 10, 2);
        
        // Add moderation to comments
        add_action('pre_comment_approved', [$this, 'moderate_comment'], 10, 2);
    }
    
    public function moderate_content() {
        $content = sanitize_textarea_field($_POST['content']);
        $type = sanitize_text_field($_POST['type']);
        
        $result = $this->call_api('/api/v1/analysis/text', [
            'text' => $content,
            'platform' => 'wordpress'
        ]);
        
        if ($result && $result['success']) {
            $analysis = $result['data']['analysis'];
            $should_block = $this->should_block_content($analysis);
            
            wp_send_json([
                'success' => true,
                'blocked' => $should_block,
                'analysis' => $analysis
            ]);
        } else {
            wp_send_json_error('Moderation failed');
        }
    }
    
    private function call_api($endpoint, $data) {
        $url = $this->api_url . $endpoint;
        $headers = ['Content-Type: application/json'];
        
        if ($this->api_key) {
            $headers[] = 'Authorization: Bearer ' . $this->api_key;
        }
        
        $response = wp_remote_post($url, [
            'headers' => $headers,
            'body' => json_encode($data),
            'timeout' => 30
        ]);
        
        if (is_wp_error($response)) {
            return false;
        }
        
        return json_decode(wp_remote_retrieve_body($response), true);
    }
    
    private function should_block_content($analysis) {
        $thresholds = [
            'hateSpeech' => 70,
            'toxicity' => 60,
            'harassment' => 65,
            'profanity' => 50
        ];
        
        foreach ($thresholds as $category => $threshold) {
            if ($analysis[$category]['score'] >= $threshold) {
                return true;
            }
        }
        
        return $analysis['overallRisk'] === 'critical';
    }
}

new HateSpeechDetectionPlugin();
?>
```

### React Component

```jsx
import React, { useState, useEffect } from 'react';
import { useHateSpeechDetection } from './src/plugin/IntegrationExamples';

const ContentModerator = ({ onContentChange, initialContent = '' }) => {
  const [content, setContent] = useState(initialContent);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const { analyzeText, shouldBlock, getRecommendations } = useHateSpeechDetection(
    'http://localhost:3000',
    'your-api-key'
  );

  useEffect(() => {
    const analyzeContent = async () => {
      if (content.length > 10) {
        setIsAnalyzing(true);
        try {
          const result = await analyzeText(content);
          setAnalysis(result);
          
          const blockDecision = shouldBlock(result);
          if (blockDecision.shouldBlock) {
            alert(`Content blocked: ${blockDecision.reason}`);
          }
        } catch (error) {
          console.error('Analysis failed:', error);
        } finally {
          setIsAnalyzing(false);
        }
      }
    };

    const timeoutId = setTimeout(analyzeContent, 1000);
    return () => clearTimeout(timeoutId);
  }, [content]);

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    onContentChange(newContent);
  };

  return (
    <div className="content-moderator">
      <textarea
        value={content}
        onChange={handleContentChange}
        placeholder="What's on your mind?"
        className={`content-input ${analysis?.analysis.overallRisk}`}
      />
      
      {isAnalyzing && <div className="analyzing">Analyzing content...</div>}
      
      {analysis && (
        <div className="analysis-results">
          <div className="risk-level">
            Risk Level: <span className={analysis.analysis.overallRisk}>
              {analysis.analysis.overallRisk.toUpperCase()}
            </span>
          </div>
          
          <div className="scores">
            <div>Hate Speech: {analysis.analysis.hateSpeech.score}/100</div>
            <div>Toxicity: {analysis.analysis.toxicity.score}/100</div>
            <div>Harassment: {analysis.analysis.harassment.score}/100</div>
            <div>Profanity: {analysis.analysis.profanity.score}/100</div>
          </div>
          
          {analysis.analysis.flaggedWords?.length > 0 && (
            <div className="flagged-words">
              Flagged words: {analysis.analysis.flaggedWords.join(', ')}
            </div>
          )}
          
          {analysis.analysis.suggestions?.length > 0 && (
            <div className="suggestions">
              <h4>Suggestions:</h4>
              <ul>
                {analysis.analysis.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContentModerator;
```

### Vue.js Component

```vue
<template>
  <div class="content-moderator">
    <textarea
      v-model="content"
      @input="analyzeContent"
      placeholder="What's on your mind?"
      :class="['content-input', analysis?.analysis.overallRisk]"
    />
    
    <div v-if="isAnalyzing" class="analyzing">
      Analyzing content...
    </div>
    
    <div v-if="analysis" class="analysis-results">
      <div class="risk-level">
        Risk Level: 
        <span :class="analysis.analysis.overallRisk">
          {{ analysis.analysis.overallRisk.toUpperCase() }}
        </span>
      </div>
      
      <div class="scores">
        <div>Hate Speech: {{ analysis.analysis.hateSpeech.score }}/100</div>
        <div>Toxicity: {{ analysis.analysis.toxicity.score }}/100</div>
        <div>Harassment: {{ analysis.analysis.harassment.score }}/100</div>
        <div>Profanity: {{ analysis.analysis.profanity.score }}/100</div>
      </div>
      
      <div v-if="analysis.analysis.flaggedWords?.length" class="flagged-words">
        Flagged words: {{ analysis.analysis.flaggedWords.join(', ') }}
      </div>
      
      <div v-if="analysis.analysis.suggestions?.length" class="suggestions">
        <h4>Suggestions:</h4>
        <ul>
          <li v-for="(suggestion, index) in analysis.analysis.suggestions" :key="index">
            {{ suggestion }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { HateSpeechDetectionPlugin } from './src/plugin/PluginInterface';

export default {
  name: 'ContentModerator',
  props: {
    initialContent: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      content: this.initialContent,
      analysis: null,
      isAnalyzing: false,
      plugin: null
    };
  },
  mounted() {
    this.plugin = new HateSpeechDetectionPlugin('http://localhost:3000', 'your-api-key');
  },
  methods: {
    async analyzeContent() {
      if (this.content.length > 10) {
        this.isAnalyzing = true;
        try {
          const result = await this.plugin.analyzeText(this.content);
          this.analysis = result;
          
          const blockDecision = this.plugin.shouldBlockContent(result);
          if (blockDecision.shouldBlock) {
            alert(`Content blocked: ${blockDecision.reason}`);
          }
        } catch (error) {
          console.error('Analysis failed:', error);
        } finally {
          this.isAnalyzing = false;
        }
      }
    }
  }
};
</script>

<style scoped>
.content-moderator {
  max-width: 600px;
  margin: 0 auto;
}

.content-input {
  width: 100%;
  min-height: 100px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.content-input.warning {
  border-color: #ffa500;
}

.content-input.danger {
  border-color: #ff0000;
}

.content-input.critical {
  border-color: #8b0000;
  background-color: #ffe6e6;
}

.analyzing {
  color: #666;
  font-style: italic;
}

.analysis-results {
  margin-top: 10px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.risk-level {
  font-weight: bold;
  margin-bottom: 10px;
}

.scores {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
  margin-bottom: 10px;
}

.flagged-words {
  color: #d32f2f;
  font-weight: bold;
}

.suggestions {
  margin-top: 10px;
}

.suggestions ul {
  margin: 5px 0;
  padding-left: 20px;
}
</style>
```

---

## Advanced Configuration

### Custom Thresholds

```javascript
const plugin = new HateSpeechDetectionPlugin('http://localhost:3000', 'api-key', {
  thresholds: {
    hateSpeech: 80,    // More strict
    toxicity: 70,      // More strict
    harassment: 75,    // More strict
    profanity: 60      // More strict
  }
});
```

### Batch Processing

```javascript
async function moderateBatchContent(contentArray) {
  const results = [];
  
  // Process in batches of 10 to avoid rate limits
  for (let i = 0; i < contentArray.length; i += 10) {
    const batch = contentArray.slice(i, i + 10);
    const batchPromises = batch.map(content => 
      plugin.analyzeText(content.text, { userId: content.userId })
    );
    
    try {
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    } catch (error) {
      console.error('Batch processing error:', error);
      // Add null results for failed items
      results.push(...new Array(batch.length).fill(null));
    }
    
    // Wait between batches to respect rate limits
    if (i + 10 < contentArray.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}
```

### Caching Strategy

```javascript
class CachedHateSpeechDetector {
  constructor(plugin, cache = new Map()) {
    this.plugin = plugin;
    this.cache = cache;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }
  
  async analyzeText(text, options = {}) {
    const cacheKey = this.getCacheKey(text, options);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }
    
    const result = await this.plugin.analyzeText(text, options);
    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
    
    return result;
  }
  
  getCacheKey(text, options) {
    return `${text}_${JSON.stringify(options)}`;
  }
}
```

---

## Testing and Validation

### Unit Tests

```javascript
// test/moderator.test.js
const { HateSpeechDetectionPlugin } = require('../src/plugin/PluginInterface');

describe('HateSpeechDetectionPlugin', () => {
  let plugin;
  
  beforeEach(() => {
    plugin = new HateSpeechDetectionPlugin('http://localhost:3000');
  });
  
  test('should detect hate speech', async () => {
    const result = await plugin.analyzeText('I hate all people of this race');
    expect(result.analysis.hateSpeech.detected).toBe(true);
    expect(result.analysis.hateSpeech.score).toBeGreaterThan(70);
  });
  
  test('should detect toxicity', async () => {
    const result = await plugin.analyzeText('You are so stupid and annoying');
    expect(result.analysis.toxicity.detected).toBe(true);
    expect(result.analysis.toxicity.score).toBeGreaterThan(50);
  });
  
  test('should allow safe content', async () => {
    const result = await plugin.analyzeText('Hello, how are you today?');
    expect(result.analysis.overallRisk).toBe('safe');
  });
});
```

### Integration Tests

```javascript
// test/integration.test.js
const request = require('supertest');
const app = require('../src/app');

describe('API Integration Tests', () => {
  test('POST /api/v1/analysis/text should analyze text', async () => {
    const response = await request(app)
      .post('/api/v1/analysis/text')
      .send({
        text: 'This is a test message',
        userId: 'test-user',
        platform: 'test-platform'
      })
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.analysis).toBeDefined();
  });
  
  test('GET /api/v1/analysis/health should return healthy status', async () => {
    const response = await request(app)
      .get('/api/v1/analysis/health')
      .expect(200);
    
    expect(response.body.data.status).toBe('healthy');
  });
});
```

### Load Testing

```javascript
// test/load.test.js
const autocannon = require('autocannon');

async function loadTest() {
  const result = await autocannon({
    url: 'http://localhost:3000',
    connections: 10,
    duration: 30,
    requests: [
      {
        method: 'POST',
        path: '/api/v1/analysis/text',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: 'This is a load test message',
          userId: 'load-test-user',
          platform: 'load-test'
        })
      }
    ]
  });
  
  console.log('Load test results:', result);
}

loadTest();
```

---

## Production Deployment

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy built application
COPY dist/ ./dist/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  hate-speech-detection:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/hate-speech-detection
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - mongodb
    restart: unless-stopped

  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

volumes:
  mongodb_data:
```

### Kubernetes Deployment

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hate-speech-detection
spec:
  replicas: 3
  selector:
    matchLabels:
      app: hate-speech-detection
  template:
    metadata:
      labels:
        app: hate-speech-detection
    spec:
      containers:
      - name: hate-speech-detection
        image: hate-speech-detection:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: mongodb-secret
              key: uri
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: openai-secret
              key: api-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/v1/analysis/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/v1/analysis/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: hate-speech-detection-service
spec:
  selector:
    app: hate-speech-detection
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### Environment Configuration

```bash
# production.env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://your-production-mongodb-cluster
OPENAI_API_KEY=your-production-openai-key
HUGGINGFACE_API_KEY=your-production-huggingface-key
HATE_SPEECH_THRESHOLD=70
TOXICITY_THRESHOLD=60
HARASSMENT_THRESHOLD=65
PROFANITY_THRESHOLD=50
API_RATE_LIMIT=1000
ALLOWED_ORIGINS=https://yourdomain.com,https://api.yourdomain.com
```

---

## Monitoring and Maintenance

### Health Monitoring

```javascript
// monitoring/health-check.js
const axios = require('axios');

class HealthMonitor {
  constructor(pluginUrl, checkInterval = 60000) {
    this.pluginUrl = pluginUrl;
    this.checkInterval = checkInterval;
    this.isHealthy = true;
    this.lastCheck = null;
    this.startMonitoring();
  }
  
  async checkHealth() {
    try {
      const response = await axios.get(`${this.pluginUrl}/api/v1/analysis/health`, {
        timeout: 5000
      });
      
      this.isHealthy = response.data.success;
      this.lastCheck = new Date();
      
      if (!this.isHealthy) {
        console.error('Plugin health check failed:', response.data);
        this.notifyHealthIssue();
      }
    } catch (error) {
      this.isHealthy = false;
      this.lastCheck = new Date();
      console.error('Plugin health check error:', error.message);
      this.notifyHealthIssue();
    }
  }
  
  startMonitoring() {
    setInterval(() => {
      this.checkHealth();
    }, this.checkInterval);
  }
  
  notifyHealthIssue() {
    // Implement notification logic (email, Slack, etc.)
    console.error('Plugin health issue detected');
  }
}

// Usage
const monitor = new HealthMonitor('http://localhost:3000');
```

### Performance Monitoring

```javascript
// monitoring/performance.js
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requestCount: 0,
      averageResponseTime: 0,
      errorRate: 0,
      lastReset: Date.now()
    };
  }
  
  recordRequest(responseTime, success) {
    this.metrics.requestCount++;
    
    // Update average response time
    const totalTime = this.metrics.averageResponseTime * (this.metrics.requestCount - 1);
    this.metrics.averageResponseTime = (totalTime + responseTime) / this.metrics.requestCount;
    
    // Update error rate
    if (!success) {
      const errorCount = this.metrics.errorRate * (this.metrics.requestCount - 1);
      this.metrics.errorRate = (errorCount + 1) / this.metrics.requestCount;
    }
  }
  
  getMetrics() {
    return { ...this.metrics };
  }
  
  resetMetrics() {
    this.metrics = {
      requestCount: 0,
      averageResponseTime: 0,
      errorRate: 0,
      lastReset: Date.now()
    };
  }
}
```

### Logging Configuration

```javascript
// logging/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'hate-speech-detection' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

module.exports = logger;
```

---

## Troubleshooting

### Common Issues

1. **Connection Timeouts**
   - Check network connectivity
   - Verify service is running
   - Increase timeout settings

2. **Rate Limit Exceeded**
   - Implement exponential backoff
   - Use caching for repeated content
   - Consider upgrading rate limits

3. **Analysis Accuracy Issues**
   - Review and adjust thresholds
   - Check content preprocessing
   - Validate input data

4. **Performance Issues**
   - Monitor response times
   - Check database performance
   - Optimize API calls

### Debug Mode

Enable debug logging:

```bash
NODE_ENV=development DEBUG=hate-speech:* npm run dev
```

### Support Resources

- GitHub Issues: Report bugs and feature requests
- Documentation: Comprehensive API and integration guides
- Community Forum: Get help from other developers
- Enterprise Support: Professional support for production deployments

---

This integration guide provides comprehensive instructions for integrating the Hate Speech Detection Plugin with your application. For additional support or custom integration requirements, please contact the development team.

