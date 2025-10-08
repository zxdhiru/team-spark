/**
 * Constants and configuration values for the Hate Speech Detection Plugin
 */

export const PLUGIN_CONFIG = {
  NAME: 'hate-speech-detection',
  VERSION: '1.0.0',
  DESCRIPTION: 'AI-powered hate speech and offensive content detection plugin',
  
  // Default thresholds (1-100 scale)
  DEFAULT_THRESHOLDS: {
    HATE_SPEECH: 70,
    TOXICITY: 60,
    HARASSMENT: 65,
    PROFANITY: 50
  },
  
  // Risk level thresholds
  RISK_THRESHOLDS: {
    LOW: 0,
    MEDIUM: 40,
    HIGH: 60,
    CRITICAL: 80
  },
  
  // Content limits
  CONTENT_LIMITS: {
    MAX_TEXT_LENGTH: 10000,
    MAX_DESCRIPTION_LENGTH: 1000,
    MIN_TEXT_LENGTH: 1
  },
  
  // API limits
  API_LIMITS: {
    RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS_PER_WINDOW: 100,
    ANALYSIS_RATE_LIMIT_WINDOW_MS: 60 * 1000, // 1 minute
    MAX_ANALYSIS_REQUESTS_PER_WINDOW: 10,
    STRICT_RATE_LIMIT_WINDOW_MS: 60 * 1000, // 1 minute
    MAX_STRICT_REQUESTS_PER_WINDOW: 5
  },
  
  // Timeouts
  TIMEOUTS: {
    API_REQUEST: 30000, // 30 seconds
    DATABASE_QUERY: 10000, // 10 seconds
    HEALTH_CHECK: 5000 // 5 seconds
  },
  
  // Supported languages
  SUPPORTED_LANGUAGES: [
    'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko',
    'ar', 'hi', 'th', 'vi', 'tr', 'pl', 'nl', 'sv', 'da', 'no'
  ],
  
  // Default language
  DEFAULT_LANGUAGE: 'en',
  
  // Image analysis
  IMAGE_ANALYSIS: {
    SUPPORTED_FORMATS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'],
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    VALID_PROTOCOLS: ['http:', 'https:']
  }
};

export const HATE_SPEECH_KEYWORDS = [
  // Direct hate speech
  'hate', 'kill', 'destroy', 'eliminate', 'exterminate',
  'racist', 'sexist', 'homophobic', 'transphobic',
  'nazi', 'fascist', 'supremacist', 'terrorist',
  
  // Dehumanizing language
  'vermin', 'pest', 'scum', 'trash', 'garbage',
  'subhuman', 'inhuman', 'animal', 'beast',
  
  // Violence incitement
  'violence', 'attack', 'assault', 'murder', 'assassinate',
  'bomb', 'explode', 'shoot', 'stab', 'beat'
];

export const HATE_SPEECH_PATTERNS = [
  /kill\s+(all|every)\s+\w+/gi,
  /destroy\s+(all|every)\s+\w+/gi,
  /\w+\s+should\s+die/gi,
  /\w+\s+deserves\s+to\s+die/gi,
  /eliminate\s+(all|every)\s+\w+/gi,
  /exterminate\s+(all|every)\s+\w+/gi,
  /wipe\s+out\s+(all|every)\s+\w+/gi,
  /get\s+rid\s+of\s+(all|every)\s+\w+/gi
];

export const TOXICITY_KEYWORDS = [
  'toxic', 'poison', 'venom', 'hate', 'disgusting', 'revolting',
  'pathetic', 'worthless', 'useless', 'garbage', 'trash',
  'annoying', 'irritating', 'infuriating', 'disgusting',
  'stupid', 'idiot', 'moron', 'dumb', 'retard'
];

export const TOXICITY_PATTERNS = [
  /you\s+are\s+(so\s+)?(stupid|dumb|idiot|moron)/gi,
  /i\s+hate\s+you/gi,
  /you\s+suck/gi,
  /go\s+away/gi,
  /shut\s+up/gi,
  /nobody\s+cares/gi,
  /you\s+are\s+worthless/gi,
  /you\s+are\s+garbage/gi
];

export const HARASSMENT_KEYWORDS = [
  'stalk', 'harass', 'bully', 'threaten', 'intimidate',
  'blackmail', 'extort', 'coerce', 'manipulate',
  'pressure', 'force', 'compel', 'push'
];

export const HARASSMENT_PATTERNS = [
  /i\s+will\s+(hurt|harm|kill)\s+you/gi,
  /you\s+will\s+pay/gi,
  /watch\s+your\s+back/gi,
  /i\s+know\s+where\s+you\s+live/gi,
  /i\s+will\s+find\s+you/gi,
  /you\s+can't\s+hide/gi,
  /i\s+will\s+get\s+you/gi
];

