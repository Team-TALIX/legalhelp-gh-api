import express from "express";
import multer from "multer";
import { body } from "express-validator";
import { authenticateToken, optionalAuth } from "../middlewares/auth.js";
import { requireAnyVerification } from "../middlewares/requireVerification.js";
import { nlpTranslation, nlpTts, nlpAsr } from "../middlewares/rateLimit.js";
import { trackUsage } from "../middlewares/usageTracking.js";
import {
  translateTextHandler,
  getSupportedLanguagesHandler,
  speechToTextHandler,
  textToSpeechHandler,
  getTTSLanguagesHandler,
  nlpHealthCheck,
} from "../controllers/nlp.js";

const router = express.Router();

// Configure multer for audio file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/webm",
      "audio/ogg",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid audio format. Supported formats: MP3, WAV, WebM, OGG"
        ),
        false
      );
    }
  },
});

// Validation schemas
const translateValidation = [
  body("text")
    .notEmpty()
    .withMessage("Text is required")
    .isLength({ min: 1, max: 1000 })
    .withMessage("Text must be between 1 and 1000 characters"),
  body("fromLanguage")
    .notEmpty()
    .withMessage("Source language is required")
    .isIn([
      "en",
      "tw",
      "gaa",
      "ee",
      "dag",
      "fat",
      "gur",
      "yo",
      "ki",
      "luo",
      "mer",
    ])
    .withMessage("Invalid source language"),
  body("toLanguage")
    .notEmpty()
    .withMessage("Target language is required")
    .isIn([
      "en",
      "tw",
      "gaa",
      "ee",
      "dag",
      "fat",
      "gur",
      "yo",
      "ki",
      "luo",
      "mer",
    ])
    .withMessage("Invalid target language"),
];

const ttsValidation = [
  body("text")
    .notEmpty()
    .withMessage("Text is required")
    .isLength({ min: 1, max: 500 })
    .withMessage("Text must be between 1 and 500 characters"),
  body("language")
    .optional()
    .isIn(["tw", "ki", "ee"])
    .withMessage("Invalid TTS language. Supported: tw, ki, ee"),
  body("speakerId")
    .optional()
    .isString()
    .withMessage("Speaker ID must be a string"),
];

const asrValidation = [
  body("language")
    .optional()
    .isIn(["tw", "gaa", "dag", "yo", "ee", "ki", "ha"])
    .withMessage("Invalid ASR language"),
];

// Public endpoints (no authentication required)
router.get("/nlp/health", nlpHealthCheck);
router.get("/nlp/languages", getSupportedLanguagesHandler);
router.get("/nlp/tts/languages", getTTSLanguagesHandler);

// Translation endpoint - requires authentication and verification
router.post(
  "/nlp/translate",
  optionalAuth, // Allow both authenticated and anonymous users
  nlpTranslation, // Apply rate limiting
  translateValidation,
  trackUsage("translation"),
  translateTextHandler
);

// Speech-to-text endpoint - requires authentication
router.post(
  "/nlp/speech-to-text",
  authenticateToken,
  requireAnyVerification,
  nlpAsr,
  upload.single("audio"),
  asrValidation,
  trackUsage("asr"),
  speechToTextHandler
);

// Text-to-speech endpoint - requires authentication
router.post(
  "/nlp/text-to-speech",
  authenticateToken,
  requireAnyVerification,
  nlpTts,
  ttsValidation,
  trackUsage("tts"),
  textToSpeechHandler
);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "File too large",
        message: "Audio file must be less than 10MB",
      });
    }
    return res.status(400).json({
      success: false,
      error: "Upload error",
      message: error.message,
    });
  }

  if (error.message.includes("Invalid audio format")) {
    return res.status(400).json({
      success: false,
      error: "Invalid file format",
      message: error.message,
    });
  }

  next(error);
});

export default router;
