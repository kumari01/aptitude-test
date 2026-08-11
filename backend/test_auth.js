require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./src/app");
const http = require("http");

async function runAuthTests() {
  const PORT = 3002;
  const baseUrl = `http://localhost:${PORT}`;
  let server;

  try {
    console.log("==========================================");
    console.log("     AUTHENTICATION API TEST SUITE        ");
    console.log("==========================================");
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB successfully!\n");

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`Test Server running on ${baseUrl}\n`);

    const randId = Math.floor(1000 + Math.random() * 9000);
    // Roll number format pattern: ^\d{2}[A-Za-z]\d{2}[A-Za-z]\d{2}[A-Za-z0-9]{2}$ e.g. 21A12A0123
    const validRollNo = `21A12A${randId}`;
    const testUser = {
      username: `testuser_${randId}`,
      rollno: validRollNo,
      email: `student_${randId}@sasi.ac.in`,
      password: "SecurePassword123!"
    };

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

    // Test 1: Student Signup - Success
    console.log("--- 1. Testing Student Signup (Success Case) ---");
    const signupRes = await fetch(`${baseUrl}/api/auth/student/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser)
    });
    const signupData = await signupRes.json();
    console.log("Signup Response:", signupData);

    assertTest(
      signupRes.status === 201 && signupData.student && !signupData.student.password,
      "POST /api/auth/signup - Valid credentials created student & omitted password hash",
      `Status: ${signupRes.status}, Body: ${JSON.stringify(signupData)}`
    );

    // Test 2: Student Signup - Invalid Roll Number Format
    console.log("\n--- 2. Testing Student Signup (Invalid Roll Number Format) ---");
    const invalidRollRes = await fetch(`${baseUrl}/api/auth/student/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "invalidroll",
        rollno: "INVALID_ROLL_123",
        email: `invalidroll_${randId}@sasi.ac.in`,
        password: "Password123!"
      })
    });
    const invalidRollData = await invalidRollRes.json();
    console.log("Invalid Roll Response:", invalidRollData);

    assertTest(
      invalidRollRes.status === 400 && invalidRollData.message.includes("incorrect roll number format"),
      "POST /api/auth/signup - Invalid roll number format rejected with 400",
      `Status: ${invalidRollRes.status}, Message: ${invalidRollData.message}`
    );

    // Test 3: Student Signup - Missing Password
    console.log("\n--- 3. Testing Student Signup (Missing Password) ---");
    const noPassRes = await fetch(`${baseUrl}/api/auth/student/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: testUser.username + "_nopass",
        rollno: `22B34C${randId}`,
        email: `nopass_${testUser.email}`
      })
    });
    const noPassData = await noPassRes.json();
    console.log("Missing Password Response:", noPassData);

    assertTest(
      noPassRes.status === 400 && noPassData.message === "Password is required",
      "POST /api/auth/signup - Missing password rejected with 400",
      `Status: ${noPassRes.status}, Message: ${noPassData.message}`
    );

    // Test 4: Student Signup - Duplicate Roll No
    console.log("\n--- 4. Testing Student Signup (Duplicate Roll No) ---");
    const dupRes = await fetch(`${baseUrl}/api/auth/student/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: testUser.username + "_dup",
        rollno: testUser.rollno,
        email: `dup_${testUser.email}`,
        password: testUser.password
      })
    });
    const dupData = await dupRes.json();
    console.log("Duplicate Signup Response:", dupData);

    assertTest(
      dupRes.status === 400,
      "POST /api/auth/signup - Duplicate student rejected with 400",
      `Status: ${dupRes.status}, Message: ${dupData.message}`
    );

    // Test 5: Student Login - Success
    console.log("\n--- 5. Testing Student Login (Success Case) ---");
    const loginRes = await fetch(`${baseUrl}/api/auth/student/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rollno: testUser.rollno,
        password: testUser.password
      })
    });
    const loginData = await loginRes.json();
    console.log("Login Response:", loginData);

    assertTest(
      loginRes.status === 200 && loginData.student && loginData.student.rollno === testUser.rollno && !loginData.student.password,
      "POST /api/auth/login - Valid login returns student object without password",
      `Status: ${loginRes.status}, Body: ${JSON.stringify(loginData)}`
    );

    // Test 6: Student Login - Incorrect Password
    console.log("\n--- 6. Testing Student Login (Invalid Password) ---");
    const wrongPassRes = await fetch(`${baseUrl}/api/auth/student/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rollno: testUser.rollno,
        password: "WrongPassword!"
      })
    });
    const wrongPassData = await wrongPassRes.json();
    console.log("Invalid Password Response:", wrongPassData);

    assertTest(
      wrongPassRes.status === 401 && wrongPassData.message === "Invalid password",
      "POST /api/auth/login - Incorrect password rejected with 401",
      `Status: ${wrongPassRes.status}, Message: ${wrongPassData.message}`
    );

    // Test 7: Student Login - Non-existent Roll No
    console.log("\n--- 7. Testing Student Login (User Not Found) ---");
    const notFoundRes = await fetch(`${baseUrl}/api/auth/student/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rollno: "99Z99Z9999",
        password: testUser.password
      })
    });
    const notFoundData = await notFoundRes.json();
    console.log("User Not Found Response:", notFoundData);

    assertTest(
      notFoundRes.status === 404 && notFoundData.message === "Student not found",
      "POST /api/auth/login - Non-existent user returns 404",
      `Status: ${notFoundRes.status}, Message: ${notFoundData.message}`
    );

    // Cleanup created test student
    const { Student } = require("./src/model/user.model");
    await Student.deleteOne({ rollno: testUser.rollno });
    console.log("\nCleaned up test student from DB.");

    console.log("\n==========================================");
    console.log(`   TEST RESULTS: ${passedTests}/${totalTests} PASSED`);
    console.log("==========================================");

    if (server) server.close();
    await mongoose.connection.close();
    process.exit(passedTests === totalTests ? 0 : 1);
  } catch (err) {
    console.error("Auth test run failed with error:", err);
    if (server) server.close();
    await mongoose.connection.close();
    process.exit(1);
  }
}

runAuthTests();
