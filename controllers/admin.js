import mongoose from "mongoose";
import Analytics from "../models/Analytics.js";
import User from "../models/User.js";
import LegalContent from "../models/LegalContent.js";
import CommunityStory from "../models/CommunityStory.js";
import {
  getRedisClient,
  setCache,
  getCache,
  pingRedis,
} from "../utils/redis.js";
import {
  getDateRange,
  getDateRangeWithEnd,
  isValidObjectId,
  createResponse,
  getPagination,
} from "../utils/helpers.js";

// Cache keys
const CACHE_KEYS = {
  DASHBOARD_STATS: "admin:dashboard:stats",
  USER_ANALYTICS: (period) => `admin:analytics:users:${period}`,
  USAGE_ANALYTICS: (period) => `admin:analytics:usage:${period}`,
  CONTENT_ANALYTICS: (period) => `admin:analytics:content:${period}`,
  SYSTEM_HEALTH: "admin:system:health",
};

// Cache TTL (Time To Live) in seconds
const CACHE_TTL = {
  DASHBOARD_STATS: 300, // 5 minutes
  ANALYTICS: 900, // 15 minutes
  SYSTEM_HEALTH: 60, // 1 minute
};

export const getDashboardStats = async (req, res) => {
  try {
    // Try to get cached stats first
    const cachedStats = await getCache(CACHE_KEYS.DASHBOARD_STATS);
    if (cachedStats) {
      return res.json(
        createResponse(
          true,
          "Dashboard stats retrieved from cache",
          cachedStats
        )
      );
    }

    const today = new Date();
    const { startDate: thirtyDaysAgoStart } = getDateRangeWithEnd("30d");

    // Use Promise.all for parallel execution to improve performance
    const [
      totalUsers,
      activeUsers,
      userRoleBreakdown,
      legalTopics,
      communityStories,
      pendingModerationStories,
      usageMetricsAgg,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({
        "usage.lastActive": { $gte: thirtyDaysAgoStart },
      }),
      User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } },
        { $project: { _id: 0, role: "$_id", count: 1 } },
      ]),
      LegalContent.countDocuments(),
      CommunityStory.countDocuments(),
      CommunityStory.countDocuments({
        status: "pending",
      }),
      Analytics.aggregate([
        { $match: { date: { $gte: thirtyDaysAgoStart, $lte: today } } },
        {
          $group: {
            _id: null,
            totalQueries: { $sum: "$metrics.totalQueries" },
            totalVoiceQueries: { $sum: "$metrics.voiceQueries" },
            totalTextQueries: { $sum: "$metrics.textQueries" },
          },
        },
        {
          $project: {
            _id: 0,
            totalQueries: { $ifNull: ["$totalQueries", 0] },
            totalVoiceQueries: { $ifNull: ["$totalVoiceQueries", 0] },
            totalTextQueries: { $ifNull: ["$totalTextQueries", 0] },
          },
        },
      ]),
    ]);

    // Process user role breakdown
    const usersByRole = userRoleBreakdown.reduce(
      (acc, item) => {
        acc[item.role] = item.count;
        return acc;
      },
      { user: 0, paid_user: 0, admin: 0 }
    );

    // Process usage metrics
    const currentUsageMetrics = usageMetricsAgg[0] || {
      totalQueries: 0,
      totalVoiceQueries: 0,
      totalTextQueries: 0,
    };

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        byRole: usersByRole,
      },
      content: {
        legalTopics: legalTopics,
        communityStories: communityStories,
        pendingModeration: pendingModerationStories,
      },
      usage: currentUsageMetrics,
      lastUpdated: new Date().toISOString(),
    };

    // Cache the results
    await setCache(
      CACHE_KEYS.DASHBOARD_STATS,
      stats,
      CACHE_TTL.DASHBOARD_STATS
    );

    res.json(
      createResponse(true, "Dashboard stats retrieved successfully", stats)
    );
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json(
      createResponse(false, "Failed to fetch dashboard stats", null, {
        error: error.message,
      })
    );
  }
};

