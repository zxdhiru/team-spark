import axios from 'axios';

export class ToxicityAnalyzer {
  private toxicityKeywords: string[];
  private toxicityPatterns: RegExp[];

  constructor() {
    this.toxicityKeywords = [
      'toxic', 'poison', 'venom', 'hate', 'disgusting', 'revolting',
      'pathetic', 'worthless', 'useless', 'garbage', 'trash',
      'annoying', 'irritating', 'infuriating', 'disgusting'
    ];

    this.toxicityPatterns = [
      /you\s+are\s+(so\s+)?(stupid|dumb|idiot|moron)/gi,
      /i\s+hate\s+you/gi,
      /you\s+suck/gi,
      /go\s+away/gi,
      /shut\s+up/gi,
      /nobody\s+cares/gi,
      /you\s+are\s+worthless/gi,
      /you\s+are\s+garbage/gi
    ];
  }

  public async analyze(text: string): Promise<number> {
    try {
      const cleanText = text.toLowerCase().trim();
      
      let score = 0;

      // Check for toxicity keywords
      const keywordScore = this.analyzeKeywords(cleanText);
      score += keywordScore;

      // Check for toxicity patterns
      const patternScore = this.analyzePatterns(cleanText);
      score += patternScore;

      // Use ML model for more sophisticated analysis
      const mlScore = await this.getMLToxicityScore(cleanText);
      score = Math.max(score, mlScore);

      // Analyze sentiment and emotional intensity
      const sentimentScore = this.analyzeSentiment(cleanText);
      score += sentimentScore;

      // Check for aggressive language
      const aggressionScore = this.analyzeAggression(cleanText);
      score += aggressionScore;

      return Math.min(score, 100);
    } catch (error) {
      console.error('Error analyzing toxicity:', error);
      return 0;
    }
  }

  private analyzeKeywords(text: string): number {
    let score = 0;
    
    this.toxicityKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 10;
      }
    });

    return Math.min(score, 40);
  }

  private analyzePatterns(text: string): number {
    let score = 0;

    this.toxicityPatterns.forEach(pattern => {
      if (pattern.test(text)) {
        score += 15;
      }
    });

    return Math.min(score, 30);
  }

  private async getMLToxicityScore(text: string): Promise<number> {
    try {
      // Use Perspective API or similar ML service
      const response = await axios.post('https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze', {
        comment: {
          text: text
        },
        requestedAttributes: {
          TOXICITY: {},
          SEVERE_TOXICITY: {},
          IDENTITY_ATTACK: {},
          INSULT: {},
          THREAT: {}
        }
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        params: {
          key: process.env.PERSPECTIVE_API_KEY
        }
      });

      if (response.data && response.data.attributeScores) {
        const scores = response.data.attributeScores;
        const toxicityScore = scores.TOXICITY?.summaryScore?.value || 0;
        const severeToxicityScore = scores.SEVERE_TOXICITY?.summaryScore?.value || 0;
        const identityAttackScore = scores.IDENTITY_ATTACK?.summaryScore?.value || 0;
        const insultScore = scores.INSULT?.summaryScore?.value || 0;
        const threatScore = scores.THREAT?.summaryScore?.value || 0;

        // Calculate weighted average
        const weightedScore = (
          toxicityScore * 0.3 +
          severeToxicityScore * 0.25 +
          identityAttackScore * 0.2 +
          insultScore * 0.15 +
          threatScore * 0.1
        ) * 100;

        return Math.round(weightedScore);
      }
    } catch (error) {
      console.warn('ML toxicity analysis failed, using rule-based only:', error);
    }

    return 0;
  }

  private analyzeSentiment(text: string): number {
    // Simple sentiment analysis based on negative words and patterns
    const negativeWords = [
      'hate', 'dislike', 'terrible', 'awful', 'horrible', 'disgusting',
      'annoying', 'irritating', 'frustrating', 'angry', 'mad', 'upset'
    ];

    const negativePatterns = [
      /i\s+hate/gi,
      /i\s+dislike/gi,
      /this\s+is\s+terrible/gi,
      /this\s+is\s+awful/gi,
      /i\s+can't\s+stand/gi
    ];

    let score = 0;

    // Check for negative words
    negativeWords.forEach(word => {
      if (text.includes(word)) {
        score += 5;
      }
    });

    // Check for negative patterns
    negativePatterns.forEach(pattern => {
      if (pattern.test(text)) {
        score += 10;
      }
    });

    // Check for excessive punctuation (indicating strong emotion)
    const exclamationCount = (text.match(/!/g) || []).length;
    const questionCount = (text.match(/\?/g) || []).length;
    
    if (exclamationCount > 3) score += 5;
    if (questionCount > 3) score += 3;

    return Math.min(score, 20);
  }

  private analyzeAggression(text: string): number {
    const aggressiveWords = [
      'attack', 'fight', 'destroy', 'kill', 'hurt', 'harm',
      'violence', 'aggressive', 'hostile', 'combative'
    ];

    const aggressivePatterns = [
      /i\s+will\s+(hurt|harm|attack)/gi,
      /you\s+deserve\s+to\s+(die|suffer)/gi,
      /i\s+want\s+to\s+(hurt|harm)/gi,
      /let's\s+fight/gi
    ];

    let score = 0;

    // Check for aggressive words
    aggressiveWords.forEach(word => {
      if (text.includes(word)) {
        score += 15;
      }
    });

    // Check for aggressive patterns
    aggressivePatterns.forEach(pattern => {
      if (pattern.test(text)) {
        score += 20;
      }
    });

    return Math.min(score, 30);
  }

  public getToxicityLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  public isToxic(score: number, threshold: number = 50): boolean {
    return score >= threshold;
  }
}

