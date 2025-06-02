import express from "express";
import { authenticateToken } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/roleAuth.js";
import * as adminController from "../controllers/admin.js";

const router = express.Router();

// All admin routes require authentication and admin role first
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard and analytics
router.get("/admin/dashboard/stats", adminController.getDashboardStats);
router.get("/admin/analytics/users", adminController.getUserAnalytics);
router.get("/admin/analytics/usage", adminController.getUsageAnalytics);
router.get("/admin/analytics/content", adminController.getContentAnalytics);

// User management
router.get("/admin/users", adminController.getAllUsers);
router.put("/admin/users/:userId/role", adminController.updateUserRole);
router.delete("/admin/users/:userId", adminController.deleteUser);

// Content management (LegalContent)
router.get("/admin/content/pending", adminController.getPendingContent);
router.put("/admin/content/:contentId/approve", adminController.approveContent);
router.delete("/admin/content/:contentId", adminController.deleteContent);

// Community moderation (CommunityStory)
router.get("/admin/stories/pending", adminController.getPendingStories);
router.put("/admin/stories/:storyId/moderate", adminController.moderateStory);

// System management
router.get("/admin/system/health", adminController.getSystemHealth);
router.post("/admin/system/backup", adminController.createBackup);

// Bulk operations
router.put("/admin/users/bulk-update", adminController.bulkUpdateUsers);
router.put("/admin/stories/bulk-moderate", adminController.bulkModerateStories);

// Export endpoints
router.get("/admin/export/users", adminController.exportUsers);
router.get("/admin/export/analytics", adminController.exportAnalytics);

// Notifications
router.get("/admin/notifications", adminController.getNotifications);
router.put(
  "/admin/notifications/:notificationId/read",
  adminController.markNotificationRead
);

export default router;
