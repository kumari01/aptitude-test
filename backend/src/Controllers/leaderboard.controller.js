const Leaderboard = require("../model/leaderboard.model");
const ExamAttempt = require("../model/testModel/testAttempt.model");
const Exam = require("../model/testModel/test.model");
const { getTestQuestions } = require("../utils/questionservice");


/*
    Generate / update leaderboard for an exam
*/
const generateLeaderboard = async (examId) => {
    try {
        const exam = await Exam.findById(examId);

        if (!exam) {
            throw new Error("Exam not found");
        }

        // Get all completed/submitted attempts for this exam (Submitted & Time Expired)
        const attempts = await ExamAttempt.find({
            testId: examId,
            status: { $in: ["Submitted", "Time Expired"] }
        }).sort({
            score: -1,
            submitted_at: 1
        });

        if (attempts.length === 0) {
            return [];
        }

        // Fall back to the actual question marks total if the test's static
        // totalMarks field is unset/stale, so leaderboard % and the
        // results-page % (answer.controller.getResults) never disagree.
        let effectiveTotalMarks = exam.totalMarks;
        if (!effectiveTotalMarks) {
            const questions = await getTestQuestions(examId, { includeAnswerKey: true });
            effectiveTotalMarks = questions.reduce(
                (sum, q) => sum + (typeof q.marks === 'number' ? q.marks : 1),
                0
            );
        }

        /*
            Competition ranking:

            100 → rank 1
            90  → rank 2
            90  → rank 2
            80  → rank 4
        */

        let previousScore = null;
        let currentRank = 0;

        const leaderboardData = [];

        for (let i = 0; i < attempts.length; i++) {
            const attempt = attempts[i];

            if (attempt.score !== previousScore) {
                currentRank = i + 1;
            }

            const percentage =
                effectiveTotalMarks > 0
                    ? Number(
                        ((attempt.score / effectiveTotalMarks) * 100).toFixed(2)
                    )
                    : 0;

            // Update rank in leaderboard
            const leaderboardEntry =
                await Leaderboard.findOneAndUpdate(
                    {
                        testId: examId,
                        attempt_id: attempt._id
                    },
                    {
                        testId: examId,
                        attempt_id: attempt._id,
                        student_id: attempt.student_id,
                        score: attempt.score,
                        percentage: percentage,
                        rank: currentRank
                    },
                    {
                        upsert: true,
                        returnDocument: 'after',
                        setDefaultsOnInsert: true
                    }
                );

            leaderboardData.push(leaderboardEntry);

            previousScore = attempt.score;
        }

        return leaderboardData;

    } catch (error) {
        console.error("Error generating leaderboard:", error);
        throw error;
    }
};


/*
    GET /api/leaderboard/:examId

    Get complete leaderboard
*/
const getLeaderboard = async (req, res) => {
    try {
        const { examId } = req.params;

        const leaderboard = await Leaderboard.find({
            testId: examId
        })
            .populate("student_id", "username email rollno")
            .sort({ rank: 1 });

        res.status(200).json({
            examId,
            totalStudents: leaderboard.length,
            leaderboard
        });

    } catch (error) {
        console.error("Error fetching leaderboard:", error);

        res.status(500).json({
            message: "Failed to fetch leaderboard",
            error: error.message
        });
    }
};


/*
    GET /api/leaderboard/:examId/student/:studentId

    Get one student's rank
*/
const getStudentRank = async (req, res) => {
    try {
        const { examId, studentId } = req.params;

        const entry = await Leaderboard.findOne({
            testId: examId,
            student_id: studentId
        })
            .populate("student_id", "username email rollno");

        if (!entry) {
            return res.status(404).json({
                message: "Student has not completed this exam"
            });
        }

        const totalStudents = await Leaderboard.countDocuments({
            testId: examId
        });

        res.status(200).json({
            rank: entry.rank,
            score: entry.score,
            percentage: entry.percentage,
            totalStudents,
            student: entry.student_id
        });

    } catch (error) {
        console.error("Error fetching student rank:", error);

        res.status(500).json({
            message: "Failed to fetch student rank",
            error: error.message
        });
    }
};


module.exports = {
    generateLeaderboard,
    getLeaderboard,
    getStudentRank
};