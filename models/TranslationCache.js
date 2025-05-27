import mongoose from 'mongoose';

// This model is intended for logging or as a persistent backup for translations.
// The primary, fast caching of translations should be handled directly via Redis.

const translationCacheSchema = new mongoose.Schema({
  cacheKey: { // e.g., md5(originalText + sourceLang + targetLang)
    type: String,
    required: true,
    unique: true,
    index: true // Critical for quick lookups if used as a DB cache
  },
  sourceLanguage: {
    type: String,
    required: true,
    trim: true
    // enum: ['en', 'twi', 'ewe', 'dagbani'] // Consider using a shared list
  },
  targetLanguage: {
    type: String,
    required: true,
    trim: true
    // enum: ['en', 'twi', 'ewe', 'dagbani']
  },
  originalText: {
    type: String,
    required: true,
    trim: true
  },
  translatedText: {
    type: String,
    required: true,
    trim: true
  },
  // Optional: metadata for cache management if this model is actively used
  characterCount: {
    type: Number // Length of originalText, could be used for cache eviction policies
  },
  sourceAPI: {
    type: String // e.g., 'GhanaNLP', if multiple translation sources are ever used
  },
  usageCount: { // How many times this translation has been retrieved from this DB store
    type: Number,
    default: 0
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true }); // createdAt, updatedAt

// TTL index: automatically remove documents after a certain period
// This can help manage the size of the cache collection in MongoDB.
// For example, expire documents after 30 days of not being updated (or created).
// The actual Redis cache should have its own TTL strategy.
// translationCacheSchema.index({ "updatedAt": 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 days

// Compound index for common lookups, if this collection is queried directly
translationCacheSchema.index({ sourceLanguage: 1, targetLanguage: 1 });
// translationCacheSchema.index({ originalText: 'text' }); // If text search is needed on originalText

// Pre-save hook to update lastAccessed timestamp
translationCacheSchema.pre('save', function(next) {
  this.lastAccessed = new Date();
  next();
});

const TranslationCache = mongoose.model('TranslationCache', translationCacheSchema);

export default TranslationCache;
