import Filter from 'bad-words';

export class ProfanityFilter {
  private filter: Filter;
  private customProfanityList: string[];

  constructor() {
    this.filter = new Filter();
    this.customProfanityList = [
      // Add custom profanity words here
      'stupid', 'idiot', 'moron', 'dumb', 'retard'
    ];
    
    this.initializeCustomFilter();
  }

  private initializeCustomFilter() {
    // Add custom words to the filter
    this.customProfanityList.forEach(word => {
      this.filter.addWords(word);
    });
  }

  public async analyze(text: string): Promise<number> {
    try {
      const cleanText = text.toLowerCase().trim();
      
      // Check if text contains profanity
      const isProfane = this.filter.isProfane(cleanText);
      
      if (!isProfane) {
        return 0;
      }

      // Calculate profanity score based on multiple factors
      let score = 0;

      // Base score for containing profanity
      score += 30;

      // Count profane words
      const profaneWords = (this.filter as any).list.filter((word: string) => 
        cleanText.includes(word.toLowerCase())
      );
      score += profaneWords.length * 10;

      // Check for repeated profanity
      const repeatedProfanity = this.countRepeatedProfanity(cleanText);
      score += repeatedProfanity * 5;

      // Check for profanity intensity (stronger words get higher scores)
      const intensityScore = this.calculateIntensityScore(cleanText);
      score += intensityScore;

      // Check for profanity in context (more offensive in certain contexts)
      const contextScore = this.calculateContextScore(cleanText);
      score += contextScore;

      return Math.min(score, 100);
    } catch (error) {
      console.error('Error analyzing profanity:', error);
      return 0;
    }
  }

  private countRepeatedProfanity(text: string): number {
    const profaneWords = (this.filter as any).list;
    let repeatedCount = 0;

    profaneWords.forEach((word: string) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches && matches.length > 1) {
        repeatedCount += matches.length - 1;
      }
    });

    return repeatedCount;
  }

  private calculateIntensityScore(text: string): number {
    // Define intensity levels for different types of profanity
    const intensityMap: { [key: string]: number } = {
      // Mild profanity
      'damn': 5, 'hell': 5, 'crap': 5,
      // Moderate profanity
      'stupid': 10, 'idiot': 10, 'moron': 10,
      // Strong profanity (these would be in the bad-words library)
      'fuck': 20, 'shit': 15, 'bitch': 15,
      // Very strong profanity
      'cunt': 25, 'nigger': 30, 'faggot': 25
    };

    let intensityScore = 0;
    
    Object.entries(intensityMap).forEach(([word, score]) => {
      if (text.includes(word)) {
        intensityScore += score;
      }
    });

    return Math.min(intensityScore, 30);
  }

  private calculateContextScore(text: string): number {
    let contextScore = 0;

    // Profanity directed at someone is more offensive
    const directedPatterns = [
      /you\s+\w+/gi,
      /fuck\s+you/gi,
      /go\s+to\s+hell/gi,
      /you\s+are\s+\w+/gi
    ];

    directedPatterns.forEach(pattern => {
      if (pattern.test(text)) {
        contextScore += 10;
      }
    });

    // Profanity in all caps is more offensive
    if (text === text.toUpperCase() && this.filter.isProfane(text)) {
      contextScore += 5;
    }

    // Multiple exclamation marks with profanity
    if (/\w+!{2,}/gi.test(text) && this.filter.isProfane(text)) {
      contextScore += 5;
    }

    return Math.min(contextScore, 20);
  }

  public clean(text: string): string {
    return this.filter.clean(text);
  }

  public isProfane(text: string): boolean {
    return this.filter.isProfane(text);
  }

  public getProfaneWords(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const profaneWords: string[] = [];

    words.forEach(word => {
      if (this.filter.isProfane(word)) {
        profaneWords.push(word);
      }
    });

    return [...new Set(profaneWords)];
  }
}

