import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN, FRONTEND_URL } from '../utils/config.js';

// Utility to generate tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign({ id: user._id, email: user.email, isAnonymous: user.isAnonymous }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ id: user._id }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
  return { accessToken, refreshToken };
};

// POST /api/auth/register
export const registerUser = async (req, res, next) => {
  const { email, phone, password, preferredLanguage, isAnonymous, profile } = req.body;

  try {
    // Basic validation (more comprehensive validation should be in a middleware)
    if (!isAnonymous && ((!email && !phone) || !password)) {
      return res.status(400).json({ message: 'Either email or phone, and a password are required for registered users.' });
    }
    if (isAnonymous && !preferredLanguage) {
        // For anonymous users, we might auto-generate an identifier or rely on client-side session
        // For now, let's assume an anonymous user is created in DB for consistency
        // return res.status(400).json({ message: 'Preferred language is required for anonymous users.'});
    }

    let user;
    if (isAnonymous) {
      user = new User({
        isAnonymous: true,
        preferredLanguage: preferredLanguage || 'en', // Default to English if not provided
        profile: profile || {},
        // Anonymous users might not have email/phone initially
      });
    } else {
      const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email or phone.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = new User({
        email,
        phone,
        password: hashedPassword,
        preferredLanguage: preferredLanguage || 'en',
        isAnonymous: false,
        profile: profile || {},
      });
    }

    await user.save();
    const { accessToken, refreshToken } = generateTokens(user);

    res.status(201).json({
      message: isAnonymous ? 'Anonymous user session initiated' : 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        isAnonymous: user.isAnonymous,
        preferredLanguage: user.preferredLanguage,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user || user.isAnonymous) { // Anonymous users don't login with password
      return res.status(401).json({ message: 'Invalid credentials or user not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        isAnonymous: user.isAnonymous,
        preferredLanguage: user.preferredLanguage,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh
export const refreshAuthToken = async (req, res, next) => {
  const { refreshToken: providedRefreshToken } = req.body;

  if (!providedRefreshToken) {
    return res.status(401).json({ message: 'Refresh token is required.' });
  }

  try {
    const decoded = jwt.verify(providedRefreshToken, JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token or user not found.' });
    }

    // Optional: Check if refresh token is revoked or still valid in a blacklist/whitelist

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    res.status(200).json({
      message: 'Token refreshed successfully',
      accessToken,
      refreshToken: newRefreshToken, // Issue a new refresh token (optional, good practice for security)
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: 'Invalid or expired refresh token.' });
    }
    next(error);
  }
};

// POST /api/auth/logout
export const logoutUser = async (req, res, next) => {
  // For stateless JWT, logout is primarily client-side (deleting the token).
  // Server-side logout might involve:
  // 1. Adding the token to a blacklist (if using refresh tokens that are stored or tracked).
  // 2. If session management is involved with JWT (less common), clearing server session.

  // Assuming req.user is populated by authenticateToken middleware
  const userId = req.user?.id;

  // Placeholder: If you have a refresh token whitelist/blacklist, you'd update it here.
  // e.g., await RefreshTokenModel.deleteOne({ userId, token: req.body.refreshToken });

  res.status(200).json({ message: 'Logout successful. Please clear your tokens client-side.' });
  // No error handling needed here unless there's a specific server-side action that can fail
};

// GET /api/auth/google/callback
export const googleOAuthCallback = (req, res) => {
  // Successful authentication, req.user should be populated by Passport strategy
  if (!req.user) {
    // This case should ideally be handled by the failureRedirect or an error in the strategy
    // Redirect to a frontend failure page or login page with an error message
    return res.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
  }

  const payload = {
    id: req.user.id,
    role: req.user.role,
    isAnonymous: req.user.isAnonymous,
    // Add any other user details you want in the JWT payload from req.user
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  // Redirect to a frontend route that can handle the token and user data.
  res.redirect(`${FRONTEND_URL}/auth/google/callback?token=${token}`);
};

// Example for a protected route controller function (if you add /me route)
// export const getAuthenticatedUserProfile = async (req, res, next) => {
//   try {
//     // req.user should be populated by authenticateToken middleware
//     if (!req.user || !req.user.id) {
//       return res.status(401).json({ message: 'Not authenticated' });
//     }
//     const user = await User.findById(req.user.id).select('-password'); // Exclude password
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
//     res.status(200).json(user);
//   } catch (error) {
//     next(error);
//   }
// };
