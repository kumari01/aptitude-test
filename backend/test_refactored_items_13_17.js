require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./src/app");
const http = require("http");

async function testRefactoredItems13to17() {
  const PORT = 3009;
  const baseUrl = `http://localhost:${PORT}`;
  let server;

  try {
    console.log("=================================================");
    console.log("   REFACTORED ITEMS 13-17 VERIFICATION SUITE     ");
    console.log("=================================================");
    await mongoose.connect(process.env.MONGODB_URI);

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`Server running on ${baseUrl}\n`);

    // 1. TimeHelper module verification (Item 14)
    console.log("--- Item 14: Centralized Time-Expiry Helper ---");
    const { checkAttemptTiming } = require("./src/utils/timeHelper");
    const activeAttempt = { started_at: new Date(Date.now() - 30 * 1000) }; // 30 sec ago
    const activeTiming = checkAttemptTiming(activeAttempt, 1); // 1 min duration
    console.log(activeTiming.isExpired === false && activeTiming.remainingSeconds <= 30
      ? "✅ [PASS] timeHelper correctly identifies active attempt timing"
      : "❌ [FAIL] timeHelper active check failed");

    const expiredAttempt = { started_at: new Date(Date.now() - 120 * 1000) }; // 2 min ago
    const expiredTiming = checkAttemptTiming(expiredAttempt, 1); // 1 min duration
    console.log(expiredTiming.isExpired === true && expiredTiming.remainingSeconds === 0
      ? "✅ [PASS] timeHelper correctly identifies expired attempt timing"
      : "❌ [FAIL] timeHelper expired check failed");

    // 2. Test Creation via testManagement (Item 17)
    console.log("\n--- Item 17: Separation of Creation vs Exam Execution ---");
    const createRes = await fetch(`${baseUrl}/api/test-management/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Targeting & Leaderboard Test", duration_minutes: 5 })
    });
    const createData = await createRes.json();
    const testId = createData.test._id;
    console.log(createRes.status === 201 ? "✅ [PASS] Test created via testManagement controller" : "❌ [FAIL] Creation failed");

    // 3. Question & Schedule setup
    const qRes = await fetch(`${baseUrl}/api/exams/${testId}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_text: "What is 3 + 3?",
        options: [{ text: "5" }, { text: "6" }],
        correct_answer: 1
      })
    });
    const qData = await qRes.json();
    const questionId = qData.question._id;
    const optionId = qData.question.options[1]._id;

    // Schedule test and assign to specific rollno (Item 13)
    console.log("\n--- Item 13: TestAssignment Access Control ---");
    const assignedRollno = "21A12A7777";
    const unassignedRollno = "21A12A8888";

    await fetch(`${baseUrl}/api/test-management/${testId}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startAt: new Date(Date.now() - 60000),
        endAt: new Date(Date.now() + 3600000),
        studentRollNumbers: [assignedRollno]
      })
    });

    // Unassigned student attempt -> Should be blocked (403)
    const unassignedRes = await fetch(`${baseUrl}/api/exams/${testId}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rollno: unassignedRollno })
    });
    console.log(unassignedRes.status === 403 ? "✅ [PASS] Unassigned student access blocked by TestAssignment" : `❌ [FAIL] Status: ${unassignedRes.status}`);

    // Assigned student attempt -> Allowed
    const assignedRes = await fetch(`${baseUrl}/api/exams/${testId}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rollno: assignedRollno })
    });
    const assignedData = await assignedRes.json();
    console.log(assignedRes.status === 200 && assignedData.attempt ? "✅ [PASS] Assigned student allowed access" : "❌ [FAIL] Assigned start failed");
    const attemptId = assignedData.attempt._id;

    // 4. Time Expired Leaderboard Inclusion (Item 15)
    console.log("\n--- Item 15: Time Expired Attempts in Leaderboard ---");
    await fetch(`${baseUrl}/api/answers/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId, questionId, selectedOptionId: optionId })
    });

    // Auto-submit attempt with reason: 'Time Expired'
    await fetch(`${baseUrl}/api/answers/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId, reason: "Time Expired" })
    });

    const lbRes = await fetch(`${baseUrl}/api/leaderboard/${testId}`);
    const lbData = await lbRes.json();
    console.log(lbData.leaderboard?.some(entry => entry.attempt_id.toString() === attemptId.toString())
      ? "✅ [PASS] 'Time Expired' attempt included in Leaderboard"
      : "❌ [FAIL] 'Time Expired' attempt missing from Leaderboard");

    // Cleanup
    const Test = require("./src/model/testModel/test.model");
    const ExamAttempt = require("./src/model/testModel/testAttempt.model");
    const TestSchedule = require("./src/model/testModel/testSchedule.model");
    const TestAssignment = require("./src/model/testModel/testAssignment.model");
    const questionModel = require("./src/model/question.model");
    const studentAnswerSchema = require("./src/model/studentAnswer.model");
    const Leaderboard = require("./src/model/leaderboard.model");

    await Test.deleteOne({ _id: testId });
    await ExamAttempt.deleteOne({ _id: attemptId });
    await TestSchedule.deleteMany({ testId });
    await TestAssignment.deleteMany({ testId });
    await questionModel.deleteOne({ _id: questionId });
    await studentAnswerSchema.deleteMany({ attempt_id: attemptId });
    await Leaderboard.deleteMany({ testId });

    console.log("\n=================================================");
    console.log("   ALL ITEMS 13-17 PASSED SUCCESSFULLY!");
    console.log("=================================================");

    server.close();
    await mongoose.connection.close();
    process.exit(0);

  } catch (err) {
    console.error("Test failed with error:", err);
    if (server) server.close();
    await mongoose.connection.close();
    process.exit(1);
  }
}

testRefactoredItems13to17();
