/**
 * Helper utilities for LegalHelp GH Backend
 */

/**
 * Get date range for analytics based on period string
 * @param {string} period - Period string like '7d', '30d', '90d', '1y'
 * @returns {Date} Start date for the period
 */
export const getDateRange = (period) => {
  const now = new Date();
  const startDate = new Date(now);

  // Normalize period to lowercase
  const normalizedPeriod = period.toLowerCase();

  switch (normalizedPeriod) {
    case '1d':
    case '1day':
      startDate.setDate(now.getDate() - 1);
      break;
    case '7d':
    case '1w':
    case '1week':
      startDate.setDate(now.getDate() - 7);
      break;
    case '14d':
    case '2w':
    case '2weeks':
      startDate.setDate(now.getDate() - 14);
      break;
    case '30d':
    case '1m':
    case '1month':
      startDate.setDate(now.getDate() - 30);
      break;
    case '60d':
    case '2m':
    case '2months':
      startDate.setDate(now.getDate() - 60);
      break;
    case '90d':
    case '3m':
    case '3months':
      startDate.setDate(now.getDate() - 90);
      break;
    case '6m':
    case '6months':
      startDate.setMonth(now.getMonth() - 6);
      break;
    case '1y':
    case '1year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      // Default to 30 days if period is not recognized
      console.warn(`Unknown period "${period}", defaulting to 30 days`);
      startDate.setDate(now.getDate() - 30);
  }

  // Set to start of day for consistent querying
  startDate.setHours(0, 0, 0, 0);

  return startDate;
};

/**
 * Get both start and end dates for a period
 * @param {string} period - Period string
 * @returns {Object} Object with startDate and endDate
 */
export const getDateRangeWithEnd = (period) => {
  const startDate = getDateRange(period);
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
};

/**
 * Format date to ISO string for consistent database queries
 * @param {Date} date - Date to format
 * @returns {string} ISO string
 */
export const formatDateForDB = (date) => {
  return date.toISOString();
};

/**
 * Validate MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean} True if valid ObjectId
 */
export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;

  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim(); // Remove whitespace
};

/**
 * Generate a random string for tokens/IDs
 * @param {number} length - Length of the string
 * @returns {string} Random string
 */
export const generateRandomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Calculate pagination offset
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Items per page
 * @returns {Object} Object with skip and limit values
 */
export const getPagination = (page = 1, limit = 10) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items per page
  const skip = (pageNum - 1) * limitNum;

  return { skip, limit: limitNum, page: pageNum };
};

/**
 * Create standard API response format
 * @param {boolean} success - Success status
 * @param {string} message - Response message
 * @param {any} data - Response data
 * @param {Object} meta - Additional metadata
 * @returns {Object} Formatted response
 */
export const createResponse = (success, message, data = null, meta = {}) => {
  return {
    success,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  };
};

/**
 * Validate Ghana phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid Ghana phone number
 */
export const isValidGhanaPhone = (phone) => {
  // Ghana phone numbers: +233XXXXXXXXX or 0XXXXXXXXX
  const ghanaPhoneRegex = /^(\+233|0)[2-9]\d{8}$/;
  return ghanaPhoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Format Ghana phone number to international format
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatGhanaPhone = (phone) => {
  const cleanPhone = phone.replace(/\s/g, '');

  if (cleanPhone.startsWith('+233')) {
    return cleanPhone;
  }

  if (cleanPhone.startsWith('0')) {
    return '+233' + cleanPhone.substring(1);
  }

  return phone; // Return original if doesn't match expected patterns
};

/**
 * Check if error is a MongoDB duplicate key error
 * @param {Error} error - Error to check
 * @returns {boolean} True if duplicate key error
 */
export const isDuplicateKeyError = (error) => {
  return error.code === 11000 || error.name === 'MongoServerError';
};

/**
 * Extract duplicate field from MongoDB error
 * @param {Error} error - MongoDB duplicate key error
 * @returns {string} Field name that caused the duplicate
 */
export const getDuplicateField = (error) => {
  if (!isDuplicateKeyError(error)) return null;

  const message = error.message;
  if (message.includes('email')) return 'email';
  if (message.includes('phone')) return 'phone';
  if (message.includes('googleId')) return 'googleId';

  return 'unknown field';
};

/**
 * Sleep function for delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Generate unique ID for chat sessions, users, etc.
 * @param {string} prefix - Prefix for the ID
 * @returns {string} Unique ID
 */
export const generateUniqueId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return prefix ? `${prefix}_${timestamp}_${randomPart}` : `${timestamp}_${randomPart}`;
};
