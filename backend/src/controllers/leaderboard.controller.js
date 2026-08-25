const Leaderboard = require("../model/leaderboard.model");
const ExamAttempt = require("../model/testModel/testAttempt.model");
const Exam = require("../model/testModel/test.model");


/*
    Generate / update leaderboard for an exam
*/
const generateLeaderboard = async (examId) => {
    try {
        const mongoose = require("mongoose");
        const examObjId = mongoose.Types.ObjectId.isValid(examId) ? new mongoose.Types.ObjectId(examId) : examId;
        const exam = await Exam.findById(examId);

        if (!exam) {
            return [];
        }

        // Get all submitted/completed attempts for this exam
        const attempts = await ExamAttempt.find({
            $or: [
                { exam_id: examId },
                { testId: examId },
                { exam_id: examObjId },
                { testId: examObjId }
            ],
            status: { $in: ["Submitted", "Completed", "Auto Submitted", "Disqualified", "Time Expired"] }
        });

        if (attempts.length === 0) {
            return [];
        }

        // Deduplicate attempts per student so each student appears only once with their best score
        const studentBestAttemptMap = new Map();
        for (const att of attempts) {
            const sId = att.student_id?.toString();
            if (!sId) continue;
            const attScore = Math.max(att.score || 0, att.obtainedMarks || 0);

            if (!studentBestAttemptMap.has(sId)) {
                studentBestAttemptMap.set(sId, att);
            } else {
                const existing = studentBestAttemptMap.get(sId);
                const existingScore = Math.max(existing.score || 0, existing.obtainedMarks || 0);
                if (attScore > existingScore) {
                    studentBestAttemptMap.set(sId, att);
                }
            }
        }

        const uniqueAttempts = Array.from(studentBestAttemptMap.values());
        if (uniqueAttempts.length === 0) {
            return [];
        }

        // Sort by score desc, then submission date asc
        uniqueAttempts.sort((a, b) => {
            const scoreA = Math.max(a.score || 0, a.obtainedMarks || 0);
            const scoreB = Math.max(b.score || 0, b.obtainedMarks || 0);
            if (scoreB !== scoreA) return scoreB - scoreA;
            return new Date(a.submitted_at || a.createdAt || 0) - new Date(b.submitted_at || b.createdAt || 0);
        });

        let totalMarks = exam.totalMarks || 0;
        if (!totalMarks || totalMarks <= 0) {
            const { getTestQuestions } = require("../utils/questionService");
            const qList = await getTestQuestions(examId, { includeAnswerKey: true });
            if (qList.length > 0) {
                totalMarks = qList.reduce((sum, q) => sum + (q.marks || 1), 0);
                try {
                    await Exam.findByIdAndUpdate(examId, { totalMarks });
                } catch (e) {}
            } else {
                totalMarks = Math.max(10, uniqueAttempts.reduce((max, a) => Math.max(max, Math.max(a.score || 0, a.obtainedMarks || 0)), 0));
            }
        }

        let previousScore = null;
        let currentRank = 0;
        const bulkOps = [];
        const activeAttemptIds = [];

        for (let i = 0; i < uniqueAttempts.length; i++) {
            const attempt = uniqueAttempts[i];
            const rawScore = Math.max(attempt.score || 0, attempt.obtainedMarks || 0);
            activeAttemptIds.push(attempt._id);

            if (rawScore !== previousScore) {
                currentRank = i + 1;
            }

            const percentage = Number(
                Math.min(100, Math.max(0, (rawScore / totalMarks) * 100)).toFixed(2)
            );

            const timeTaken = attempt.submitted_at && attempt.started_at
                ? Math.round((new Date(attempt.submitted_at) - new Date(attempt.started_at)) / 1000)
                : (attempt.updatedAt && attempt.started_at
                    ? Math.round((new Date(attempt.updatedAt) - new Date(attempt.started_at)) / 1000)
                    : 0);

            const docData = {
                exam_id: examObjId,
                testId: examObjId,
                attempt_id: attempt._id,
                student_id: attempt.student_id,
                studentId: attempt.student_id,
                score: rawScore,
                percentage: percentage,
                accuracy: percentage,
                timeTaken: timeTaken,
                rank: currentRank
            };

            bulkOps.push({
                updateOne: {
                    filter: { exam_id: examObjId, student_id: attempt.student_id },
                    update: { $set: docData },
                    upsert: true
                }
            });

            previousScore = rawScore;
        }

        if (bulkOps.length > 0) {
            await Leaderboard.bulkWrite(bulkOps);
            // Remove any orphan entries not matching current attempts
            await Leaderboard.deleteMany({
                exam_id: examObjId,
                attempt_id: { $nin: activeAttemptIds }
            });
            return await Leaderboard.find({ exam_id: examObjId }).sort({ rank: 1 });
        }

        return [];
    } catch (error) {
        console.error("Error generating leaderboard:", error);
        return [];
    }
};


