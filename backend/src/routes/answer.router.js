const express = require("express");
const router = express.Router();
const answerController = require("../controllers/answer.controller");
const authenticate = require("../middleware/auth.middleware");

// Save or update student answer for a question (single)
router.post("/save", authenticate, answerController.saveStudentAnswer);

// Batch save multiple student answers (high-concurrency optimization)
router.post("/batch-save", authenticate, answerController.batchSaveStudentAnswers);

// Get student's current saved answers for an attempt
router.get("/attempt/:attemptId", authenticate, answerController.getStudentAnswers);

// Submit the exam attempt and calculate final score
router.post("/submit", authenticate, answerController.submitExam);

// Get final result for an attempt
router.get("/results/:attemptId", authenticate, answerController.getResults);

module.exports = router;
