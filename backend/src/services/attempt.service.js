const ExamAttempt = require("../model/testModel/testAttempt.model");
const StudentAnswer = require("../model/studentAnswer.model");
const Question = require("../model/question.model");

const submitAttempt = async (attemptId, submissionType = "Submitted") => {
    // 1. Find attempt
    const attempt = await ExamAttempt.findById(attemptId);

    if (!attempt) {
        throw new Error("Attempt not found");
    }

    // 2. Don't submit an already completed attempt
    if (
        attempt.status === "Submitted" ||
        attempt.status === "Time Expired" ||
        attempt.status === "Auto Submitted"
    ) {
        throw new Error("Attempt has already been completed");
    }

    // 3. Get test ID
    const targetTestId = attempt.testId || attempt.exam_id;

    // 4. Get all questions belonging to this test
    const questions = await Question.find({
        $or: [
            { testId: targetTestId },
            { exam_id: targetTestId }
        ]
    });

    // 5. Get student's answers
    const answers = await StudentAnswer.find({
        attempt_id: attemptId
    });

    let totalScore = 0;
    let totalPossibleMarks = 0;

    // 6. Grade answers
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

        studentAnswer.is_correct = isCorrect;
        studentAnswer.marks_awarded = isCorrect
            ? questionMarks
            : 0;

        await studentAnswer.save();

        if (isCorrect) {
            totalScore += questionMarks;
        }
    }

    // 7. Update attempt
    attempt.score = totalScore;
    attempt.status = submissionType;
    attempt.submitted_at = new Date();

    await attempt.save();

    return {
        attempt,
        score: totalScore,
        totalMarks: totalPossibleMarks
    };
};

module.exports = {submitAttempt};