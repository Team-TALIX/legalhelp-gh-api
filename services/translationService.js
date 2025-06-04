import axios from "axios";
import crypto from "crypto";
import { getRedisClient } from "../utils/redis.js";
import { GHANA_NLP_API_KEY, GHANA_NLP_BASE_URL } from "../utils/config.js";

const TRANSLATION_API_VERSION = "v1"; // As per prompt docs (e.g. /v1/translate)
const TRANSLATION_CACHE_PREFIX = "translate_v1:";
const TRANSLATION_CACHE_TTL = 24 * 3600; // 24 hours

// Language mapping: internal app codes to GhanaNLP codes if different.
// From prompt: English - en, Twi - tw, Ga - gaa, Ewe - ee, Fante - fat, Dagbani - dag, Gurene - gur
// Yoruba - yo, Kikuyu - ki, Luo - luo, Kimeru - mer
// Ensure these are exactly what the API expects.
const languageCodeMap = {
  en: "en",
  twi: "tw",
  gaa: "gaa",
  ewe: "ee",
  dagbani: "dag",
  // Add all other supported languages by your app and the GhanaNLP translation API
  // Example: 'fante': 'fat', 'gurene': 'gur' , etc.
};
// dag: "Dagbani";
// ee: "Ewe";
// en: "English";
// fat: "Fante";
// gaa: "Ga";
// gur: "Gurune";
// ki: "Kikuyu";
// kus: "Kusaal";
// luo: "Luo";
// mer: "Kimeru";
// tw: "Twi";
// yo: "Yoruba";

/**
 * Generates a cache key for translation requests.
 * @param {string} text - The text to translate.
 * @param {string} sourceLang - The source language code.
 * @param {string} targetLang - The target language code.
 * @returns {string} The generated cache key.
 */
const generateCacheKey = (text, sourceLang, targetLang) => {
  const textHash = crypto.createHash("sha256").update(text).digest("hex");
  return `${TRANSLATION_CACHE_PREFIX}${sourceLang}_to_${targetLang}:${textHash}`;
};

/**
 * Translates text using the GhanaNLP Translation API.
 * @param {string} text - The text to translate (max 1000 characters as per prompt).
 * @param {string} sourceLanguage - The source language code (e.g., 'en').
 * @param {string} targetLanguage - The target language code (e.g., 'twi').
 * @returns {Promise<Object>} An object containing the translated text and other metadata.
 * @throws {Error} If the translation request fails or languages are not supported.
 */
