import axios from 'axios';
import { ContentAnalysisResult, TextAnalysisRequest } from '../types';
import { ProfanityFilter } from './ProfanityFilter';
import { ToxicityAnalyzer } from './ToxicityAnalyzer';
import * as natural from 'natural';

export class TextAnalysisService {
  private profanityFilter: ProfanityFilter;
  private toxicityAnalyzer: ToxicityAnalyzer;
  private sentimentAnalyzer: SentimentAnalyzer;
  private hateSpeechModel: any;
  private harassmentModel: any;
  private contextAnalyzer: ContextAnalyzer;
  private intentAnalyzer: IntentAnalyzer;

  constructor() {
    this.profanityFilter = new ProfanityFilter();
    this.toxicityAnalyzer = new ToxicityAnalyzer();
    this.sentimentAnalyzer = new SentimentAnalyzer();
    this.contextAnalyzer = new ContextAnalyzer();
    this.intentAnalyzer = new IntentAnalyzer();
    this.initializeModels();
  }

  private async initializeModels() {
    try {
      // Initialize pre-trained models for hate speech and harassment detection
      // Using Hugging Face transformers or similar models
      console.log('Initializing text analysis models...');
      // Model initialization would go here
    } catch (error) {
      console.error('Error initializing models:', error);
    }
  }

  public async analyzeText(request: TextAnalysisRequest): Promise<ContentAnalysisResult> {
    const startTime = Date.now();
    
    try {
      const originalText = request.text;
      const text = originalText.toLowerCase().trim();
      
      // Enhanced preprocessing
      const preprocessedText = this.preprocessText(originalText);
      
      // Context and intent analysis
      const contextAnalysis = await this.contextAnalyzer.analyze(preprocessedText);
      const intentAnalysis = await this.intentAnalyzer.analyze(preprocessedText);
      
      // Parallel analysis of different aspects with improved algorithms
      const [hateSpeechResult, toxicityResult, harassmentResult, profanityResult, sentimentResult] = await Promise.all([
        this.analyzeHateSpeech(preprocessedText, contextAnalysis, intentAnalysis),
        this.analyzeToxicity(preprocessedText, contextAnalysis, intentAnalysis),
        this.analyzeHarassment(preprocessedText, contextAnalysis, intentAnalysis),
        this.analyzeProfanity(preprocessedText, contextAnalysis),
        this.sentimentAnalyzer.analyze(preprocessedText)
      ]);

      // Calculate overall risk level with improved weighting
      const overallRisk = this.calculateOverallRisk(
        hateSpeechResult.score,
        toxicityResult.score,
        harassmentResult.score,
        profanityResult.score,
        sentimentResult.score,
        contextAnalysis,
        intentAnalysis
      );

      // Calculate confidence based on multiple factors
      const confidence = this.calculateConfidence([
        hateSpeechResult.score,
        toxicityResult.score,
        harassmentResult.score,
        profanityResult.score,
        sentimentResult.score
      ], contextAnalysis, intentAnalysis);

      const processingTime = Date.now() - startTime;

      const result: ContentAnalysisResult = {
        id: this.generateId(),
        content: request.text,
        contentType: 'text',
        analysis: {
          hateSpeech: hateSpeechResult,
          toxicity: toxicityResult,
          harassment: harassmentResult,
          profanity: profanityResult,
          sentiment: sentimentResult,
          context: contextAnalysis,
          intent: intentAnalysis,
          overallRisk,
          confidence,
          flaggedWords: this.extractFlaggedWords(preprocessedText),
          suggestions: this.generateSuggestions(overallRisk, contextAnalysis),
          reasoning: this.generateReasoning(hateSpeechResult, toxicityResult, harassmentResult, profanityResult, sentimentResult)
        },
        metadata: {
          userId: request.userId,
          platform: request.platform,
          timestamp: new Date(),
          processingTime
        }
      };

      return result;
    } catch (error) {
      console.error('Error analyzing text:', error);
      throw new Error('Failed to analyze text content');
    }
  }

