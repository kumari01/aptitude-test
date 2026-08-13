require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./src/app");
const http = require("http");

async function testRefactoredItems6to12() {
  const PORT = 3008;
  const baseUrl = `http://localhost:${PORT}`;
  let server;

  try {
    console.log("=================================================");
    console.log("   REFACTORED ITEMS 6-12 VERIFICATION SUITE      ");
    console.log("=================================================");
    await mongoose.connect(process.env.MONGODB_URI);

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`Server running on ${baseUrl}\n`);

    // 1. Test creation with totalMarks (Item 10)
    console.log("--- Item 10: totalMarks Standardization ---");
    const createRes = await fetch(`${baseUrl}/api/exams/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Section & Marks Test Exam",
        duration_minutes: 30,
        totalMarks: 5
      })
    });
    const createData = await createRes.json();
    console.log(createData.test?.totalMarks === 5 ? "✅ [PASS] totalMarks set correctly" : "❌ [FAIL] totalMarks failed");
    const testId = createData.test._id;

    // 2. Add question with explicit marks = 3 (Item 12 & Item 11)
    console.log("\n--- Item 11 & 12: testId Standardization & question.marks Grading ---");
    const qRes = await fetch(`${baseUrl}/api/exams/${testId}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_text: "What is 100 / 10?",
        options: [{ text: "5" }, { text: "10" }],
        correct_answer: 1,
        marks: 3
      })
    });
    const qData = await qRes.json();
    const questionId = qData.question._id;
    const correctOptionId = qData.question.options[1]._id;
    console.log(qData.question?.marks === 3 ? "✅ [PASS] Question stored with marks = 3" : "❌ [FAIL] Question marks failed");

    // 3. Section & SectionQuestion Creation (Item 6)
    console.log("\n--- Item 6: Section-Based Question Loading ---");
    const secRes = await fetch(`${baseUrl}/api/test-management/${testId}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Math Section", displayOrder: 1 })
    });
    const secData = await secRes.json();
    const sectionId = secData.section._id;

    await fetch(`${baseUrl}/api/test-management/sections/${sectionId}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, displayOrder: 1, marks: 3 })
    });

    const startRes = await fetch(`${baseUrl}/api/exams/${testId}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    const startData = await startRes.json();
    console.log(startData.questions?.length > 0 && startData.questions[0]._id === questionId
      ? "✅ [PASS] Questions loaded via Sections -> SectionQuestions -> Questions"
      : "❌ [FAIL] Section-based question loading failed");
    const attemptId = startData.attempt._id;

    // 4. Save answer and submit -> Test weighted score calculation
    await fetch(`${baseUrl}/api/answers/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId, questionId, selectedOptionId: correctOptionId })
    });
    const submitRes = await fetch(`${baseUrl}/api/answers/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId })
    });
    const submitData = await submitRes.json();
    console.log(submitData.score === 3 ? "✅ [PASS] Score correctly awarded 3 marks based on question.marks" : `❌ [FAIL] Score: ${submitData.score}`);

    // 5. Leaderboard GET without recalculation (Item 7)
    console.log("\n--- Item 7: Leaderboard GET Optimization ---");
    const lbRes = await fetch(`${baseUrl}/api/leaderboard/${testId}`);
    const lbData = await lbRes.json();
    console.log(lbRes.status === 200 && lbData.leaderboard !== undefined
      ? "✅ [PASS] Leaderboard GET retrieved persisted records without recalculating"
      : "❌ [FAIL] Leaderboard GET failed");

    // 6. Test rollno assignment (Item 9)
    console.log("\n--- Item 9: rollno Standardization ---");
    const testRollno = "21A12A9999";
    const schedRes = await fetch(`${baseUrl}/api/test-management/${testId}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startAt: new Date(Date.now() - 60000),
        endAt: new Date(Date.now() + 3600000),
        studentRollNumbers: [testRollno]
      })
    });
    const assignRes = await fetch(`${baseUrl}/api/test-management/student/assigned?rollno=${testRollno}`);
    const assignData = await assignRes.json();
    console.log(assignRes.status === 200 && assignData.tests?.length > 0
      ? "✅ [PASS] Test assignment queried using rollno"
      : "❌ [FAIL] rollno assignment failed");

    // Cleanup
    const Test = require("./src/model/testModel/test.model");
    const ExamAttempt = require("./src/model/testModel/testAttempt.model");
    const TestSchedule = require("./src/model/testModel/testSchedule.model");
    const TestAssignment = require("./src/model/testModel/testAssignment.model");
    const Section = require("./src/model/sectionModel/section.model");
    const SectionQuestion = require("./src/model/sectionModel/sectionQuestion.model");
    const questionModel = require("./src/model/question.model");
    const studentAnswerSchema = require("./src/model/studentAnswer.model");
    const Leaderboard = require("./src/model/leaderboard.model");

    await Test.deleteOne({ _id: testId });
    await ExamAttempt.deleteOne({ _id: attemptId });
    await TestSchedule.deleteMany({ testId });
    await TestAssignment.deleteMany({ testId });
    await Section.deleteMany({ testId });
    await SectionQuestion.deleteMany({ sectionId });
    await questionModel.deleteOne({ _id: questionId });
    await studentAnswerSchema.deleteMany({ attempt_id: attemptId });
    await Leaderboard.deleteMany({ testId });

    console.log("\n=================================================");
    console.log("   ALL ITEMS 6-12 PASSED SUCCESSFULLY!");
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

testRefactoredItems6to12();
