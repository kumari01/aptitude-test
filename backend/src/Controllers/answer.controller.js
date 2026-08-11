const studentAnswerSchema = require("../model/studentAnswer.model");
const ExamAttempt = require("../model/testModel/testAttempt.model");
const questionModel = require("../model/question.model");
const SectionQuestion = require("../model/sectionModel/sectionQuestion.model");

// Save or update student answer
const saveStudentAnswer = async (req, res) => {
    try {
        const { attemptId, questionId, selectedOptionId } = req.body;

        if (!attemptId || !questionId || !selectedOptionId) {
            return res.status(400).json({
                message: 'attemptId, questionId and selectedOptionId are required'
            });
        }

        // Check if attempt exists
        const attempt = await ExamAttempt.findById(attemptId);
        if (!attempt) {
            return res.status(404).json({
                message: 'Attempt not found'
            });
        }

        // Check if attempt is active
        if (attempt.status === 'Submitted' || attempt.status === 'Time Expired') {
            return res.status(400).json({
                message: 'Attempt is not active'
            });
        }

        // Check if question exists
        let question = await questionModel.findById(questionId);
        if (!question) {
            question = await SectionQuestion.findById(questionId);
        }
        if (!question) {
            return res.status(404).json({
                message: 'Question not found'
            });
        }

        const targetTestId = attempt.testId || attempt.exam_id;
        const questionTestId = question.testId || question.exam_id;
        if (targetTestId && questionTestId && questionTestId.toString() !== targetTestId.toString()) {
            return res.status(400).json({
                message: 'Question does not belong to this exam attempt'
            });
        }

        // Check if selected option is valid for this question
        const optionExists = question.options.some(option => option._id.toString() === selectedOptionId);
        if (!optionExists) {
            return res.status(400).json({
                message: 'Selected option does not belong to the question'
            });
        }

        // Save or update (upsert) answer cleanly
        const answer = await studentAnswerSchema.findOneAndUpdate(
            { attempt_id: attemptId, question_id: questionId },
            { selected_option_id: selectedOptionId },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );

        res.status(200).json({
            message: 'Student answer saved successfully',
            answer
        });
    } catch (err) {
        console.error('Error saving student answer:', err);
        res.status(500).json({
            message: 'Internal server error'
        });
    }
};

// Retrieve student answers for an attempt
const getStudentAnswers = async (req, res) => {
    try {
        const { attemptId } = req.params;
        const answers = await studentAnswerSchema.find({ attempt_id: attemptId });
        res.status(200).json({
            answers
        });
    } catch (err) {
        console.error('Error retrieving student answers:', err);
        res.status(500).json({
            message: 'Internal server error'
        });
    }
};

// Submit exam attempt, grade all answers, and set final score
const submitExam = async (req, res) => {
    try {
        const { attemptId } = req.body;
        if (!attemptId) {
            return res.status(400).json({ message: 'attemptId is required' });
        }

        const attempt = await ExamAttempt.findById(attemptId);
        if (!attempt) {
            return res.status(404).json({ message: 'Attempt not found' });
        }

        if (attempt.status === 'Submitted') {
            return res.status(400).json({ message: 'Attempt has already been submitted' });
        }

        const targetTestId = attempt.testId || attempt.exam_id;
        const questions = await questionModel.find({
            $or: [{ testId: targetTestId }, { exam_id: targetTestId }]
        });
        const answers = await studentAnswerSchema.find({ attempt_id: attemptId });

        let totalScore = 0;
        let totalPossibleMarks = 0;

        for (const question of questions) {
            const qMarks = 1; // 1 point per question
            totalPossibleMarks += qMarks;

            const studentAns = answers.find(a => a.question_id.toString() === question._id.toString());
            if (studentAns) {
                const isCorrect = question.correct_option_id && studentAns.selected_option_id && question.correct_option_id.toString() === studentAns.selected_option_id.toString();
                studentAns.is_correct = isCorrect;
                studentAns.marks_awarded = isCorrect ? qMarks : 0;
                await studentAns.save();

                if (isCorrect) {
                    totalScore += qMarks;
                }
            }
        }

        attempt.score = totalScore;
        attempt.status = 'Submitted';
        attempt.submitted_at = new Date();
        await attempt.save();

        res.status(200).json({
            message: 'Exam submitted successfully',
            score: totalScore,
            totalMarks: totalPossibleMarks,
            attempt
        });
    } catch (err) {
        console.error('Error submitting exam:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Retrieve test results for an attempt
const getResults = async (req, res) => {
    try {
        const { attemptId } = req.params;

        const attempt = await ExamAttempt.findById(attemptId);
        if (!attempt) {
            return res.status(404).json({ message: 'Attempt not found' });
        }

        const targetTestId = attempt.testId || attempt.exam_id;
        const questions = await questionModel.find({
            $or: [{ testId: targetTestId }, { exam_id: targetTestId }]
        });
        const answers = await studentAnswerSchema.find({ attempt_id: attemptId });

        const totalMarks = questions.length; // 1 point per question
        let correctCount = 0;
        let wrongCount = 0;

        for (const question of questions) {
            const ans = answers.find(a => a.question_id.toString() === question._id.toString());
            if (ans && ans.selected_option_id) {
                if (question.correct_option_id && question.correct_option_id.toString() === ans.selected_option_id.toString()) {
                    correctCount++;
                } else {
                    wrongCount++;
                }
            }
        }

        const answeredCount = answers.filter(a => a.selected_option_id).length;
        const percentage = totalMarks > 0 ? Math.round((attempt.score / totalMarks) * 100) : 0;

        res.status(200).json({
            attemptId: attempt._id,
            status: attempt.status,
            score: attempt.score,
            totalMarks,
            totalQuestions: questions.length,
            answeredCount,
            correctCount,
            wrongCount,
            percentage,
            startedAt: attempt.started_at,
            submittedAt: attempt.submitted_at
        });
    } catch (err) {
        console.error('Error calculating results:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { saveStudentAnswer, getStudentAnswers, submitExam, getResults };