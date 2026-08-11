const Leaderboard = require("../model/leaderboard.model");
const ExamAttempt = require("../model/testModel/testAttempt.model");
const Exam = require("../model/testModel/test.model");


/*
    Generate / update leaderboard for an exam
*/
const generateLeaderboard = async (examId) => {
    try {
        const exam = await Exam.findById(examId);

        if (!exam) {
            throw new Error("Exam not found");
        }

        // Get all submitted attempts for this exam
        const attempts = await ExamAttempt.find({
            exam_id: examId,
            status: "Submitted"
        }).sort({
            score: -1,
            submitted_at: 1
        });

        if (attempts.length === 0) {
            return [];
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
                exam.totalMarks > 0
                    ? Number(
                        ((attempt.score / exam.totalMarks) * 100).toFixed(2)
                    )
                    : 0;

            // Update rank in leaderboard
            const leaderboardEntry =
                await Leaderboard.findOneAndUpdate(
                    {
                        exam_id: examId,
                        attempt_id: attempt._id
                    },
                    {
                        exam_id: examId,
                        attempt_id: attempt._id,
                        student_id: attempt.student_id,
                        score: attempt.score,
                        percentage: percentage,
                        rank: currentRank
                    },
                    {
                        upsert: true,
                        new: true,
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

        // Generate/update leaderboard first
        await generateLeaderboard(examId);

        const leaderboard = await Leaderboard.find({
            exam_id: examId
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

        await generateLeaderboard(examId);

        const entry = await Leaderboard.findOne({
            exam_id: examId,
            student_id: studentId
        })
            .populate("student_id", "username email rollno");

        if (!entry) {
            return res.status(404).json({
                message: "Student has not completed this exam"
            });
        }

        const totalStudents = await Leaderboard.countDocuments({
            exam_id: examId
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