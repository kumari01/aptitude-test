const express = require("express");

const {
  createSession,
  getSession,
  endSession,
  getLiveSessionsForTest,
  terminateSessionByAdmin,
} = require("../Controllers/proctoringSession.controller");
const authenticate = require("../Middleware/auth.middleware");
const requireAdmin = require("../Middleware/admin.middleware");

const router = express.Router();

router.post("/sessions", authenticate, createSession);

router.get("/sessions/live/:testId", authenticate, requireAdmin, getLiveSessionsForTest);
router.post("/sessions/admin/terminate", authenticate, requireAdmin, terminateSessionByAdmin);

router.get("/sessions/:sessionId", authenticate, getSession);

router.post("/sessions/:sessionId/end", authenticate, endSession);

module.exports = router;
