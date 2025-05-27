import User from '../models/User.js'; // Adjust path as needed

/**
 * Middleware to track user actions and update usage statistics.
 * @param {string} actionType - A string identifying the type of action being tracked (e.g., 'query', 'voice_query', 'content_view').
 * @param {object} [options] - Optional parameters for more specific tracking.
 * @param {number} [options.voiceDurationSeconds] - Duration of voice interaction in seconds.
 */
export const trackUsage = (actionType, options = {}) => {
  return async (req, res, next) => {
    if (!req.user || req.user.isAnonymous) {
      // Don't track usage for anonymous users or if no user is authenticated
      return next();
    }

    try {
      const userId = req.user._id;
      const updateFields = {
        $set: { 'usage.lastActive': new Date() },
        $inc: {},
      };

      // Check if it's time to reset monthly counts
      const user = await User.findById(userId, 'usage.lastResetDate');
      if (user && user.usage && user.usage.lastResetDate) {
        const lastReset = new Date(user.usage.lastResetDate);
        const now = new Date();
        if (now.getFullYear() > lastReset.getFullYear() || now.getMonth() > lastReset.getMonth()) {
          updateFields.$set['usage.monthlyQueries'] = 0;
          updateFields.$set['usage.monthlyVoiceMinutes'] = 0;
          updateFields.$set['usage.lastResetDate'] = now;
          // Note: If setting a field, it shouldn't also be in $inc for the same operation
        }
      }

      // Increment general total queries
      if (actionType === 'query' || actionType === 'voice_query') {
        if (updateFields.$set['usage.monthlyQueries'] === 0) { // if reset, this is the first query
             updateFields.$inc['usage.monthlyQueries'] = 1;
        } else {
            updateFields.$inc['usage.monthlyQueries'] = updateFields.$inc['usage.monthlyQueries'] ? updateFields.$inc['usage.monthlyQueries'] + 1 : 1;
        }
        updateFields.$inc['usage.totalQueries'] = 1;
      }

      // Increment voice minutes if applicable
      if (actionType === 'voice_query' && options.voiceDurationSeconds > 0) {
        const voiceMinutes = Math.ceil(options.voiceDurationSeconds / 60);
        if (updateFields.$set['usage.monthlyVoiceMinutes'] === 0) { // if reset
            updateFields.$inc['usage.monthlyVoiceMinutes'] = voiceMinutes;
        } else {
            updateFields.$inc['usage.monthlyVoiceMinutes'] = updateFields.$inc['usage.monthlyVoiceMinutes'] ? updateFields.$inc['usage.monthlyVoiceMinutes'] + voiceMinutes : voiceMinutes;
        }
      }

      // Other action types can be added here, e.g.:
      // if (actionType === 'content_view') { updateFields.$inc['usage.contentViews'] = 1; }
      // if (actionType === 'bookmark_added') { updateFields.$inc['usage.bookmarksMade'] = 1; }

      if (Object.keys(updateFields.$inc).length > 0 || Object.keys(updateFields.$set).length > 1) { // lastActive is always set
        await User.findByIdAndUpdate(userId, updateFields);
      }

      next();
    } catch (error) {
      console.error('Error in usageTracking middleware:', error);
      next(); // Important to call next() even if tracking fails, so the request doesn't hang.
    }
  };
};