export const PROFANITY_INTENSITY_MAP: { [key: string]: number } = {
  // Mild profanity
  'damn': 5, 'hell': 5, 'crap': 5, 'piss': 5,
  
  // Moderate profanity
  'stupid': 10, 'idiot': 10, 'moron': 10, 'dumb': 10,
  'ass': 15, 'bitch': 15, 'bastard': 15,
  
  // Strong profanity
  'fuck': 20, 'shit': 15,
  
  // Very strong profanity
  'cunt': 25, 'nigger': 30, 'faggot': 25, 'kike': 30
};

export const NEGATIVE_SENTIMENT_WORDS = [
  'hate', 'dislike', 'terrible', 'awful', 'horrible', 'disgusting',
  'annoying', 'irritating', 'frustrating', 'angry', 'mad', 'upset',
  'disappointed', 'furious', 'livid', 'enraged', 'outraged'
];

export const NEGATIVE_SENTIMENT_PATTERNS = [
  /i\s+hate/gi,
  /i\s+dislike/gi,
  /this\s+is\s+terrible/gi,
  /this\s+is\s+awful/gi,
  /i\s+can't\s+stand/gi,
  /this\s+makes\s+me\s+sick/gi,
  /i\s+despise/gi
];

export const AGGRESSIVE_WORDS = [
  'attack', 'fight', 'destroy', 'kill', 'hurt', 'harm',
  'violence', 'aggressive', 'hostile', 'combative',
  'threaten', 'intimidate', 'bully', 'harass'
];

export const AGGRESSIVE_PATTERNS = [
  /i\s+will\s+(hurt|harm|attack)/gi,
  /you\s+deserve\s+to\s+(die|suffer)/gi,
  /i\s+want\s+to\s+(hurt|harm)/gi,
  /let's\s+fight/gi,
  /i\s+will\s+destroy\s+you/gi,
  /you\s+will\s+regret/gi
];

export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

export const ERROR_MESSAGES = {
  VALIDATION_ERROR: 'Validation error',
  INVALID_INPUT: 'Invalid input provided',
  CONTENT_TOO_LONG: 'Content exceeds maximum length',
  CONTENT_TOO_SHORT: 'Content is too short',
  INVALID_IMAGE_URL: 'Invalid image URL format',
  ANALYSIS_FAILED: 'Content analysis failed',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  UNAUTHORIZED: 'Unauthorized access',
  NOT_FOUND: 'Resource not found',
  INTERNAL_ERROR: 'Internal server error'
};

export const SUCCESS_MESSAGES = {
  ANALYSIS_COMPLETED: 'Content analysis completed successfully',
  TEXT_ANALYZED: 'Text analysis completed successfully',
  IMAGE_ANALYZED: 'Image analysis completed successfully',
  HISTORY_RETRIEVED: 'Analysis history retrieved successfully',
  STATISTICS_RETRIEVED: 'Statistics retrieved successfully',
  HEALTH_CHECK_PASSED: 'Service is healthy',
  PLUGIN_INFO_RETRIEVED: 'Plugin information retrieved successfully'
};

export const DATABASE_INDEXES = {
  CONTENT_ANALYSIS: [
    { 'metadata.userId': 1 },
    { 'metadata.platform': 1 },
    { 'analysis.overallRisk': 1 },
    { 'metadata.timestamp': -1 },
    { 'contentType': 1 },
    { 'analysis.hateSpeech.detected': 1 },
    { 'analysis.toxicity.detected': 1 },
    { 'analysis.harassment.detected': 1 },
    { 'analysis.profanity.detected': 1 }
  ]
};

export const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  MAX_SIZE: 1000,
  CLEANUP_INTERVAL: 60 * 1000 // 1 minute
};

export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

export const ENVIRONMENT_VARIABLES = {
  NODE_ENV: 'NODE_ENV',
  PORT: 'PORT',
  MONGODB_URI: 'MONGODB_URI',
  OPENAI_API_KEY: 'OPENAI_API_KEY',
  HUGGINGFACE_API_KEY: 'HUGGINGFACE_API_KEY',
  PERSPECTIVE_API_KEY: 'PERSPECTIVE_API_KEY',
  JWT_SECRET: 'JWT_SECRET',
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  HATE_SPEECH_THRESHOLD: 'HATE_SPEECH_THRESHOLD',
  TOXICITY_THRESHOLD: 'TOXICITY_THRESHOLD',
  HARASSMENT_THRESHOLD: 'HARASSMENT_THRESHOLD',
  PROFANITY_THRESHOLD: 'PROFANITY_THRESHOLD',
  ALLOWED_ORIGINS: 'ALLOWED_ORIGINS'
};

