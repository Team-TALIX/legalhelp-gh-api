import User from '../models/User.js';
import emailService from '../services/emailService.js';
import smsService from '../services/smsService.js';
import { validationResult } from 'express-validator';

// Send email verification
export const sendEmailVerification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate verification token
    const token = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email
    await emailService.sendEmailVerification(user.email, token, user.preferredLanguage);

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('Send email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify email
export const verifyEmail = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { token } = req.body;
    const user = await User.findOne({ emailVerificationToken: token });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    const verified = user.verifyEmail(token);
    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    await user.save();

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email, user.googleProfile?.name, user.preferredLanguage);
    } catch (emailError) {
      console.error('Welcome email failed:', emailError);
      // Don't fail the verification if welcome email fails
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user._id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Send phone verification code
export const sendPhoneVerification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { phone } = req.body;

    // Validate phone number format
    const phoneValidation = smsService.validatePhoneNumber(phone);
    if (!phoneValidation.valid) {
      return res.status(400).json({
        success: false,
        message: phoneValidation.error
      });
    }

    const user = await User.findOne({ phone: phoneValidation.formatted });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isPhoneVerified) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is already verified'
      });
    }

    // Check rate limiting (max 3 requests per 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    if (user.phoneVerificationExpires && user.phoneVerificationExpires > tenMinutesAgo && user.phoneVerificationAttempts >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Too many verification requests. Please wait before requesting a new code.'
      });
    }

    // Generate verification code
    const code = user.generatePhoneVerificationCode();
    await user.save();

    // Send SMS
    await smsService.sendVerificationCode(user.phone, code, user.preferredLanguage);

    res.status(200).json({
      success: true,
      message: 'Verification code sent successfully',
      expiresIn: '10 minutes'
    });

  } catch (error) {
    console.error('Send phone verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification code',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify phone
export const verifyPhone = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { phone, code } = req.body;

    // Validate phone number format
    const phoneValidation = smsService.validatePhoneNumber(phone);
    if (!phoneValidation.valid) {
      return res.status(400).json({
        success: false,
        message: phoneValidation.error
      });
    }

    const user = await User.findOne({ phone: phoneValidation.formatted });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const verification = user.verifyPhone(code);
    if (!verification.success) {
      await user.save(); // Save the incremented attempts
      return res.status(400).json({
        success: false,
        message: verification.error
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Phone number verified successfully',
      user: {
        id: user._id,
        phone: user.phone,
        isPhoneVerified: user.isPhoneVerified,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Resend phone verification code
export const resendPhoneVerification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { phone } = req.body;

    // Validate phone number format
    const phoneValidation = smsService.validatePhoneNumber(phone);
    if (!phoneValidation.valid) {
      return res.status(400).json({
        success: false,
        message: phoneValidation.error
      });
    }

    const user = await User.findOne({ phone: phoneValidation.formatted });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isPhoneVerified) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is already verified'
      });
    }

    // Check rate limiting (max 5 total attempts per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (user.phoneVerificationAttempts >= 5 && user.phoneVerificationExpires > oneHourAgo) {
      return res.status(429).json({
        success: false,
        message: 'Maximum verification attempts reached. Please try again later.'
      });
    }

    // Reset attempts if it's been more than an hour
    if (user.phoneVerificationExpires <= oneHourAgo) {
      user.phoneVerificationAttempts = 0;
    }

    // Generate new verification code
    const code = user.generatePhoneVerificationCode();
    await user.save();

    // Send SMS
    await smsService.resendVerificationCode(user.phone, code, user.preferredLanguage);

    res.status(200).json({
      success: true,
      message: 'New verification code sent successfully',
      expiresIn: '10 minutes'
    });

  } catch (error) {
    console.error('Resend phone verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification code',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get verification status
export const getVerificationStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('email phone isEmailVerified isPhoneVerified isVerified');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      verification: {
        email: user.email,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
