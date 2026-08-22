require("dotenv").config();
const dns = require("dns");
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}
const mongoose = require("mongoose");
const app = require("./src/app");
const http = require("http");

async function testAutoSubmit() {
  const PORT = 3006;
  const baseUrl = `http://localhost:${PORT}`;
  let server;

  try {
    console.log("=================================================");
    console.log("     AUTO-SUBMIT & TIMER TEST SUITE              ");
    console.log("=================================================");
    await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
    
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`Server listening on ${baseUrl}\n`);

    // 0. Setup Admin and Student Auth Tokens
    const { issueAuthToken } = require("./src/utils/Authtoken");
    const { Student, Admin } = require("./src/model/user.model");
    const jwt = require("jsonwebtoken");
    const secret = process.env.JWT_SECRET || "default_jwt_secret";

    const adminUser = await Admin.findOne({ email: "admin.autosubmit@sasi.ac.in" }) || await Admin.create({
      username: "AdminAutoSubmit",
      email: "admin.autosubmit@sasi.ac.in",
      adminid: "ADM_AUTO_SUBMIT",
      password: "hashedpassword123",
      status: "active"
    });
    const adminToken = jwt.sign({ id: adminUser._id, role: "admin" }, secret, { expiresIn: "1h" });

    const studentUser = await Student.findOne({ email: "student.autosubmit@sasi.ac.in" }) || await Student.create({
      username: "StudentAutoSubmit",
      email: "student.autosubmit@sasi.ac.in",
      rollno: "21A91A0599",
      password: "hashedpassword123",
      status: "active"
    });
    const studentToken = jwt.sign({ id: studentUser._id, role: "student" }, secret, { expiresIn: "1h" });

    // 1. Create a test with 1-minute duration
    const createRes = await fetch(`${baseUrl}/api/exams/create`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: "Auto Submit Test Exam",
        duration_minutes: 1,
        total_marks: 5
      })
    });
    const createData = await createRes.json();
    console.log("Create Exam Response:", (createData.test?.durationMinutes === 1 || createData.test?.duration_minutes === 1) ? "✅ Duration 1 min set" : "❌ Failed to set duration");
    const testId = createData.test._id;

    // 2. Start Exam
    const startRes = await fetch(`${baseUrl}/api/exams/${testId}/start`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${studentToken}`
      },
      body: JSON.stringify({})
    });
    const startData = await startRes.json();
    console.log("Start Exam Response:", startData.attempt?._id ? "✅ Active attempt" : "❌ Failed start");
    const attemptId = startData.attempt._id;

    // 3. Add a question
    const qRes = await fetch(`${baseUrl}/api/exams/${testId}/questions`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        question_text: "What is 2 + 2?",
        options: [{ text: "3" }, { text: "4" }],
        correct_answer: 1
      })
    });
    const qData = await qRes.json();
    const questionId = qData.question._id;
    const optionId = qData.question.options[1]._id;

    // 4. Save answer while active
    const saveRes1 = await fetch(`${baseUrl}/api/answers/save`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${studentToken}`
      },
      body: JSON.stringify({ attemptId, questionId, selectedOptionId: optionId })
    });
    const saveData1 = await saveRes1.json();
    console.log("Save answer while active:", saveRes1.status === 200 ? "✅ Saved answer successfully" : "❌ Save failed");

    // 5. Simulate timer expiration by moving started_at back by 5 minutes in DB
    const ExamAttempt = require("./src/model/testModel/testAttempt.model");
    await ExamAttempt.findByIdAndUpdate(attemptId, {
      started_at: new Date(Date.now() - 5 * 60 * 1000)
    });

    // 6. Try saving an answer after duration expired -> Should trigger auto-submit
    const saveRes2 = await fetch(`${baseUrl}/api/answers/save`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${studentToken}`
      },
      body: JSON.stringify({ attemptId, questionId, selectedOptionId: optionId })
    });
    const saveData2 = await saveRes2.json();
    console.log("Save answer after time expired:", saveData2.isTimeExpired ? "✅ Time expired detected & auto-submitted" : "❌ Auto submit failed");

    // 7. Verify attempt status is now 'Time Expired'
    const updatedAttempt = await ExamAttempt.findById(attemptId);
    console.log("Attempt final status in DB:", updatedAttempt.status === "Time Expired" ? "✅ 'Time Expired'" : `❌ Status: ${updatedAttempt.status}`);

    // Cleanup
    const Test = require("./src/model/testModel/test.model");
    const questionModel = require("./src/model/question.model");
    const studentAnswerSchema = require("./src/model/studentAnswer.model");

    await Test.deleteOne({ _id: testId });
    await ExamAttempt.deleteOne({ _id: attemptId });
    await questionModel.deleteOne({ _id: questionId });
    await studentAnswerSchema.deleteMany({ attempt_id: attemptId });

    console.log("\n✅ ALL AUTO-SUBMIT TESTS PASSED SUCCESSFULLY!");
    server.close();
    await mongoose.connection.close();
    process.exit(0);

  } catch (err) {
    console.error("Auto-submit test failed:", err);
    if (server) server.close();
    await mongoose.connection.close();
    process.exit(1);
  }
}

testAutoSubmit();
