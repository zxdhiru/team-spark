export interface ContentAnalysisResult {
  id: string;
  content: string;
  contentType: 'text' | 'image';
  analysis: {
    hateSpeech: {
      score: number; // 1-100
      level: 'low' | 'medium' | 'high' | 'critical';
      detected: boolean;
      reasoning?: string[];
    };
    toxicity: {
      score: number; // 1-100
      level: 'low' | 'medium' | 'high' | 'critical';
      detected: boolean;
      reasoning?: string[];
    };
    harassment: {
      score: number; // 1-100
      level: 'low' | 'medium' | 'high' | 'critical';
      detected: boolean;
      reasoning?: string[];
    };
    profanity: {
      score: number; // 1-100
      level: 'low' | 'medium' | 'high' | 'critical';
      detected: boolean;
      reasoning?: string[];
    };
    sentiment?: {
      score: number; // 1-100
      level: 'low' | 'medium' | 'high' | 'critical';
      detected: boolean;
      reasoning?: string[];
    };
    context?: {
      isSarcastic: boolean;
      isIronic: boolean;
      isPlayful: boolean;
      isFriendly: boolean;
      isEducational: boolean;
      isHistorical: boolean;
      isFormal: boolean;
    };
    intent?: {
      isThreatening: boolean;
      isAggressive: boolean;
      isHostile: boolean;
      isClear: boolean;
      isConstructive: boolean;
    };
    overallRisk: 'safe' | 'warning' | 'danger' | 'critical';
    confidence: number; // 0-100
    flaggedWords?: string[];
    suggestions?: string[];
    reasoning?: string[];
  };
  metadata: {
    userId?: string;
    platform?: string;
    timestamp: Date;
    processingTime: number;
  };
}

export interface TextAnalysisRequest {
  text: string;
  userId?: string;
  platform?: string;
  language?: string;
}

export interface ImageAnalysisRequest {
  imageUrl: string;
  userId?: string;
  platform?: string;
  description?: string;
}

export interface PluginConfig {
  thresholds: {
    hateSpeech: number;
    toxicity: number;
    harassment: number;
    profanity: number;
  };
  enabledFeatures: {
    textAnalysis: boolean;
    imageAnalysis: boolean;
    realTimeAnalysis: boolean;
  };
  supportedLanguages: string[];
  customRules?: string[];
}

export interface AnalysisResponse {
  success: boolean;
  data?: ContentAnalysisResult;
  error?: string;
  message?: string;
}

export interface PluginIntegration {
  platform: string;
  version: string;
  endpoints: {
    textAnalysis: string;
    imageAnalysis: string;
    healthCheck: string;
  };
  authentication: {
    type: 'api_key' | 'oauth' | 'jwt';
    required: boolean;
  };
}

