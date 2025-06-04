import express from "express";
import cors from "cors";
import { MONGODB_URI, REDIS_URL } from "./utils/config.js";
import connectDB from "./utils/database.js";
import { initializeRedis } from "./utils/redis.js";
import errorHandler from "./middlewares/errorHandler.js";
import authRoutes from "./routes/auth.js";
import verificationRoutes from "./routes/verification.js";
import adminRoutes from "./routes/admin.js";
import chatRoutes from "./routes/chat.js";
import nlpRoutes from "./routes/nlp.js";
import passport from "./utils/passport-setup.js";

const app = express();

// Connect to MongoDB
connectDB(MONGODB_URI);

// Initialize Redis connection
initializeRedis(REDIS_URL)
  .then((redisClient) => {
    if (redisClient) {
      console.log("Redis initialized successfully");
    } else {
      console.log("Redis not available - continuing without cache");
    }
  })
  .catch((error) => {
    console.error("Redis initialization failed:", error);
  });

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport Middleware
app.use(passport.initialize());

// Basic Route
app.get("/", (req, res) => {
  res.json({
    message: "LegalHelp GH Backend API Running",
    version: "1.0.0",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/v1", authRoutes);
app.use("/api/v1", verificationRoutes);
app.use("/api/v1", adminRoutes);
app.use("/api/v1", chatRoutes);
app.use("/api/v1", nlpRoutes);

// Global Error Handler (must be the last middleware)
app.use(errorHandler);

export default app;