export const getUserAnalytics = async (req, res) => {
  try {
    const { period = "30d" } = req.query;
    const cacheKey = CACHE_KEYS.USER_ANALYTICS(period);

    // Try cache first
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json(
        createResponse(true, "User analytics retrieved from cache", cachedData)
      );
    }

    const startDate = getDateRange(period);
    const analytics = await Analytics.find({
      date: { $gte: startDate },
    })
      .select(
        "date metrics.totalUsers metrics.activeUsers metrics.newRegistrations metrics.userRoleBreakdown"
      )
      .sort({ date: 1 })
      .lean(); // Use lean() for better performance

    // Cache the results
    await setCache(cacheKey, analytics, CACHE_TTL.ANALYTICS);

    res.json(
      createResponse(true, "User analytics retrieved successfully", analytics, {
        period,
        totalRecords: analytics.length,
      })
    );
  } catch (error) {
    console.error("Error fetching user analytics:", error);
    res.status(500).json(
      createResponse(false, "Failed to fetch user analytics", null, {
        error: error.message,
      })
    );
  }
};

export const getUsageAnalytics = async (req, res) => {
  try {
    const { period = "30d" } = req.query;
    const cacheKey = CACHE_KEYS.USAGE_ANALYTICS(period);

    // Try cache first
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json(
        createResponse(true, "Usage analytics retrieved from cache", cachedData)
      );
    }

    const startDate = getDateRange(period);
    const usageData = await Analytics.find({
      date: { $gte: startDate },
    })
      .select(
        "date metrics.totalQueries metrics.voiceQueries metrics.textQueries metrics.languageBreakdown"
      )
      .sort({ date: 1 })
      .lean();

    // Cache the results
    await setCache(cacheKey, usageData, CACHE_TTL.ANALYTICS);

    res.json(
      createResponse(
        true,
        "Usage analytics retrieved successfully",
        usageData,
        {
          period,
          totalRecords: usageData.length,
        }
      )
    );
  } catch (error) {
    console.error("Error fetching usage analytics:", error);
    res.status(500).json(
      createResponse(false, "Failed to fetch usage analytics", null, {
        error: error.message,
      })
    );
  }
};

export const getContentAnalytics = async (req, res) => {
  try {
    const { period = "30d" } = req.query;
    const cacheKey = CACHE_KEYS.CONTENT_ANALYTICS(period);

    // Try cache first
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json(
        createResponse(
          true,
          "Content analytics retrieved from cache",
          cachedData
        )
      );
    }

    const startDate = getDateRange(period);
    const contentData = await Analytics.find({
      date: { $gte: startDate },
    })
      .select("date metrics.topLegalTopics")
      .sort({ date: 1 })
      .lean();

    // Cache the results
    await setCache(cacheKey, contentData, CACHE_TTL.ANALYTICS);

    res.json(
      createResponse(
        true,
        "Content analytics retrieved successfully",
        contentData,
        {
          period,
          totalRecords: contentData.length,
        }
      )
    );
  } catch (error) {
    console.error("Error fetching content analytics:", error);
    res.status(500).json(
      createResponse(false, "Failed to fetch content analytics", null, {
        error: error.message,
      })
    );
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const {
      skip,
      limit: pageLimit,
      page: currentPage,
    } = getPagination(page, limit);

    // Build query
    const query = {};
    if (role && ["user", "paid_user", "admin"].includes(role)) {
      query.role = role;
    }
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { "profile.name": { $regex: search, $options: "i" } },
        { "googleProfile.name": { $regex: search, $options: "i" } },
        { "googleProfile.email": { $regex: search, $options: "i" } },
      ];
    }

    const [users, totalCount] = await Promise.all([
      User.find(query)
        .select("-password -googleId -verification")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .lean(),
      User.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / pageLimit);

    res.json(
      createResponse(true, "Users retrieved successfully", users, {
        pagination: {
          currentPage,
          totalPages,
          totalCount,
          limit: pageLimit,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1,
        },
      })
    );
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(500).json(
      createResponse(false, "Failed to fetch users", null, {
        error: error.message,
      })
    );
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, permissions } = req.body;

    // Validate inputs
    if (!userId || !role) {
      return res
        .status(400)
        .json(createResponse(false, "User ID and role are required"));
    }

    if (!isValidObjectId(userId)) {
      return res
        .status(400)
        .json(createResponse(false, "Invalid user ID format"));
    }

    if (!["user", "paid_user", "admin"].includes(role)) {
      return res
        .status(400)
        .json(createResponse(false, "Invalid role specified"));
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        role,
        permissions: permissions || {},
      },
      { new: true, runValidators: true }
    ).select("-password -googleId -verification");

    if (!user) {
      return res.status(404).json(createResponse(false, "User not found"));
    }

    res.json(createResponse(true, "User role updated successfully", user));
  } catch (error) {
    console.error("Error updating user role:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json(createResponse(false, error.message));
    }
    res.status(500).json(
      createResponse(false, "Failed to update user role", null, {
        error: error.message,
      })
    );
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json(createResponse(false, "User ID is required"));
    }

    if (!isValidObjectId(userId)) {
      return res
        .status(400)
        .json(createResponse(false, "Invalid user ID format"));
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json(createResponse(false, "User not found"));
    }

    // TODO: Consider soft delete or cleanup of related data (chat sessions, stories, etc.)
    // This could be implemented as a background job for better performance

    res.json(
      createResponse(true, "User deleted successfully", { userId: user._id })
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json(
      createResponse(false, "Failed to delete user", null, {
        error: error.message,
      })
    );
  }
};

