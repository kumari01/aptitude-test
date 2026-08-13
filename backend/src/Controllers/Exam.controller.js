const mongoose = require("mongoose");
const Test = require("../model/testModel/test.model");
const ExamAttempt = require("../model/testModel/testAttempt.model");
const TestSchedule = require("../model/testModel/testSchedule.model");
const TestAssignment = require("../model/testModel/testAssignment.model");
const { Student } = require("../model/user.model");
const { gradeAndSubmitAttempt } = require("./answer.controller");
const { checkAttemptTiming } = require("../utils/timeHelper");
const { getTestQuestions } = require("../utils/questionservice");

const startExam = async (req, res) => {
    try {
        const { examId } = req.params;

        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only students can start an exam"
            });
        }

        const studentId = req.user?.id || req.user?._id;
        const reqRollno = req.body?.rollno || req.user?.rollno;

        if (!mongoose.Types.ObjectId.isValid(examId)) {
            return res.status(404).json({
                message: 'Exam not found'
            });
        }

        const test = await Test.findById(examId);
        if (!test) {
            return res.status(404).json({
                message: 'Exam not found'
            });
        }

        // 1. Validate student assignment access (TestAssignment as source of truth)
        const assignmentCount = await TestAssignment.countDocuments({ testId: examId });
        if (assignmentCount > 0) {
            let studentRollno = reqRollno;
            if (!studentRollno && studentId && mongoose.Types.ObjectId.isValid(studentId)) {
                const sObj = await Student.findById(studentId);
                if (sObj) studentRollno = sObj.rollno;
            }
            if (studentRollno) {
                const assigned = await TestAssignment.findOne({
                    testId: examId,
                    rollno: studentRollno
                });
                if (!assigned) {
                    return res.status(403).json({
                        message: 'You are not assigned to take this exam.'
                    });
                }
            }
        }

        // 2. Check Test Schedule if schedules exist
        const schedules = await TestSchedule.find({ testId: examId });
        if (schedules && schedules.length > 0) {
            const now = new Date();
            const activeSchedule = schedules.find(s => new Date(s.startAt) <= now && now <= new Date(s.endAt));
            if (!activeSchedule) {
                const upcoming = schedules.find(s => new Date(s.startAt) > now);
                if (upcoming) {
                    return res.status(403).json({
                        message: `Test schedule has not started yet. Exam opens at ${upcoming.startAt}`
                    });
                }
                return res.status(403).json({
                    message: `Test schedule has ended or is not currently active.`
                });
            }
        }

        // 3. Check for active attempt to resume
        const activeQuery = {
            testId: examId,
            status: "Started",
            student_id: studentId
        };

        let attempt = await ExamAttempt.findOne(activeQuery);

        if (attempt) {
            // Check test duration expiration via centralized timeHelper
            const { remainingSeconds, isExpired } = checkAttemptTiming(attempt, test.duration_minutes);

            if (isExpired) {
                const submitResult = await gradeAndSubmitAttempt(attempt, 'Time Expired');
                return res.status(200).json({
                    message: 'Exam time has expired and attempt has been auto-submitted',
                    attempt: submitResult.attempt,
                    exam: test,
                    test,
                    questions: [],
                    isTimeExpired: true,
                    remainingSeconds: 0
                });
            }

            const questions = await getTestQuestions(examId);

            return res.status(200).json({
                message: 'Resuming active exam attempt',
                attempt,
                exam: test,
                test,
                questions,
                isTimeExpired: false,
                remainingSeconds
            });
        }

        // 4. No active attempt found -> Check Max Attempts Limit
        const maxAllowedAttempts = test.maxAttempts || 1;
        const completedAttemptsCount = await ExamAttempt.countDocuments({
            testId: examId,
            student_id: studentId,
            status: { $in: ["Submitted", "Time Expired"] }
        });

        if (completedAttemptsCount >= maxAllowedAttempts) {
            return res.status(403).json({
                message: `Maximum attempt limit reached (${completedAttemptsCount}/${maxAllowedAttempts}). You cannot take this exam again.`
            });
        }

        // 5. Create new attempt
        attempt = new ExamAttempt({
            testId: examId,
            student_id: studentId,
            attemptNumber: completedAttemptsCount + 1,
            started_at: new Date(),
            status: "Started"
        });
        await attempt.save();

        const { remainingSeconds } = checkAttemptTiming(attempt, test.duration_minutes);
        const questions = await getTestQuestions(examId);

        return res.status(200).json({
            message: 'Exam started successfully',
            attempt,
            exam: test,
            test,
            questions,
            isTimeExpired: false,
            remainingSeconds
        });
    }
    catch (err) {
        console.error('Error starting exam:', err);
        res.status(500).json({
            message: 'Internal server error'
        });
    }
}

module.exports = { startExam };