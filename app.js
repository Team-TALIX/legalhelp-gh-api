import express from 'express';
import cors from 'cors';
import { MONGODB_URI, REDIS_URL } from './utils/config.js'; // We'll create this next
import connectDB from './utils/database.js';
import { connectRedis } from './utils/redis.js';
import errorHandler from './middlewares/errorHandler.js';
import authRoutes from './routes/auth.js';
import passport from './utils/passport-setup.js'; // Correct path to passport setup

const app = express();

// Connect to MongoDB
connectDB(MONGODB_URI);

// Connect to Redis
// const redisClient = connectRedis(REDIS_URL); // We'll uncomment this when Redis is set up

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport Middleware
app.use(passport.initialize());
// app.use(passport.session()); // If using sessions, which we are not with JWT strategy primarily

// Basic Route
app.get('/', (req, res) => {
  res.send('LegalHelp GH Backend API Running');
});

// API Routes
app.use('/api/v1', authRoutes);

// Global Error Handler (must be the last middleware)
app.use(errorHandler);

export default app;
