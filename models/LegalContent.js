import mongoose from 'mongoose';

const localizedStringSchema = new mongoose.Schema({
  en: { type: String, trim: true },
  twi: { type: String, trim: true },
  ewe: { type: String, trim: true },
  dagbani: { type: String, trim: true }
}, { _id: false });

const legalContentSchema = new mongoose.Schema({
  topicId: {
    type: String,
    unique: true,
    required: true,
    trim: true
    // Example: "family-law-marriage-registration"
  },
  category: {
    type: String,
    required: true,
    trim: true
    // Example: "Family Law", "Land Rights"
  },
  title: localizedStringSchema,
  content: localizedStringSchema, // Can be markdown or HTML, decide on a format
  summary: localizedStringSchema, // A short summary for previews
  keywords: {
    type: [String],
    default: []
  },
  relatedTopics: [{
    type: String // References other topicIds
  }],
  difficulty: {
    type: String,
    enum: ['basic', 'intermediate', 'advanced'],
    default: 'basic'
  },
  version: { type: Number, default: 1 }, // For content versioning
  lastPublishedAt: Date, // When it was last made live
  lastUpdatedAt: { type: Date, default: Date.now } // Different from Mongoose timestamps, for content logical update
  // Mongoose timestamps (createdAt, updatedAt) will track document changes
}, { timestamps: true });

// Indexing for search and filtering
legalContentSchema.index({ topicId: 1 });
legalContentSchema.index({ category: 1 });
legalContentSchema.index({ difficulty: 1 });
legalContentSchema.index({ keywords: 1 });
legalContentSchema.index({ "title.en": 'text', "content.en": 'text', "keywords": 'text' }); // Example for text search in English
// Add more text indexes for other languages as needed, e.g., "title.twi", "content.twi"

const LegalContent = mongoose.model('LegalContent', legalContentSchema);

export default LegalContent;
