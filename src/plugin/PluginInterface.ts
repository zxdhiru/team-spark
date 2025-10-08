import axios, { AxiosInstance } from 'axios';
import { ContentAnalysisResult, TextAnalysisRequest, ImageAnalysisRequest, PluginConfig } from '../types';

export class HateSpeechDetectionPlugin {
  private apiClient: AxiosInstance;
  private baseUrl: string;
  private apiKey?: string;
  private config: PluginConfig;

  constructor(baseUrl: string, apiKey?: string, config?: Partial<PluginConfig>) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.config = {
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
      supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'],
      ...config
    };

    this.apiClient = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.apiClient.interceptors.request.use(
      (config) => {
        console.log(`Making request to: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.apiClient.interceptors.response.use(
      (response) => {
        console.log(`Response received: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('Response error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Analyze text content for hate speech and offensive content
   */
  public async analyzeText(text: string, options?: {
    userId?: string;
    platform?: string;
    language?: string;
  }): Promise<ContentAnalysisResult> {
    try {
      const request: TextAnalysisRequest = {
        text,
        userId: options?.userId,
        platform: options?.platform,
        language: options?.language || 'en'
      };

      const response = await this.apiClient.post('/api/v1/analysis/text', request);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Text analysis failed');
      }

      return response.data.data;
    } catch (error) {
      console.error('Text analysis error:', error);
      throw new Error(`Failed to analyze text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze image content for offensive material
   */
  public async analyzeImage(imageUrl: string, options?: {
    userId?: string;
    platform?: string;
    description?: string;
  }): Promise<ContentAnalysisResult> {
    try {
      const request: ImageAnalysisRequest = {
        imageUrl,
        userId: options?.userId,
        platform: options?.platform,
        description: options?.description
      };

      const response = await this.apiClient.post('/api/v1/analysis/image', request);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Image analysis failed');
      }

      return response.data.data;
    } catch (error) {
      console.error('Image analysis error:', error);
      throw new Error(`Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if content should be blocked based on analysis results
   */
  public shouldBlockContent(analysis: ContentAnalysisResult): {
    shouldBlock: boolean;
    reason?: string;
    riskLevel: string;
  } {
    const { analysis: results } = analysis;
    
    // Check against configured thresholds
    const shouldBlock = 
      results.hateSpeech.score >= this.config.thresholds.hateSpeech ||
      results.toxicity.score >= this.config.thresholds.toxicity ||
      results.harassment.score >= this.config.thresholds.harassment ||
      results.profanity.score >= this.config.thresholds.profanity ||
      results.overallRisk === 'critical';

    let reason: string | undefined;
    if (shouldBlock) {
      const reasons = [];
      if (results.hateSpeech.score >= this.config.thresholds.hateSpeech) {
        reasons.push('hate speech detected');
      }
      if (results.toxicity.score >= this.config.thresholds.toxicity) {
        reasons.push('toxic content detected');
      }
      if (results.harassment.score >= this.config.thresholds.harassment) {
        reasons.push('harassment detected');
      }
      if (results.profanity.score >= this.config.thresholds.profanity) {
        reasons.push('profanity detected');
      }
      if (results.overallRisk === 'critical') {
        reasons.push('critical risk level');
      }
      reason = reasons.join(', ');
    }

    return {
      shouldBlock,
      reason,
      riskLevel: results.overallRisk
    };
  }

  /**
   * Get moderation recommendations based on analysis
   */
  public getModerationRecommendations(analysis: ContentAnalysisResult): {
    action: 'allow' | 'review' | 'block' | 'warn';
    message: string;
    suggestions: string[];
  } {
    const { analysis: results } = analysis;
    
    let action: 'allow' | 'review' | 'block' | 'warn';
    let message: string;

    switch (results.overallRisk) {
      case 'critical':
        action = 'block';
        message = 'Content contains critical violations and should be blocked immediately';
        break;
      case 'danger':
        action = 'block';
        message = 'Content contains dangerous violations and should be blocked';
        break;
      case 'warning':
        action = 'review';
        message = 'Content may violate community guidelines and should be reviewed';
        break;
      default:
        action = 'allow';
        message = 'Content appears safe for publication';
    }

    return {
      action,
      message,
      suggestions: results.suggestions || []
    };
  }

  /**
   * Get analysis history for a user or platform
   */
  public async getAnalysisHistory(options?: {
    userId?: string;
    platform?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    analyses: ContentAnalysisResult[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    try {
      const response = await this.apiClient.get('/api/v1/analysis/history', {
        params: options
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to retrieve analysis history');
      }

      return response.data.data;
    } catch (error) {
      console.error('Get analysis history error:', error);
      throw new Error(`Failed to get analysis history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get statistics and analytics
   */
  public async getStatistics(options?: {
    userId?: string;
    platform?: string;
    days?: number;
  }): Promise<any> {
    try {
      const response = await this.apiClient.get('/api/v1/analysis/stats/overview', {
        params: options
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to retrieve statistics');
      }

      return response.data.data;
    } catch (error) {
      console.error('Get statistics error:', error);
      throw new Error(`Failed to get statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if the plugin service is healthy
   */
  public async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    version: string;
    services: {
      database: string;
      textAnalysis: string;
      imageAnalysis: string;
    };
  }> {
    try {
      const response = await this.apiClient.get('/api/v1/analysis/health');

      if (!response.data.success) {
        throw new Error(response.data.message || 'Health check failed');
      }

      return response.data.data;
    } catch (error) {
      console.error('Health check error:', error);
      throw new Error(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get plugin information and capabilities
   */
  public async getPluginInfo(): Promise<any> {
    try {
      const response = await this.apiClient.get('/api/v1/plugin/info');

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to retrieve plugin info');
      }

      return response.data.data;
    } catch (error) {
      console.error('Get plugin info error:', error);
      throw new Error(`Failed to get plugin info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update plugin configuration
   */
  public updateConfig(newConfig: Partial<PluginConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  public getConfig(): PluginConfig {
    return { ...this.config };
  }
}