  private async analyzeHateSpeech(
    text: string, 
    contextAnalysis: any, 
    intentAnalysis: any
  ): Promise<{
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    detected: boolean;
    reasoning: string[];
  }> {
    const reasoning: string[] = [];
    let score = 0;
    let detected = false;

    // Enhanced hate speech detection with context awareness
    const hateSpeechIndicators = {
      // Direct hate speech patterns
      directHate: [
        /i\s+hate\s+(all\s+)?(blacks?|whites?|jews?|muslims?|gays?|women?|men)/gi,
        /(blacks?|whites?|jews?|muslims?|gays?|women?|men)\s+should\s+(die|be\s+killed|be\s+eliminated)/gi,
        /(nazi|fascist|supremacist)\s+(ideology|beliefs?|views?)/gi
      ],
      
      // Indirect hate speech patterns
      indirectHate: [
        /(blacks?|whites?|jews?|muslims?|gays?|women?|men)\s+are\s+(inferior|superior|animals?|scum)/gi,
        /(blacks?|whites?|jews?|muslims?|gays?|women?|men)\s+don't\s+belong/gi,
        /(blacks?|whites?|jews?|muslims?|gays?|women?|men)\s+are\s+(ruining|destroying)/gi
      ],
      
      // Dehumanizing language
      dehumanizing: [
        /(blacks?|whites?|jews?|muslims?|gays?|women?|men)\s+are\s+(animals?|vermin|pests?)/gi,
        /(blacks?|whites?|jews?|muslims?|gays?|women?|men)\s+should\s+be\s+(exterminated|eliminated)/gi
      ]
    };

    // Check for direct hate speech
    for (const pattern of hateSpeechIndicators.directHate) {
      if (pattern.test(text)) {
        score += 40;
        detected = true;
        reasoning.push('Direct hate speech pattern detected');
      }
    }

    // Check for indirect hate speech
    for (const pattern of hateSpeechIndicators.indirectHate) {
      if (pattern.test(text)) {
        score += 25;
        detected = true;
        reasoning.push('Indirect hate speech pattern detected');
      }
    }

    // Check for dehumanizing language
    for (const pattern of hateSpeechIndicators.dehumanizing) {
      if (pattern.test(text)) {
        score += 35;
        detected = true;
        reasoning.push('Dehumanizing language detected');
      }
    }

    // Context-aware scoring adjustments
    if (contextAnalysis.isSarcastic || contextAnalysis.isIronic) {
      score *= 0.3; // Reduce score for sarcastic/ironic content
      reasoning.push('Score reduced due to sarcastic/ironic context');
    }

    if (contextAnalysis.isEducational || contextAnalysis.isHistorical) {
      score *= 0.2; // Further reduce for educational content
      reasoning.push('Score reduced due to educational context');
    }

    if (intentAnalysis.isThreatening) {
      score *= 1.5; // Increase score for threatening intent
      reasoning.push('Score increased due to threatening intent');
    }

    // Use ML model for more sophisticated detection
    try {
      const mlScore = await this.getMLHateSpeechScore(text);
      if (mlScore > score) {
        score = mlScore;
        reasoning.push('ML model detected higher hate speech score');
      }
      if (mlScore > 30) detected = true;
    } catch (error) {
      console.warn('ML hate speech detection failed, using rule-based only');
    }

    score = Math.min(score, 100);

    return {
      score,
      level: this.getRiskLevel(score),
      detected,
      reasoning
    };
  }