export const getPendingContent = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const {
      skip,
      limit: pageLimit,
      page: currentPage,
    } = getPagination(page, limit);

    // Note: This assumes LegalContent model has a 'status' field
    // If not present, this endpoint will return empty results
    const [pendingContent, totalCount] = await Promise.all([
      LegalContent.find({ status: "pending" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .lean(),
      LegalContent.countDocuments({ status: "pending" }),
    ]);

    const totalPages = Math.ceil(totalCount / pageLimit);

    res.json(
      createResponse(
        true,
        "Pending content retrieved successfully",
        pendingContent,
        {
          pagination: {
            currentPage,
            totalPages,
            totalCount,
            limit: pageLimit,
          },
        }
      )
    );
  } catch (error) {
    console.error("Error fetching pending content:", error);
    res
      .status(500)
      .json(
        createResponse(
          false,
          'Failed to fetch pending content. Ensure LegalContent model has a "status" field.',
          null,
          { error: error.message }
        )
      );
  }
};

export const approveContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { reason } = req.body;

    if (!isValidObjectId(contentId)) {
      return res
        .status(400)
        .json(createResponse(false, "Invalid content ID format"));
    }

    // Note: This assumes LegalContent model has moderation fields
    const content = await LegalContent.findByIdAndUpdate(
      contentId,
      {
        status: "approved",
        moderationReason: reason || "Approved by admin via admin panel",
        moderatedBy: req.user.id,
        moderatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!content) {
      return res
        .status(404)
        .json(createResponse(false, "Legal content not found"));
    }

    res.json(
      createResponse(true, "Legal content approved successfully", content)
    );
  } catch (error) {
    console.error("Error approving content:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json(createResponse(false, error.message));
    }
    res
      .status(500)
      .json(
        createResponse(
          false,
          "Failed to approve content. Ensure LegalContent model has necessary moderation fields.",
          null,
          { error: error.message }
        )
      );
  }
};

export const deleteContent = async (req, res) => {
  try {
    const { contentId } = req.params;

    if (!contentId) {
      return res
        .status(400)
        .json(createResponse(false, "Content ID is required"));
    }

    if (!isValidObjectId(contentId)) {
      return res
        .status(400)
        .json(createResponse(false, "Invalid content ID format"));
    }

    const content = await LegalContent.findByIdAndDelete(contentId);
    if (!content) {
      return res
        .status(404)
        .json(createResponse(false, "Legal content not found"));
    }

    res.json(
      createResponse(true, "Legal content deleted successfully", {
        contentId: content._id,
      })
    );
  } catch (error) {
    console.error("Error deleting content:", error);
    res.status(500).json(
      createResponse(false, "Failed to delete legal content", null, {
        error: error.message,
      })
    );
  }
};

