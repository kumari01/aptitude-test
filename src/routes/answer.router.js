const express = require("express");
const router = express.Router();
const answerController = require("../Controllers/answer.controller");

// Save or update student answer for a question
router.post("/save", answerController.saveStudentAnswer);

// Get student's current saved answers for an attempt
router.get("/attempt/:attemptId", answerController.getStudentAnswers);

// Submit the exam attempt and calculate final score
router.post("/submit", answerController.submitExam);

// Get final result for an attempt
router.get("/results/:attemptId", answerController.getResults);

module.exports = router;
