const studentAnswerSchema = require("../model/studentAnswer.model");
const ExamAttempt = require("../model/testModel/testAttempt.model");
const questionModel = require("../model/question.model");
const SectionQuestion = require("../model/sectionModel/sectionQuestion.model");
const { submitAttempt } = require('../services/attempt.service');
const {
    generateLeaderboard
} = require("./leaderboard.controller");

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

        // Authorization: student must own this attempt
        if (attempt.student_id.toString() !== req.user.id) {
            return res.status(403).json({
                message: 'Forbidden: You do not own this attempt'
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

        const attempt = await ExamAttempt.findById(attemptId);
        if (!attempt) {
            return res.status(404).json({ message: 'Attempt not found' });
        }

        // Authorization: student must own this attempt
        if (attempt.student_id.toString() !== req.user.id) {
            return res.status(403).json({
                message: 'Forbidden: You do not own this attempt'
            });
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

// Submit exam attempt, grade all answers, and set final score
const submitExam = async (req, res) => {
    try {
        const { attemptId } = req.body;

        if (!attemptId) {
            return res.status(400).json({
                message: "attemptId is required"
            });
        }

        // Authorization: student must own this attempt
        const attempt = await ExamAttempt.findById(attemptId);
        if (!attempt) {
            return res.status(404).json({ message: 'Attempt not found' });
        }

        if (attempt.student_id.toString() !== req.user.id) {
            return res.status(403).json({
                message: 'Forbidden: You do not own this attempt'
            });
        }

        const result = await submitAttempt(
            attemptId,
            "Submitted"
        );

        // Update leaderboard after successful submission
        await generateLeaderboard(result.attempt.exam_id);

        return res.status(200).json({
            message: "Exam submitted successfully",
            score: result.score,
            totalMarks: result.totalMarks,
            attempt: result.attempt
        });
    } catch (err) {
        console.error("Error submitting exam:", err);

        return res.status(400).json({
            message: err.message
        });
    }
};

// Retrieve test results for an attempt
const getResults = async (req, res) => {
    try {
        const { attemptId } = req.params;
        const mongoose = require("mongoose");
        const currentUserId = (req.user?.id || req.user?._id)?.toString();

        let attempt = null;
        if (mongoose.Types.ObjectId.isValid(attemptId)) {
            attempt = await ExamAttempt.findById(attemptId);
        }

        if (!attempt) {
            // Try matching attempt by testId / exam_id for the logged in student
            const testIdQuery = [];
            if (mongoose.Types.ObjectId.isValid(attemptId)) {
                const tObjId = new mongoose.Types.ObjectId(attemptId);
                testIdQuery.push({ testId: tObjId }, { exam_id: tObjId });
            }
            testIdQuery.push({ testId: attemptId }, { exam_id: attemptId });

            const studentQuery = [];
            if (currentUserId) {
                studentQuery.push({ student_id: currentUserId });
                if (mongoose.Types.ObjectId.isValid(currentUserId)) {
                    studentQuery.push({ student_id: new mongoose.Types.ObjectId(currentUserId) });
                }
            }

            const searchFilter = { $or: testIdQuery };
            if (studentQuery.length > 0) {
                searchFilter.$and = [{ $or: studentQuery }];
            }

            attempt = await ExamAttempt.findOne(searchFilter).sort({ updatedAt: -1 });
        }

        // If still no attempt found, try finding ANY attempt for this testId
        if (!attempt && mongoose.Types.ObjectId.isValid(attemptId)) {
            const tObjId = new mongoose.Types.ObjectId(attemptId);
            attempt = await ExamAttempt.findOne({
                $or: [{ testId: tObjId }, { exam_id: tObjId }, { testId: attemptId }, { exam_id: attemptId }]
            }).sort({ updatedAt: -1 });
        }

        if (!attempt) {
            return res.status(404).json({ message: 'Attempt not found' });
        }

        // Authorization check
        if (currentUserId && attempt.student_id) {
            const attemptStudentId = attempt.student_id.toString();
            if (attemptStudentId !== currentUserId) {
                return res.status(403).json({
                    message: 'Forbidden: You do not own this attempt'
                });
            }
        }

        const targetTestId = attempt.testId || attempt.exam_id || attemptId;

        // 1. Fetch questions for this test
        const qOrList = [];
        if (mongoose.Types.ObjectId.isValid(targetTestId)) {
            const testObjId = new mongoose.Types.ObjectId(targetTestId);
            qOrList.push({ testId: testObjId }, { exam_id: testObjId });
        }
        qOrList.push({ testId: targetTestId }, { exam_id: targetTestId }, { testId: targetTestId.toString() }, { exam_id: targetTestId.toString() });

        let questions = await questionModel.find({ $or: qOrList });

        if (questions.length === 0) {
            const Section = require("../model/sectionModel/section.model");
            const SectionQuestion = require("../model/sectionModel/sectionQuestion.model");
            const sectionOrList = [];
            if (mongoose.Types.ObjectId.isValid(targetTestId)) {
                sectionOrList.push({ testId: new mongoose.Types.ObjectId(targetTestId) });
            }
            sectionOrList.push({ testId: targetTestId }, { testId: targetTestId.toString() });

            const sections = await Section.find({ $or: sectionOrList });
            const sectionIds = sections.map(s => s._id);
            const secQuestions = await SectionQuestion.find({ sectionId: { $in: sectionIds } });
            if (secQuestions.length > 0) {
                const questionIds = secQuestions.map(sq => sq.questionId).filter(Boolean);
                questions = await questionModel.find({ _id: { $in: questionIds } });
            }
        }

        // 2. Fetch all student answers for this attempt
        const answers = await studentAnswerSchema.find({
            $or: [{ attempt_id: attempt._id }, { attempt_id: attempt._id.toString() }]
        });

        if (questions.length === 0 && answers.length > 0) {
            const answeredQIds = answers.map(a => a.question_id).filter(Boolean);
            questions = await questionModel.find({ _id: { $in: answeredQIds } });
        }

        let correctCount = 0;
        let answeredCount = 0;

        const breakdown = questions.map((question, idx) => {
            const ans = answers.find(a => a.question_id.toString() === question._id.toString());
            const selectedOptionId = ans?.selected_option_id ? ans.selected_option_id.toString() : null;
            const correctOptionId = question.correct_option_id ? question.correct_option_id.toString() : null;

            const isAnswered = !!selectedOptionId;
            if (isAnswered) answeredCount++;

            const isCorrect = isAnswered && correctOptionId && selectedOptionId === correctOptionId;
            if (isCorrect) correctCount++;

            const optionsFormatted = (question.options || []).map(opt => {
                const optId = opt._id ? opt._id.toString() : opt.text;
                return {
                    id: optId,
                    text: opt.text,
                    isCorrectOption: correctOptionId ? optId === correctOptionId : false,
                    isSelectedOption: selectedOptionId ? optId === selectedOptionId : false
                };
            });

            return {
                number: idx + 1,
                questionId: question._id,
                questionText: question.question_text || question.text || `Question ${idx + 1}`,
                marks: question.marks || 1,
                isAnswered,
                isCorrect,
                selectedOptionId,
                correctOptionId,
                options: optionsFormatted
            };
        });

        const totalQuestions = questions.length;
        const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0) || totalQuestions;
        const wrongCount = Math.max(0, answeredCount - correctCount);
        const percentage = totalMarks > 0 ? Math.round((attempt.score / totalMarks) * 100) : 0;

        res.status(200).json({
            attemptId: attempt._id,
            status: attempt.status,
            score: attempt.score,
            totalMarks,
            totalQuestions,
            answeredCount,
            correctCount,
            wrongCount,
            percentage,
            startedAt: attempt.started_at,
            submittedAt: attempt.submitted_at,
            breakdown
        });
    } catch (err) {
        console.error('Error calculating results:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { saveStudentAnswer, getStudentAnswers, submitExam, getResults };