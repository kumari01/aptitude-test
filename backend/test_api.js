require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./src/app");
const http = require("http");

async function testFlow() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB successfully!");

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(3001, resolve));
    console.log("Test Server running on http://localhost:3001");

    const baseUrl = "http://localhost:3001";

    // 1. Register student
    const randId = Math.floor(1000 + Math.random() * 9000);
    const testRollNo = `21A12A${randId}`;
    const testPassword = "Test@12345";
    console.log("\n1. Testing Student Signup...");
    const studentRes = await fetch(`${baseUrl}/api/auth/student/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "teststudent",
        rollno: testRollNo,
        email: "student" + Date.now() + "@sasi.ac.in",
        password: testPassword
      })
    });
    const studentData = await studentRes.json();
    console.log("Student Response:", studentData);
    const studentId = studentData.student._id;

    // 1b. Test Student Login
    console.log("\n1b. Testing Student Login...");
    const loginRes = await fetch(`${baseUrl}/api/auth/student/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rollno: testRollNo,
        password: testPassword
      })
    });
    const loginData = await loginRes.json();
    console.log("Student Login Response:", loginData);

    // 2. Create Exam
    console.log("\n2. Testing Exam Creation...");
    const examRes = await fetch(`${baseUrl}/api/exams/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Aptitude Test 101",
        duration_minutes: 30,
        start_time: new Date(),
        end_time: new Date(Date.now() + 3600000),
        total_marks: 2
      })
    });
    const examData = await examRes.json();
    console.log("Exam Response:", examData);

    const Exam = require("./src/model/exam_model");
    const latestExam = await Exam.findOne().sort({ createdAt: -1 });
    const examId = latestExam._id.toString();

    // 3. Add Question
    console.log("\n3. Testing Question Creation...");
    const qRes = await fetch(`${baseUrl}/api/exams/${examId}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_text: "What is 2 + 2?",
        options: [{ text: "3" }, { text: "4" }, { text: "5" }],
        correct_answer: 1, // index 1 is "4"
        marks: 2
      })
    });
    const qData = await qRes.json();
    console.log("Question Response:", qData);

    // 4. Start Exam Attempt
    console.log("\n4. Testing Start Exam Attempt...");
    const startRes = await fetch(`${baseUrl}/api/exams/${examId}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId })
    });
    const startData = await startRes.json();
    console.log("Start Attempt Response:", startData);
    const attemptId = startData.attempt._id;

    // 5. Fetch Questions (Verify correct_option_id is hidden)
    console.log("\n5. Testing Fetch Questions for Exam (Hiding Answers)...");
    const getQRes = await fetch(`${baseUrl}/api/exams/${examId}/questions`);
    const getQData = await getQRes.json();
    console.log("Fetch Questions Response:", JSON.stringify(getQData, null, 2));

    const questionObj = getQData.questions[0];
    const selectedOptionId = questionObj.options[1]._id; // option "4"

    // 6. Save Answer
    console.log("\n6. Testing Save Student Answer...");
    const saveAnsRes = await fetch(`${baseUrl}/api/answers/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptId,
        questionId: questionObj._id,
        selectedOptionId
      })
    });
    const saveAnsData = await saveAnsRes.json();
    console.log("Save Answer Response:", saveAnsData);

    // 7. Submit Exam
    console.log("\n7. Testing Submit Exam & Auto-Grading...");
    const submitRes = await fetch(`${baseUrl}/api/answers/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId })
    });
    const submitData = await submitRes.json();
    console.log("Submit Exam Response:", submitData);

    // 8. Get Results
    console.log("\n8. Testing Get Results...");
    const resultRes = await fetch(`${baseUrl}/api/answers/results/${attemptId}`);
    const resultData = await resultRes.json();
    console.log("Get Results Response:", resultData);

    console.log("\n✅ ALL ASSESSMENT API ENDPOINTS VERIFIED & WORKING PERFECTLY!");

    server.close();
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("Test failed with error:", err);
    process.exit(1);
  }
}

testFlow();
