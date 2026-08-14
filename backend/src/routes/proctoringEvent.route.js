const express = require("express");

const {
  createEvent,
} = require("../Controllers/proctoringEvent.controller");

const {
  validateCreateProctoringEvent,
} = require("../validators/proctoringEventValidator");

const router = express.Router();

router.post(
  "/sessions/:sessionId/events",
  validateCreateProctoringEvent,
  createEvent
);

module.exports = router;