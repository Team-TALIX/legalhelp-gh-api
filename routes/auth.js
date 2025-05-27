import express from 'express';
import {
  registerUser,
  loginUser,
  refreshAuthToken,
  logoutUser,
  googleOAuthCallback, // Import the new controller function
  // getAuthenticatedUserProfile // Example of a protected route
} from '../controllers/auth.js';
import { authenticateToken } from '../middlewares/auth.js'; // For protected routes
// import { validateRegistration, validateLogin } from '../validators/auth.js'; // Example for input validation
import passport from '../utils/passport-setup.js'; // Corrected path
import { FRONTEND_URL } from '../utils/config.js';

const router = express.Router();

// @route   POST /api/v1/auth/register
// @desc    Register a new user
// @access  Public
router.post('/auth/register', /* validateRegistration, */ registerUser);

// @route   POST /api/v1/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/auth/login', /* validateLogin, */ loginUser);

// @route   POST /api/v1/auth/refresh
// @desc    Refresh access token
// @access  Public (or Private, depending on strategy - needs a valid refresh token)
// For simplicity, making it public now, but usually needs some form of existing token
router.post('/auth/refresh', refreshAuthToken);

// @route   POST /api/v1/auth/logout
// @desc    Logout user (e.g., invalidate refresh token if stored server-side)
// @access  Private (typically requires authentication to know WHO is logging out)
// If JWTs are stateless on server, logout is client-side. Server might blacklist token if needed.
router.post('/auth/logout', authenticateToken, logoutUser); // Made private, requires auth

// @route   GET /api/v1/auth/google
// @desc    Initiate Google OAuth 2.0 authentication
// @access  Public
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @route   GET /api/v1/auth/google/callback
// @desc    Google OAuth 2.0 callback route
// @access  Public
router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login?error=google_auth_failed`, session: false }), // Use FRONTEND_URL for failure redirect
  googleOAuthCallback // Use the controller function here
);

// Example of a protected route that requires authentication:
// @route   GET /api/auth/me
// @desc    Get current authenticated user's profile
// @access  Private
// router.get('/me', authenticateToken, getAuthenticatedUserProfile);

export default router;
