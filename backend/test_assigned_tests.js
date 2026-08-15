require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./src/app");
const http = require("http");

async function testAssignedTests() {
  const PORT = 3005;
  const baseUrl = `http://localhost:${PORT}`;
  let server;

  const Test = require("./src/model/testModel/test.model");
  const TestSetting = require("./src/model/testModel/testSetting.model");
  const TestTarget = require("./src/model/testModel/testTarget.model");
  const TestSchedule = require("./src/model/testModel/testSchedule.model");
  const TestAssignment = require("./src/model/testModel/testAssignment.model");
  const { Student } = require("./src/model/user.model");

  let createdTest = null;
  let createdStudent = null;
  let createdSchedule = null;

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
    console.log("     ASSIGNED TESTS API TEST SUITE        ");
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
      username: `assigneduser_${randId}`,
      rollno: testRollNo,
      email: `assigned_${randId}@sasi.ac.in`,
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

    // ========== 2. CREATE TEST & ASSIGN ==========
    console.log("\n--- 2. CREATE TEST & ASSIGN ---");

    // 2a. Create test via test-management
    const createRes = await fetch(`${baseUrl}/api/test-management/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `Assigned Test ${randId}`,
        testType: "Aptitude",
        maxAttempts: 1,
        proctoringEnabled: true,
        tabSwitchLimit: 3,
        autoSubmit: true,
      }),
    });
    const createData = await createRes.json();
    createdTest = createData.test;
    assertTest(
      createRes.status === 201 && createdTest && createdTest._id,
      "POST /api/test-management/create - Test created",
      `Status: ${createRes.status}`
    );

    // 2b. Schedule & assign to the student
    const scheduleRes = await fetch(`${baseUrl}/api/test-management/${createdTest._id}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startAt: new Date(Date.now() - 3600000).toISOString(),
        endAt: new Date(Date.now() + 86400000).toISOString(),
        studentRollNumbers: [testRollNo],
      }),
    });
    const scheduleData = await scheduleRes.json();
    createdSchedule = scheduleData.schedule;
    assertTest(
      scheduleRes.status === 200 && scheduleData.totalAssigned === 1,
      "POST /api/test-management/:testId/schedule - Test assigned to student",
      `Status: ${scheduleRes.status}, Assigned: ${scheduleData.totalAssigned}`
    );

    // ========== 3. LIST ASSIGNED TESTS ==========
    console.log("\n--- 3. LIST ASSIGNED TESTS ---");

    // 3a. Unauthenticated request should be rejected
    const unauthRes = await fetch(`${baseUrl}/api/test-management/student/assigned`);
    assertTest(
      unauthRes.status === 401,
      "GET /api/test-management/student/assigned - Unauthenticated rejected with 401",
      `Status: ${unauthRes.status}`
    );

    // 3b. Authenticated request returns only assigned tests
    const assignedRes = await fetch(`${baseUrl}/api/test-management/student/assigned`, {
      headers: { Authorization: `Bearer ${loginData.token}` },
    });
    const assignedData = await assignedRes.json();
    assertTest(
      assignedRes.status === 200 && assignedData.tests && assignedData.tests.length === 1,
      "GET /api/test-management/student/assigned - Returns exactly 1 assigned test",
      `Status: ${assignedRes.status}, Count: ${assignedData.tests ? assignedData.tests.length : "N/A"}`
    );
    assertTest(
      assignedData.tests && assignedData.tests[0] && assignedData.tests[0].test._id.toString() === createdTest._id.toString(),
      "Assigned test matches the created test",
      `Test ID: ${assignedData.tests && assignedData.tests[0] ? assignedData.tests[0].test._id : "N/A"}`
    );
    assertTest(
      assignedData.tests && assignedData.tests[0] && assignedData.tests[0].setting,
      "Assigned test includes setting",
      `Setting: ${assignedData.tests && assignedData.tests[0] ? JSON.stringify(assignedData.tests[0].setting) : "N/A"}`
    );
    assertTest(
      assignedData.tests && assignedData.tests[0] && assignedData.tests[0].schedule,
      "Assigned test includes schedule",
      `Schedule: ${assignedData.tests && assignedData.tests[0] ? JSON.stringify(assignedData.tests[0].schedule) : "N/A"}`
    );

    // ========== CLEANUP ==========
    console.log("\nCleaning up test resources...");
    if (createdTest) await Test.deleteOne({ _id: createdTest._id });
    if (createdStudent) await Student.deleteOne({ _id: createdStudent._id });
    if (createdSchedule) await TestSchedule.deleteOne({ _id: createdSchedule._id });
    if (createdTest) await TestAssignment.deleteMany({ testId: createdTest._id });
    if (createdTest) await TestSetting.deleteMany({ testId: createdTest._id });
    if (createdTest) await TestTarget.deleteMany({ testId: createdTest._id });
    console.log("Cleanup completed.\n");

    console.log("==========================================");
    console.log(`   ASSIGNED TESTS TEST RESULTS: ${passedTests}/${totalTests} PASSED`);
    console.log("==========================================");

    if (server) server.close();
    await mongoose.connection.close();
    process.exit(passedTests === totalTests ? 0 : 1);
  } catch (err) {
    console.error("Assigned tests test failed with error:", err);
    try {
      if (createdTest) await Test.deleteOne({ _id: createdTest._id });
      if (createdStudent) await Student.deleteOne({ _id: createdStudent._id });
      if (createdSchedule) await TestSchedule.deleteOne({ _id: createdSchedule._id });
      if (createdTest) await TestAssignment.deleteMany({ testId: createdTest._id });
      if (createdTest) await TestSetting.deleteMany({ testId: createdTest._id });
      if (createdTest) await TestTarget.deleteMany({ testId: createdTest._id });
    } catch (cleanErr) {
      console.error("Cleanup during catch failed:", cleanErr);
    }
    if (server) server.close();
    await mongoose.connection.close();
    process.exit(1);
  }
}

testAssignedTests();