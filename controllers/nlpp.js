import {
  translateText,
  getSupportedTranslationLanguages,
} from "../services/translationService.js";
import { NLPService } from "../services/nlpService.js";
import createError from "http-errors";
// import { createError } from "../utils/helpers.js";
import { validationResult } from "express-validator";

/**
 * Translate text using NPLGhana Translation API
 * POST /nlp/translate
 */
export const translateTextHandler = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { text, fromLanguage, toLanguage } = req.body;

    // Validate required fields
    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: "Text is required for translation",
      });
    }

    if (!fromLanguage || !toLanguage) {
      return res.status(400).json({
        success: false,
        error: "Both fromLanguage and toLanguage are required",
      });
    }

    // If languages are the same, return original text
    if (fromLanguage.toLowerCase() === toLanguage.toLowerCase()) {
      return res.json({
        success: true,
        data: {
          translatedText: text.trim(),
          sourceLanguage: fromLanguage,
          targetLanguage: toLanguage,
          engine: "none",
          confidence: 1.0,
          timestamp: new Date().toISOString(),
          cached: false,
        },
      });
    }

    // Call translation service
    const translationResult = await translateText(
      text.trim(),
      fromLanguage,
      toLanguage
    );

    res.json({
      success: true,
      data: {
        translatedText: translationResult.translatedText,
        sourceLanguage: translationResult.sourceLanguage,
        targetLanguage: translationResult.targetLanguage,
        engine: translationResult.engine,
        confidence: translationResult.confidence,
        timestamp: translationResult.timestamp,
        cached: translationResult.cached || false,
      },
    });
  } catch (error) {
    console.error("Translation handler error:", error);

    // Handle specific translation service errors
    if (error.message.includes("Translation request failed")) {
      return res.status(422).json({
        success: false,
        error: "Translation service unavailable",
        message:
          "Unable to process translation at this time. Please try again later.",
      });
    }

    if (
      error.message.includes("API key") ||
      error.message.includes("not configured")
    ) {
      return res.status(503).json({
        success: false,
        error: "Service configuration error",
        message: "Translation service is temporarily unavailable.",
      });
    }

    next(createError(500, "Translation failed", error.message));
  }
};

/**
 * Get supported translation languages
 * GET /nlp/languages
 */
export const getSupportedLanguagesHandler = async (req, res, next) => {
  try {
    const languages = await getSupportedTranslationLanguages();

    // Ensure we return a consistent format
    let formattedLanguages = [];

    if (Array.isArray(languages)) {
      formattedLanguages = languages;
    } else if (typeof languages === "object") {
      // Convert object format to array format
      formattedLanguages = Object.entries(languages).map(([code, name]) => ({
        code,
        name,
      }));
    }

    // Add our known supported languages if API doesn't return them
    const knownLanguages = [
      { code: "en", name: "English" },
      { code: "tw", name: "Twi" },
      { code: "gaa", name: "Ga" },
      { code: "ee", name: "Ewe" },
      { code: "dag", name: "Dagbani" },
      { code: "fat", name: "Fante" },
      { code: "gur", name: "Gurene" },
      { code: "yo", name: "Yoruba" },
      { code: "ki", name: "Kikuyu" },
      { code: "luo", name: "Luo" },
      { code: "mer", name: "Kimeru" },
    ];

    // Use API response if available, otherwise fallback to known languages
    const responseLanguages =
      formattedLanguages.length > 0 ? formattedLanguages : knownLanguages;

    res.json({
      success: true,
      data: {
        languages: responseLanguages,
        total: responseLanguages.length,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Get supported languages error:", error);

    // Fallback to known languages if API fails
    const fallbackLanguages = [
      { code: "en", name: "English" },
      { code: "tw", name: "Twi" },
      { code: "gaa", name: "Ga" },
      { code: "ee", name: "Ewe" },
      { code: "dag", name: "Dagbani" },
    ];

    res.json({
      success: true,
      data: {
        languages: fallbackLanguages,
        total: fallbackLanguages.length,
        lastUpdated: new Date().toISOString(),
        fallback: true,
      },
    });
  }
};

/**
 * Convert speech to text using NPLGhana ASR API
 * POST /nlp/speech-to-text
 */
export const speechToTextHandler = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { language = "tw" } = req.body;
    const audioFile = req.file;

    if (!audioFile) {
      return res.status(400).json({
        success: false,
        error: "Audio file is required",
      });
    }

    // Call speech-to-text service
    const transcriptionResult = await NLPService.speechToText(
      audioFile.buffer,
      language,
      audioFile.mimetype
    );

    res.json({
      success: true,
      data: {
        transcription: transcriptionResult.transcription,
        language: transcriptionResult.language,
        confidence: transcriptionResult.confidence,
        duration: transcriptionResult.duration,
        timestamp: transcriptionResult.timestamp,
      },
    });
  } catch (error) {
    console.error("Speech-to-text handler error:", error);
    next(createError(500, "Speech recognition failed", error.message));
  }
};

/**
 * Convert text to speech using NPLGhana TTS API
 * POST /nlp/text-to-speech
 */
export const textToSpeechHandler = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { text, language = "tw", speakerId } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: "Text is required for speech synthesis",
      });
    }

    // Call text-to-speech service
    const audioResult = await NLPService.textToSpeech(
      text.trim(),
      language,
      speakerId
    );

    // Convert base64 audio data back to buffer
    const audioBuffer = Buffer.from(audioResult.audioData, "base64");

    // Set appropriate headers for audio response
    res.set({
      "Content-Type": "audio/wav",
      "Content-Length": audioBuffer.length,
      "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      "X-Audio-Language": audioResult.language,
      "X-Speaker-ID": audioResult.speakerId,
    });

    res.send(audioBuffer);
  } catch (error) {
    console.error("Text-to-speech handler error:", error);
    next(createError(500, "Speech synthesis failed", error.message));
  }
};

