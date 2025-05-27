import mongoose from 'mongoose';

const communityStorySchema = new mongoose.Schema({
  // storyId: { // Let MongoDB generate the _id
  //   type: String,
  //   unique: true,
  //   required: true,
  //   trim: true
  // },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // For anonymous posts
  },
  title: {
    type: String,
    trim: true,
    maxlength: 200
  },
  storyContent: {
    type: String,
    required: [true, 'Story content is required.'],
    trim: true,
    minlength: [50, 'Story content must be at least 50 characters.'],
    maxlength: [5000, 'Story content cannot exceed 5000 characters.']
  },
  language: {
    type: String,
    required: [true, 'Language is required.'],
    enum: ['en', 'twi', 'ewe', 'dagbani'], // Consider fetching from config
    default: 'en'
  },
  category: {
    type: String,
    trim: true,
    maxlength: 100
    // Consider making this an enum or linking to a Category model if categories are predefined
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  upvotes: {
    type: Number,
    default: 0,
    min: 0
  },
  // Consider storing individual votes in a separate collection for more complex voting logic
  // For example, to prevent multiple votes from the same user
  // downvotes: { // Typically, a net score (upvotes - downvotes) or just upvotes is simpler
  //   type: Number,
  //   default: 0,
  //   min: 0
  // },
  status: {
    type: String,
    enum: ['pending_review', 'approved', 'rejected', 'archived'],
    default: 'pending_review'
  },
  isAnonymous: {
    type: Boolean,
    default: true
  },
  region: { // User's region, if provided and relevant
    type: String,
    trim: true
  },
  // Optional: if you want to track who moderated the story
  // moderatedBy: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User' // Assuming moderators are also users
  // },
  // moderationNotes: String,
  reportedCount: { // For tracking how many times a story has been reported
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Indexes for faster querying
communityStorySchema.index({ userId: 1 });
communityStorySchema.index({ status: 1 });
communityStorySchema.index({ category: 1 });
communityStorySchema.index({ language: 1 });
communityStorySchema.index({ upvotes: -1 }); // For sorting by most upvoted
communityStorySchema.index({ createdAt: -1 }); // For sorting by newest

// Text index for searching story content and title (example for English)
// communityStorySchema.index({ title: 'text', storyContent: 'text' });

// Pre-save hook for example: Convert tags to lowercase
communityStorySchema.pre('save', function(next) {
  if (this.tags && this.tags.length > 0) {
    this.tags = this.tags.map(tag => tag.toLowerCase().trim());
  }
  // Ensure storyContent is not just whitespace
  if (this.storyContent && this.storyContent.trim().length === 0) {
    return next(new Error('Story content cannot be empty or just whitespace.'));
  }
  next();
});

const CommunityStory = mongoose.model('CommunityStory', communityStorySchema);

export default CommunityStory;
