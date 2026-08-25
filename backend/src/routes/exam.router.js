const express = require("express");

const router = express.Router();

const examController = require("../controllers/exam.controller");
const questionController = require("../controllers/question.controller");
const authenticate = require("../middleware/auth.middleware");
const requireAdmin = require("../middleware/admin.middleware");

router.get('/hello', (req, res) => {
    res.send('Hello from StartExamRouter');
})

router.post("/create", authenticate, requireAdmin, examController.createExam);

router.post("/:examId/start", authenticate, examController.startExam);

router.post("/:examId/questions", authenticate, requireAdmin, questionController.createQuestion);

router.get("/:examId/questions", questionController.getQuestions);

module.exports = router;