/**
 * Get supported TTS languages and speakers
 * GET /nlp/tts/languages
 */
export const getTTSLanguagesHandler = async (req, res, next) => {
  try {
    // TTS languages are fixed based on GhanaNLP API documentation
    const supportedTtsLanguages = {
      tw: "Twi",
      ki: "Kikuyu",
      ee: "Ewe",
    };

    const supportedSpeakers = {
      tw: [
        "twi_speaker_4",
        "twi_speaker_5",
        "twi_speaker_6",
        "twi_speaker_7",
        "twi_speaker_8",
        "twi_speaker_9",
      ],
      ki: ["kikuyu_speaker_1", "kikuyu_speaker_5"],
      ee: ["ewe_speaker_3", "ewe_speaker_4"],
    };

    // Try to get speakers from the API, but fallback to hardcoded ones
    let speakers = supportedSpeakers;
    try {
      const apiSpeakers = await NLPService.getTTSSpeakers();
      if (apiSpeakers && typeof apiSpeakers === "object") {
        speakers = apiSpeakers;
      }
    } catch (speakerError) {
      console.warn(
        "Failed to fetch TTS speakers from API, using fallback:",
        speakerError.message
      );
    }

    res.json({
      success: true,
      data: {
        languages: supportedTtsLanguages,
        speakers,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Get TTS languages error:", error);

    // Fallback response
    const fallbackData = {
      languages: {
        tw: "Twi",
        ki: "Kikuyu",
        ee: "Ewe",
      },
      speakers: {
        tw: [
          "twi_speaker_4",
          "twi_speaker_5",
          "twi_speaker_6",
          "twi_speaker_7",
          "twi_speaker_8",
          "twi_speaker_9",
        ],
        ki: ["kikuyu_speaker_1", "kikuyu_speaker_5"],
        ee: ["ewe_speaker_3", "ewe_speaker_4"],
      },
    };

    res.json({
      success: true,
      data: {
        ...fallbackData,
        lastUpdated: new Date().toISOString(),
        fallback: true,
      },
    });
  }
};

/**
 * Health check for NLP services
 * GET /nlp/health
 */
export const nlpHealthCheck = async (req, res) => {
  try {
    // Test translation service with a simple request
    const testResult = await NLPService.testConnectivity();

    res.json({
      success: true,
      data: {
        status: testResult.connected ? "healthy" : "degraded",
        services: testResult.services,
        timestamp: testResult.timestamp,
        message: testResult.message,
      },
    });
  } catch (error) {
    console.error("NLP health check failed:", error);

    res.status(503).json({
      success: false,
      data: {
        status: "degraded",
        services: {
          translation: "unavailable",
          tts: "unknown",
          asr: "unknown",
        },
        timestamp: new Date().toISOString(),
        error: "Service health check failed",
      },
    });
  }
};
