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

        // Get all submitted/completed attempts for this exam
        const attempts = await ExamAttempt.find({
            $or: [{ exam_id: examId }, { testId: examId }],
            status: { $in: ["Submitted", "Completed", "Auto Submitted"] }
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

        let totalMarks = exam.totalMarks || 0;
        if (!totalMarks || totalMarks <= 0) {
            const Question = require("../model/question.model");
            const qList = await Question.find({ $or: [{ testId: examId }, { exam_id: examId }] });
            if (qList.length > 0) {
                totalMarks = qList.reduce((sum, q) => sum + (q.marks || 1), 0);
                try {
                    await Exam.findByIdAndUpdate(examId, { totalMarks });
                } catch (e) {}
            } else {
                totalMarks = Math.max(100, attempts.reduce((max, a) => Math.max(max, a.score || 0), 0));
            }
        }

        for (let i = 0; i < attempts.length; i++) {
            const attempt = attempts[i];

            if (attempt.score !== previousScore) {
                currentRank = i + 1;
            }

            const percentage = Number(
                Math.min(100, Math.max(0, (attempt.score / totalMarks) * 100)).toFixed(2)
            );

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

    Get complete leaderboard with populated student name & roll number
*/
const getLeaderboard = async (req, res) => {
    try {
        const { examId } = req.params;

        // Generate/update leaderboard first
        await generateLeaderboard(examId);

        const rawLeaderboard = await Leaderboard.find({
            $or: [{ exam_id: examId }, { test_id: examId }]
        })
            .populate("student_id", "username name email rollno department")
            .sort({ rank: 1 });

        const leaderboard = rawLeaderboard.map((entry) => {
            const student = entry.student_id;
            return {
                _id: entry._id,
                rank: entry.rank,
                score: entry.percentage || entry.score,
                rawScore: entry.score,
                percentage: entry.percentage,
                studentId: student?._id ? student._id.toString() : (entry.student_id ? entry.student_id.toString() : ""),
                studentName: student?.username || student?.name || "Student",
                username: student?.username || student?.name || "Student",
                rollno: student?.rollno || "",
                department: student?.department || "",
                student_id: student
            };
        });

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