export const translateText = async (text, sourceLanguage, targetLanguage) => {
  if (sourceLanguage === targetLanguage) {
    return {
      translatedText: text,
      sourceLanguage,
      targetLanguage,
      engine: "none",
      confidence: 1.0, // Perfect confidence as no translation needed
      timestamp: new Date().toISOString(),
    };
  }

  const mappedSourceLang =
    languageCodeMap[sourceLanguage.toLowerCase()] ||
    sourceLanguage.toLowerCase();
  const mappedTargetLang =
    languageCodeMap[targetLanguage.toLowerCase()] ||
    targetLanguage.toLowerCase();

  if (!GHANA_NLP_API_KEY || !GHANA_NLP_BASE_URL) {
    throw new Error("GhanaNLP API key or base URL is not configured.");
  }

  if (text.length > 1000) {
    // As per prompt: "Maximum length is 1000 characters"
    console.warn("Translation input text exceeds 1000 characters. Truncating.");
    text = text.substring(0, 1000);
  }

  const langPair = `${mappedSourceLang}-${mappedTargetLang}`;

  // Check cache first
  const redisClient = getRedisClient();
  const cacheKey = generateCacheKey(text, mappedSourceLang, mappedTargetLang);

  if (redisClient) {
    try {
      const cachedResult = await redisClient.get(cacheKey);
      if (cachedResult) {
        return JSON.parse(cachedResult);
      }
    } catch (cacheError) {
      console.error("Translation Redis cache read error:", cacheError);
      // Continue to API call if cache read fails
    }
  }

  const url = `${GHANA_NLP_BASE_URL}/${TRANSLATION_API_VERSION}/translate`;
  const requestBody = {
    in: text,
    lang: langPair,
  };

  try {
    const response = await axios.post(url, requestBody, {
      headers: {
        "Ocp-Apim-Subscription-Key": GHANA_NLP_API_KEY,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    });

    // The prompt says "Response: 200 OK, successful operation, application/json, translationResponse, Translated text"
    // This implies the translated text might be directly in response.data or response.data.translationResponse
    // Adjust based on actual API response structure.
    // Assuming response.data is a string with the translated text based on the simplest interpretation of "Translated text".
    // Or if it's an object: response.data.translationResponse or similar.
    // For now, let's assume the API returns an object like { "translationResponse": "Translated text here" }
    // or simply the translated string directly in response.data

    let translatedTextValue = "";
    if (response.data && typeof response.data === "string") {
      translatedTextValue = response.data.trim();
    } else if (
      response.data &&
      response.data.translationResponse &&
      typeof response.data.translationResponse === "string"
    ) {
      translatedTextValue = response.data.translationResponse.trim();
    } else if (
      response.data &&
      response.data.out &&
      typeof response.data.out === "string"
    ) {
      // Another common pattern for translation APIs
      translatedTextValue = response.data.out.trim();
    } else {
      console.warn(
        "Unexpected translation API response structure:",
        response.data
      );
      // Fallback or throw error if structure is unknown
      throw new Error("Failed to parse translation from API response.");
    }

    const result = {
      translatedText: translatedTextValue,
      sourceLanguage: mappedSourceLang,
      targetLanguage: mappedTargetLang,
      engine: `ghananlp_translate_${TRANSLATION_API_VERSION}`,
      confidence: response.data.confidence || 0.9, // API might provide confidence
      timestamp: new Date().toISOString(),
    };

    // Cache the result
    if (redisClient) {
      try {
        await redisClient.setEx(
          cacheKey,
          TRANSLATION_CACHE_TTL,
          JSON.stringify(result)
        );
      } catch (cacheError) {
        console.error("Translation Redis cache write error:", cacheError);
      }
    }
    return result;
  } catch (error) {
    console.error(
      `Translation service error for ${langPair}:`,
      error.response ? error.response.data : error.message
    );
    const errorMessage =
      error.response &&
      error.response.data &&
      (typeof error.response.data.message === "string"
        ? error.response.data.message
        : typeof error.response.data === "string"
        ? error.response.data
        : "Translation API error")
        ? typeof error.response.data.message === "string"
          ? error.response.data.message
          : error.response.data
        : error.message || "Failed to translate text.";
    throw new Error(`Translation request failed: ${errorMessage}`);
  }
};

/**
 * Fetches the list of supported languages from the GhanaNLP Translation API.
 * @returns {Promise<Object[]>} A list of supported language objects e.g. [{ code: 'en', name: 'English' }].
 */
export const getSupportedTranslationLanguages = async () => {
  if (!GHANA_NLP_API_KEY || !GHANA_NLP_BASE_URL) {
    throw new Error(
      "GhanaNLP API key or base URL is not configured for fetching languages."
    );
  }
  // Cache this if it doesn't change often
  const url = `${GHANA_NLP_BASE_URL}/${TRANSLATION_API_VERSION}/languages`;
  try {
    const response = await axios.get(url, {
      headers: {
        "Ocp-Apim-Subscription-Key": GHANA_NLP_API_KEY,
        "Cache-Control": "no-cache",
      },
    });
    // The prompt says: "Response: 200 OK, List of language codes with corresponding language name"
    // Adapt based on actual API response structure. Expecting something like: [{ "code": "en", "name": "English"}, ...]
    // or {"en": "English", "tw": "Twi", ...}
    if (
      response.data &&
      (Array.isArray(response.data) || typeof response.data === "object")
    ) {
      return response.data;
    } else {
      console.warn(
        "Unexpected language list API response structure:",
        response.data
      );
      throw new Error("Failed to parse supported languages from API response.");
    }
  } catch (error) {
    console.error(
      "Failed to fetch supported translation languages:",
      error.response ? error.response.data : error.message
    );
    throw new Error("Could not retrieve supported translation languages.");
  }
};
