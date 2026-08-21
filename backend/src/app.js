const express = require('express');
const cors = require("cors");
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require("cookie-parser");

const ExamRouter = require('./routes/Exam.router');
const AuthRouter = require('./routes/auth.router');
const AnswerRouter = require('./routes/answer.router');
const TestManagementRouter = require('./routes/testManagement.router');
const ProctoringEventRoute = require('./routes/proctoringEvent.route');
const proctoringSessionRoutes = require("./routes/proctoringSession.route");
const LeaderboardRouter = require('./routes/leaderboard.router');

const app = express();

// 1. Security Headers (Helmet)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

// 2. Cookie Parser & CORS
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173"],
    credentials: true,
  })
);

// 3. Body Parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 4. Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again after 15 minutes.",
  },
  skip: (req) => process.env.NODE_ENV === "test",
});

const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // 2000 requests per 15 mins for active exams
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === "test",
});

app.use("/api/", generalApiLimiter);
app.use("/api/auth/student/login", authLimiter);
app.use("/api/auth/admin/login", authLimiter);

// 5. Root & Health Check
app.get('/', (req, res) => {
  res.status(200).json({
    name: "Quiz App API",
    status: "active",
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: "healthy",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: process.uptime(),
  });
});

// 6. API Route Handlers
app.use('/api/auth', AuthRouter);
app.use('/api/exams', ExamRouter);
app.use('/api/answers', AnswerRouter);
app.use('/api/test-management', TestManagementRouter);
app.use("/api/v1/proctoring", proctoringSessionRoutes);
app.use("/api/v1/proctoring", ProctoringEventRoute);
app.use('/api/leaderboard', LeaderboardRouter);

// 7. 404 Route Not Found Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// 8. Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Application Error:", err);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: messages,
    });
  }

  // Mongoose invalid ObjectId / CastError
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid identifier format for field ${err.path}`,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
});

module.exports = app;