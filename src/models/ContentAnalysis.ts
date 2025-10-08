import mongoose, { Document, Schema } from 'mongoose';

export interface IContentAnalysis extends Document {
  content: string;
  contentType: 'text' | 'image';
  analysis: {
    hateSpeech: {
      score: number;
      level: 'low' | 'medium' | 'high' | 'critical';
      detected: boolean;
    };
    toxicity: {
      score: number;
      level: 'low' | 'medium' | 'high' | 'critical';
      detected: boolean;
    };
    harassment: {
      score: number;
      level: 'low' | 'medium' | 'high' | 'critical';
      detected: boolean;
    };
    profanity: {
      score: number;
      level: 'low' | 'medium' | 'high' | 'critical';
      detected: boolean;
    };
    overallRisk: 'safe' | 'warning' | 'danger' | 'critical';
    confidence: number;
    flaggedWords?: string[];
    suggestions?: string[];
  };
  metadata: {
    userId?: string;
    platform?: string;
    timestamp: Date;
    processingTime: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ContentAnalysisSchema = new Schema<IContentAnalysis>({
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  contentType: {
    type: String,
    enum: ['text', 'image'],
    required: true
  },
  analysis: {
    hateSpeech: {
      score: { type: Number, required: true, min: 0, max: 100 },
      level: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
      detected: { type: Boolean, required: true }
    },
    toxicity: {
      score: { type: Number, required: true, min: 0, max: 100 },
      level: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
      detected: { type: Boolean, required: true }
    },
    harassment: {
      score: { type: Number, required: true, min: 0, max: 100 },
      level: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
      detected: { type: Boolean, required: true }
    },
    profanity: {
      score: { type: Number, required: true, min: 0, max: 100 },
      level: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
      detected: { type: Boolean, required: true }
    },
    overallRisk: {
      type: String,
      enum: ['safe', 'warning', 'danger', 'critical'],
      required: true
    },
    confidence: { type: Number, required: true, min: 0, max: 100 },
    flaggedWords: [String],
    suggestions: [String]
  },
  metadata: {
    userId: String,
    platform: String,
    timestamp: { type: Date, default: Date.now },
    processingTime: { type: Number, required: true }
  }
}, {
  timestamps: true
});

// Indexes for better performance
ContentAnalysisSchema.index({ 'metadata.userId': 1 });
ContentAnalysisSchema.index({ 'metadata.platform': 1 });
ContentAnalysisSchema.index({ 'analysis.overallRisk': 1 });
ContentAnalysisSchema.index({ 'metadata.timestamp': -1 });

export const ContentAnalysis = mongoose.model<IContentAnalysis>('ContentAnalysis', ContentAnalysisSchema);

