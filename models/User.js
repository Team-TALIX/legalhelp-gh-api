import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'; // Import bcrypt

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple documents to have null for this field if unique is true
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please fill a valid email address']
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  password: {
    type: String,
    // Optionally: select: false
  },
  preferredLanguage: {
    type: String,
    default: 'twi',
    enum: ['en', 'twi', 'ewe', 'dagbani']
  },
  isAnonymous: {
    type: Boolean,
    default: false // Default to false for registered users
  },
  role: {
    type: String,
    enum: ['user', 'paid_user', 'admin'],
    default: 'user'
  },
  subscription: {
    plan: { type: String, enum: ['free', 'premium'], default: 'free' },
    startDate: Date,
    endDate: Date,
    isActive: { type: Boolean, default: true },
    paymentMethod: String, // e.g., 'stripe', 'mtn_momo'
    lastPaymentDate: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String
  },
  profile: {
    region: String,
    occupation: String,
    legalInterests: [String]
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  googleProfile: {
    name: String,
    email: String, // This might duplicate the main email but can be useful for initial signup
    picture: String
  },
  usage: {
    totalQueries: { type: Number, default: 0 },
    monthlyQueries: { type: Number, default: 0 },
    monthlyVoiceMinutes: { type: Number, default: 0 },
    lastResetDate: { type: Date, default: Date.now },
    favoriteTopics: [{ type: String }],
    bookmarkedContent: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LegalContent' }],
    lastActive: { type: Date, default: Date.now }
  },
  permissions: {
    canAccessAnalytics: { type: Boolean, default: false },
    canManageContent: { type: Boolean, default: false },
    canModerateStories: { type: Boolean, default: false },
    canManageUsers: { type: Boolean, default: false }
  },
  passwordResetToken: String,
  passwordResetExpires: Date
}, { timestamps: true });

// Indexing
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });

// Password Hashing Middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  // Only hash if user is not anonymous and password is set
  if (this.isAnonymous && !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false; // No password to compare (e.g. anonymous user)
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to set permissions based on role (call after role change)
userSchema.methods.setPermissionsByRole = function() {
  this.permissions = {
    canAccessAnalytics: false,
    canManageContent: false,
    canModerateStories: false,
    canManageUsers: false
  };
  if (this.role === 'admin') {
    this.permissions.canAccessAnalytics = true;
    this.permissions.canManageContent = true;
    this.permissions.canModerateStories = true;
    this.permissions.canManageUsers = true;
  } else if (this.role === 'paid_user') {
    // Paid users might get some specific permissions later
  }
  // Regular 'user' has default (false) permissions for these specific flags
};

// Before saving, if role is changed, update permissions
userSchema.pre('save', function(next) {
  if (this.isModified('role')) {
    this.setPermissionsByRole();
  }
  next();
});

const User = mongoose.model('User', userSchema);

export default User;
