# Hate Speech Detection Plugin

A robust AI-powered backend service for detecting and classifying hate speech, offensive content, and toxic behavior in social media text and images. Built as a plugin that can be easily integrated with any social media platform.

## 🚀 Features

- **Text Analysis**: Advanced NLP-based hate speech, toxicity, harassment, and profanity detection
- **Image Analysis**: OpenAI Vision API integration for offensive content detection in images
- **Scoring System**: 1-100 scale scoring for different types of harmful content
- **Real-time Analysis**: Fast content analysis with configurable thresholds
- **Plugin Architecture**: Easy integration with existing social media platforms
- **Comprehensive API**: RESTful API with detailed analytics and reporting
- **Multi-language Support**: Support for multiple languages and dialects
- **Rate Limiting**: Built-in rate limiting and security features

## 📊 Content Analysis Categories

### 1. Hate Speech Detection (0-100)
- Identifies discriminatory language targeting specific groups
- Detects extremist ideologies and supremacist content
- Recognizes dehumanizing language and calls for violence

### 2. Toxicity Analysis (0-100)
- Measures overall toxicity and negative sentiment
- Identifies inflammatory and provocative content
- Detects aggressive and hostile language patterns

### 3. Harassment Detection (0-100)
- Identifies bullying and intimidation tactics
- Detects stalking and threatening behavior
- Recognizes coercive and manipulative language

### 4. Profanity Filtering (0-100)
- Comprehensive profanity detection and scoring
- Context-aware profanity analysis
- Intensity-based scoring system

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MongoDB with Mongoose ODM
- **AI/ML**: OpenAI GPT-4 Vision, Hugging Face Transformers
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Joi schema validation
- **Testing**: Jest testing framework

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hate-speech-detection-plugin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/hate-speech-detection
   OPENAI_API_KEY=your_openai_api_key_here
   HUGGINGFACE_API_KEY=your_huggingface_api_key_here
   ```

4. **Start MongoDB**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   
   # Or install MongoDB locally
   ```

5. **Build and start the application**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm run build
   npm start
   ```

## 🔧 API Endpoints

### Text Analysis
```http
POST /api/v1/analysis/text
Content-Type: application/json

{
  "text": "Your text content here",
  "userId": "optional_user_id",
  "platform": "optional_platform_name",
  "language": "en"
}
```

### Image Analysis
```http
POST /api/v1/analysis/image
Content-Type: application/json

{
  "imageUrl": "https://example.com/image.jpg",
  "userId": "optional_user_id",
  "platform": "optional_platform_name",
  "description": "optional_image_description"
}
```

### Analysis History
```http
GET /api/v1/analysis/history?userId=user123&limit=50&offset=0
```

### Statistics
```http
GET /api/v1/analysis/stats/overview?userId=user123&days=30
```

### Health Check
```http
GET /api/v1/analysis/health
```

### Plugin Information
```http
GET /api/v1/plugin/info
```

## 📱 Integration Examples

### Node.js/Express Integration

```typescript
import { HateSpeechDetectionPlugin } from './src/plugin/PluginInterface';

const plugin = new HateSpeechDetectionPlugin('http://localhost:3000');

// Analyze text before posting
app.post('/api/posts', async (req, res) => {
  const { content, userId } = req.body;
  
  try {
    const analysis = await plugin.analyzeText(content, { userId, platform: 'myapp' });
    const shouldBlock = plugin.shouldBlockContent(analysis);
    
    if (shouldBlock.shouldBlock) {
      return res.status(400).json({
        error: 'Content blocked',
        reason: shouldBlock.reason
      });
    }
    
    // Proceed with post creation
    res.json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ error: 'Analysis failed' });
  }
});
```

### React Frontend Integration

```typescript
import { useHateSpeechDetection } from './src/plugin/IntegrationExamples';

function PostComposer() {
  const { analyzeText, shouldBlock } = useHateSpeechDetection('http://localhost:3000');
  const [content, setContent] = useState('');
  const [analysis, setAnalysis] = useState(null);

  const handleContentChange = async (text) => {
    setContent(text);
    
    if (text.length > 10) {
      try {
        const result = await analyzeText(text);
        setAnalysis(result);
        
        const blockDecision = shouldBlock(result);
        if (blockDecision.shouldBlock) {
          alert(`Content blocked: ${blockDecision.reason}`);
        }
      } catch (error) {
        console.error('Analysis failed:', error);
      }
    }
  };

  return (
    <div>
      <textarea 
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder="What's on your mind?"
      />
      {analysis && (
        <div className="analysis-results">
          <p>Hate Speech: {analysis.analysis.hateSpeech.score}/100</p>
          <p>Toxicity: {analysis.analysis.toxicity.score}/100</p>
          <p>Risk Level: {analysis.analysis.overallRisk}</p>
        </div>
      )}
    </div>
  );
}
```

### Middleware Integration

```typescript
import { createModerationMiddleware } from './src/plugin/IntegrationExamples';

const moderation = createModerationMiddleware('http://localhost:3000');

// Apply moderation middleware to routes
app.post('/api/comments', moderation.moderateText, (req, res) => {
  // Comment creation logic
});

app.post('/api/images', moderation.moderateImage, (req, res) => {
  // Image upload logic
});
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/hate-speech-detection |
| `OPENAI_API_KEY` | OpenAI API key for image analysis | - |
| `HUGGINGFACE_API_KEY` | Hugging Face API key | - |
| `HATE_SPEECH_THRESHOLD` | Hate speech detection threshold | 70 |
| `TOXICITY_THRESHOLD` | Toxicity detection threshold | 60 |
| `HARASSMENT_THRESHOLD` | Harassment detection threshold | 65 |
| `PROFANITY_THRESHOLD` | Profanity detection threshold | 50 |

### Plugin Configuration

```typescript
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
  },
  supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko']
});
```

## 📈 Response Format

### Analysis Response
```json
{
  "success": true,
  "data": {
    "id": "analysis_1234567890_abc123",
    "content": "Your analyzed content",
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

## 🔒 Security Features

- **Rate Limiting**: Configurable rate limits to prevent abuse
- **Input Validation**: Comprehensive input validation and sanitization
- **Error Handling**: Secure error handling without information leakage
- **CORS Protection**: Configurable CORS policies
- **Helmet Security**: Security headers and protection middleware
- **API Key Authentication**: Optional API key authentication

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📊 Monitoring and Analytics

The plugin provides comprehensive analytics and monitoring capabilities:

- **Real-time Statistics**: Detection rates, processing times, and accuracy metrics
- **User Analytics**: Per-user moderation statistics and trends
- **Platform Analytics**: Platform-specific moderation insights
- **Performance Metrics**: API response times and system health
- **Historical Data**: Long-term trends and pattern analysis

## 🚀 Deployment

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/
EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### Environment Setup

```bash
# Production environment variables
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://your-mongodb-cluster
OPENAI_API_KEY=your-production-openai-key
HUGGINGFACE_API_KEY=your-production-huggingface-key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API examples

## 🔮 Roadmap

- [ ] Multi-language model support
- [ ] Real-time streaming analysis
- [ ] Advanced ML model integration
- [ ] Custom model training capabilities
- [ ] Enhanced image analysis features
- [ ] Webhook notifications
- [ ] Advanced analytics dashboard
- [ ] Mobile SDK development

---

**Built with ❤️ for safer online communities**

