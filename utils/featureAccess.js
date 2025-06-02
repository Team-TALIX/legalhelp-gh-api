/**
 * Utility functions for feature access control based on user roles
 * Used to control access to premium features and enforce usage limits
 */

/**
 * Check if a user has access to a specific feature
 * @param {Object} user - User object containing role
 * @param {string} feature - Feature identifier
 * @returns {boolean} - Whether the user has access to the feature
 */
export const canAccessFeature = (user, feature) => {
  if (!user) return false;

  // Define feature access by role
  const featureAccess = {
    // Chat and voice features
    unlimited_queries: ["paid_user", "admin"],
    voice_minutes: ["paid_user", "admin"],

    // Content access features
    premium_legal_content: ["paid_user", "admin"],
    content_export: ["paid_user", "admin"],

    // Support features
    priority_support: ["paid_user", "admin"],

    // Community features
    community_moderation: ["admin"],

    // Admin features
    advanced_analytics: ["admin"],
    content_management: ["admin"],
    user_management: ["admin"],
    system_management: ["admin"],
  };

  // Check if feature exists and user role has access
  return featureAccess[feature]?.includes(user.role) || false;
};

/**
 * Get usage limits based on user role
 * @param {string} userRole - User role (user, paid_user, admin)
 * @returns {Object} - Usage limits for the role
 */
export const getUsageLimits = (userRole) => {
  // Define usage limits by role
  // -1 indicates unlimited usage
  const limits = {
    user: {
      monthlyQueries: 50,
      voiceMinutes: 10,
      bookmarks: 20,
      downloadFormats: ["pdf"],
      maxDownloadsPerMonth: 5,
    },
    paid_user: {
      monthlyQueries: -1, // unlimited
      voiceMinutes: -1, // unlimited
      bookmarks: -1, // unlimited
      downloadFormats: ["pdf", "docx", "txt"],
      maxDownloadsPerMonth: -1, // unlimited
    },
    admin: {
      monthlyQueries: -1,
      voiceMinutes: -1,
      bookmarks: -1,
      downloadFormats: ["pdf", "docx", "txt", "csv"],
      maxDownloadsPerMonth: -1,
    },
  };

  return limits[userRole] || limits.user;
};

/**
 * Check if a user has reached their usage limit
 * @param {Object} user - User object with usage data
 * @param {string} limitType - Type of limit to check
 * @returns {boolean} - Whether the user has reached their limit
 */
export const hasReachedLimit = (user, limitType) => {
  if (!user) return true;

  const limits = getUsageLimits(user.role);

  // If the limit is -1, it's unlimited
  if (limits[limitType] === -1) return false;

  // Check current usage against limit
  switch (limitType) {
    case "monthlyQueries":
      return user.usage?.monthlyQueries >= limits.monthlyQueries;
    case "voiceMinutes":
      return user.usage?.monthlyVoiceMinutes >= limits.voiceMinutes;
    case "bookmarks":
      return user.usage?.bookmarkedContent?.length >= limits.bookmarks;
    case "downloads":
      return user.usage?.monthlyDownloads >= limits.maxDownloadsPerMonth;
    default:
      return false;
  }
};

/**
 * Check if a format is available for user's role
 * @param {Object} user - User object with role
 * @param {string} format - Format to check
 * @returns {boolean} - Whether the format is available
 */
export const isFormatAvailable = (user, format) => {
  if (!user) return false;

  const limits = getUsageLimits(user.role);
  return limits.downloadFormats.includes(format);
};

/**
 * Get user-friendly message for upgrade prompts
 * @param {string} limitType - Type of limit that was reached
 * @returns {string} - User-friendly message
 */
export const getUpgradeMessage = (limitType) => {
  const messages = {
    monthlyQueries:
      "You've reached your monthly limit of legal queries. Upgrade to continue asking questions.",
    voiceMinutes:
      "You've used all your voice minutes for this month. Upgrade for unlimited voice features.",
    bookmarks:
      "You've reached your bookmarks limit. Upgrade to save unlimited legal resources.",
    downloads:
      "You've reached your monthly download limit. Upgrade for unlimited downloads.",
    format:
      "This download format is only available to premium users. Upgrade to access all formats.",
  };

  return (
    messages[limitType] ||
    "Upgrade to our premium plan for additional features and higher usage limits."
  );
};
