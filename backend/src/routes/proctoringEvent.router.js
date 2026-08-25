const express = require("express");

const {
  createEvent,
} = require("../controllers/proctoringEvent.controller");

const {
  validateCreateProctoringEvent,
} = require("../validators/proctoringEventValidator");
const authenticate = require("../middleware/auth.middleware");

const router = express.Router();

router.post(
  "/sessions/:sessionId/events",
  authenticate,
  validateCreateProctoringEvent,
  createEvent
);

module.exports = router;
