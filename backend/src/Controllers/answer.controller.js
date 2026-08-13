const studentAnswerSchema = require("../model/studentAnswer.model");
const ExamAttempt = require("../model/testModel/testAttempt.model");
const Test = require("../model/testModel/test.model");
const questionModel = require("../model/question.model");
const { checkAttemptTiming } = require("../utils/timeHelper");
const { getTestQuestions } = require("../utils/questionservice");
const { isAttemptOwner } = require("../utils/attemptAuth");
const {
    generateLeaderboard
} = require("./leaderboard.controller");

// Helper to grade all saved answers and mark attempt as Submitted / Time Expired
const gradeAndSubmitAttempt = async (attempt, statusReason = 'Submitted') => {
    if (attempt.status === 'Submitted' || attempt.status === 'Time Expired') {
        return { attempt, score: attempt.score, totalMarks: 0 };
    }

    const targetTestId = attempt.testId;
    // Uses the same section-aware resolver the student saw when taking the
    // exam (including section-level marks overrides), so grading can never
    // drift from what was actually shown on screen.
    const questions = await getTestQuestions(targetTestId, { includeAnswerKey: true });
    const answers = await studentAnswerSchema.find({ attempt_id: attempt._id });

    let totalScore = 0;
    let totalPossibleMarks = 0;

    for (const question of questions) {
        const qMarks = (question && typeof question.marks === 'number') ? question.marks : 1;
        totalPossibleMarks += qMarks;

        const studentAns = answers.find(a => a.question_id.toString() === question._id.toString());
        if (studentAns) {
            const isCorrect = checkIsCorrect(question, studentAns.selected_option_id);
            studentAns.is_correct = isCorrect;
            studentAns.marks_awarded = isCorrect ? qMarks : 0;
            await studentAns.save();

            if (isCorrect) {
                totalScore += qMarks;
            }
        }
    }

    attempt.score = totalScore;
    attempt.status = statusReason;
    attempt.submitted_at = attempt.submitted_at || new Date();
    await attempt.save();

    if (attempt.testId) {
        await generateLeaderboard(attempt.testId);
    }

    return {
        attempt,
        score: totalScore,
        totalMarks: totalPossibleMarks
    };
};

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

        // Confirm the authenticated student actually owns this attempt
        if (!isAttemptOwner(attempt, req)) {
            return res.status(403).json({
                message: 'This attempt does not belong to you'
            });
        }

        // Check if attempt is active
        if (attempt.status === 'Submitted' || attempt.status === 'Time Expired') {
            return res.status(400).json({
                message: 'Attempt is not active'
            });
        }

        // Check time expiry via centralized helper
        const test = await Test.findById(attempt.testId);
        const { isExpired } = checkAttemptTiming(attempt, test?.duration_minutes);

        if (isExpired) {
            const result = await gradeAndSubmitAttempt(attempt, 'Time Expired');
            return res.status(400).json({
                message: 'Exam duration has expired. Test auto-submitted.',
                isTimeExpired: true,
                attempt: result.attempt,
                score: result.score
            });
        }

        // Check if question exists and belongs to this exam
        const question = await questionModel.findById(questionId);
        if (!question) {
            return res.status(404).json({
                message: 'Question not found'
            });
        }

        const targetTestId = attempt.testId;
        const questionTestId = question.testId;
        if (targetTestId && questionTestId && questionTestId.toString() !== targetTestId.toString()) {
            return res.status(400).json({
                message: 'Question does not belong to this exam attempt'
            });
        }

        // Check if selected option is valid for this question
        const optionExists = Array.isArray(question.options) &&
            question.options.some(option => option._id.toString() === selectedOptionId);
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

        const attempt = await ExamAttempt.findById(attemptId);
        if (!attempt) {
            return res.status(404).json({ message: 'Attempt not found' });
        }
        if (!isAttemptOwner(attempt, req)) {
            return res.status(403).json({ message: 'This attempt does not belong to you' });
        }

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

// Helper to evaluate whether selected option is correct using strictly correct_option_id
const checkIsCorrect = (question, selectedOptionId) => {
    if (!selectedOptionId || !question || !question.correct_option_id) return false;
    return question.correct_option_id.toString() === selectedOptionId.toString();
};

// Submit exam attempt, grade all answers, and set final score
const submitExam = async (req, res) => {
    try {
        const { attemptId, reason } = req.body;
        if (!attemptId) {
            return res.status(400).json({ message: 'attemptId is required' });
        }

        const attempt = await ExamAttempt.findById(attemptId);
        if (!attempt) {
            return res.status(404).json({ message: 'Attempt not found' });
        }

        if (!isAttemptOwner(attempt, req)) {
            return res.status(403).json({ message: 'This attempt does not belong to you' });
        }

        if (attempt.status === 'Submitted' || attempt.status === 'Time Expired') {
            return res.status(400).json({ message: 'Attempt has already been submitted or expired' });
        }

        const finalStatus = reason === 'Time Expired' ? 'Time Expired' : 'Submitted';
        const result = await gradeAndSubmitAttempt(attempt, finalStatus);

        res.status(200).json({
            message: finalStatus === 'Time Expired' ? 'Exam auto-submitted (Time Expired)' : 'Exam submitted successfully',
            score: result.score,
            totalMarks: result.totalMarks,
            attempt: result.attempt
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

        if (!isAttemptOwner(attempt, req)) {
            return res.status(403).json({ message: 'This attempt does not belong to you' });
        }

        const targetTestId = attempt.testId;
        const questions = await getTestQuestions(targetTestId, { includeAnswerKey: true });
        const answers = await studentAnswerSchema.find({ attempt_id: attemptId });

        let totalPossibleMarks = 0;
        let correctCount = 0;
        let wrongCount = 0;

        for (const question of questions) {
            const qMarks = (question && typeof question.marks === 'number') ? question.marks : 1;
            totalPossibleMarks += qMarks;

            const ans = answers.find(a => a.question_id.toString() === question._id.toString());
            if (ans && ans.selected_option_id) {
                if (checkIsCorrect(question, ans.selected_option_id)) {
                    correctCount++;
                } else {
                    wrongCount++;
                }
            }
        }

        const answeredCount = answers.filter(a => a.selected_option_id).length;
        const totalMarks = totalPossibleMarks || questions.length;
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

module.exports = { saveStudentAnswer, getStudentAnswers, submitExam, getResults, gradeAndSubmitAttempt };