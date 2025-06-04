import rateLimit from "express-rate-limit";

// Generic rate limit for general API requests
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
    error: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit for verification endpoints (email/phone)
export const verificationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 verification requests per windowMs
  message: {
    success: false,
    message: "Too many verification requests. Please try again later.",
    error: "VERIFICATION_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit for authentication endpoints (login/register)
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
    error: "AUTH_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit for password reset endpoints
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    message: "Too many password reset attempts. Please try again in an hour.",
    error: "PASSWORD_RESET_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit for chat/NLP endpoints
export const chatRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit each IP to 20 chat requests per 5 minutes
  message: {
    success: false,
    message:
      "Too many chat requests. Please wait a moment before asking another question.",
    error: "CHAT_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit for community endpoints (story submission)
export const communityRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 community actions per hour
  message: {
    success: false,
    message: "Too many community submissions. Please try again later.",
    error: "COMMUNITY_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limit for admin endpoints
export const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 admin requests per windowMs
  message: {
    success: false,
    message: "Too many admin requests. Please try again later.",
    error: "ADMIN_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit for file upload endpoints
export const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 uploads per windowMs
  message: {
    success: false,
    message: "Too many upload attempts. Please try again later.",
    error: "UPLOAD_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit for NLP translation endpoint
export const nlpTranslation = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // Limit each IP to 30 translation requests per 5 minutes
  message: {
    success: false,
    message:
      "Too many translation requests. Please wait before translating more text.",
    error: "TRANSLATION_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit for NLP text-to-speech endpoint
export const nlpTts = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 15, // Limit each IP to 15 TTS requests per 5 minutes
  message: {
    success: false,
    message:
      "Too many text-to-speech requests. Please wait before generating more audio.",
    error: "TTS_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit for NLP automatic speech recognition endpoint
export const nlpAsr = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 15, // Limit each IP to 15 ASR requests per 5 minutes
  message: {
    success: false,
    message:
      "Too many speech recognition requests. Please wait before uploading more audio.",
    error: "ASR_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});