const express = require("express");

const router = express.Router();

const examController = require("../Controllers/Exam.controller");
const testManagementController = require("../Controllers/testManagement.controller");
const questionController = require("../Controllers/question.controller");
const authenticate = require("../Middleware/auth.middleware");
const requireAdmin = require("../Middleware/admin.middleware");

router.get('/hello', (req, res) => {
    res.send('Hello from StartExamRouter');
});

router.post("/create", authenticate, requireAdmin, testManagementController.createTest);

router.post("/:examId/start", authenticate, examController.startExam);

router.post("/:examId/questions", authenticate, requireAdmin, questionController.createQuestion);

router.get("/:examId/questions", authenticate, questionController.getQuestions);

module.exports = router;