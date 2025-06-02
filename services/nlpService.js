import {
  speechToText as asrSpeechToText,
  getSupportedAsrLanguages,
} from "./asrService.js";
import {
  textToSpeech as ttsSynthesis,
  getSupportedTtsLanguages,
  getAvailableTtsSpeakers,
} from "./ttsService.js";
import {
  translateText as translationTranslate,
  getSupportedTranslationLanguages,
} from "./translationService.js";

/**
 * Ghana NLP Service - Main service class that orchestrates ASR, TTS, and Translation services
 */
export class NLPService {
  /**
   * Convert audio from speech to text using Ghana NLP ASR API
   * @param {Buffer} audioBuffer - Audio file buffer
   * @param {string} language - Source language (twi, ewe, dagbani, etc.)
   * @param {string} audioContentType - MIME type of the audio
   * @returns {Promise<Object>} Transcription result
   */
  static async speechToText(
    audioBuffer,
    language,
    audioContentType = "audio/mpeg"
  ) {
    try {
      return await asrSpeechToText(audioBuffer, language, audioContentType);
    } catch (error) {
      console.error("NLP Service - Speech-to-text failed:", error);
      throw new Error(`Speech recognition failed: ${error.message}`);
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
      return await ttsSynthesis(text, language, speakerId);
    } catch (error) {
      console.error("NLP Service - Text-to-speech failed:", error);
      throw new Error(`Speech synthesis failed: ${error.message}`);
    }
  }

  /**
   * Translate text between languages using Ghana NLP Translation API
   * @param {string} text - Text to translate
   * @param {string} sourceLang - Source language
   * @param {string} targetLang - Target language
   * @returns {Promise<Object>} Translation result
   */
  static async translateText(text, sourceLang, targetLang) {
    try {
      return await translationTranslate(text, sourceLang, targetLang);
    } catch (error) {
      console.error("NLP Service - Translation failed:", error);
      throw new Error(`Translation failed: ${error.message}`);
    }
  }

  /**
   * Get list of supported languages for all services
   * @returns {Promise<Object>} Object containing supported languages for each service
   */
  static async getSupportedLanguages() {
    try {
      const [asrLanguages, ttsLanguages, translationLanguages] =
        await Promise.allSettled([
          getSupportedAsrLanguages(),
          getSupportedTtsLanguages(),
          getSupportedTranslationLanguages(),
        ]);

      return {
        asr: asrLanguages.status === "fulfilled" ? asrLanguages.value : [],
        tts: ttsLanguages.status === "fulfilled" ? ttsLanguages.value : [],
        translation:
          translationLanguages.status === "fulfilled"
            ? translationLanguages.value
            : [],
      };
    } catch (error) {
      console.error("NLP Service - Failed to get supported languages:", error);
      throw new Error("Failed to retrieve supported languages");
    }
  }

  /**
   * Get available TTS speakers
   * @returns {Promise<Array>} List of available speakers
   */
  static async getTTSSpeakers() {
    try {
      return await getAvailableTtsSpeakers();
    } catch (error) {
      console.error("NLP Service - Failed to get TTS speakers:", error);
      throw new Error("Failed to retrieve TTS speakers");
    }
  }

  /**
   * Test connectivity to Ghana NLP APIs
   * @returns {Promise<Object>} Connection status for all services
   */
  static async testConnectivity() {
    try {
      const [ttsTest] = await Promise.allSettled([getSupportedTtsLanguages()]);

      const isConnected = ttsTest.status === "fulfilled";

      return {
        connected: isConnected,
        services: {
          tts: ttsTest.status === "fulfilled",
          asr: true, // ASR doesn't have a test endpoint
          translation: true, // Translation doesn't have a test endpoint
        },
        message: isConnected
          ? "Ghana NLP APIs are accessible"
          : "Some Ghana NLP APIs may be unavailable",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("NLP Service - Connectivity test failed:", error);
      return {
        connected: false,
        services: { tts: false, asr: false, translation: false },
        message: `Connection test failed: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
    }
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
    const maxChunkSize = 10 * 1024 * 1024; // 10MB
    const minChunkSize = 1024; // 1KB

    if (audioLength <= maxChunkSize) {
      return audioLength;
    }

    return maxChunkSize;
  }
}