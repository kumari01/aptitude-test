require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./src/app");
const http = require("http");

async function runFullFlowTests() {
  const PORT = 3004;
  const baseUrl = `http://localhost:${PORT}`;
  let server;

  // Models for cleanup
  const Test = require("./src/model/testModel/test.model");
  const TestAttempt = require("./src/model/testModel/testAttempt.model");
  const { Student } = require("./src/model/user.model");
  const Question = require("./src/model/question.model");
  const StudentAnswer = require("./src/model/studentAnswer.model");
  const Leaderboard = require("./src/model/leaderboard.model");
  const ProctoringSession = require("./src/model/proctoring/proctoringSession");
  const ProctoringEvent = require("./src/model/proctoring/proctoringEvent");

  let createdTest = null;
  let createdStudent = null;
  let createdAttempt = null;
  let createdQuestion = null;
  let createdAnswer = null;
  let createdSession = null;

  let passedTests = 0;
  let totalTests = 0;

  function assertTest(condition, testName, details = "") {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ [PASS] ${testName}`);
    } else {
      console.log(`❌ [FAIL] ${testName} - ${details}`);
    }
  }

  try {
    console.log("==========================================");
    console.log("     FULL FLOW API TEST SUITE             ");
    console.log("==========================================");
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB successfully!\n");

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`Test Server running on ${baseUrl}\n`);

    const randId = Math.floor(1000 + Math.random() * 9000);
    const testRollNo = `21A12A${randId}`;
    const testPassword = "SecurePassword123!";
    const testUser = {
      username: `flowuser_${randId}`,
      rollno: testRollNo,
      email: `flow_${randId}@sasi.ac.in`,
      password: testPassword,
    };

    // ========== 1. AUTH FLOW ==========
    console.log("--- 1. AUTH FLOW ---");

    // 1a. Student Signup
    const signupRes = await fetch(`${baseUrl}/api/auth/student/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });
    const signupData = await signupRes.json();
    createdStudent = signupData.student;
    assertTest(
      signupRes.status === 201 && createdStudent && createdStudent._id,
      "POST /api/auth/student/signup - Student created",
      `Status: ${signupRes.status}`
    );

    // 1b. Student Login
    const loginRes = await fetch(`${baseUrl}/api/auth/student/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rollno: testRollNo, password: testPassword }),
    });
    const loginData = await loginRes.json();
    assertTest(
      loginRes.status === 200 && loginData.token,
      "POST /api/auth/student/login - Login returns token",
      `Status: ${loginRes.status}`
    );

    // 1c. Protected Profile
    const profileRes = await fetch(`${baseUrl}/api/auth/student/profile`, {
      headers: { Authorization: `Bearer ${loginData.token}` },
    });
    const profileData = await profileRes.json();
    assertTest(
      profileRes.status === 200 && profileData.student,
      "GET /api/auth/student/profile - Protected profile works",
      `Status: ${profileRes.status}`
    );

    // ========== 2. EXAM FLOW ==========
    console.log("\n--- 2. EXAM FLOW ---");

    // 2a. Create Exam
    const examRes = await fetch(`${baseUrl}/api/exams/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `Flow Test Exam ${randId}`,
        testType: "Aptitude",
        totalMarks: 2,
        maxAttempts: 1,
      }),
    });
    const examData = await examRes.json();
    createdTest = examData.test || examData.exam;
    assertTest(
      examRes.status === 201 && createdTest && createdTest._id,
      "POST /api/exams/create - Exam created",
      `Status: ${examRes.status}`
    );

    // 2b. Add Question
    const qRes = await fetch(`${baseUrl}/api/exams/${createdTest._id}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_text: "What is 2 + 2?",
        options: [{ text: "3" }, { text: "4" }, { text: "5" }],
        correct_answer: 1,
        marks: 2,
      }),
    });
    const qData = await qRes.json();
    createdQuestion = qData.question;
    assertTest(
      qRes.status === 201 && createdQuestion && createdQuestion._id,
      "POST /api/exams/:examId/questions - Question created",
      `Status: ${qRes.status}`
    );

    // 2c. Start Exam Attempt
    const startRes = await fetch(`${baseUrl}/api/exams/${createdTest._id}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: createdStudent._id }),
    });
    const startData = await startRes.json();
    createdAttempt = startData.attempt;
    assertTest(
      startRes.status === 200 && createdAttempt && createdAttempt._id,
      "POST /api/exams/:examId/start - Attempt started",
      `Status: ${startRes.status}`
    );
    assertTest(
      createdAttempt && createdAttempt.status === "Started",
      "Attempt status is 'Started'",
      `Status: ${createdAttempt ? createdAttempt.status : "N/A"}`
    );
    assertTest(
      createdAttempt && createdAttempt.exam_id && createdAttempt.exam_id.toString() === createdTest._id.toString(),
      "Attempt has exam_id set correctly",
      `exam_id: ${createdAttempt ? createdAttempt.exam_id : "N/A"}`
    );
    assertTest(
      createdAttempt && createdAttempt.student_id && createdAttempt.student_id.toString() === createdStudent._id.toString(),
      "Attempt has student_id set correctly",
      `student_id: ${createdAttempt ? createdAttempt.student_id : "N/A"}`
    );

    // 2d. Get Questions (correct_option_id hidden)
    const getQRes = await fetch(`${baseUrl}/api/exams/${createdTest._id}/questions`);
    const getQData = await getQRes.json();
    const questionObj = getQData.questions && getQData.questions[0];
    assertTest(
      getQRes.status === 200 && questionObj && questionObj._id,
      "GET /api/exams/:examId/questions - Questions fetched",
      `Status: ${getQRes.status}`
    );
    assertTest(
      questionObj && questionObj.correct_option_id === undefined,
      "correct_option_id is hidden from students",
      `correct_option_id: ${questionObj ? questionObj.correct_option_id : "N/A"}`
    );

    // ========== 3. ANSWER FLOW ==========
    console.log("\n--- 3. ANSWER FLOW ---");

    // 3a. Save Answer (correct option: index 1 = "4")
    const selectedOptionId = questionObj.options[1]._id;
    const saveRes = await fetch(`${baseUrl}/api/answers/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptId: createdAttempt._id,
        questionId: questionObj._id,
        selectedOptionId,
      }),
    });
    const saveData = await saveRes.json();
    createdAnswer = saveData.answer;
    assertTest(
      saveRes.status === 200 && createdAnswer && createdAnswer._id,
      "POST /api/answers/save - Answer saved",
      `Status: ${saveRes.status}`
    );

    // 3b. Get Saved Answers
    const getAnsRes = await fetch(`${baseUrl}/api/answers/attempt/${createdAttempt._id}`);
    const getAnsData = await getAnsRes.json();
    assertTest(
      getAnsRes.status === 200 && getAnsData.answers && getAnsData.answers.length === 1,
      "GET /api/answers/attempt/:attemptId - Answers retrieved",
      `Status: ${getAnsRes.status}, Count: ${getAnsData.answers ? getAnsData.answers.length : "N/A"}`
    );

    // 3c. Submit Exam
    const submitRes = await fetch(`${baseUrl}/api/answers/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId: createdAttempt._id }),
    });
    const submitData = await submitRes.json();
    assertTest(
      submitRes.status === 200 && submitData.score === 2,
      "POST /api/answers/submit - Exam submitted with correct score (2/2)",
      `Status: ${submitRes.status}, Score: ${submitData.score}`
    );
    assertTest(
      submitData.attempt && submitData.attempt.status === "Submitted",
      "Attempt status is 'Submitted' after submission",
      `Status: ${submitData.attempt ? submitData.attempt.status : "N/A"}`
    );

    // 3d. Get Results
    const resultRes = await fetch(`${baseUrl}/api/answers/results/${createdAttempt._id}`);
    const resultData = await resultRes.json();
    assertTest(
      resultRes.status === 200 && resultData.score === 2 && resultData.correctCount === 1,
      "GET /api/answers/results/:attemptId - Results correct (score 2, 1 correct)",
      `Status: ${resultRes.status}, Score: ${resultData.score}, Correct: ${resultData.correctCount}`
    );

    // ========== 4. LEADERBOARD FLOW ==========
    console.log("\n--- 4. LEADERBOARD FLOW ---");

    const lbRes = await fetch(`${baseUrl}/api/leaderboard/${createdTest._id}`);
    const lbData = await lbRes.json();
    assertTest(
      lbRes.status === 200 && lbData.totalStudents === 1,
      "GET /api/leaderboard/:examId - Leaderboard has 1 student",
      `Status: ${lbRes.status}, Total: ${lbData.totalStudents}`
    );
    assertTest(
      lbData.leaderboard && lbData.leaderboard[0] && lbData.leaderboard[0].rank === 1,
      "Leaderboard rank is 1",
      `Rank: ${lbData.leaderboard && lbData.leaderboard[0] ? lbData.leaderboard[0].rank : "N/A"}`
    );

    const lbStudentRes = await fetch(`${baseUrl}/api/leaderboard/${createdTest._id}/student/${createdStudent._id}`);
    const lbStudentData = await lbStudentRes.json();
    assertTest(
      lbStudentRes.status === 200 && lbStudentData.rank === 1,
      "GET /api/leaderboard/:examId/student/:studentId - Student rank is 1",
      `Status: ${lbStudentRes.status}, Rank: ${lbStudentData.rank}`
    );

    // ========== 5. PROCTORING FLOW ==========
    console.log("\n--- 5. PROCTORING FLOW ---");

    // 5a. Create Proctoring Session
    const sessRes = await fetch(`${baseUrl}/api/v1/proctoring/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const sessData = await sessRes.json();
    createdSession = sessData.data;
    assertTest(
      sessRes.status === 201 && createdSession && createdSession._id,
      "POST /api/v1/proctoring/sessions - Session created",
      `Status: ${sessRes.status}`
    );
    assertTest(
      createdSession && createdSession.status === "ACTIVE",
      "Proctoring session status is ACTIVE",
      `Status: ${createdSession ? createdSession.status : "N/A"}`
    );

    // 5b. Create Proctoring Event (TAB_SWITCH)
    const eventRes = await fetch(`${baseUrl}/api/v1/proctoring/sessions/${createdSession._id}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "TAB_SWITCH" }),
    });
    const eventData = await eventRes.json();
    assertTest(
      eventRes.status === 201 && eventData.data && eventData.data.event && eventData.data.event.eventType === "TAB_SWITCH",
      "POST /api/v1/proctoring/sessions/:sessionId/events - Event created",
      `Status: ${eventRes.status}`
    );
    assertTest(
      eventData.data && eventData.data.session && eventData.data.session.tabSwitchCount === 1,
      "Tab switch count incremented to 1",
      `Count: ${eventData.data && eventData.data.session ? eventData.data.session.tabSwitchCount : "N/A"}`
    );

    // 5c. Invalid Event Type rejected
    const invalidEventRes = await fetch(`${baseUrl}/api/v1/proctoring/sessions/${createdSession._id}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "INVALID_TYPE" }),
    });
    assertTest(
      invalidEventRes.status === 400,
      "Invalid proctoring event type rejected with 400",
      `Status: ${invalidEventRes.status}`
    );

    // 5d. Get Session
    const getSessRes = await fetch(`${baseUrl}/api/v1/proctoring/sessions/${createdSession._id}`);
    const getSessData = await getSessRes.json();
    assertTest(
      getSessRes.status === 200 && getSessData.data && getSessData.data._id,
      "GET /api/v1/proctoring/sessions/:sessionId - Session retrieved",
      `Status: ${getSessRes.status}`
    );

    // 5e. End Session
    const endSessRes = await fetch(`${baseUrl}/api/v1/proctoring/sessions/${createdSession._id}/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const endSessData = await endSessRes.json();
    assertTest(
      endSessRes.status === 200 && endSessData.data && endSessData.data.status === "COMPLETED",
      "POST /api/v1/proctoring/sessions/:sessionId/end - Session ended",
      `Status: ${endSessRes.status}, Session status: ${endSessData.data ? endSessData.data.status : "N/A"}`
    );
    assertTest(
      endSessData.data && endSessData.data.endedAt,
      "Session has endedAt timestamp",
      `endedAt: ${endSessData.data ? endSessData.data.endedAt : "N/A"}`
    );

    // ========== CLEANUP ==========
    console.log("\nCleaning up test resources...");
    if (createdTest) await Test.deleteOne({ _id: createdTest._id });
    if (createdStudent) await Student.deleteOne({ _id: createdStudent._id });
    if (createdAttempt) await TestAttempt.deleteOne({ _id: createdAttempt._id });
    if (createdQuestion) await Question.deleteOne({ _id: createdQuestion._id });
    if (createdAnswer) await StudentAnswer.deleteOne({ _id: createdAnswer._id });
    if (createdTest) await Leaderboard.deleteMany({ exam_id: createdTest._id });
    if (createdSession) {
      await ProctoringEvent.deleteMany({ sessionId: createdSession._id });
      await ProctoringSession.deleteOne({ _id: createdSession._id });
    }
    console.log("Cleanup completed.\n");

    console.log("==========================================");
    console.log(`   FULL FLOW TEST RESULTS: ${passedTests}/${totalTests} PASSED`);
    console.log("==========================================");

    if (server) server.close();
    await mongoose.connection.close();
    process.exit(passedTests === totalTests ? 0 : 1);
  } catch (err) {
    console.error("Full flow test failed with error:", err);
    // Cleanup on error
    try {
      if (createdTest) await Test.deleteOne({ _id: createdTest._id });
      if (createdStudent) await Student.deleteOne({ _id: createdStudent._id });
      if (createdAttempt) await TestAttempt.deleteOne({ _id: createdAttempt._id });
      if (createdQuestion) await Question.deleteOne({ _id: createdQuestion._id });
      if (createdAnswer) await StudentAnswer.deleteOne({ _id: createdAnswer._id });
      if (createdTest) await Leaderboard.deleteMany({ exam_id: createdTest._id });
      if (createdSession) {
        await ProctoringEvent.deleteMany({ sessionId: createdSession._id });
        await ProctoringSession.deleteOne({ _id: createdSession._id });
      }
    } catch (cleanErr) {
      console.error("Cleanup during catch failed:", cleanErr);
    }
    if (server) server.close();
    await mongoose.connection.close();
    process.exit(1);
  }
}

runFullFlowTests();