export const getPendingStories = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const {
      skip,
      limit: pageLimit,
      page: currentPage,
    } = getPagination(page, limit);

    const [pendingStories, totalCount] = await Promise.all([
      CommunityStory.find({
        status: "pending_review",
      })
        .populate(
          "userId",
          "profile.name email googleProfile.name googleProfile.email"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .lean(),
      CommunityStory.countDocuments({ status: "pending_review" }),
    ]);

    const totalPages = Math.ceil(totalCount / pageLimit);

    res.json(
      createResponse(
        true,
        "Pending stories retrieved successfully",
        pendingStories,
        {
          pagination: {
            currentPage,
            totalPages,
            totalCount,
            limit: pageLimit,
          },
        }
      )
    );
  } catch (error) {
    console.error("Error fetching pending stories:", error);
    res.status(500).json(
      createResponse(false, "Failed to fetch pending stories", null, {
        error: error.message,
      })
    );
  }
};

export const moderateStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { action, reason } = req.body;

    if (!storyId || !action) {
      return res
        .status(400)
        .json(createResponse(false, "Story ID and action are required"));
    }

    if (!isValidObjectId(storyId)) {
      return res
        .status(400)
        .json(createResponse(false, "Invalid story ID format"));
    }

    if (!["approved", "rejected"].includes(action)) {
      return res
        .status(400)
        .json(
          createResponse(
            false,
            'Invalid action. Must be "approved" or "rejected"'
          )
        );
    }

    const story = await CommunityStory.findByIdAndUpdate(
      storyId,
      {
        status: action,
        moderationNotes: reason || "",
        moderatedBy: req.user.id,
        moderatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!story) {
      return res
        .status(404)
        .json(createResponse(false, "Community story not found"));
    }

    res.json(createResponse(true, `Story successfully ${action}`, story));
  } catch (error) {
    console.error("Error moderating story:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json(createResponse(false, error.message));
    }
    res.status(500).json(
      createResponse(false, "Failed to moderate story", null, {
        error: error.message,
      })
    );
  }
};

export const getSystemHealth = async (req, res) => {
  try {
    // Try to get cached health status
    const cachedHealth = await getCache(CACHE_KEYS.SYSTEM_HEALTH);
    if (cachedHealth) {
      return res.json(
        createResponse(true, "System health retrieved from cache", cachedHealth)
      );
    }

    const healthStatus = {
      timestamp: new Date().toISOString(),
      database: { status: "unknown", message: "" },
      redis: { status: "unknown", message: "" },
    };

    // Check MongoDB connection
    try {
      const dbState = mongoose.connection.readyState;
      const dbStates = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting",
      };
      healthStatus.database.status = dbStates[dbState] || "unknown state";
      healthStatus.database.message = `Database is ${healthStatus.database.status}. Ready state: ${dbState}`;

      if (dbState !== 1) {
        throw new Error(`Database not connected. State: ${dbState}`);
      }
    } catch (error) {
      healthStatus.database.status = "error";
      healthStatus.database.message =
        error.message || "Failed to get database status.";
      console.error("Database health check error:", error);
    }

    // Check Redis connection
    try {
      const pong = await pingRedis();
      if (pong === "PONG") {
        healthStatus.redis.status = "connected";
        healthStatus.redis.message = "Redis connection healthy.";
      } else if (pong === null) {
        healthStatus.redis.status = "not_available";
        healthStatus.redis.message =
          "Redis client not available or not configured.";
      } else {
        throw new Error(`Redis ping returned unexpected response: ${pong}`);
      }
    } catch (error) {
      healthStatus.redis.status = "error";
      healthStatus.redis.message = error.message || "Failed to ping Redis.";
      console.error("Redis health check error:", error);
    }

    const isOverallHealthy =
      healthStatus.database.status === "connected" &&
      (healthStatus.redis.status === "connected" ||
        healthStatus.redis.status === "not_available");

    // Cache the health status
    await setCache(
      CACHE_KEYS.SYSTEM_HEALTH,
      healthStatus,
      CACHE_TTL.SYSTEM_HEALTH
    );

    res
      .status(isOverallHealthy ? 200 : 503)
      .json(
        createResponse(
          isOverallHealthy,
          isOverallHealthy ? "System is healthy" : "System has issues",
          healthStatus
        )
      );
  } catch (error) {
    console.error("Error checking system health:", error);
    res.status(500).json(
      createResponse(false, "Failed to check system health", null, {
        error: error.message,
      })
    );
  }
};