  private async analyzeToxicity(
    text: string, 
    contextAnalysis: any, 
    intentAnalysis: any
  ): Promise<{
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    detected: boolean;
    reasoning: string[];
  }> {
    const reasoning: string[] = [];
    let toxicityScore = await this.toxicityAnalyzer.analyze(text);
    
    // Context-aware adjustments
    if (contextAnalysis.isSarcastic || contextAnalysis.isIronic) {
      toxicityScore *= 0.4;
      reasoning.push('Toxicity score reduced due to sarcastic context');
    }
    
    if (contextAnalysis.isPlayful || contextAnalysis.isFriendly) {
      toxicityScore *= 0.3;
      reasoning.push('Toxicity score reduced due to playful context');
    }
    
    if (intentAnalysis.isAggressive || intentAnalysis.isHostile) {
      toxicityScore *= 1.3;
      reasoning.push('Toxicity score increased due to aggressive intent');
    }
    
    return {
      score: Math.min(toxicityScore, 100),
      level: this.getRiskLevel(toxicityScore),
      detected: toxicityScore > 40, // Lowered threshold for better sensitivity
      reasoning
    };
  }

  private async analyzeHarassment(
    text: string, 
    contextAnalysis: any, 
    intentAnalysis: any
  ): Promise<{
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    detected: boolean;
    reasoning: string[];
  }> {
    const reasoning: string[] = [];
    let score = 0;
    let detected = false;

    // Enhanced harassment detection patterns
    const harassmentPatterns = {
      // Direct threats
      directThreats: [
        /i\s+will\s+(hurt|harm|kill|attack|destroy)\s+you/gi,
        /you\s+will\s+(pay|suffer|regret)/gi,
        /i\s+am\s+going\s+to\s+(hurt|harm|kill|attack)\s+you/gi
      ],
      
      // Stalking behavior
      stalking: [
        /i\s+know\s+where\s+you\s+(live|work|go)/gi,
        /i\s+am\s+watching\s+you/gi,
        /i\s+see\s+you\s+(everywhere|all\s+the\s+time)/gi,
        /i\s+follow\s+you/gi
      ],
      
      // Intimidation
      intimidation: [
        /watch\s+your\s+(back|step)/gi,
        /you\s+better\s+(watch\s+out|be\s+careful)/gi,
        /i\s+will\s+find\s+you/gi,
        /you\s+can't\s+hide/gi
      ],
      
      // Cyberbullying
      cyberbullying: [
        /everyone\s+hates\s+you/gi,
        /nobody\s+(likes|loves)\s+you/gi,
        /you\s+should\s+(kill\s+yourself|die)/gi,
        /you\s+are\s+(worthless|useless|pathetic)/gi
      ]
    };

    // Check for direct threats
    for (const pattern of harassmentPatterns.directThreats) {
      if (pattern.test(text)) {
        score += 45;
        detected = true;
        reasoning.push('Direct threat pattern detected');
      }
    }

    // Check for stalking behavior
    for (const pattern of harassmentPatterns.stalking) {
      if (pattern.test(text)) {
        score += 35;
        detected = true;
        reasoning.push('Stalking behavior pattern detected');
      }
    }

    // Check for intimidation
    for (const pattern of harassmentPatterns.intimidation) {
      if (pattern.test(text)) {
        score += 25;
        detected = true;
        reasoning.push('Intimidation pattern detected');
      }
    }

    // Check for cyberbullying
    for (const pattern of harassmentPatterns.cyberbullying) {
      if (pattern.test(text)) {
        score += 30;
        detected = true;
        reasoning.push('Cyberbullying pattern detected');
      }
    }

    // Context-aware adjustments
    if (contextAnalysis.isSarcastic || contextAnalysis.isIronic) {
      score *= 0.2;
      reasoning.push('Harassment score reduced due to sarcastic context');
    }

    if (intentAnalysis.isThreatening) {
      score *= 1.4;
      reasoning.push('Harassment score increased due to threatening intent');
    }

    score = Math.min(score, 100);

    return {
      score,
      level: this.getRiskLevel(score),
      detected,
      reasoning
    };
  }

