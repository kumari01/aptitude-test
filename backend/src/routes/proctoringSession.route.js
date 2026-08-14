const express = require("express");

const {
  createSession,
  getSession,
  endSession,
} = require("../Controllers/proctoringSession.controller");

const router = express.Router();

router.post("/sessions", createSession);

router.get("/sessions/:sessionId", getSession);

router.post("/sessions/:sessionId/end", endSession);

module.exports = router;