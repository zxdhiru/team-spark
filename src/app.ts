import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { rateLimitMiddleware, generalRateLimiter } from './middleware/rateLimiter';
import analysisRoutes from './routes/analysis';

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

// Rate limiting
app.use(rateLimitMiddleware(generalRateLimiter));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Hate Speech Detection Plugin is running',
    timestamp: new Date().toISOString(),
    version: process.env.PLUGIN_VERSION || '1.0.0'
  });
});

// API routes
app.use('/api/v1/analysis', analysisRoutes);

// Plugin information endpoint
app.get('/api/v1/plugin/info', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: process.env.PLUGIN_NAME || 'hate-speech-detection',
      version: process.env.PLUGIN_VERSION || '1.0.0',
      description: process.env.PLUGIN_DESCRIPTION || 'AI-powered hate speech and offensive content detection',
      endpoints: {
        textAnalysis: '/api/v1/analysis/text',
        imageAnalysis: '/api/v1/analysis/image',
        healthCheck: '/api/v1/analysis/health',
        statistics: '/api/v1/analysis/stats/overview',
        history: '/api/v1/analysis/history'
      },
      features: {
        textAnalysis: true,
        imageAnalysis: !!process.env.OPENAI_API_KEY,
        realTimeAnalysis: true,
        scoringSystem: '1-100 scale',
        supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko']
      },
      thresholds: {
        hateSpeech: parseInt(process.env.HATE_SPEECH_THRESHOLD || '70'),
        toxicity: parseInt(process.env.TOXICITY_THRESHOLD || '60'),
        harassment: parseInt(process.env.HARASSMENT_THRESHOLD || '65'),
        profanity: parseInt(process.env.PROFANITY_THRESHOLD || '50')
      }
    },
    message: 'Plugin information retrieved successfully'
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize database connection
connectDatabase();

export default app;

