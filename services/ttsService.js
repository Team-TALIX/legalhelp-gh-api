import axios from "axios";
import crypto from "crypto";
import { getRedisClient } from "../utils/redis.js";
import { GHANA_NLP_API_KEY, GHANA_NLP_BASE_URL } from "../utils/config.js";

const TTS_API_VERSION = "v1";
const TTS_CACHE_PREFIX = "tts_v1:";
const TTS_CACHE_TTL = 24 * 3600; // 24 hours
const TTS_LANGUAGES_CACHE_KEY = "tts_v1:supported_languages";
const TTS_SPEAKERS_CACHE_KEY_PREFIX = "tts_v1:speakers_for_lang:";
const TTS_METADATA_CACHE_TTL = 6 * 3600; // 6 hours for metadata like languages/speakers

// Language mapping for Ghana NLP TTS API (e.g., internal 'twi' to API's 'tw')
// Prompt: Language should be one of 'tw' -> Twi, 'ki' -> Kikuyu, or 'ee' -> Ewe
const languageCodeMap = {
  twi: "tw",
  kikuyu: "ki",
  ewe: "ee",
  // Add others if supported by the API and your app
};

// Speaker IDs as per prompt. This can be expanded or fetched dynamically.
const defaultSpeakerMap = {
  tw: "twi_speaker_4", // Default Twi speaker
  ki: "kikuyu_speaker_1", // Default Kikuyu speaker
  ee: "ewe_speaker_3", // Default Ewe speaker
};

/**
 * Generates a cache key for TTS requests.
 * @param {string} text - The text to synthesize.
 * @param {string} language - The language code.
 * @param {string} speakerId - The speaker ID.
 * @returns {string} The generated cache key.
 */
const generateCacheKey = (text, language, speakerId) => {
  const textHash = crypto.createHash("sha256").update(text).digest("hex");
  return `${TTS_CACHE_PREFIX}${language}:${speakerId}:${textHash}`;
};

/**
 * Synthesizes text to speech using the GhanaNLP TTS API.
 * @param {string} text - The text to synthesize.
 * @param {string} language - The language of the text (e.g., 'twi').
 * @param {string} [speakerId] - Optional specific speaker ID. If not provided, a default will be used.
 * @returns {Promise<Object>} An object containing the audio data (as Buffer or base64 string) and format.
 * @throws {Error} If the TTS request fails or language/speaker is not supported.
 */