export const createBackup = async (req, res) => {
  try {
    const timestamp = new Date();
    const adminUserId = req.user ? req.user.id : "UnknownAdmin";

    console.log(
      `[INFO] Backup request initiated by admin (${adminUserId}) at ${timestamp.toISOString()}`
    );

    // In a production system, this would trigger an actual backup process
    // Consider implementing:
    // 1. Database backup (mongodump)
    // 2. File system backup
    // 3. Cloud provider snapshots
    // 4. Backup verification
    // 5. Backup scheduling and rotation

    res.status(202).json(
      createResponse(
        true,
        "Backup request acknowledged by the system",
        {
          requestedBy: adminUserId,
          requestedAt: timestamp.toISOString(),
          status: "acknowledged",
        },
        {
          note: "This endpoint logs the backup request. A separate, automated and robust backup mechanism should be implemented for production data safety.",
        }
      )
    );
  } catch (error) {
    console.error("Error processing backup request:", error);
    res.status(500).json(
      createResponse(false, "Failed to process backup request", null, {
        error: error.message,
      })
    );
  }
};

// Bulk Operations
export const bulkUpdateUsers = async (req, res) => {
  try {
    const { userIds, updates } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res
        .status(400)
        .json(createResponse(false, "User IDs array is required"));
    }

    if (!updates || typeof updates !== "object") {
      return res
        .status(400)
        .json(createResponse(false, "Updates object is required"));
    }

    // Validate all user IDs
    const invalidIds = userIds.filter((id) => !isValidObjectId(id));
    if (invalidIds.length > 0) {
      return res
        .status(400)
        .json(
          createResponse(false, `Invalid user IDs: ${invalidIds.join(", ")}`)
        );
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: updates },
      { runValidators: true }
    );

    res.json(
      createResponse(true, "Users updated successfully", {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        updatedUserIds: userIds,
        updates,
      })
    );
  } catch (error) {
    console.error("Error bulk updating users:", error);
    res.status(500).json(
      createResponse(false, "Failed to bulk update users", null, {
        error: error.message,
      })
    );
  }
};

export const bulkModerateStories = async (req, res) => {
  try {
    const { storyIds, action, reason } = req.body;

    if (!storyIds || !Array.isArray(storyIds) || storyIds.length === 0) {
      return res
        .status(400)
        .json(createResponse(false, "Story IDs array is required"));
    }

    if (!action || !["approved", "rejected"].includes(action)) {
      return res
        .status(400)
        .json(createResponse(false, 'Action must be "approved" or "rejected"'));
    }

    // Validate all story IDs
    const invalidIds = storyIds.filter((id) => !isValidObjectId(id));
    if (invalidIds.length > 0) {
      return res
        .status(400)
        .json(
          createResponse(false, `Invalid story IDs: ${invalidIds.join(", ")}`)
        );
    }

    const result = await CommunityStory.updateMany(
      { _id: { $in: storyIds } },
      {
        $set: {
          status: action,
          moderationNotes: reason || "",
          moderatedBy: req.user.id,
          moderatedAt: new Date(),
        },
      }
    );

    res.json(
      createResponse(true, `Stories bulk ${action} successfully`, {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        action,
        moderatedStoryIds: storyIds,
      })
    );
  } catch (error) {
    console.error("Error bulk moderating stories:", error);
    res.status(500).json(
      createResponse(false, "Failed to bulk moderate stories", null, {
        error: error.message,
      })
    );
  }
};