/*
    GET /api/leaderboard/:examId?

    Get complete leaderboard with populated student name & roll number
    Falls back to most recent exam with submissions if target exam has 0 submissions
*/
const getLeaderboard = async (req, res) => {
    try {
        let { examId } = req.params;
        const mongoose = require("mongoose");

        // If no examId provided or target exam has no submissions, find the latest exam with submissions
        if (!examId || examId === "latest") {
            const latestAttempt = await ExamAttempt.findOne({
                status: { $in: ["Submitted", "Completed", "Auto Submitted"] }
            }).sort({ submitted_at: -1, updatedAt: -1 });

            if (latestAttempt) {
                examId = (latestAttempt.testId || latestAttempt.exam_id)?.toString();
            }
        }

        if (!examId) {
            return res.status(200).json({
                examId: null,
                testTitle: "No Exams",
                totalStudents: 0,
                leaderboard: []
            });
        }

        const examObjId = mongoose.Types.ObjectId.isValid(examId) ? new mongoose.Types.ObjectId(examId) : examId;
        const examDoc = await Exam.findById(examId);

        // Generate/update leaderboard for the requested exam
        let generated = await generateLeaderboard(examId);

        // If the requested exam has 0 submissions, try falling back to the most recent exam with submissions
        let isFallback = false;
        let activeExamDoc = examDoc;
        let activeExamId = examId;

        if (generated.length === 0) {
            const latestAttempt = await ExamAttempt.findOne({
                status: { $in: ["Submitted", "Completed", "Auto Submitted"] }
            }).sort({ submitted_at: -1, updatedAt: -1 });

            if (latestAttempt) {
                const fallbackId = (latestAttempt.testId || latestAttempt.exam_id)?.toString();
                if (fallbackId && fallbackId !== examId.toString()) {
                    activeExamId = fallbackId;
                    activeExamDoc = await Exam.findById(fallbackId);
                    await generateLeaderboard(fallbackId);
                    isFallback = true;
                }
            }
        }

        const queryId = isFallback ? activeExamId : examId;
        const queryObjId = mongoose.Types.ObjectId.isValid(queryId) ? new mongoose.Types.ObjectId(queryId) : queryId;

        const rawLeaderboard = await Leaderboard.find({
            $or: [{ exam_id: queryId }, { testId: queryId }, { exam_id: queryObjId }, { testId: queryObjId }]
        })
            .populate("student_id", "username name email rollno department")
            .sort({ rank: 1 });

        const leaderboard = rawLeaderboard.map((entry) => {
            const student = entry.student_id;
            return {
                _id: entry._id,
                rank: entry.rank,
                attempt_id: entry.attempt_id,
                attemptId: entry.attempt_id,
                score: Math.round(entry.percentage || 0),
                percentage: entry.percentage,
                rawScore: entry.score,
                studentId: student?._id ? student._id.toString() : (entry.student_id ? entry.student_id.toString() : ""),
                studentName: student?.username || student?.name || "Student",
                username: student?.username || student?.name || "Student",
                rollno: student?.rollno || "",
                department: student?.department || "",
                student_id: student
            };
        });

        res.status(200).json({
            examId: queryId,
            testTitle: activeExamDoc?.title || "Exam Standings",
            isFallback,
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

/*
    GET /api/leaderboard/exams/list

    Get list of exams for the leaderboard history dropdown
*/
const getLeaderboardExams = async (req, res) => {
    try {
        const tests = await Exam.find().sort({ createdAt: -1 });
        const list = [];

        for (const t of tests) {
            const submissionCount = await ExamAttempt.countDocuments({
                $or: [{ testId: t._id }, { exam_id: t._id }],
                status: { $in: ["Submitted", "Completed", "Auto Submitted"] }
            });

            list.push({
                _id: t._id,
                title: t.title,
                testType: t.testType || "Aptitude",
                totalQuestions: t.totalQuestions || 10,
                submissionCount,
                createdAt: t.createdAt
            });
        }

        res.status(200).json({ exams: list });
    } catch (error) {
        console.error("Error fetching leaderboard exams list:", error);
        res.status(500).json({ message: "Failed to fetch leaderboard exams list" });
    }
};

module.exports = {
    generateLeaderboard,
    getLeaderboard,
    getStudentRank,
    getLeaderboardExams
};