const express = require("express");

const router = express.Router();

const examController = require("../Controllers/Exam.controller");
const questionController = require("../Controllers/question.controller");

router.get('/hello', (req, res) => {
    res.send('Hello from StartExamRouter');
})

router.post("/create", examController.createExam);

router.post("/:examId/start", examController.startExam);

router.post("/:examId/questions", questionController.createQuestion);

router.get("/:examId/questions", questionController.getQuestions);

module.exports = router;