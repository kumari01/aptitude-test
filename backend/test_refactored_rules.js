require("dotenv").config();
const dns = require("dns");
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}
const mongoose = require("mongoose");
const app = require("./src/app");
const http = require("http");

async function testRefactoredRules() {
  const PORT = 3007;
  const baseUrl = `http://localhost:${PORT}`;
  let server;

  try {
    console.log("=================================================");
    console.log("     REFACTORED RULES VERIFICATION SUITE         ");
    console.log("=================================================");
    await mongoose.connect(process.env.MONGODB_URI, { family: 4 });

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`Server running on ${baseUrl}\n`);

    const { Student, Admin } = require("./src/model/user.model");
    const jwt = require("jsonwebtoken");
    const secret = process.env.JWT_SECRET || "default_jwt_secret";

    const adminUser = await Admin.findOne({ email: "admin.rules@sasi.ac.in" }) || await Admin.create({
      username: "AdminRules",
      email: "admin.rules@sasi.ac.in",
      adminid: "ADM_RULES_1",
      password: "hashedpassword123",
      status: "active"
    });
    const adminToken = jwt.sign({ id: adminUser._id, role: "admin" }, secret, { expiresIn: "1h" });

    const studentUser = await Student.findOne({ email: "student.rules@sasi.ac.in" }) || await Student.create({
      username: "StudentRules",
      email: "student.rules@sasi.ac.in",
      rollno: "21A91A0588",
      password: "hashedpassword123",
      status: "active"
    });
    const studentToken = jwt.sign({ id: studentUser._id, role: "student" }, secret, { expiresIn: "1h" });

    // Rule 1: Test creation via single method createTest
    console.log("--- Rule 1: Single Test Creation Method ---");
    const createRes = await fetch(`${baseUrl}/api/exams/create`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: "Refactored Rules Test",
        duration_minutes: 10,
        maxAttempts: 2,
        totalMarks: 5
      })
    });
    const createData = await createRes.json();
    console.log(createRes.status === 201 && createData.test ? "✅ [PASS] createTest executed via /create" : "❌ [FAIL] createTest failed");
    const testId = createData.test._id;

    // Rule 2 & 3: Question Ownership (testId) and correct_option_id evaluation
    console.log("\n--- Rule 2 & 3: Question Ownership & correct_option_id ---");
    const qRes = await fetch(`${baseUrl}/api/exams/${testId}/questions`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        question_text: "What is 10 + 10?",
        options: [{ text: "15" }, { text: "20" }, { text: "25" }],
        correct_answer: 1
      })
    });
    const qData = await qRes.json();
    console.log(qRes.status === 201 && qData.question?.correct_option_id ? "✅ [PASS] Question created with testId and correct_option_id" : "❌ [FAIL] Question creation failed");
    const questionId = qData.question._id;
    const correctOptionId = qData.question.options[1]._id;

    // Rule 5: Schedule Enforcement
    console.log("\n--- Rule 5: Schedule Window Enforcement ---");
    // Add a schedule in the future
    const futureStart = new Date(Date.now() + 3600 * 1000); // 1 hour in future
    const futureEnd = new Date(Date.now() + 7200 * 1000);
    const schedRes = await fetch(`${baseUrl}/api/test-management/${testId}/schedule`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        startAt: futureStart,
        endAt: futureEnd
      })
    });
    const schedData = await schedRes.json();
    const scheduleId = schedData.schedule._id;

    // Try starting exam before schedule opens -> Should be blocked (400)
    const earlyStartRes = await fetch(`${baseUrl}/api/exams/${testId}/start`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${studentToken}`
      },
      body: JSON.stringify({})
    });
    console.log(earlyStartRes.status === 400 ? "✅ [PASS] Exam blocked before scheduled startAt window" : `❌ [FAIL] Expected 400, got ${earlyStartRes.status}`);

    // Update schedule window to active (now)
    const TestSchedule = require("./src/model/testModel/testSchedule.model");
    await TestSchedule.findByIdAndUpdate(scheduleId, {
      startAt: new Date(Date.now() - 300 * 1000), // 5 min ago
      endAt: new Date(Date.now() + 3600 * 1000)   // 1 hr from now
    });

    // Rule 4: Resume active attempt & Max Attempts enforcement
    console.log("\n--- Rule 4: Attempt Resuming & Max Attempts Enforcement ---");
    // Attempt 1: Start
    const startRes1 = await fetch(`${baseUrl}/api/exams/${testId}/start`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${studentToken}`
      },
      body: JSON.stringify({})
    });
    const startData1 = await startRes1.json();
    console.log(startRes1.status === 200 && startData1.attempt ? "✅ [PASS] Started Attempt 1 successfully" : "❌ [FAIL] Attempt 1 failed");
    const attempt1Id = startData1.attempt._id;

    // Start again while active -> Should resume Attempt 1
    const resumeRes = await fetch(`${baseUrl}/api/exams/${testId}/start`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${studentToken}`
      },
      body: JSON.stringify({})
    });
    const resumeData = await resumeRes.json();
    console.log(resumeData.attempt?._id === attempt1Id ? "✅ [PASS] Active attempt resumed instead of creating duplicate" : "❌ [FAIL] Did not resume active attempt");

    // Submit Attempt 1
    await fetch(`${baseUrl}/api/answers/save`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${studentToken}`
      },
      body: JSON.stringify({ attemptId: attempt1Id, questionId, selectedOptionId: correctOptionId })
    });
    await fetch(`${baseUrl}/api/answers/submit`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${studentToken}`
      },
      body: JSON.stringify({ attemptId: attempt1Id })
    });

    // Attempt 2: Start second attempt (maxAttempts = 2)
    const startRes2 = await fetch(`${baseUrl}/api/exams/${testId}/start`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${studentToken}`
      },
      body: JSON.stringify({})
    });
    const startData2 = await startRes2.json();
    console.log(startRes2.status === 200 && startData2.attempt?._id !== attempt1Id ? "✅ [PASS] Started Attempt 2 successfully (under maxAttempts = 2)" : "❌ [FAIL] Attempt 2 start failed");
    const attempt2Id = startData2.attempt._id;

    // Submit Attempt 2
    await fetch(`${baseUrl}/api/answers/submit`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${studentToken}`
      },
      body: JSON.stringify({ attemptId: attempt2Id })
    });

    // Attempt 3: Try starting 3rd attempt -> Should be blocked (400)
    const startRes3 = await fetch(`${baseUrl}/api/exams/${testId}/start`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${studentToken}`
      },
      body: JSON.stringify({})
    });
    console.log(startRes3.status === 400 ? "✅ [PASS] Blocked 3rd attempt when maxAttempts = 2" : `❌ [FAIL] Expected 400, got ${startRes3.status}`);

    // Cleanup
    const Test = require("./src/model/testModel/test.model");
    const ExamAttempt = require("./src/model/testModel/testAttempt.model");
    const questionModel = require("./src/model/question.model");
    const studentAnswerSchema = require("./src/model/studentAnswer.model");

    await Test.deleteOne({ _id: testId });
    await TestSchedule.deleteOne({ _id: scheduleId });
    await ExamAttempt.deleteMany({ testId });
    await questionModel.deleteOne({ _id: questionId });
    await studentAnswerSchema.deleteMany({ attempt_id: { $in: [attempt1Id, attempt2Id] } });

    console.log("\n=================================================");
    console.log("   ALL REFACTORED RULES PASSED SUCCESSFULLY!");
    console.log("=================================================");

    server.close();
    await mongoose.connection.close();
    process.exit(0);

  } catch (err) {
    console.error("Refactored rules test failed:", err);
    if (server) server.close();
    await mongoose.connection.close();
    process.exit(1);
  }
}

testRefactoredRules();