  private async analyzeProfanity(
    text: string, 
    contextAnalysis: any
  ): Promise<{
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    detected: boolean;
    reasoning: string[];
  }> {
    const reasoning: string[] = [];
    let profanityScore = await this.profanityFilter.analyze(text);
    
    // Context-aware adjustments
    if (contextAnalysis.isSarcastic || contextAnalysis.isIronic) {
      profanityScore *= 0.3;
      reasoning.push('Profanity score reduced due to sarcastic context');
    }
    
    if (contextAnalysis.isPlayful || contextAnalysis.isFriendly) {
      profanityScore *= 0.4;
      reasoning.push('Profanity score reduced due to playful context');
    }
    
    if (contextAnalysis.isEducational || contextAnalysis.isHistorical) {
      profanityScore *= 0.1;
      reasoning.push('Profanity score reduced due to educational context');
    }
    
    return {
      score: Math.min(profanityScore, 100),
      level: this.getRiskLevel(profanityScore),
      detected: profanityScore > 25, // Lowered threshold
      reasoning
    };
  }

  private async getMLHateSpeechScore(text: string): Promise<number> {
    // This would integrate with a pre-trained model like BERT or RoBERTa
    // For now, returning a mock score based on text analysis
    try {
      // Mock ML model call - replace with actual model integration
      const response = await axios.post('https://api-inference.huggingface.co/models/facebook/roberta-hate-speech-dynabench-r4-target', {
        inputs: text
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`
        }
      });

      if (response.data && response.data[0]) {
        const hateScore = response.data[0].find((item: any) => item.label === 'HATE')?.score || 0;
        return Math.round(hateScore * 100);
      }
    } catch (error) {
      console.warn('Hugging Face API call failed:', error);
    }

    return 0;
  }

  private calculateOverallRisk(
    hateSpeech: number,
    toxicity: number,
    harassment: number,
    profanity: number,
    sentiment: number,
    contextAnalysis: any,
    intentAnalysis: any
  ): 'safe' | 'warning' | 'danger' | 'critical' {
    // Weighted scoring based on severity
    const weights = {
      hateSpeech: 0.35,    // Highest weight - most serious
      harassment: 0.25,    // Second highest - serious threat
      toxicity: 0.20,      // Moderate weight
      profanity: 0.15,     // Lower weight
      sentiment: 0.05      // Lowest weight - supporting factor
    };

    const weightedScore = (
      hateSpeech * weights.hateSpeech +
      harassment * weights.harassment +
      toxicity * weights.toxicity +
      profanity * weights.profanity +
      sentiment * weights.sentiment
    );

    // Context adjustments
    let adjustedScore = weightedScore;
    
    if (contextAnalysis.isSarcastic || contextAnalysis.isIronic) {
      adjustedScore *= 0.4;
    }
    
    if (contextAnalysis.isEducational || contextAnalysis.isHistorical) {
      adjustedScore *= 0.3;
    }
    
    if (intentAnalysis.isThreatening || intentAnalysis.isAggressive) {
      adjustedScore *= 1.3;
    }

    // Dynamic thresholds based on context
    const thresholds = {
      critical: 70,
      danger: 50,
      warning: 30
    };

    if (adjustedScore >= thresholds.critical) return 'critical';
    if (adjustedScore >= thresholds.danger) return 'danger';
    if (adjustedScore >= thresholds.warning) return 'warning';
    return 'safe';
  }

  private calculateConfidence(
    scores: number[], 
    contextAnalysis: any, 
    intentAnalysis: any
  ): number {
    // Calculate confidence based on multiple factors
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // Base confidence from score consistency
    let confidence = Math.max(0, 100 - (stdDev * 2));
    
    // Adjust based on context clarity
    if (contextAnalysis.isSarcastic || contextAnalysis.isIronic) {
      confidence *= 0.7; // Lower confidence for ambiguous context
    }
    
    if (contextAnalysis.isEducational || contextAnalysis.isHistorical) {
      confidence *= 0.8; // Slightly lower confidence for educational content
    }
    
    if (intentAnalysis.isClear) {
      confidence *= 1.1; // Higher confidence for clear intent
    }
    
    return Math.round(Math.min(confidence, 100));
  }

  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  private extractFlaggedWords(text: string): string[] {
    const flaggedWords: string[] = [];
    const words = text.split(/\s+/);
    
    const allKeywords = [
      'hate', 'kill', 'destroy', 'racist', 'sexist', 'harass', 'bully', 'threaten'
    ];

    for (const word of words) {
      if (allKeywords.some(keyword => word.includes(keyword))) {
        flaggedWords.push(word);
      }
    }

    return [...new Set(flaggedWords)];
  }


  private generateId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private preprocessText(text: string): string {
    // Enhanced text preprocessing
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s]/g, ' ') // Remove special characters but keep spaces
      .trim();
  }

  private generateReasoning(
    hateSpeech: any,
    toxicity: any,
    harassment: any,
    profanity: any,
    sentiment: any
  ): string[] {
    const reasoning: string[] = [];
    
    if (hateSpeech.reasoning) reasoning.push(...hateSpeech.reasoning);
    if (toxicity.reasoning) reasoning.push(...toxicity.reasoning);
    if (harassment.reasoning) reasoning.push(...harassment.reasoning);
    if (profanity.reasoning) reasoning.push(...profanity.reasoning);
    
    return [...new Set(reasoning)]; // Remove duplicates
  }

  private generateSuggestions(riskLevel: string, contextAnalysis: any): string[] {
    const baseSuggestions: { [key: string]: string[] } = {
      safe: ['Content appears safe for publication'],
      warning: ['Consider reviewing content before publication', 'Content may need minor adjustments'],
      danger: ['Content should be reviewed by moderators', 'Consider editing or removing problematic sections'],
      critical: ['Content should not be published', 'Immediate moderation required', 'Consider user warning or suspension']
    };

    let suggestions = baseSuggestions[riskLevel] || [];
    
    // Add context-specific suggestions
    if (contextAnalysis.isSarcastic || contextAnalysis.isIronic) {
      suggestions.push('Consider adding context indicators for sarcastic content');
    }
    
    if (contextAnalysis.isEducational) {
      suggestions.push('Educational content may need additional context or warnings');
    }
    
    return suggestions;
  }
}

// Helper classes for enhanced analysis
class ContextAnalyzer {
  public async analyze(text: string): Promise<any> {
    const analysis = {
      isSarcastic: this.detectSarcasm(text),
      isIronic: this.detectIrony(text),
      isPlayful: this.detectPlayfulness(text),
      isFriendly: this.detectFriendliness(text),
      isEducational: this.detectEducational(text),
      isHistorical: this.detectHistorical(text),
      isFormal: this.detectFormality(text)
    };
    
    return analysis;
  }

  private detectSarcasm(text: string): boolean {
    const sarcasmIndicators = [
      /yeah\s+right/gi,
      /sure\s+thing/gi,
      /oh\s+great/gi,
      /wonderful/gi,
      /fantastic/gi,
      /as\s+if/gi,
      /whatever/gi
    ];
    
    return sarcasmIndicators.some(pattern => pattern.test(text));
  }

  private detectIrony(text: string): boolean {
    const ironyIndicators = [
      /ironically/gi,
      /paradoxically/gi,
      /surprisingly/gi,
      /unexpectedly/gi
    ];
    
    return ironyIndicators.some(pattern => pattern.test(text));
  }

  private detectPlayfulness(text: string): boolean {
    const playfulIndicators = [
      /lol/gi,
      /haha/gi,
      /hehe/gi,
      /jk/gi,
      /just\s+kidding/gi,
      /😄|😊|😂|🤣/g
    ];
    
    return playfulIndicators.some(pattern => pattern.test(text));
  }

  private detectFriendliness(text: string): boolean {
    const friendlyIndicators = [
      /please/gi,
      /thank\s+you/gi,
      /thanks/gi,
      /appreciate/gi,
      /kind\s+of/gi,
      /sort\s+of/gi
    ];
    
    return friendlyIndicators.some(pattern => pattern.test(text));
  }

  private detectEducational(text: string): boolean {
    const educationalIndicators = [
      /according\s+to/gi,
      /research\s+shows/gi,
      /studies\s+indicate/gi,
      /historically/gi,
      /in\s+fact/gi,
      /for\s+example/gi
    ];
    
    return educationalIndicators.some(pattern => pattern.test(text));
  }

  private detectHistorical(text: string): boolean {
    const historicalIndicators = [
      /in\s+\d{4}/gi,
      /during\s+the/gi,
      /historically/gi,
      /in\s+the\s+past/gi,
      /century/gi,
      /era/gi
    ];
    
    return historicalIndicators.some(pattern => pattern.test(text));
  }

  private detectFormality(text: string): boolean {
    const formalIndicators = [
      /therefore/gi,
      /however/gi,
      /furthermore/gi,
      /moreover/gi,
      /consequently/gi
    ];
    
    return formalIndicators.some(pattern => pattern.test(text));
  }
}

class IntentAnalyzer {
  public async analyze(text: string): Promise<any> {
    const analysis = {
      isThreatening: this.detectThreats(text),
      isAggressive: this.detectAggression(text),
      isHostile: this.detectHostility(text),
      isClear: this.detectClarity(text),
      isConstructive: this.detectConstructiveness(text)
    };
    
    return analysis;
  }

  private detectThreats(text: string): boolean {
    const threatIndicators = [
      /i\s+will\s+(hurt|harm|kill|attack)/gi,
      /you\s+will\s+(pay|suffer|regret)/gi,
      /threat/gi,
      /warning/gi
    ];
    
    return threatIndicators.some(pattern => pattern.test(text));
  }

  private detectAggression(text: string): boolean {
    const aggressionIndicators = [
      /angry/gi,
      /furious/gi,
      /rage/gi,
      /attack/gi,
      /fight/gi,
      /destroy/gi
    ];
    
    return aggressionIndicators.some(pattern => pattern.test(text));
  }

  private detectHostility(text: string): boolean {
    const hostilityIndicators = [
      /hate/gi,
      /despise/gi,
      /loathe/gi,
      /enemy/gi,
      /opponent/gi
    ];
    
    return hostilityIndicators.some(pattern => pattern.test(text));
  }

  private detectClarity(text: string): boolean {
    // Simple heuristic for clarity
    const wordCount = text.split(/\s+/).length;
    const hasPunctuation = /[.!?]/.test(text);
    
    return wordCount > 5 && hasPunctuation;
  }

  private detectConstructiveness(text: string): boolean {
    const constructiveIndicators = [
      /suggest/gi,
      /recommend/gi,
      /propose/gi,
      /help/gi,
      /improve/gi,
      /better/gi
    ];
    
    return constructiveIndicators.some(pattern => pattern.test(text));
  }
}

class SentimentAnalyzer {
  public async analyze(text: string): Promise<{
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    detected: boolean;
    reasoning: string[];
  }> {
    const reasoning: string[] = [];
    let score = 0;

    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'wonderful', 'amazing', 'love', 'like'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'angry'];

    const words = text.split(/\s+/);
    
    words.forEach(word => {
      if (positiveWords.includes(word)) {
        score -= 10; // Reduce negative sentiment
        reasoning.push('Positive sentiment detected');
      }
      if (negativeWords.includes(word)) {
        score += 15; // Increase negative sentiment
        reasoning.push('Negative sentiment detected');
      }
    });

    // Check for emotional intensity
    const exclamationCount = (text.match(/!/g) || []).length;
    if (exclamationCount > 2) {
      score += exclamationCount * 5;
      reasoning.push('High emotional intensity detected');
    }

    return {
      score: Math.min(score, 100),
      level: this.getRiskLevel(score),
      detected: score > 20,
      reasoning
    };
  }

  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }
}

