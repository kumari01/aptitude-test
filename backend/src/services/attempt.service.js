const ExamAttempt = require("../model/testModel/testAttempt.model");
const StudentAnswer = require("../model/studentAnswer.model");
const Question = require("../model/question.model");

const gradeAttemptInBackground = async (attemptId, submissionType) => {
    try {
        console.log(`[Background Grading] Starting for attempt ID: ${attemptId}`);
        const attempt = await ExamAttempt.findById(attemptId);
        if (!attempt) {
            console.log(`[Background Grading] ERROR: Attempt not found for ID: ${attemptId}`);
            return;
        }
        console.log(`[Background Grading] Found attempt. Test ID: ${attempt.testId || attempt.exam_id}`);

        // Get test ID
        const targetTestId = attempt.testId || attempt.exam_id;

        // Get all questions belonging to this test using unified question resolver (with answer key)
        const { getTestQuestions } = require("../utils/questionService");
        let questions = await getTestQuestions(targetTestId, { includeAnswerKey: true });
        console.log(`[Background Grading] Resolved questions count: ${questions.length}`);

        // Get student's answers
        const answers = await StudentAnswer.find({
            attempt_id: attemptId
        });
        console.log(`[Background Grading] Found student answers count: ${answers.length}`);

        if (questions.length === 0 && answers.length > 0) {
            console.log("[Background Grading] Falling back to query questions from answer IDs.");
            const answeredQIds = answers.map(a => a.question_id).filter(Boolean);
            questions = await Question.find({ _id: { $in: answeredQIds } });
            console.log(`[Background Grading] Fallback questions count: ${questions.length}`);
        }

        let totalScore = 0;
        let totalPossibleMarks = 0;
        const answerBulkOps = [];

        // Grade answers
        for (const question of questions) {
            const questionMarks = question.marks || 1;
            totalPossibleMarks += questionMarks;

            const studentAnswer = answers.find(
                (answer) =>
                    answer.question_id.toString() ===
                    question._id.toString()
            );

            if (!studentAnswer) {
                continue;
            }

            const isCorrect =
                question.correct_option_id &&
                studentAnswer.selected_option_id &&
                question.correct_option_id.toString() ===
                studentAnswer.selected_option_id.toString();

            answerBulkOps.push({
                updateOne: {
                    filter: { _id: studentAnswer._id },
                    update: {
                        $set: {
                            is_correct: isCorrect,
                            marks_awarded: isCorrect ? questionMarks : 0
                        }
                    }
                }
            });

            if (isCorrect) {
                totalScore += questionMarks;
            }
        }

        console.log(`[Background Grading] Answer grading loop done. Correct count: ${answerBulkOps.filter(op => op.updateOne.update.$set.is_correct).length}/${questions.length}. Bulk operations count: ${answerBulkOps.length}`);

        // Execute bulk update to optimize database write operations
        if (answerBulkOps.length > 0) {
            await StudentAnswer.bulkWrite(answerBulkOps);
            console.log("[Background Grading] StudentAnswer bulkWrite completed.");
        }

        // Update attempt with final scores and set isGraded = true
        const finalScore = submissionType === "Disqualified" ? 0 : totalScore;
        attempt.score = finalScore;
        attempt.obtainedMarks = finalScore;
        attempt.isGraded = true;
        await attempt.save();
        console.log(`[Background Grading] Attempt updated and saved. Score: ${finalScore}, isGraded: true`);

        // Update leaderboard
        const { generateLeaderboard } = require("../controllers/leaderboard.controller");
        const targetExamId = attempt.exam_id || attempt.testId;
        if (targetExamId) {
            console.log(`[Background Grading] Updating leaderboard for exam: ${targetExamId}`);
            await generateLeaderboard(targetExamId);
            console.log("[Background Grading] Leaderboard generation completed.");
        }
    } catch (err) {
        console.error("[Background Grading] Error in background grading:", err);
    }
};

const submitAttempt = async (attemptId, submissionType = "Submitted") => {
    // 1. Find attempt
    const attempt = await ExamAttempt.findById(attemptId);

    if (!attempt) {
        throw new Error("Attempt not found");
    }

    // 2. Don't submit an already completed or graded attempt
    if (
        attempt.status === "Submitted" ||
        attempt.status === "Time Expired" ||
        attempt.status === "Auto Submitted" ||
        attempt.status === "Completed" ||
        attempt.status === "Disqualified" ||
        attempt.isGraded
    ) {
        return {
            attempt,
            score: attempt.score || 0,
            totalMarks: 0
        };
    }

    // 3. Mark attempt status and submitted_at immediately (fast update)
    attempt.status = submissionType;
    attempt.submitted_at = new Date();
    attempt.isGraded = false; // Marks it as pending grading
    await attempt.save();

    // 4. Trigger grading asynchronously in the background without blocking the request
    setImmediate(() => {
        gradeAttemptInBackground(attempt._id.toString(), submissionType);
    });

    return {
        attempt,
        score: 0,
        totalMarks: 0
    };
};

module.exports = { submitAttempt, gradeAttemptInBackground };