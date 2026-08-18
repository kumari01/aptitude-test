const express = require("express");

const {
  createEvent,
} = require("../Controllers/proctoringEvent.controller");

const {
  validateCreateProctoringEvent,
} = require("../validators/proctoringEventValidator");
const authenticate = require("../Middleware/auth.middleware");

const router = express.Router();

router.post(
  "/sessions/:sessionId/events",
  authenticate,
  validateCreateProctoringEvent,
  createEvent
);

module.exports = router;
