import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true, index: true }, // Unique date for daily rollups
  metrics: {
    totalUsers: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 }, // e.g., active in last 24h or 7d
    newRegistrations: { type: Number, default: 0 },
    totalQueries: { type: Number, default: 0 }, // Total queries submitted on this date
    voiceQueries: { type: Number, default: 0 },
    textQueries: { type: Number, default: 0 },
    languageBreakdown: {
      twi: { type: Number, default: 0 },
      ewe: { type: Number, default: 0 },
      dagbani: { type: Number, default: 0 },
      english: { type: Number, default: 0 }
    },
    topLegalTopics: [{
      topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'LegalContent' }, // Reference to LegalContent
      topicTitle: String, // Denormalized for easier display
      queryCount: { type: Number, default: 0 }
    }],
    userRoleBreakdown: {
      user: { type: Number, default: 0 },
      paid_user: { type: Number, default: 0 },
      admin: { type: Number, default: 0 }
    },
    // Additional useful metrics
    avgQueriesPerUser: { type: Number, default: 0 },
    communityStoriesSubmitted: { type: Number, default: 0 },
    legalAidSearches: { type: Number, default: 0 },
  },
  performance: {
    averageResponseTimeMs: { type: Number, default: 0 }, // Store in milliseconds
    apiSuccessRate: { type: Number, default: 0 }, // Percentage 0-100
    translationAccuracy: { type: Number, default: 0 }, // Placeholder, actual measurement complex
    asrAccuracy: { type: Number, default: 0 }, // Placeholder
    ttsRequests: { type: Number, default: 0 },
  },
  // Could add a version for the schema if it evolves
  // schemaVersion: { type: Number, default: 1 }
}, { timestamps: true });

// Ensure only one analytics document per day
analyticsSchema.index({ date: 1 }, { unique: true });

const Analytics = mongoose.model('Analytics', analyticsSchema);

export default Analytics;
