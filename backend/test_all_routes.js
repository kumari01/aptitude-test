require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./src/app");
const http = require("http");

async function testAllRoutes() {
  const PORT = 3005;
  const baseUrl = `http://localhost:${PORT}`;
  let server;

  try {
    console.log("=================================================");
    console.log("   ADMIN AUTHORIZATION & ROUTE VERIFICATION SUITE ");
    console.log("=================================================");
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB successfully!\n");

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`Test Server running on ${baseUrl}\n`);

    let passed = 0;
    let total = 0;

    function assertRoute(condition, name, info = "") {
      total++;
      if (condition) {
        passed++;
        console.log(`✅ [PASS] ${name}`);
      } else {
        console.log(`❌ [FAIL] ${name} - ${info}`);
      }
    }

    // 1. Root & Misc Routes
    console.log("--- 1. Root & Misc Routes ---");
    const rootRes = await fetch(`${baseUrl}/`);
    const rootText = await rootRes.text();
    assertRoute(rootRes.status === 200 && rootText.includes("Quiz App API"), "GET /", `Status: ${rootRes.status}`);

    const helloRes = await fetch(`${baseUrl}/api/exams/hello`);
    const helloText = await helloRes.text();
    assertRoute(helloRes.status === 200 && helloText.includes("Hello"), "GET /api/exams/hello", `Status: ${helloRes.status}`);

    // 2. Auth Routes & Role Setup
    console.log("\n--- 2. Auth Routes ---");
    const randId = Math.floor(1000 + Math.random() * 9000);
    const subId = String(Math.floor(10 + Math.random() * 90));
    const testRollNo = `21A12A${subId}01`;
    const testPassword = "Password123!";

    // Student Signup & Login
    const signupRes = await fetch(`${baseUrl}/api/auth/student/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: `student_${randId}`,
        rollno: testRollNo,
        email: `student_${randId}@sasi.ac.in`,
        password: testPassword
      })
    });
    const signupData = await signupRes.json();
    assertRoute(signupRes.status === 201 && signupData.student, "POST /api/auth/student/signup", `Status: ${signupRes.status}`);
    const studentId = signupData.student?._id;

    const loginRes = await fetch(`${baseUrl}/api/auth/student/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rollno: testRollNo, password: testPassword })
    });
    const loginData = await loginRes.json();
    assertRoute(loginRes.status === 200 && loginData.token, "POST /api/auth/student/login", `Status: ${loginRes.status}`);
    const studentToken = loginData.token;

    // Protected Student Profile & Progress
    const profileRes = await fetch(`${baseUrl}/api/auth/student/profile`, {
      headers: { "Authorization": `Bearer ${studentToken}` }
    });
    assertRoute(profileRes.status === 200, "GET /api/auth/student/profile", `Status: ${profileRes.status}`);

    const progressRes = await fetch(`${baseUrl}/api/auth/student/progress`, {
      headers: { "Authorization": `Bearer ${studentToken}` }
    });
    assertRoute(progressRes.status === 200, "GET /api/auth/student/progress", `Status: ${progressRes.status}`);

    // Admin Signup & Login
    const adminId = `ADM${randId}`;
    const adminSignupRes = await fetch(`${baseUrl}/api/auth/admin/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: `admin_${randId}`,
        adminid: adminId,
        email: `admin_${randId}@sasi.ac.in`,
        password: testPassword
      })
    });
    const adminSignupData = await adminSignupRes.json();
    assertRoute(adminSignupRes.status === 201 && adminSignupData.admin, "POST /api/auth/admin/signup", `Status: ${adminSignupRes.status}`);
    const createdAdminId = adminSignupData.admin?._id;

    const adminLoginRes = await fetch(`${baseUrl}/api/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminid: adminId, password: testPassword })
    });
    const adminLoginData = await adminLoginRes.json();
    assertRoute(adminLoginRes.status === 200 && adminLoginData.token, "POST /api/auth/admin/login", `Status: ${adminLoginData.token ? 200 : adminLoginRes.status}`);
    const adminToken = adminLoginData.token;

    // 3. Security Assertions A - G
    console.log("\n--- 3. Required Security Test Cases (A - G) ---");

    // Case A: Admin login -> create test -> SUCCESS
    const caseARes = await fetch(`${baseUrl}/api/exams/create`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: "Security Test Exam A",
        duration_minutes: 30,
        total_marks: 10
      })
    });
    const caseAData = await caseARes.json();
    assertRoute(caseARes.status === 201 && caseAData.test?.createdBy === createdAdminId, "Case A: Admin login -> create test -> SUCCESS (createdBy set to admin id)", `Status: ${caseARes.status}`);
    const testId = caseAData.test?._id;

    // Case B: Admin login -> add question -> SUCCESS
    const caseBRes = await fetch(`${baseUrl}/api/exams/${testId}/questions`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        question_text: "What is 10 + 10?",
        options: [{ text: "15" }, { text: "20" }, { text: "25" }],
        correct_answer: 1,
        marks: 2
      })
    });
    const caseBData = await caseBRes.json();
    assertRoute(caseBRes.status === 201 && caseBData.question, "Case B: Admin login -> add question -> SUCCESS", `Status: ${caseBRes.status}`);
    const questionId = caseBData.question?._id;
    const correctOptionId = caseBData.question?.options[1]?._id;

    // Case C: Student login -> create test -> 403
    const caseCRes = await fetch(`${baseUrl}/api/exams/create`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${studentToken}`
      },
      body: JSON.stringify({ title: "Unauthorized Student Test" })
    });
    assertRoute(caseCRes.status === 403, "Case C: Student login -> create test -> 403", `Status: ${caseCRes.status}`);

    // Case D: Student login -> add question -> 403
    const caseDRes = await fetch(`${baseUrl}/api/exams/${testId}/questions`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${studentToken}`
      },
      body: JSON.stringify({ question_text: "Forbidden Question" })
    });
    assertRoute(caseDRes.status === 403, "Case D: Student login -> add question -> 403", `Status: ${caseDRes.status}`);

    // Case E: No token -> create test -> 401
    const caseERes = await fetch(`${baseUrl}/api/exams/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Unauthenticated Test" })
    });
    assertRoute(caseERes.status === 401, "Case E: No token -> create test -> 401", `Status: ${caseERes.status}`);

    // Case F: Student login -> start exam -> SUCCESS
    const caseFRes = await fetch(`${baseUrl}/api/exams/${testId}/start`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${studentToken}`
      }
    });
    const caseFData = await caseFRes.json();
    assertRoute(caseFRes.status === 200 && caseFData.attempt, "Case F: Student login -> start exam -> SUCCESS", `Status: ${caseFRes.status}`);
    const attemptId = caseFData.attempt?._id;

    // Case G: Admin login -> start exam -> 403
    const caseGRes = await fetch(`${baseUrl}/api/exams/${testId}/start`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      }
    });
    assertRoute(caseGRes.status === 403, "Case G: Admin login -> start exam -> 403", `Status: ${caseGRes.status}`);

    // 4. Test Management & Section Admin Routes
    console.log("\n--- 4. Test Management & Section Admin Routes ---");
    const tmCreateRes = await fetch(`${baseUrl}/api/test-management/create`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({ title: "Managed Admin Test 1" })
    });
    const tmCreateData = await tmCreateRes.json();
    assertRoute(tmCreateRes.status === 201 && tmCreateData.test, "POST /api/test-management/create (Admin)", `Status: ${tmCreateRes.status}`);
    const tmTestId = tmCreateData.test?._id;

    const tmDetailsRes = await fetch(`${baseUrl}/api/test-management/${tmTestId}`, {
      headers: { "Authorization": `Bearer ${studentToken}` }
    });
    assertRoute(tmDetailsRes.status === 200, "GET /api/test-management/:testId", `Status: ${tmDetailsRes.status}`);

    const tmSettingsRes = await fetch(`${baseUrl}/api/test-management/${tmTestId}/settings`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({ tabSwitchLimit: 3 })
    });
    assertRoute(tmSettingsRes.status === 200, "PUT /api/test-management/:testId/settings (Admin)", `Status: ${tmSettingsRes.status}`);

    const tmTargetRes = await fetch(`${baseUrl}/api/test-management/${tmTestId}/target`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({ targetType: "All" })
    });
    assertRoute(tmTargetRes.status === 200, "PUT /api/test-management/:testId/target (Admin)", `Status: ${tmTargetRes.status}`);

    const tmTargetStudentRes = await fetch(`${baseUrl}/api/test-management/${tmTestId}/target`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${studentToken}`
      },
      body: JSON.stringify({ targetType: "All" })
    });
    assertRoute(tmTargetStudentRes.status === 403, "PUT /api/test-management/:testId/target (Student -> 403)", `Status: ${tmTargetStudentRes.status}`);

    const tmScheduleRes = await fetch(`${baseUrl}/api/test-management/${tmTestId}/schedule`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        startAt: new Date(),
        endAt: new Date(Date.now() + 3600000),
        studentRollNumbers: [testRollNo]
      })
    });
    assertRoute(tmScheduleRes.status === 200, "POST /api/test-management/:testId/schedule (Admin)", `Status: ${tmScheduleRes.status}`);

    // Create Section (Admin)
    const createSectionRes = await fetch(`${baseUrl}/api/test-management/${tmTestId}/sections`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({ name: "Mathematics Section", displayOrder: 1 })
    });
    const createSectionData = await createSectionRes.json();
    assertRoute(createSectionRes.status === 201 && createSectionData.section, "POST /api/test-management/:testId/sections (Admin)", `Status: ${createSectionRes.status}`);
    const sectionId = createSectionData.section?._id;

    // Add Question to Section (Admin)
    const addSectionQuestionRes = await fetch(`${baseUrl}/api/test-management/sections/${sectionId}/questions`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({ questionId, displayOrder: 1, marks: 2 })
    });
    assertRoute(addSectionQuestionRes.status === 201, "POST /api/test-management/sections/:sectionId/questions (Admin)", `Status: ${addSectionQuestionRes.status}`);

    // List Student Assigned
    const tmAssignedRes = await fetch(`${baseUrl}/api/test-management/student/assigned?rollNumber=${testRollNo}`, {
      headers: { "Authorization": `Bearer ${studentToken}` }
    });
    assertRoute(tmAssignedRes.status === 200, "GET /api/test-management/student/assigned (Student)", `Status: ${tmAssignedRes.status}`);

    // 5. Answer Routes (Student)
    console.log("\n--- 5. Answer Routes ---");
    const saveAnswerRes = await fetch(`${baseUrl}/api/answers/save`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        attemptId,
        questionId,
        selectedOptionId: correctOptionId
      })
    });
    assertRoute(saveAnswerRes.status === 200, "POST /api/answers/save", `Status: ${saveAnswerRes.status}`);

    const getAnswersRes = await fetch(`${baseUrl}/api/answers/attempt/${attemptId}`, {
      headers: { "Authorization": `Bearer ${studentToken}` }
    });
    assertRoute(getAnswersRes.status === 200, "GET /api/answers/attempt/:attemptId", `Status: ${getAnswersRes.status}`);

    const submitAnswerRes = await fetch(`${baseUrl}/api/answers/submit`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${studentToken}`
      },
      body: JSON.stringify({ attemptId })
    });
    assertRoute(submitAnswerRes.status === 200, "POST /api/answers/submit", `Status: ${submitAnswerRes.status}`);

    const resultsRes = await fetch(`${baseUrl}/api/answers/results/${attemptId}`, {
      headers: { "Authorization": `Bearer ${studentToken}` }
    });
    assertRoute(resultsRes.status === 200, "GET /api/answers/results/:attemptId", `Status: ${resultsRes.status}`);

    // 6. Leaderboard Routes
    console.log("\n--- 6. Leaderboard Routes ---");
    const leaderboardRes = await fetch(`${baseUrl}/api/leaderboard/${testId}`);
    assertRoute(leaderboardRes.status === 200, "GET /api/leaderboard/:examId", `Status: ${leaderboardRes.status}`);

    const studentRankRes = await fetch(`${baseUrl}/api/leaderboard/${testId}/student/${studentId}`);
    assertRoute(studentRankRes.status === 200, "GET /api/leaderboard/:examId/student/:studentId", `Status: ${studentRankRes.status}`);

    // Cleanup Database Artifacts created during test
    const { Student, Admin } = require("./src/model/user.model");
    const Test = require("./src/model/testModel/test.model");
    const TestAttempt = require("./src/model/testModel/testAttempt.model");
    const TestSchedule = require("./src/model/testModel/testSchedule.model");
    const TestAssignment = require("./src/model/testModel/testAssignment.model");
    const Leaderboard = require("./src/model/leaderboard.model");
    const questionModel = require("./src/model/question.model");
    const Section = require("./src/model/sectionModel/section.model");
    const SectionQuestion = require("./src/model/sectionModel/sectionQuestion.model");

    if (studentId) await Student.deleteOne({ _id: studentId });
    if (createdAdminId) await Admin.deleteOne({ _id: createdAdminId });
    if (testId || tmTestId) await Test.deleteMany({ _id: { $in: [testId, tmTestId].filter(Boolean) } });
    if (attemptId) await TestAttempt.deleteOne({ _id: attemptId });
    if (testId) await Leaderboard.deleteMany({ testId });
    if (questionId) await questionModel.deleteOne({ _id: questionId });
    if (sectionId) {
      await Section.deleteOne({ _id: sectionId });
      await SectionQuestion.deleteMany({ sectionId });
    }
    await TestSchedule.deleteMany({ testId: { $in: [testId, tmTestId].filter(Boolean) } });
    await TestAssignment.deleteMany({ testId: { $in: [testId, tmTestId].filter(Boolean) } });

    console.log("\n=================================================");
    console.log(`   FINAL RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed/total)*100)}%)`);
    console.log("=================================================");

    server.close();
    await mongoose.connection.close();
    process.exit(passed === total ? 0 : 1);

  } catch (err) {
    console.error("Test failed with error:", err);
    if (server) server.close();
    await mongoose.connection.close();
    process.exit(1);
  }
}

testAllRoutes();
