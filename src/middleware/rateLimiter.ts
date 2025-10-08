import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  private getKey(req: Request): string {
    // Use IP address as the key, could be enhanced with user ID if authenticated
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  public middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = this.getKey(req);
      const now = Date.now();
      
      if (!this.store[key] || this.store[key].resetTime < now) {
        // Reset or create new entry
        this.store[key] = {
          count: 1,
          resetTime: now + this.windowMs
        };
      } else {
        // Increment count
        this.store[key].count++;
      }

      const { count, resetTime } = this.store[key];
      const remaining = Math.max(0, this.maxRequests - count);
      const resetTimeSeconds = Math.ceil((resetTime - now) / 1000);

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': this.maxRequests.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(resetTime).toISOString()
      });

      if (count > this.maxRequests) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${resetTimeSeconds} seconds.`,
          retryAfter: resetTimeSeconds
        });
      }

      return next();
    };
  }
}

// Create rate limiter instances for different endpoints
export const generalRateLimiter = new RateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes
export const analysisRateLimiter = new RateLimiter(60 * 1000, 10); // 10 requests per minute for analysis
export const strictRateLimiter = new RateLimiter(60 * 1000, 5); // 5 requests per minute for strict endpoints

export const rateLimitMiddleware = (rateLimiter: RateLimiter) => {
  return rateLimiter.middleware();
};

