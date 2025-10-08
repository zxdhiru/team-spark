import { HateSpeechDetectionPlugin } from './PluginInterface';

/**
 * Example integration for a social media platform
 */
export class SocialMediaIntegration {
  private plugin: HateSpeechDetectionPlugin;

  constructor(pluginUrl: string, apiKey?: string) {
    this.plugin = new HateSpeechDetectionPlugin(pluginUrl, apiKey, {
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
  }

  /**
   * Moderate a post before publishing
   */
  public async moderatePost(content: {
    text?: string;
    imageUrl?: string;
    userId: string;
    platform: string;
  }): Promise<{
    approved: boolean;
    reason?: string;
    analysis?: any;
    recommendations?: string[];
  }> {
    try {
      let analysis;

      // Analyze text content if provided
      if (content.text) {
        analysis = await this.plugin.analyzeText(content.text, {
          userId: content.userId,
          platform: content.platform
        });
      }

      // Analyze image content if provided
      if (content.imageUrl) {
        const imageAnalysis = await this.plugin.analyzeImage(content.imageUrl, {
          userId: content.userId,
          platform: content.platform
        });

        // If we have both text and image analysis, use the higher risk
        if (analysis) {
          analysis = this.combineAnalyses(analysis, imageAnalysis);
        } else {
          analysis = imageAnalysis;
        }
      }

      if (!analysis) {
        return { approved: true };
      }

      const blockDecision = this.plugin.shouldBlockContent(analysis);
      const recommendations = this.plugin.getModerationRecommendations(analysis);

      return {
        approved: !blockDecision.shouldBlock,
        reason: blockDecision.reason,
        analysis: analysis.analysis,
        recommendations: recommendations.suggestions
      };

    } catch (error) {
      console.error('Moderation error:', error);
      // In case of error, allow the post but log for review
      return {
        approved: true,
        reason: 'Moderation service unavailable - manual review recommended'
      };
    }
  }

  /**
   * Moderate a comment before posting
   */
  public async moderateComment(comment: string, userId: string, platform: string): Promise<{
    approved: boolean;
    reason?: string;
    analysis?: any;
  }> {
    try {
      const analysis = await this.plugin.analyzeText(comment, {
        userId,
        platform
      });

      const blockDecision = this.plugin.shouldBlockContent(analysis);

      return {
        approved: !blockDecision.shouldBlock,
        reason: blockDecision.reason,
        analysis: analysis.analysis
      };

    } catch (error) {
      console.error('Comment moderation error:', error);
      return {
        approved: true,
        reason: 'Moderation service unavailable'
      };
    }
  }

  /**
   * Get user moderation statistics
   */
  public async getUserModerationStats(userId: string, platform: string, days: number = 30): Promise<any> {
    try {
      return await this.plugin.getStatistics({
        userId,
        platform,
        days
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      return null;
    }
  }

  private combineAnalyses(textAnalysis: any, imageAnalysis: any): any {
    // Combine analyses by taking the higher scores
    return {
      ...textAnalysis,
      analysis: {
        hateSpeech: {
          score: Math.max(textAnalysis.analysis.hateSpeech.score, imageAnalysis.analysis.hateSpeech.score),
          level: textAnalysis.analysis.hateSpeech.score > imageAnalysis.analysis.hateSpeech.score 
            ? textAnalysis.analysis.hateSpeech.level 
            : imageAnalysis.analysis.hateSpeech.level,
          detected: textAnalysis.analysis.hateSpeech.detected || imageAnalysis.analysis.hateSpeech.detected
        },
        toxicity: {
          score: Math.max(textAnalysis.analysis.toxicity.score, imageAnalysis.analysis.toxicity.score),
          level: textAnalysis.analysis.toxicity.score > imageAnalysis.analysis.toxicity.score 
            ? textAnalysis.analysis.toxicity.level 
            : imageAnalysis.analysis.toxicity.level,
          detected: textAnalysis.analysis.toxicity.detected || imageAnalysis.analysis.toxicity.detected
        },
        harassment: {
          score: Math.max(textAnalysis.analysis.harassment.score, imageAnalysis.analysis.harassment.score),
          level: textAnalysis.analysis.harassment.score > imageAnalysis.analysis.harassment.score 
            ? textAnalysis.analysis.harassment.level 
            : imageAnalysis.analysis.harassment.level,
          detected: textAnalysis.analysis.harassment.detected || imageAnalysis.analysis.harassment.detected
        },
        profanity: {
          score: Math.max(textAnalysis.analysis.profanity.score, imageAnalysis.analysis.profanity.score),
          level: textAnalysis.analysis.profanity.score > imageAnalysis.analysis.profanity.score 
            ? textAnalysis.analysis.profanity.level 
            : imageAnalysis.analysis.profanity.level,
          detected: textAnalysis.analysis.profanity.detected || imageAnalysis.analysis.profanity.detected
        },
        overallRisk: this.getHigherRisk(textAnalysis.analysis.overallRisk, imageAnalysis.analysis.overallRisk),
        confidence: Math.round((textAnalysis.analysis.confidence + imageAnalysis.analysis.confidence) / 2),
        flaggedWords: [...(textAnalysis.analysis.flaggedWords || []), ...(imageAnalysis.analysis.flaggedWords || [])],
        suggestions: [...(textAnalysis.analysis.suggestions || []), ...(imageAnalysis.analysis.suggestions || [])]
      }
    };
  }

  private getHigherRisk(risk1: string, risk2: string): string {
    const riskLevels = { 'safe': 0, 'warning': 1, 'danger': 2, 'critical': 3 };
    return riskLevels[risk1 as keyof typeof riskLevels] > riskLevels[risk2 as keyof typeof riskLevels] ? risk1 : risk2;
  }
}

/**
 * Example middleware for Express.js applications
 */
export const createModerationMiddleware = (pluginUrl: string, apiKey?: string) => {
  const plugin = new HateSpeechDetectionPlugin(pluginUrl, apiKey);

  return {
    /**
     * Middleware to moderate text content
     */
    moderateText: (req: any, res: any, next: any) => {
      const { text, userId, platform } = req.body;

      if (!text) {
        return next();
      }

      plugin.analyzeText(text, { userId, platform })
        .then((analysis) => {
          const blockDecision = plugin.shouldBlockContent(analysis);
          
          if (blockDecision.shouldBlock) {
            return res.status(400).json({
              success: false,
              error: 'Content blocked',
              message: blockDecision.reason,
              analysis: analysis.analysis
            });
          }

          req.moderationAnalysis = analysis;
          next();
        })
        .catch((error) => {
          console.error('Moderation middleware error:', error);
          // Allow content if moderation fails
          next();
        });
    },

    /**
     * Middleware to moderate image content
     */
    moderateImage: (req: any, res: any, next: any) => {
      const { imageUrl, userId, platform, description } = req.body;

      if (!imageUrl) {
        return next();
      }

      plugin.analyzeImage(imageUrl, { userId, platform, description })
        .then((analysis) => {
          const blockDecision = plugin.shouldBlockContent(analysis);
          
          if (blockDecision.shouldBlock) {
            return res.status(400).json({
              success: false,
              error: 'Content blocked',
              message: blockDecision.reason,
              analysis: analysis.analysis
            });
          }

          req.moderationAnalysis = analysis;
          next();
        })
        .catch((error) => {
          console.error('Image moderation middleware error:', error);
          // Allow content if moderation fails
          next();
        });
    }
  };
};

/**
 * Example React hook for frontend integration
 */
export const useHateSpeechDetection = (pluginUrl: string, apiKey?: string) => {
  const plugin = new HateSpeechDetectionPlugin(pluginUrl, apiKey);

  const analyzeText = async (text: string, options?: { userId?: string; platform?: string }) => {
    try {
      return await plugin.analyzeText(text, options);
    } catch (error) {
      console.error('Text analysis error:', error);
      throw error;
    }
  };

  const analyzeImage = async (imageUrl: string, options?: { userId?: string; platform?: string; description?: string }) => {
    try {
      return await plugin.analyzeImage(imageUrl, options);
    } catch (error) {
      console.error('Image analysis error:', error);
      throw error;
    }
  };

  const shouldBlock = (analysis: any) => {
    return plugin.shouldBlockContent(analysis);
  };

  const getRecommendations = (analysis: any) => {
    return plugin.getModerationRecommendations(analysis);
  };

  return {
    analyzeText,
    analyzeImage,
    shouldBlock,
    getRecommendations,
    plugin
  };
};

