require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./src/app");
const http = require("http");

async function runLeaderboardTests() {
  const PORT = 3003;
  const baseUrl = `http://localhost:${PORT}`;
  let server;

  // Models needed
  const Test = require("./src/model/testModel/test.model");
  const TestAttempt = require("./src/model/testModel/testAttempt.model");
  const { Student } = require("./src/model/user.model");
  const Leaderboard = require("./src/model/leaderboard.model");

  // Keep track of dummy records to clean up
  let dummyTest = null;
  let dummyStudents = [];
  let dummyAttempts = [];

  try {
    console.log("==========================================");
    console.log("     LEADERBOARD API TEST SUITE           ");
    console.log("==========================================");
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB successfully!\n");

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`Test Server running on ${baseUrl}\n`);

    // 1. Create a dummy Test/Exam
    console.log("Creating dummy test...");
    dummyTest = new Test({
      title: "Test Leaderboard Exam",
      testType: "Exam",
      status: "Published",
      totalMarks: 100,
      maxAttempts: 1
    });
    await dummyTest.save();
    console.log(`Created test with ID: ${dummyTest._id}\n`);

    // 2. Create 3 dummy Students with different marks
    console.log("Creating dummy students and attempts...");
    const randId1 = Math.floor(1000 + Math.random() * 9000);
    const randId2 = Math.floor(1000 + Math.random() * 9000);
    const randId3 = Math.floor(1000 + Math.random() * 9000);

    const studentsData = [
      { username: `stud_a_${randId1}`, email: `stud_a_${randId1}@sasi.ac.in`, rollno: `21A12A${randId1}`, password: "Password123!" },
      { username: `stud_b_${randId2}`, email: `stud_b_${randId2}@sasi.ac.in`, rollno: `21A12A${randId2}`, password: "Password123!" },
      { username: `stud_c_${randId3}`, email: `stud_c_${randId3}@sasi.ac.in`, rollno: `21A12A${randId3}`, password: "Password123!" }
    ];

    const scores = [95, 80, 95]; // Student 0 and 2 should have same score (95), Student 1 has 80

    for (let i = 0; i < studentsData.length; i++) {
      const student = new Student(studentsData[i]);
      await student.save();
      dummyStudents.push(student);

      const attempt = new TestAttempt({
        testId: dummyTest._id,
        student_id: student._id,
        score: scores[i],
        obtainedMarks: scores[i],
        status: "Submitted",
        submitted_at: new Date()
      });
      await attempt.save();
      dummyAttempts.push(attempt);
    }
    console.log(`Created ${dummyStudents.length} students & attempts successfully.\n`);

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

    // Test 1: Get complete leaderboard
    console.log("--- 1. Testing GET /api/leaderboard/:examId ---");
    const leaderboardRes = await fetch(`${baseUrl}/api/leaderboard/${dummyTest._id}`);
    const leaderboardData = await leaderboardRes.json();
    console.log("Leaderboard Response:", JSON.stringify(leaderboardData, null, 2));

    assertTest(
      leaderboardRes.status === 200,
      "GET /api/leaderboard/:examId returns 200 status code",
      `Status: ${leaderboardRes.status}`
    );

    assertTest(
      leaderboardData.totalStudents === 3,
      "totalStudents count in leaderboard is 3",
      `totalStudents: ${leaderboardData.totalStudents}`
    );

    assertTest(
      Array.isArray(leaderboardData.leaderboard) && leaderboardData.leaderboard.length === 3,
      "leaderboard contains exactly 3 entries",
      `Length: ${leaderboardData.leaderboard ? leaderboardData.leaderboard.length : "N/A"}`
    );

    // Verify ranks: Score 95 should be Rank 1 (both students), Score 80 should be Rank 3
    const entry1 = leaderboardData.leaderboard.find(e => e.score === 95 && e.student_id._id.toString() === dummyStudents[0]._id.toString());
    const entry2 = leaderboardData.leaderboard.find(e => e.score === 95 && e.student_id._id.toString() === dummyStudents[2]._id.toString());
    const entry3 = leaderboardData.leaderboard.find(e => e.score === 80);

    assertTest(
      entry1 && entry1.rank === 1,
      "First student with 95 score has Rank 1",
      `Rank: ${entry1 ? entry1.rank : "not found"}`
    );

    assertTest(
      entry2 && entry2.rank === 1,
      "Second student with 95 score has Rank 1 (due to competition ranking)",
      `Rank: ${entry2 ? entry2.rank : "not found"}`
    );

    assertTest(
      entry3 && entry3.rank === 3,
      "Student with 80 score has Rank 3 (1, 1, then 3)",
      `Rank: ${entry3 ? entry3.rank : "not found"}`
    );

    assertTest(
      entry1 && entry1.percentage === 95,
      "Percentage calculation is correct (95%)",
      `Percentage: ${entry1 ? entry1.percentage : "not found"}`
    );

    // Test 2: Get specific student's rank
    console.log("\n--- 2. Testing GET /api/leaderboard/:examId/student/:studentId ---");
    const student1Res = await fetch(`${baseUrl}/api/leaderboard/${dummyTest._id}/student/${dummyStudents[0]._id}`);
    const student1Data = await student1Res.json();
    console.log("Student 1 Rank Response:", student1Data);

    assertTest(
      student1Res.status === 200,
      "GET /api/leaderboard/:examId/student/:studentId returns 200",
      `Status: ${student1Res.status}`
    );

    assertTest(
      student1Data.rank === 1 && student1Data.score === 95 && student1Data.totalStudents === 3,
      "Student 1 details match (Rank 1, Score 95, totalStudents 3)",
      `Data: ${JSON.stringify(student1Data)}`
    );

    const student2Res = await fetch(`${baseUrl}/api/leaderboard/${dummyTest._id}/student/${dummyStudents[1]._id}`);
    const student2Data = await student2Res.json();
    console.log("Student 2 Rank Response:", student2Data);

    assertTest(
      student2Res.status === 200 && student2Data.rank === 3 && student2Data.score === 80,
      "Student 2 details match (Rank 3, Score 80)",
      `Data: ${JSON.stringify(student2Data)}`
    );

    // Cleanup created resources
    console.log("\nCleaning up test resources from database...");
    await Test.deleteOne({ _id: dummyTest._id });
    for (const student of dummyStudents) {
      await Student.deleteOne({ _id: student._id });
    }
    for (const attempt of dummyAttempts) {
      await TestAttempt.deleteOne({ _id: attempt._id });
    }
    await Leaderboard.deleteMany({ testId: dummyTest._id });
    console.log("Cleanup completed successfully.");

    console.log("\n==========================================");
    console.log(`   LEADERBOARD TEST RESULTS: ${passedTests}/${totalTests} PASSED`);
    console.log("==========================================");

    if (server) server.close();
    await mongoose.connection.close();
    process.exit(passedTests === totalTests ? 0 : 1);
  } catch (err) {
    console.error("Leaderboard test run failed with error:", err);
    // Attempt cleanup in case of crash
    try {
      if (dummyTest) {
        const Test = require("./src/model/testModel/test.model");
        const { Student } = require("./src/model/user.model");
        const TestAttempt = require("./src/model/testModel/testAttempt.model");
        const Leaderboard = require("./src/model/leaderboard.model");
        await Test.deleteOne({ _id: dummyTest._id });
        for (const student of dummyStudents) {
          await Student.deleteOne({ _id: student._id });
        }
        for (const attempt of dummyAttempts) {
          await TestAttempt.deleteOne({ _id: attempt._id });
        }
        await Leaderboard.deleteMany({ testId: dummyTest._id });
      }
    } catch (cleanErr) {
      console.error("Cleanup during catch failed:", cleanErr);
    }
    if (server) server.close();
    await mongoose.connection.close();
    process.exit(1);
  }
}

runLeaderboardTests();
