import express from "express";
import { authenticateToken, optionalAuth } from "../middlewares/auth.js";
import { trackUsage } from "../middlewares/usageTracking.js";
import { requireAnyVerification } from "../middlewares/requireVerification.js";
import { chatRateLimit } from "../middlewares/rateLimit.js";
import { validate } from "../middlewares/validation.js";
import {
  createSession,
  processQuery,
  getChatHistory,
  submitFeedback,
  deleteSession,
  updateSession,
  getUserSessions,
} from "../controllers/chat.js";
import {
  createSessionSchema,
  chatQuerySchema,
  chatHistorySchema,
  chatFeedbackSchema,
  deleteSessionSchema,
  updateSessionSchema,
  sessionIdParamsSchema,
} from "../validators/chat.js";

const router = express.Router();

// Chat session management routes
router.post(
  "/chat/sessions",
  optionalAuth, // Allow both authenticated and anonymous users
  chatRateLimit,
  validate(createSessionSchema), //validate req.body
  createSession
);

router.get("/chat/sessions", authenticateToken, chatRateLimit, getUserSessions);

router.get(
  "/chat/sessions/:sessionId/history",
  optionalAuth,
  chatRateLimit,
  validate(sessionIdParamsSchema, "params"), // Validate sessionId from req.params
  validate(chatHistorySchema, "query"), // Validates req.query for pagination (limit, offset)
  getChatHistory
);

router.put(
  "/chat/sessions/:sessionId",
  optionalAuth,
  chatRateLimit,
  validate(sessionIdParamsSchema, "params"), // Validate sessionId from req.params
  validate(updateSessionSchema), // Validates req.body (context, active)
  updateSession
);

router.delete(
  "/chat/sessions/:sessionId",
  optionalAuth,
  chatRateLimit,
  validate(sessionIdParamsSchema, "params"), // Validate sessionId from req.params
  validate(deleteSessionSchema), // Validates req.body (confirmDelete)
  deleteSession
);

// Core chat functionality
router.post(
  "/chat/query",
  optionalAuth,
  requireAnyVerification,
  chatRateLimit,
  trackUsage("query"),
  validate(chatQuerySchema),
  processQuery
);

// Feedback system
router.post(
  "/chat/feedback",
  optionalAuth,
  chatRateLimit,
  validate(chatFeedbackSchema),
  submitFeedback
);

export default router;
