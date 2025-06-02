// Instructions: Implement asrService.js using axios, targeting GhanaNLP ASR v2, with caching and error handling.

import axios from "axios";
import crypto from "crypto";
import { getRedisClient } from "../utils/redis.js";
import { GHANA_NLP_API_KEY, GHANA_NLP_BASE_URL } from "../utils/config.js";

const ASR_API_VERSION = "v2";
const ASR_CACHE_PREFIX = "asr_v2:";
const ASR_CACHE_TTL = 3600; // 1 hour

// Language mapping for Ghana NLP APIs (if specific mappings are needed beyond project prompt)
const languageMap = {
  twi: "tw",
  ewe: "ee",
  dagbani: "dag",
  gaa: "gaa", // As per prompt example, though 'ga' is sometimes used
  // Add other languages supported by your app and GhanaNLP ASR v2
};

/**
 * Generates a cache key for ASR requests.
 * @param {Buffer} audioBuffer - The audio buffer.
 * @param {string} language - The language of the audio.
 * @returns {string} The generated cache key.
 */
const generateCacheKey = (audioBuffer, language) => {
  const hash = crypto.createHash("sha256").update(audioBuffer).digest("hex");
  return `${ASR_CACHE_PREFIX}${language}:${hash}`;
};

/**
 * Performs Speech-to-Text (ASR) using the GhanaNLP ASR v2 API.
 * @param {Buffer} audioBuffer - The audio buffer to transcribe.
 * @param {string} language - The language of the audio (e.g., 'twi', 'ewe').
 * @param {string} audioContentType - The content type of the audio (e.g., 'audio/mpeg', 'audio/wav').
 * @returns {Promise<Object>} An object containing the transcription text and other metadata.
 * @throws {Error} If the ASR request fails or an unsupported language is provided.
 */
export const speechToText = async (
  audioBuffer,
  language,
  audioContentType = "audio/mpeg"
) => {
  const nlpLanguage =
    languageMap[language.toLowerCase()] || language.toLowerCase();

  if (!GHANA_NLP_API_KEY || !GHANA_NLP_BASE_URL) {
    throw new Error("GhanaNLP API key or base URL is not configured.");
  }

  // Check cache first
  const redisClient = getRedisClient();
  const cacheKey = generateCacheKey(audioBuffer, nlpLanguage);

  if (redisClient) {
    try {
      const cachedResult = await redisClient.get(cacheKey);
      if (cachedResult) {
        return JSON.parse(cachedResult);
      }
    } catch (cacheError) {
      console.error("ASR Redis cache read error:", cacheError);
      // Continue to API call if cache read fails
    }
  }

  const url = `${GHANA_NLP_BASE_URL}/asr/${ASR_API_VERSION}/transcribe?language=${nlpLanguage}`;

  try {
    const response = await axios.post(url, audioBuffer, {
      headers: {
        "Ocp-Apim-Subscription-Key": GHANA_NLP_API_KEY,
        "Content-Type": audioContentType,
        "Cache-Control": "no-cache",
      },
      responseType: "text", // GhanaNLP ASR API returns plain text
    });

    if (response.status === 200 && typeof response.data === "string") {
      const result = {
        text: response.data.trim(),
        language: nlpLanguage, // Return the language code used for the API call
        sourceLanguage: language, // Original language code from request
        engine: `ghananlp_asr_${ASR_API_VERSION}`,
        timestamp: new Date().toISOString(),
      };

      // Cache the result
      if (redisClient) {
        try {
          await redisClient.setEx(
            cacheKey,
            ASR_CACHE_TTL,
            JSON.stringify(result)
          );
        } catch (cacheError) {
          console.error("ASR Redis cache write error:", cacheError);
        }
      }
      return result;
    } else {
      // Handle cases where response.data might not be a string or status is not 200
      throw new Error(
        `ASR API request failed with status ${response.status}: ${
          response.data || "No data returned"
        }`
      );
    }
  } catch (error) {
    console.error(
      `ASR service error for language '${nlpLanguage}':`,
      error.response ? error.response.data : error.message
    );
    const errorMessage =
      error.response &&
      error.response.data &&
      typeof error.response.data === "string"
        ? error.response.data
        : error.message || "Failed to convert speech to text.";
    throw new Error(`ASR request failed: ${errorMessage}`);
  }
};

/**
 * Lists supported languages by this ASR service configuration.
 * This should align with what GhanaNLP ASR v2 actually supports and your `languageMap`.
 * @returns {string[]} An array of supported language codes (internal app codes).
 */
export const getSupportedAsrLanguages = () => {
  return Object.keys(languageMap);
};
