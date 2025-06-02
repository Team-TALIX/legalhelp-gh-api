import express from "express";
import * as verificationController from "../controllers/verification.js";
import { authenticateToken } from "../middlewares/auth.js";
import { verificationRateLimit } from "../middlewares/rateLimit.js";
import {
  sendEmailVerificationValidation,
  verifyEmailValidation,
  sendPhoneVerificationValidation,
  verifyPhoneValidation,
  resendPhoneVerificationValidation,
} from "../validators/verification.js";

const router = express.Router();

// Routes with proper validation from validators

// Send email verification
router.post(
  "/verification/email/send",
  verificationRateLimit,
  sendEmailVerificationValidation,
  verificationController.sendEmailVerification
);

// Verify email
router.post(
  "/verification/email/verify",
  verifyEmailValidation,
  verificationController.verifyEmail
);

// Send phone verification code
router.post(
  "/verification/phone/send",
  verificationRateLimit,
  sendPhoneVerificationValidation,
  verificationController.sendPhoneVerification
);

// Verify phone
router.post(
  "/verification/phone/verify",
  verifyPhoneValidation,
  verificationController.verifyPhone
);

// Resend phone verification code
router.post(
  "/verification/phone/resend",
  verificationRateLimit,
  resendPhoneVerificationValidation,
  verificationController.resendPhoneVerification
);

// Get verification status (authenticated route)
router.get(
  "/verification/status",
  authenticateToken,
  verificationController.getVerificationStatus
);

export default router;
