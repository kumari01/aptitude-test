const express = require("express");

const {
  createSession,
  getSession,
  endSession,
} = require("../Controllers/proctoringSession.controller");
const authenticate = require("../Middleware/auth.middleware");

const router = express.Router();

router.post("/sessions", authenticate, createSession);

router.get("/sessions/:sessionId", authenticate, getSession);

router.post("/sessions/:sessionId/end", authenticate, endSession);

module.exports = router;
