import mongoose from 'mongoose';
import bcrypt, { compare } from 'bcrypt';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple documents to have null for this field if unique is true
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please fill a valid email address"],
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      // Optionally: select: false
    },
    preferredLanguage: {
      type: String,
      default: "twi",
      enum: ["en", "twi", "ewe", "dagbani"],
    },
    isAnonymous: {
      type: Boolean,
      default: false, // Default to false for registered users
    },
    role: {
      type: String,
      enum: ["user", "paid_user", "admin"],
      default: "user",
    },
    subscription: {
      plan: { type: String, enum: ["free", "premium"], default: "free" },
      startDate: Date,
      endDate: Date,
      isActive: { type: Boolean, default: true },
      paymentMethod: String, // e.g., 'stripe', 'mtn_momo'
      lastPaymentDate: Date,
      stripeCustomerId: String,
      stripeSubscriptionId: String,
    },
    profile: {
      region: String,
      occupation: String,
      legalInterests: [String],
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    googleProfile: {
      name: String,
      email: String, // This might duplicate the main email but can be useful for initial signup
      picture: String,
    },
    usage: {
      totalQueries: { type: Number, default: 0 },
      monthlyQueries: { type: Number, default: 0 },
      monthlyVoiceMinutes: { type: Number, default: 0 },
      lastResetDate: { type: Date, default: Date.now },
      favoriteTopics: [{ type: String }],
      bookmarkedContent: [
        { type: mongoose.Schema.Types.ObjectId, ref: "LegalContent" },
      ],
      lastActive: { type: Date, default: Date.now },
    },
    permissions: {
      canAccessAnalytics: { type: Boolean, default: false },
      canManageContent: { type: Boolean, default: false },
      canModerateStories: { type: Boolean, default: false },
      canManageUsers: { type: Boolean, default: false },
    },
    // Email verification
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    // Phone verification
    isPhoneVerified: { type: Boolean, default: false },
    phoneVerificationCode: String,
    phoneVerificationExpires: Date,
    phoneVerificationAttempts: { type: Number, default: 0 },
    // General verification
    isVerified: { type: Boolean, default: false }, // True when either email or phone is verified
    // Password reset
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
  }
);

// Indexing
// userSchema.index({ email: 1 });
// userSchema.index({ phone: 1 });
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
  if (!this.password) return false;
  const result = await bcrypt.compare(candidatePassword, this.password);
  return result
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

// Method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = token;
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return token;
};

// Method to generate phone verification code
userSchema.methods.generatePhoneVerificationCode = function() {
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
  this.phoneVerificationCode = code;
  this.phoneVerificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  this.phoneVerificationAttempts = 0;
  return code;
};

// Method to verify email
userSchema.methods.verifyEmail = function(token) {
  if (this.emailVerificationToken !== token) {
    return false;
  }
  if (new Date() > this.emailVerificationExpires) {
    return false;
  }
  this.isEmailVerified = true;
  this.emailVerificationToken = undefined;
  this.emailVerificationExpires = undefined;
  return true;
};

// Method to verify phone
userSchema.methods.verifyPhone = function(code) {
  if (this.phoneVerificationAttempts >= 5) {
    return { success: false, error: 'Too many attempts. Please request a new code.' };
  }

  if (this.phoneVerificationCode !== code) {
    this.phoneVerificationAttempts += 1;
    return { success: false, error: 'Invalid verification code.' };
  }

  if (new Date() > this.phoneVerificationExpires) {
    return { success: false, error: 'Verification code has expired.' };
  }

  this.isPhoneVerified = true;
  this.phoneVerificationCode = undefined;
  this.phoneVerificationExpires = undefined;
  this.phoneVerificationAttempts = 0;
  return { success: true };
};

// Before saving, if role is changed, update permissions
userSchema.pre('save', function(next) {
  if (this.isModified('role')) {
    this.setPermissionsByRole();
  }

  // Update general verification status
  if (this.isModified('isEmailVerified') || this.isModified('isPhoneVerified')) {
    this.isVerified = this.isEmailVerified || this.isPhoneVerified;
  }

  next();
});

const User = mongoose.model('User', userSchema);

export default User;