export const textToSpeech = async (text, language, speakerId) => {
  const nlpLanguage =
    languageCodeMap[language.toLowerCase()] || language.toLowerCase();
  const selectedSpeakerId = speakerId || defaultSpeakerMap[nlpLanguage];

  if (!GHANA_NLP_API_KEY || !GHANA_NLP_BASE_URL) {
    throw new Error("GhanaNLP API key or base URL is not configured.");
  }

  if (!nlpLanguage || !selectedSpeakerId) {
    throw new Error(
      `TTS not supported for language: ${language} or speaker not found.`
    );
  }

  // Check cache first
  const redisClient = getRedisClient();
  const cacheKey = generateCacheKey(text, nlpLanguage, selectedSpeakerId);

  if (redisClient) {
    try {
      const cachedResult = await redisClient.get(cacheKey);
      if (cachedResult) {
        const parsedResult = JSON.parse(cachedResult);
        // Convert base64 back to Buffer if needed by consumer, or keep as base64
        // For now, assuming consumer can handle base64 or a Buffer directly.
        // If Buffer is preferred: parsedResult.audioData = Buffer.from(parsedResult.audioData, 'base64');
        return parsedResult;
      }
    } catch (cacheError) {
      console.error("TTS Redis cache read error:", cacheError);
    }
  }

  const url = `${GHANA_NLP_BASE_URL}/tts/${TTS_API_VERSION}/tts`;
  const requestBody = {
    text: text,
    language: nlpLanguage,
    speaker_id: selectedSpeakerId,
  };

  try {
    const response = await axios.post(url, requestBody, {
      headers: {
        "Ocp-Apim-Subscription-Key": GHANA_NLP_API_KEY,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      responseType: "arraybuffer", // API returns audio file (WAV as per prompt)
    });

    // API returns audio file directly (WAV)
    const audioBuffer = Buffer.from(response.data);
    const audioBase64 = audioBuffer.toString("base64"); // Common way to send audio data in JSON

    const result = {
      audioData: audioBase64, // Or send audioBuffer directly if preferred by controller
      audioFormat: "wav", // As per prompt
      language: nlpLanguage,
      speakerId: selectedSpeakerId,
      timestamp: new Date().toISOString(),
    };

    if (redisClient) {
      try {
        // Store base64 string in cache
        await redisClient.setEx(
          cacheKey,
          TTS_CACHE_TTL,
          JSON.stringify(result)
        );
      } catch (cacheError) {
        console.error("TTS Redis cache write error:", cacheError);
      }
    }
    return result;
  } catch (error) {
    console.error(
      `TTS service error for lang '${nlpLanguage}', speaker '${selectedSpeakerId}':`,
      error.response ? error.response.data : error.message
    );
    const errorMessage =
      error.response && error.response.data
        ? typeof error.response.data === "string"
          ? error.response.data
          : Buffer.from(error.response.data).toString() // API might return error as text or buffer
        : error.message || "Failed to synthesize speech.";
    throw new Error(`TTS request failed: ${errorMessage}`);
  }
};

/**
 * Fetches the list of supported languages for TTS from the GhanaNLP API.
 * @returns {Promise<any>} The list of supported languages.
 */
export const getSupportedTtsLanguages = async () => {
  if (!GHANA_NLP_API_KEY || !GHANA_NLP_BASE_URL) {
    throw new Error("GhanaNLP API credentials not configured.");
  }
  const url = `${GHANA_NLP_BASE_URL}/tts/${TTS_API_VERSION}/languages`;
  const redisClient = getRedisClient();

  if (redisClient) {
    try {
      const cachedLangs = await redisClient.get(TTS_LANGUAGES_CACHE_KEY);
      if (cachedLangs) return JSON.parse(cachedLangs);
    } catch (e) {
      console.error("TTS Langs cache read error:", e);
    }
  }

  try {
    const response = await axios.get(url, {
      headers: {
        "Ocp-Apim-Subscription-Key": GHANA_NLP_API_KEY,
        "Cache-Control": "no-cache",
      },
    });
    if (redisClient && response.data) {
      try {
        await redisClient.setEx(
          TTS_LANGUAGES_CACHE_KEY,
          TTS_METADATA_CACHE_TTL,
          JSON.stringify(response.data)
        );
      } catch (e) {
        console.error("TTS Langs cache write error:", e);
      }
    }
    return response.data; // Actual structure depends on API
  } catch (error) {
    console.error(
      "Failed to fetch TTS languages:",
      error.response ? error.response.data : error.message
    );
    throw new Error("Could not retrieve supported TTS languages.");
  }
};

/**
 * Fetches the list of available TTS speakers from the GhanaNLP API.
 * This might be for all languages or per language based on API design.
 * The prompt shows one endpoint for all speakers.
 * @returns {Promise<any>} The list of available speakers.
 */
export const getAvailableTtsSpeakers = async () => {
  if (!GHANA_NLP_API_KEY || !GHANA_NLP_BASE_URL) {
    throw new Error("GhanaNLP API credentials not configured.");
  }
  // Assuming one endpoint for all speakers as per prompt structure
  const url = `${GHANA_NLP_BASE_URL}/tts/${TTS_API_VERSION}/speakers`;
  const cacheKey = `${TTS_SPEAKERS_CACHE_KEY_PREFIX}all`; // Cache all speakers together
  const redisClient = getRedisClient();

  if (redisClient) {
    try {
      const cachedSpeakers = await redisClient.get(cacheKey);
      if (cachedSpeakers) return JSON.parse(cachedSpeakers);
    } catch (e) {
      console.error("TTS Speakers cache read error:", e);
    }
  }

  try {
    const response = await axios.get(url, {
      headers: {
        "Ocp-Apim-Subscription-Key": GHANA_NLP_API_KEY,
        "Cache-Control": "no-cache",
      },
    });
    if (redisClient && response.data) {
      try {
        await redisClient.setEx(
          cacheKey,
          TTS_METADATA_CACHE_TTL,
          JSON.stringify(response.data)
        );
      } catch (e) {
        console.error("TTS Speakers cache write error:", e);
      }
    }
    return response.data; // Actual structure depends on API
  } catch (error) {
    console.error(
      "Failed to fetch TTS speakers:",
      error.response ? error.response.data : error.message
    );
    throw new Error("Could not retrieve available TTS speakers.");
  }
};
