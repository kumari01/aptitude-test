const mongoose = require("mongoose");
const Test = require("../model/testModel/test.model");
const ExamAttempt = require("../model/testModel/testAttempt.model");
const questionModel = require("../model/question.model");
const {
    createProctoringSession,
    findProctoringSessionByAttemptId,
} = require("../services/proctoringSession.service");

const createExam = async (req, res) => {
    try {
        const { title, testType, duration_minutes, total_marks, totalMarks, maxAttempts } = req.body;

        const test = new Test({
            title,
            testType: testType || "Aptitude",
            status: "Published",
            totalMarks: totalMarks || total_marks || 0,
            maxAttempts: maxAttempts || 1
        });

        await test.save();
        res.status(201).json({
            message: 'Exam created successfully',
            exam: test,
            test
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}

const startExam = async (req, res) => {
    try {
        const { examId } = req.params;
        // Use authenticated student identity from JWT, not client-supplied studentId
        const studentId = req.user.id;

        const test = await Test.findById(examId);
        if (!test) {
            return res.status(404).json({
                message: 'Exam not found'
            });
        }

        const studentObjId = mongoose.Types.ObjectId.isValid(studentId) ? new mongoose.Types.ObjectId(studentId) : studentId;
        const examObjId = mongoose.Types.ObjectId.isValid(examId) ? new mongoose.Types.ObjectId(examId) : examId;

        // Check for existing attempt by this student for this test (handling string & ObjectId values)
        const studentOrList = [{ student_id: studentId }];
        if (mongoose.Types.ObjectId.isValid(studentId)) {
            studentOrList.push({ student_id: studentObjId });
        }

        const examOrList = [{ testId: examId }, { exam_id: examId }];
        if (mongoose.Types.ObjectId.isValid(examId)) {
            examOrList.push({ testId: examObjId }, { exam_id: examObjId });
        }

        let attempt = await ExamAttempt.findOne({
            $and: [
                { $or: studentOrList },
                { $or: examOrList }
            ]
        }).sort({ createdAt: -1 });

        if (!attempt) {
            attempt = new ExamAttempt({
                testId: examObjId,
                exam_id: examObjId,
                student_id: studentObjId,
                started_at: new Date(),
                status: "Started"
            });
            await attempt.save();
        } else {
            // Update existing attempt document in-place instead of creating duplicate documents
            attempt.started_at = new Date();
            attempt.submitted_at = null;
            attempt.status = "Started";
            attempt.score = 0;
            attempt.obtainedMarks = 0;
            attempt.tab_switches = 0;
            await attempt.save();
        }

        // Find or reset the proctoring session linked to this attempt
        let proctoringSession = await findProctoringSessionByAttemptId(attempt._id);
        if (!proctoringSession) {
            proctoringSession = await createProctoringSession(attempt._id);
        } else {
            proctoringSession.status = "ACTIVE";
            proctoringSession.tabSwitchCount = 0;
            proctoringSession.riskScore = 0;
            await proctoringSession.save();
        }

        // Fetch questions without exposing correct_option_id
        const questions = await questionModel.find(
            { $or: [{ testId: examId }, { exam_id: examId }] },
            { correct_option_id: 0, __v: 0 }
        );

        res.status(200).json({
            message: 'Exam started successfully',
            attempt,
            proctoringSession,
            exam: test,
            test,
            questions
        });
    }
    catch (err) {
        console.error('Error starting exam:', err);
        res.status(500).json({
            message: 'Internal server error'
        });
    }
}


module.exports = { createExam, startExam };