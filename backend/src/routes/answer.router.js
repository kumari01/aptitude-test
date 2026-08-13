const express = require("express");
const router = express.Router();
const answerController = require("../Controllers/answer.controller");
const authenticate = require("../Middleware/auth.middleware");
 

// Save or update student answer for a question
router.post("/save", authenticate ,answerController.saveStudentAnswer);

// Get student's current saved answers for an attempt
router.get("/attempt/:attemptId", authenticate, answerController.getStudentAnswers);

// Submit the exam attempt and calculate final score
router.post("/submit", authenticate, answerController.submitExam);

// Get final result for an attempt
router.get("/results/:attemptId", authenticate, answerController.getResults);

module.exports = router;
