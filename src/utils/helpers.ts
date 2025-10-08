/**
 * Utility functions for the Hate Speech Detection Plugin
 */

export class PluginHelpers {
  /**
   * Generate a unique ID for analysis results
   */
  static generateId(prefix: string = 'analysis'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Sanitize text content for analysis
   */
  static sanitizeText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[^\w\s@#.,!?;:()\-]/g, '') // Remove special characters except common punctuation
      .substring(0, 10000); // Limit length
  }

  /**
   * Validate image URL format
   */
  static isValidImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const validProtocols = ['http:', 'https:'];
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
      
      if (!validProtocols.includes(urlObj.protocol)) {
        return false;
      }
      
      const pathname = urlObj.pathname.toLowerCase();
      return validExtensions.some(ext => pathname.endsWith(ext));
    } catch {
      return false;
    }
  }

  /**
   * Calculate risk level based on score
   */
  static getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  /**
   * Calculate overall risk from multiple scores
   */
  static calculateOverallRisk(
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

  /**
   * Calculate confidence score based on model agreement
   */
  static calculateConfidence(scores: number[]): number {
    if (scores.length === 0) return 0;
    
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower standard deviation = higher confidence
    const confidence = Math.max(0, 100 - (stdDev * 2));
    return Math.round(confidence);
  }

  /**
   * Format processing time for display
   */
  static formatProcessingTime(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(1)}s`;
    } else {
      return `${(milliseconds / 60000).toFixed(1)}m`;
    }
  }

  /**
   * Extract flagged words from text
   */
  static extractFlaggedWords(text: string, flaggedPatterns: string[]): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const flaggedWords: string[] = [];
    
    words.forEach(word => {
      if (flaggedPatterns.some(pattern => word.includes(pattern.toLowerCase()))) {
        flaggedWords.push(word);
      }
    });
    
    return [...new Set(flaggedWords)];
  }

  /**
   * Generate moderation suggestions based on risk level
   */
  static generateSuggestions(riskLevel: string): string[] {
    const suggestions: { [key: string]: string[] } = {
      safe: [
        'Content appears safe for publication',
        'No moderation action required'
      ],
      warning: [
        'Consider reviewing content before publication',
        'Content may need minor adjustments',
        'Monitor for similar content patterns'
      ],
      danger: [
        'Content should be reviewed by moderators',
        'Consider editing or removing problematic sections',
        'User may need guidance on community guidelines'
      ],
      critical: [
        'Content should not be published',
        'Immediate moderation required',
        'Consider user warning or suspension',
        'Review user\'s content history'
      ]
    };

    return suggestions[riskLevel] || suggestions.safe;
  }

  /**
   * Validate analysis request parameters
   */
  static validateAnalysisRequest(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.text && !data.imageUrl) {
      errors.push('Either text or imageUrl is required');
    }
    
    if (data.text && (typeof data.text !== 'string' || data.text.length === 0)) {
      errors.push('Text must be a non-empty string');
    }
    
    if (data.text && data.text.length > 10000) {
      errors.push('Text cannot exceed 10,000 characters');
    }
    
    if (data.imageUrl && !this.isValidImageUrl(data.imageUrl)) {
      errors.push('Invalid image URL format');
    }
    
    if (data.userId && typeof data.userId !== 'string') {
      errors.push('UserId must be a string');
    }
    
    if (data.platform && typeof data.platform !== 'string') {
      errors.push('Platform must be a string');
    }
    
    if (data.language && typeof data.language !== 'string') {
      errors.push('Language must be a string');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create standardized error response
   */
  static createErrorResponse(message: string, statusCode: number = 500, details?: any) {
    return {
      success: false,
      error: message,
      statusCode,
      timestamp: new Date().toISOString(),
      ...(details && { details })
    };
  }

  /**
   * Create standardized success response
   */
  static createSuccessResponse(data: any, message: string = 'Operation completed successfully') {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Retry function with exponential backoff
   */
  static async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  /**
   * Debounce function for API calls
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  /**
   * Throttle function for API calls
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Check if content should be blocked based on thresholds
   */
  static shouldBlockContent(
    analysis: any,
    thresholds: {
      hateSpeech: number;
      toxicity: number;
      harassment: number;
      profanity: number;
    }
  ): { shouldBlock: boolean; reason?: string } {
    const { analysis: results } = analysis;
    
    const shouldBlock = 
      results.hateSpeech.score >= thresholds.hateSpeech ||
      results.toxicity.score >= thresholds.toxicity ||
      results.harassment.score >= thresholds.harassment ||
      results.profanity.score >= thresholds.profanity ||
      results.overallRisk === 'critical';

    if (!shouldBlock) {
      return { shouldBlock: false };
    }

    const reasons = [];
    if (results.hateSpeech.score >= thresholds.hateSpeech) {
      reasons.push('hate speech detected');
    }
    if (results.toxicity.score >= thresholds.toxicity) {
      reasons.push('toxic content detected');
    }
    if (results.harassment.score >= thresholds.harassment) {
      reasons.push('harassment detected');
    }
    if (results.profanity.score >= thresholds.profanity) {
      reasons.push('profanity detected');
    }
    if (results.overallRisk === 'critical') {
      reasons.push('critical risk level');
    }

    return {
      shouldBlock: true,
      reason: reasons.join(', ')
    };
  }

  /**
   * Get moderation action based on risk level
   */
  static getModerationAction(riskLevel: string): {
    action: 'allow' | 'review' | 'block' | 'warn';
    message: string;
  } {
    const actions = {
      safe: {
        action: 'allow' as const,
        message: 'Content appears safe for publication'
      },
      warning: {
        action: 'review' as const,
        message: 'Content may violate community guidelines and should be reviewed'
      },
      danger: {
        action: 'block' as const,
        message: 'Content likely violates guidelines and should be blocked'
      },
      critical: {
        action: 'block' as const,
        message: 'Content contains critical violations and should be blocked immediately'
      }
    };

    return actions[riskLevel as keyof typeof actions] || actions.safe;
  }
}

