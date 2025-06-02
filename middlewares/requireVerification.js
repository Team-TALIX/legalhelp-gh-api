import User from '../models/User.js';

// Middleware to require email verification
export const requireEmailVerification = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Anonymous users are exempt from verification requirements
    if (req.user.isAnonymous) {
      return next();
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isEmailVerified && user.email) {
      return res.status(403).json({
        success: false,
        message: 'Email verification required',
        code: 'EMAIL_VERIFICATION_REQUIRED',
        verificationRequired: {
          type: 'email',
          email: user.email
        }
      });
    }

    next();
  } catch (error) {
    console.error('Email verification middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Middleware to require phone verification
export const requirePhoneVerification = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Anonymous users are exempt from verification requirements
    if (req.user.isAnonymous) {
      return next();
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isPhoneVerified && user.phone) {
      return res.status(403).json({
        success: false,
        message: 'Phone verification required',
        code: 'PHONE_VERIFICATION_REQUIRED',
        verificationRequired: {
          type: 'phone',
          phone: user.phone.replace(/(\+233\d{2})\d{3}(\d{4})/, '$1***$2') // Mask phone number
        }
      });
    }

    next();
  } catch (error) {
    console.error('Phone verification middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Middleware to require any verification (email OR phone)
export const requireAnyVerification = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Anonymous users are exempt from verification requirements
    if (req.user.isAnonymous) {
      return next();
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isVerified) {
      const verificationOptions = [];

      if (user.email) {
        verificationOptions.push({
          type: 'email',
          email: user.email,
          verified: user.isEmailVerified
        });
      }

      if (user.phone) {
        verificationOptions.push({
          type: 'phone',
          phone: user.phone.replace(/(\+233\d{2})\d{3}(\d{4})/, '$1***$2'),
          verified: user.isPhoneVerified
        });
      }

      return res.status(403).json({
        success: false,
        message: 'Account verification required',
        code: 'VERIFICATION_REQUIRED',
        verificationRequired: {
          options: verificationOptions
        }
      });
    }

    next();
  } catch (error) {
    console.error('Verification middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Middleware to require verification for sensitive actions (both email AND phone if both exist)
export const requireFullVerification = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Anonymous users are exempt from verification requirements
    if (req.user.isAnonymous) {
      return next();
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const missingVerifications = [];

    if (user.email && !user.isEmailVerified) {
      missingVerifications.push({
        type: 'email',
        email: user.email
      });
    }

    if (user.phone && !user.isPhoneVerified) {
      missingVerifications.push({
        type: 'phone',
        phone: user.phone.replace(/(\+233\d{2})\d{3}(\d{4})/, '$1***$2')
      });
    }

    if (missingVerifications.length > 0) {
      return res.status(403).json({
        success: false,
        message: 'Full account verification required for this action',
        code: 'FULL_VERIFICATION_REQUIRED',
        verificationRequired: {
          missing: missingVerifications
        }
      });
    }

    next();
  } catch (error) {
    console.error('Full verification middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Optional verification check (doesn't block, just adds verification info to request)
export const checkVerificationStatus = async (req, res, next) => {
  try {
    if (req.user && !req.user.isAnonymous) {
      const user = await User.findById(req.user.id).select('isEmailVerified isPhoneVerified isVerified email phone');

      if (user) {
        req.verificationStatus = {
          isVerified: user.isVerified,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          hasEmail: !!user.email,
          hasPhone: !!user.phone
        };
      }
    }

    next();
  } catch (error) {
    console.error('Verification status check error:', error);
    // Continue without blocking if verification check fails
    next();
  }
};