// Export Functions
export const exportUsers = async (req, res) => {
  try {
    const { format = "csv", role, startDate, endDate } = req.query;

    const query = {};
    if (role && ["user", "paid_user", "admin"].includes(role)) {
      query.role = role;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const users = await User.find(query)
      .select(
        "-password -googleId -emailVerificationToken -phoneVerificationCode"
      )
      .lean();

    if (format === "csv") {
      const csv = convertToCSV(users, [
        { key: "_id", label: "ID" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "role", label: "Role" },
        { key: "isEmailVerified", label: "Email Verified" },
        { key: "isPhoneVerified", label: "Phone Verified" },
        { key: "preferredLanguage", label: "Preferred Language" },
        { key: "usage.totalQueries", label: "Total Queries" },
        { key: "createdAt", label: "Created At" },
        { key: "usage.lastActive", label: "Last Active" },
      ]);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=users-export-${
          new Date().toISOString().split("T")[0]
        }.csv`
      );
      return res.send(csv);
    }

    res.json(createResponse(true, "Users exported successfully", users));
  } catch (error) {
    console.error("Error exporting users:", error);
    res.status(500).json(
      createResponse(false, "Failed to export users", null, {
        error: error.message,
      })
    );
  }
};

export const exportAnalytics = async (req, res) => {
  try {
    const { format = "csv", period = "30d" } = req.query;
    const startDate = getDateRange(period);

    const analytics = await Analytics.find({
      date: { $gte: startDate },
    })
      .sort({ date: 1 })
      .lean();

    if (format === "csv") {
      const csv = convertToCSV(analytics, [
        { key: "date", label: "Date" },
        { key: "metrics.totalUsers", label: "Total Users" },
        { key: "metrics.activeUsers", label: "Active Users" },
        { key: "metrics.newRegistrations", label: "New Registrations" },
        { key: "metrics.totalQueries", label: "Total Queries" },
        { key: "metrics.voiceQueries", label: "Voice Queries" },
        { key: "metrics.textQueries", label: "Text Queries" },
        { key: "metrics.languageBreakdown.twi", label: "Twi Queries" },
        { key: "metrics.languageBreakdown.ewe", label: "Ewe Queries" },
        { key: "metrics.languageBreakdown.dagbani", label: "Dagbani Queries" },
        { key: "metrics.languageBreakdown.english", label: "English Queries" },
      ]);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=analytics-export-${
          new Date().toISOString().split("T")[0]
        }.csv`
      );
      return res.send(csv);
    }

    res.json(
      createResponse(true, "Analytics exported successfully", analytics)
    );
  } catch (error) {
    console.error("Error exporting analytics:", error);
    res.status(500).json(
      createResponse(false, "Failed to export analytics", null, {
        error: error.message,
      })
    );
  }
};

// Notifications
export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const {
      skip,
      limit: pageLimit,
      page: currentPage,
    } = getPagination(page, limit);

    // Mock notifications for now - in production, these would come from a Notifications model
    const mockNotifications = [
      {
        id: "1",
        type: "user_registration",
        title: "New User Registration",
        message: "5 new users registered in the last hour",
        timestamp: new Date(),
        isRead: false,
        severity: "info",
      },
      {
        id: "2",
        type: "content_pending",
        title: "Content Pending Review",
        message: "3 legal content articles are waiting for approval",
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        isRead: false,
        severity: "warning",
      },
      {
        id: "3",
        type: "system_health",
        title: "System Health Alert",
        message: "Database response time increased by 15%",
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        isRead: true,
        severity: "warning",
      },
    ];

    const filteredNotifications =
      unreadOnly === "true"
        ? mockNotifications.filter((n) => !n.isRead)
        : mockNotifications;

    const total = filteredNotifications.length;
    const notifications = filteredNotifications.slice(skip, skip + pageLimit);

    res.json(
      createResponse(
        true,
        "Notifications retrieved successfully",
        notifications,
        {
          pagination: {
            currentPage,
            totalPages: Math.ceil(total / pageLimit),
            totalCount: total,
            limit: pageLimit,
          },
        }
      )
    );
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json(
      createResponse(false, "Failed to fetch notifications", null, {
        error: error.message,
      })
    );
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    // Mock implementation - in production, update actual notification record
    res.json(
      createResponse(true, "Notification marked as read", {
        notificationId,
        isRead: true,
        readAt: new Date(),
      })
    );
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json(
      createResponse(false, "Failed to mark notification as read", null, {
        error: error.message,
      })
    );
  }
};

// Helper function to convert data to CSV
const convertToCSV = (data, fields) => {
  if (!data || data.length === 0) return "";

  const headers = fields.map((field) => field.label).join(",");
  const rows = data.map((item) => {
    return fields
      .map((field) => {
        const value = getNestedValue(item, field.key);
        if (value === null || value === undefined) return "";
        if (typeof value === "string" && value.includes(",")) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      })
      .join(",");
  });

  return [headers, ...rows].join("\n");
};

// Helper function to get nested object values
const getNestedValue = (obj, path) => {
  return path.split(".").reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
};
