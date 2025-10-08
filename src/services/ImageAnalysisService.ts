import axios from 'axios';
import { ContentAnalysisResult, ImageAnalysisRequest } from '../types';

export class ImageAnalysisService {
  private openaiApiKey: string;

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    if (!this.openaiApiKey) {
      console.warn('OpenAI API key not provided. Image analysis will be limited.');
    }
  }

  public async analyzeImage(request: ImageAnalysisRequest): Promise<ContentAnalysisResult> {
    const startTime = Date.now();
    
    try {
      // Analyze image using OpenAI Vision API
      const imageAnalysis = await this.analyzeWithOpenAI(request.imageUrl, request.description);
      
      // Analyze text description if provided
      const textAnalysis = request.description ? 
        await this.analyzeImageDescription(request.description) : null;

      // Combine results
      const combinedAnalysis = this.combineImageAndTextAnalysis(imageAnalysis, textAnalysis);

      const processingTime = Date.now() - startTime;

      const result: ContentAnalysisResult = {
        id: this.generateId(),
        content: request.imageUrl,
        contentType: 'image',
        analysis: combinedAnalysis,
        metadata: {
          userId: request.userId,
          platform: request.platform,
          timestamp: new Date(),
          processingTime
        }
      };

      return result;
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw new Error('Failed to analyze image content');
    }
  }

  private async analyzeWithOpenAI(imageUrl: string, description?: string): Promise<{
    hateSpeech: { score: number; level: string; detected: boolean };
    toxicity: { score: number; level: string; detected: boolean };
    harassment: { score: number; level: string; detected: boolean };
    profanity: { score: number; level: string; detected: boolean };
    overallRisk: string;
    confidence: number;
    flaggedWords?: string[];
    suggestions?: string[];
  }> {
    if (!this.openaiApiKey) {
      return this.getDefaultAnalysis();
    }

    try {
      const prompt = this.buildAnalysisPrompt(description);
      
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      }, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const analysis = this.parseOpenAIResponse(response.data.choices[0].message.content);
      return analysis;
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.getDefaultAnalysis();
    }
  }

  private buildAnalysisPrompt(description?: string): string {
    return `
Analyze this image for hate speech, toxicity, harassment, and profanity content. Consider both visual elements and any text in the image.

${description ? `Additional context: ${description}` : ''}

Please provide a JSON response with the following structure:
{
  "hateSpeech": {
    "score": 0-100,
    "level": "low|medium|high|critical",
    "detected": true/false,
    "reasoning": "explanation"
  },
  "toxicity": {
    "score": 0-100,
    "level": "low|medium|high|critical", 
    "detected": true/false,
    "reasoning": "explanation"
  },
  "harassment": {
    "score": 0-100,
    "level": "low|medium|high|critical",
    "detected": true/false,
    "reasoning": "explanation"
  },
  "profanity": {
    "score": 0-100,
    "level": "low|medium|high|critical",
    "detected": true/false,
    "reasoning": "explanation"
  },
  "overallRisk": "safe|warning|danger|critical",
  "confidence": 0-100,
  "flaggedElements": ["list of problematic elements"],
  "suggestions": ["list of recommendations"]
}

Scoring guidelines:
- 0-25: Low risk, minimal concerns
- 26-50: Medium risk, some concerns
- 51-75: High risk, significant concerns  
- 76-100: Critical risk, severe concerns

Consider:
- Explicit content, violence, or disturbing imagery
- Hate symbols, discriminatory content
- Harassment, bullying, or threatening imagery
- Profane or offensive text/imagery
- Context and intent of the content
`;
  }

  private parseOpenAIResponse(response: string): {
    hateSpeech: { score: number; level: string; detected: boolean };
    toxicity: { score: number; level: string; detected: boolean };
    harassment: { score: number; level: string; detected: boolean };
    profanity: { score: number; level: string; detected: boolean };
    overallRisk: string;
    confidence: number;
    flaggedWords?: string[];
    suggestions?: string[];
  } {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      
      return {
        hateSpeech: {
          score: analysis.hateSpeech?.score || 0,
          level: analysis.hateSpeech?.level || 'low',
          detected: analysis.hateSpeech?.detected || false
        },
        toxicity: {
          score: analysis.toxicity?.score || 0,
          level: analysis.toxicity?.level || 'low',
          detected: analysis.toxicity?.detected || false
        },
        harassment: {
          score: analysis.harassment?.score || 0,
          level: analysis.harassment?.level || 'low',
          detected: analysis.harassment?.detected || false
        },
        profanity: {
          score: analysis.profanity?.score || 0,
          level: analysis.profanity?.level || 'low',
          detected: analysis.profanity?.detected || false
        },
        overallRisk: analysis.overallRisk || 'safe',
        confidence: analysis.confidence || 50,
        flaggedWords: analysis.flaggedElements || [],
        suggestions: analysis.suggestions || []
      };
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      return this.getDefaultAnalysis();
    }
  }

  private async analyzeImageDescription(description: string): Promise<{
    hateSpeech: { score: number; level: string; detected: boolean };
    toxicity: { score: number; level: string; detected: boolean };
    harassment: { score: number; level: string; detected: boolean };
    profanity: { score: number; level: string; detected: boolean };
  }> {
    // Use text analysis on the description
    const textAnalysisService = new (await import('./TextAnalysisService')).TextAnalysisService();
    const result = await textAnalysisService.analyzeText({
      text: description,
      language: 'en'
    });

    return result.analysis;
  }

  private combineImageAndTextAnalysis(
    imageAnalysis: any,
    textAnalysis: any
  ): {
    hateSpeech: { score: number; level: 'low' | 'medium' | 'high' | 'critical'; detected: boolean; reasoning?: string[] };
    toxicity: { score: number; level: 'low' | 'medium' | 'high' | 'critical'; detected: boolean; reasoning?: string[] };
    harassment: { score: number; level: 'low' | 'medium' | 'high' | 'critical'; detected: boolean; reasoning?: string[] };
    profanity: { score: number; level: 'low' | 'medium' | 'high' | 'critical'; detected: boolean; reasoning?: string[] };
    overallRisk: 'safe' | 'warning' | 'danger' | 'critical';
    confidence: number;
    flaggedWords?: string[];
    suggestions?: string[];
    reasoning?: string[];
  } {
    if (!textAnalysis) {
      return imageAnalysis;
    }

    // Combine scores (take the higher of the two)
    const combined = {
      hateSpeech: {
        score: Math.max(imageAnalysis.hateSpeech.score, textAnalysis.hateSpeech.score),
        level: this.getRiskLevel(Math.max(imageAnalysis.hateSpeech.score, textAnalysis.hateSpeech.score)),
        detected: imageAnalysis.hateSpeech.detected || textAnalysis.hateSpeech.detected
      },
      toxicity: {
        score: Math.max(imageAnalysis.toxicity.score, textAnalysis.toxicity.score),
        level: this.getRiskLevel(Math.max(imageAnalysis.toxicity.score, textAnalysis.toxicity.score)),
        detected: imageAnalysis.toxicity.detected || textAnalysis.toxicity.detected
      },
      harassment: {
        score: Math.max(imageAnalysis.harassment.score, textAnalysis.harassment.score),
        level: this.getRiskLevel(Math.max(imageAnalysis.harassment.score, textAnalysis.harassment.score)),
        detected: imageAnalysis.harassment.detected || textAnalysis.harassment.detected
      },
      profanity: {
        score: Math.max(imageAnalysis.profanity.score, textAnalysis.profanity.score),
        level: this.getRiskLevel(Math.max(imageAnalysis.profanity.score, textAnalysis.profanity.score)),
        detected: imageAnalysis.profanity.detected || textAnalysis.profanity.detected
      },
      overallRisk: this.calculateOverallRisk(
        Math.max(imageAnalysis.hateSpeech.score, textAnalysis.hateSpeech.score),
        Math.max(imageAnalysis.toxicity.score, textAnalysis.toxicity.score),
        Math.max(imageAnalysis.harassment.score, textAnalysis.harassment.score),
        Math.max(imageAnalysis.profanity.score, textAnalysis.profanity.score)
      ),
      confidence: Math.round((imageAnalysis.confidence + textAnalysis.confidence) / 2),
      flaggedWords: [...(imageAnalysis.flaggedWords || []), ...(textAnalysis.flaggedWords || [])],
      suggestions: [...(imageAnalysis.suggestions || []), ...(textAnalysis.suggestions || [])]
    };

    return combined;
  }

  private getDefaultAnalysis(): {
    hateSpeech: { score: number; level: string; detected: boolean };
    toxicity: { score: number; level: string; detected: boolean };
    harassment: { score: number; level: string; detected: boolean };
    profanity: { score: number; level: string; detected: boolean };
    overallRisk: string;
    confidence: number;
    flaggedWords?: string[];
    suggestions?: string[];
  } {
    return {
      hateSpeech: { score: 0, level: 'low', detected: false },
      toxicity: { score: 0, level: 'low', detected: false },
      harassment: { score: 0, level: 'low', detected: false },
      profanity: { score: 0, level: 'low', detected: false },
      overallRisk: 'safe',
      confidence: 50,
      flaggedWords: [],
      suggestions: ['Unable to analyze image content - manual review recommended']
    };
  }

  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  private calculateOverallRisk(
    hateSpeech: number,
    toxicity: number,
    harassment: number,
    profanity: number
  ): 'safe' | 'warning' | 'danger' | 'critical' {
    const maxScore = Math.max(hateSpeech, toxicity, harassment, profanity);
    const avgScore = (hateSpeech + toxicity + harassment + profanity) / 4;

    if (maxScore >= 80 || avgScore >= 70) return 'critical';
    if (maxScore >= 60 || avgScore >= 50) return 'danger';
    if (maxScore >= 40 || avgScore >= 30) return 'warning';
    return 'safe';
  }

  private generateId(): string {
    return `image_analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

