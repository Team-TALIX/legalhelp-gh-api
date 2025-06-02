import { GHANA_NLP_API_KEY, GHANA_NLP_BASE_URL } from "../utils/config.js";
import { getRedisClient } from "../utils/redis.js";

/**
 * Ghana NLP Service for ASR, Translation, and TTS
 * Integrates with Ghana NLP APIs as specified in the project requirements
 */
export class NLPService {
  /**
   * Language mapping for Ghana NLP APIs
   */
  static languageMap = {
    twi: "tw",
    ewe: "ee",
    dagbani: "dag",
    ga: "gaa",
    yoruba: "yo",
    kikuyu: "ki",
    hausa: "ha",
  };

  /**
   * TTS Speaker IDs for supported languages
   */
  static ttsSpakers = {
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

  /**
   * Convert audio from speech to text using Ghana NLP ASR API
   * @param {Buffer} audioBuffer - Audio file buffer
   * @param {string} language - Source language (twi, ewe, dagbani, etc.)
   * @returns {Promise<Object>} Transcription result
   */
  static async speechToText(audioBuffer, language) {
    try {
      // Map language to Ghana NLP format
      const nlpLanguage = this.languageMap[language] || language;

      // Validate supported language
      if (!Object.values(this.languageMap).includes(nlpLanguage)) {
        throw new Error(
          `Language ${language} not supported for speech recognition`
        );
      }

      // Check cache first
      const redisClient = getRedisClient();
      const audioHash = this.generateAudioHash(audioBuffer);
      const cacheKey = `asr:${nlpLanguage}:${audioHash}`;

      if (redisClient) {
        const cachedResult = await redisClient.get(cacheKey);
        if (cachedResult) {
          return JSON.parse(cachedResult);
        }
      }

      // Call Ghana NLP ASR API
      const response = await fetch(
        `https://translation-api.ghananlp.org/asr/v1/transcribe?language=${nlpLanguage}`,
        {
          method: "POST",
          body: audioBuffer,
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "no-cache",
            "Ocp-Apim-Subscription-Key": GHANA_NLP_API_KEY,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ASR API error: ${response.status} - ${errorText}`);
      }

      const transcriptionText = await response.text();

      const result = {
        text: transcriptionText.trim(),
        language: nlpLanguage,
        confidence: 0.9, // Ghana NLP doesn't provide confidence scores
        timestamp: new Date().toISOString(),
      };

      // Cache result for 1 hour
      if (redisClient) {
        await redisClient.setex(cacheKey, 3600, JSON.stringify(result));
      }

      return result;
    } catch (error) {
      console.error("Speech-to-text conversion failed:", error);
      throw new Error(`Failed to convert speech to text: ${error.message}`);
    }
  }

  /**
   * Convert text to speech using Ghana NLP TTS API
   * @param {string} text - Text to convert to speech
   * @param {string} language - Target language (twi, ewe, kikuyu)
   * @param {string} speakerId - Optional speaker ID
   * @returns {Promise<Object>} Audio data
   */
  static async textToSpeech(text, language, speakerId = null) {
    try {
      // Map language to Ghana NLP format
      const nlpLanguage = this.languageMap[language] || language;

      // Check if TTS is supported for this language
      if (!this.ttsSpakers[nlpLanguage]) {
        throw new Error(
          `Text-to-speech not supported for language: ${language}`
        );
      }

      // Select speaker ID
      const selectedSpeaker = speakerId || this.ttsSpakers[nlpLanguage][0];

      // Check cache first
      const redisClient = getRedisClient();
      const textHash = this.generateTextHash(text);
      const cacheKey = `tts:${nlpLanguage}:${selectedSpeaker}:${textHash}`;

      if (redisClient) {
        const cachedResult = await redisClient.get(cacheKey);
        if (cachedResult) {
          return JSON.parse(cachedResult);
        }
      }

      // Prepare request body
      const requestBody = {
        text: text.substring(0, 500), // Limit text length for TTS
        language: nlpLanguage,
        speaker_id: selectedSpeaker,
      };

      // Call Ghana NLP TTS API
      const response = await fetch(
        "https://translation-api.ghananlp.org/tts/v1/tts",
        {
          method: "POST",
          body: JSON.stringify(requestBody),
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            "Ocp-Apim-Subscription-Key": GHANA_NLP_API_KEY,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`TTS API error: ${response.status} - ${errorText}`);
      }

      // Get audio buffer
      const audioBuffer = await response.arrayBuffer();

      // In production, you would save this to a file storage service
      // For now, we'll create a base64 representation
      const audioBase64 = Buffer.from(audioBuffer).toString("base64");

      const result = {
        audioData: audioBase64,
        audioFormat: "wav",
        language: nlpLanguage,
        speakerId: selectedSpeaker,
        text: requestBody.text,
        audioUrl: null, // Would be set after uploading to file storage
        timestamp: new Date().toISOString(),
      };

      // Cache result for 24 hours
      if (redisClient) {
        await redisClient.setex(cacheKey, 86400, JSON.stringify(result));
      }

      return result;
    } catch (error) {
      console.error("Text-to-speech conversion failed:", error);
      throw new Error(`Failed to convert text to speech: ${error.message}`);
    }
  }

  /**
   * Translate text between languages
   * Note: Ghana NLP doesn't have a dedicated translation API
   * This would need to be implemented using a translation service
   * For production, integrate with Google Translate API or similar
   * @param {string} text - Text to translate
   * @param {string} sourceLang - Source language
   * @param {string} targetLang - Target language
   * @returns {Promise<Object>} Translation result
   */
  static async translateText(text, sourceLang, targetLang) {
    try {
      // For production, this should integrate with a translation service
      // Since Ghana NLP doesn't provide translation API, we'll use a fallback approach

      if (sourceLang === targetLang) {
        return {
          translatedText: text,
          sourceLang,
          targetLang,
          confidence: 1.0,
        };
      }

      // Check cache first
      const redisClient = getRedisClient();
      const textHash = this.generateTextHash(text);
      const cacheKey = `translate:${sourceLang}:${targetLang}:${textHash}`;

      if (redisClient) {
        const cachedResult = await redisClient.get(cacheKey);
        if (cachedResult) {
          return JSON.parse(cachedResult);
        }
      }

      // In production, integrate with Google Translate API or Azure Translator
      // For now, return original text with a note
      const result = {
        translatedText: text, // Would be actual translation in production
        sourceLang,
        targetLang,
        confidence: 0.0, // Low confidence since this is not actually translated
        note: "Translation service integration required for production",
      };

      // Cache result for 24 hours
      if (redisClient) {
        await redisClient.setex(cacheKey, 86400, JSON.stringify(result));
      }

      return result;
    } catch (error) {
      console.error("Translation failed:", error);
      throw new Error(`Failed to translate text: ${error.message}`);
    }
  }

  /**
   * Get list of supported languages for ASR
   * @returns {Promise<Array>} List of supported languages
   */
  static async getSupportedLanguages() {
    try {
      return {
        asr: Object.keys(this.languageMap),
        tts: Object.keys(this.ttsSpakers),
        translation: ["en", "twi", "ewe", "dagbani"], // Limited without dedicated translation API
      };
    } catch (error) {
      console.error("Failed to get supported languages:", error);
      throw new Error("Failed to retrieve supported languages");
    }
  }

  /**
   * Get available TTS speakers for a language
   * @param {string} language - Language code
   * @returns {Promise<Array>} List of available speakers
   */
  static async getTTSSpeakers(language) {
    try {
      const nlpLanguage = this.languageMap[language] || language;

      if (!this.ttsSpakers[nlpLanguage]) {
        return [];
      }

      return this.ttsSpakers[nlpLanguage].map((speakerId) => ({
        id: speakerId,
        language: nlpLanguage,
        gender: this.inferGenderFromSpeakerId(speakerId),
        name: this.formatSpeakerName(speakerId),
      }));
    } catch (error) {
      console.error("Failed to get TTS speakers:", error);
      throw new Error("Failed to retrieve TTS speakers");
    }
  }

  /**
   * Test Ghana NLP API connectivity
   * @returns {Promise<Object>} Connection status
   */
  static async testConnectivity() {
    try {
      // Test TTS languages endpoint
      const response = await fetch(
        "https://translation-api.ghananlp.org/tts/v1/languages",
        {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
            "Ocp-Apim-Subscription-Key": GHANA_NLP_API_KEY,
          },
        }
      );

      const isConnected = response.ok;
      const statusCode = response.status;

      return {
        connected: isConnected,
        statusCode,
        message: isConnected
          ? "Ghana NLP API is accessible"
          : "Ghana NLP API connection failed",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Ghana NLP connectivity test failed:", error);
      return {
        connected: false,
        statusCode: 0,
        message: `Connection test failed: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Generate hash for audio buffer for caching
   * @param {Buffer} audioBuffer - Audio buffer
   * @returns {string} Hash string
   */
  static generateAudioHash(audioBuffer) {
    // Simple hash based on buffer size and first few bytes
    const size = audioBuffer.length;
    const firstBytes = audioBuffer.slice(0, 16).toString("hex");
    return `${size}_${firstBytes}`;
  }

  /**
   * Generate hash for text for caching
   * @param {string} text - Text to hash
   * @returns {string} Hash string
   */
  static generateTextHash(text) {
    // Simple hash for caching purposes
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Infer gender from speaker ID (basic heuristic)
   * @param {string} speakerId - Speaker ID
   * @returns {string} Gender (male/female/unknown)
   */
  static inferGenderFromSpeakerId(speakerId) {
    // This is a basic heuristic - in production you'd have this data
    const femalePatterns = ["speaker_3", "speaker_4", "speaker_6", "speaker_8"];
    const malePatterns = ["speaker_1", "speaker_5", "speaker_7", "speaker_9"];

    if (femalePatterns.some((pattern) => speakerId.includes(pattern))) {
      return "female";
    } else if (malePatterns.some((pattern) => speakerId.includes(pattern))) {
      return "male";
    }

    return "unknown";
  }

  /**
   * Format speaker name for display
   * @param {string} speakerId - Speaker ID
   * @returns {string} Formatted name
   */
  static formatSpeakerName(speakerId) {
    const parts = speakerId.split("_");
    if (parts.length >= 3) {
      const language = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      const number = parts[2];
      return `${language} Speaker ${number}`;
    }
    return speakerId;
  }

  /**
   * Validate audio format for ASR
   * @param {string} mimeType - MIME type of audio file
   * @returns {boolean} Whether format is supported
   */
  static isValidAudioFormat(mimeType) {
    const supportedFormats = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/webm",
      "audio/ogg",
    ];
    return supportedFormats.includes(mimeType);
  }

  /**
   * Get optimal chunk size for audio processing
   * @param {number} audioLength - Audio length in bytes
   * @returns {number} Optimal chunk size
   */
  static getOptimalChunkSize(audioLength) {
    // Ghana NLP API limits - adjust based on actual API limits
    const maxChunkSize = 10 * 1024 * 1024; // 10MB
    const minChunkSize = 1024; // 1KB

    if (audioLength <= maxChunkSize) {
      return audioLength;
    }

    return maxChunkSize;
  }
}
