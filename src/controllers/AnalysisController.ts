import { Request, Response } from 'express';
import { TextAnalysisService } from '../services/TextAnalysisService';
import { ImageAnalysisService } from '../services/ImageAnalysisService';
import { ContentAnalysis } from '../models/ContentAnalysis';
import { AnalysisResponse, TextAnalysisRequest, ImageAnalysisRequest } from '../types';
import Joi from 'joi';

export class AnalysisController {
  private textAnalysisService: TextAnalysisService;
  private imageAnalysisService: ImageAnalysisService;

  constructor() {
    this.textAnalysisService = new TextAnalysisService();
    this.imageAnalysisService = new ImageAnalysisService();
  }

  // Validation schemas
  private textAnalysisSchema = Joi.object({
    text: Joi.string().required().min(1).max(10000).messages({
      'string.empty': 'Text content is required',
      'string.min': 'Text content must be at least 1 character long',
      'string.max': 'Text content cannot exceed 10,000 characters'
    }),
    userId: Joi.string().optional(),
    platform: Joi.string().optional(),
    language: Joi.string().optional().default('en')
  });

  private imageAnalysisSchema = Joi.object({
    imageUrl: Joi.string().uri().required().messages({
      'string.uri': 'Valid image URL is required',
      'any.required': 'Image URL is required'
    }),
    userId: Joi.string().optional(),
    platform: Joi.string().optional(),
    description: Joi.string().optional().max(1000)
  });

  public analyzeText = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const { error, value } = this.textAnalysisSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: error.details[0].message
        } as AnalysisResponse);
        return;
      }

      const request: TextAnalysisRequest = value;

      // Perform text analysis
      const analysisResult = await this.textAnalysisService.analyzeText(request);

      // Save to database
      const savedAnalysis = new ContentAnalysis(analysisResult);
      await savedAnalysis.save();

      res.status(200).json({
        success: true,
        data: analysisResult,
        message: 'Text analysis completed successfully'
      } as AnalysisResponse);

    } catch (error) {
      console.error('Text analysis error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to analyze text content'
      } as AnalysisResponse);
    }
  };

  public analyzeImage = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const { error, value } = this.imageAnalysisSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: error.details[0].message
        } as AnalysisResponse);
        return;
      }

      const request: ImageAnalysisRequest = value;

      // Perform image analysis
      const analysisResult = await this.imageAnalysisService.analyzeImage(request);

      // Save to database
      const savedAnalysis = new ContentAnalysis(analysisResult);
      await savedAnalysis.save();

      res.status(200).json({
        success: true,
        data: analysisResult,
        message: 'Image analysis completed successfully'
      } as AnalysisResponse);

    } catch (error) {
      console.error('Image analysis error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to analyze image content'
      } as AnalysisResponse);
    }
  };

  public getAnalysisHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, platform, limit = 50, offset = 0 } = req.query;

      const query: any = {};
      if (userId) query['metadata.userId'] = userId;
      if (platform) query['metadata.platform'] = platform;

      const analyses = await ContentAnalysis.find(query)
        .sort({ 'metadata.timestamp': -1 })
        .limit(Number(limit))
        .skip(Number(offset))
        .select('-__v');

      const total = await ContentAnalysis.countDocuments(query);

      res.status(200).json({
        success: true,
        data: {
          analyses,
          pagination: {
            total,
            limit: Number(limit),
            offset: Number(offset),
            hasMore: Number(offset) + Number(limit) < total
          }
        },
        message: 'Analysis history retrieved successfully'
      });

    } catch (error) {
      console.error('Get analysis history error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve analysis history'
      });
    }
  };

  public getAnalysisById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const analysis = await ContentAnalysis.findById(id).select('-__v');
      
      if (!analysis) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Analysis not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: analysis,
        message: 'Analysis retrieved successfully'
      });

    } catch (error) {
      console.error('Get analysis by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve analysis'
      });
    }
  };

  public getStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, platform, days = 30 } = req.query;

      const query: any = {
        'metadata.timestamp': {
          $gte: new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000)
        }
      };

      if (userId) query['metadata.userId'] = userId;
      if (platform) query['metadata.platform'] = platform;

      const [
        totalAnalyses,
        hateSpeechDetected,
        toxicityDetected,
        harassmentDetected,
        profanityDetected,
        criticalRisk,
        averageProcessingTime
      ] = await Promise.all([
        ContentAnalysis.countDocuments(query),
        ContentAnalysis.countDocuments({ ...query, 'analysis.hateSpeech.detected': true }),
        ContentAnalysis.countDocuments({ ...query, 'analysis.toxicity.detected': true }),
        ContentAnalysis.countDocuments({ ...query, 'analysis.harassment.detected': true }),
        ContentAnalysis.countDocuments({ ...query, 'analysis.profanity.detected': true }),
        ContentAnalysis.countDocuments({ ...query, 'analysis.overallRisk': 'critical' }),
        ContentAnalysis.aggregate([
          { $match: query },
          { $group: { _id: null, avgTime: { $avg: '$metadata.processingTime' } } }
        ])
      ]);

      const stats = {
        totalAnalyses,
        detections: {
          hateSpeech: hateSpeechDetected,
          toxicity: toxicityDetected,
          harassment: harassmentDetected,
          profanity: profanityDetected,
          criticalRisk
        },
        rates: {
          hateSpeechRate: totalAnalyses > 0 ? (hateSpeechDetected / totalAnalyses * 100).toFixed(2) : 0,
          toxicityRate: totalAnalyses > 0 ? (toxicityDetected / totalAnalyses * 100).toFixed(2) : 0,
          harassmentRate: totalAnalyses > 0 ? (harassmentDetected / totalAnalyses * 100).toFixed(2) : 0,
          profanityRate: totalAnalyses > 0 ? (profanityDetected / totalAnalyses * 100).toFixed(2) : 0,
          criticalRiskRate: totalAnalyses > 0 ? (criticalRisk / totalAnalyses * 100).toFixed(2) : 0
        },
        performance: {
          averageProcessingTime: averageProcessingTime[0]?.avgTime || 0
        }
      };

      res.status(200).json({
        success: true,
        data: stats,
        message: 'Statistics retrieved successfully'
      });

    } catch (error) {
      console.error('Get statistics error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve statistics'
      });
    }
  };

  public healthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check database connection
      await ContentAnalysis.findOne().limit(1);

      res.status(200).json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: process.env.PLUGIN_VERSION || '1.0.0',
          services: {
            database: 'connected',
            textAnalysis: 'available',
            imageAnalysis: process.env.OPENAI_API_KEY ? 'available' : 'limited'
          }
        },
        message: 'Service is healthy'
      });

    } catch (error) {
      console.error('Health check error:', error);
      res.status(503).json({
        success: false,
        error: 'Service unavailable',
        message: 'Health check failed'
      });
    }
  };
}

