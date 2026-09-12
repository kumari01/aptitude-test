require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const dns = require("dns");

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

const { Student, Admin } = require("./src/model/user.model");
const Test = require("./src/model/testModel/test.model");
const TestSetting = require("./src/model/testModel/testSetting.model");
const TestTarget = require("./src/model/testModel/testTarget.model");
const TestSchedule = require("./src/model/testModel/testSchedule.model");
const Question = require("./src/model/question.model");
const Topic = require("./src/model/topic.model");

const SAMPLE_QUESTIONS = [
  {
    question_text: "What is the time complexity of searching in a balanced Binary Search Tree (BST)?",
    topicName: "Data Structures & Algorithms",
    difficulty: "medium",
    marks: 2,
    options: ["O(N)", "O(log N)", "O(N^2)", "O(1)"],
    correct_answer_index: 1,
  },
  {
    question_text: "Which data structure operates on a Last-In, First-Out (LIFO) order?",
    topicName: "Data Structures & Algorithms",
    difficulty: "easy",
    marks: 1,
    options: ["Queue", "Stack", "Tree", "Graph"],
    correct_answer_index: 1,
  },
  {
    question_text: "If a train 150 meters long crosses a telegraph post in 10 seconds, what is the speed of the train in km/hr?",
    topicName: "Quantitative Aptitude",
    difficulty: "medium",
    marks: 2,
    options: ["36 km/hr", "54 km/hr", "60 km/hr", "72 km/hr"],
    correct_answer_index: 1,
  },
  {
    question_text: "Choose the word that is most nearly OPPOSITE in meaning to 'METICULOUS':",
    topicName: "Verbal Ability",
    difficulty: "easy",
    marks: 1,
    options: ["Careful", "Sloppy", "Accurate", "Diligent"],
    correct_answer_index: 1,
  },
  {
    question_text: "Which HTTP status code represents 'Internal Server Error'?",
    topicName: "Web Development",
    difficulty: "easy",
    marks: 1,
    options: ["200 OK", "404 Not Found", "500 Internal Server Error", "403 Forbidden"],
    correct_answer_index: 2,
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI is not defined in .env!");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(uri);
    console.log(" Connected to MongoDB Atlas.");

    // 1. Seed or Update Admin
    const adminEmail = "admin@sasi.ac.in";
    const adminId = "ADMIN001";
    const adminRawPassword = "adminpassword123";
    const hashedAdminPassword = await bcrypt.hash(adminRawPassword, 10);

    let admin = await Admin.findOne({ $or: [{ email: adminEmail }, { adminid: adminId }] });
    if (admin) {
      admin.username = "Admin Demo";
      admin.password = hashedAdminPassword;
      admin.status = "active";
      await admin.save();
      console.log(" Admin account updated successfully.");
    } else {
      admin = await Admin.create({
        username: "Admin Demo",
        email: adminEmail,
        adminid: adminId,
        password: hashedAdminPassword,
        status: "active",
      });
      console.log(" Admin account created successfully.");
    }

    // 2. Seed or Update Student
    const studentEmail = "student@sasi.ac.in";
    const studentRollno = "21K91A0501";
    const studentRawPassword = "password123";
    const hashedStudentPassword = await bcrypt.hash(studentRawPassword, 10);

    let student = await Student.findOne({ $or: [{ email: studentEmail }, { rollno: studentRollno }] });
    if (student) {
      student.username = "Student Demo";
      student.password = hashedStudentPassword;
      student.department = "CSE";
      student.batch = "2021-2025";
      student.section = "A";
      student.status = "active";
      await student.save();
      console.log(" Student account updated successfully.");
    } else {
      student = await Student.create({
        username: "Student Demo",
        email: studentEmail,
        rollno: studentRollno,
        password: hashedStudentPassword,
        department: "CSE",
        batch: "2021-2025",
        section: "A",
        status: "active",
      });
      console.log(" Student account created successfully.");
    }

    // 3. Ensure a Published Test exists with questions, settings, target and schedule
    let test = await Test.findOne({ title: "Sample Aptitude & Technical Benchmark Exam" });
    if (!test) {
      test = await Test.create({
        title: "Sample Aptitude & Technical Benchmark Exam",
        testType: "Aptitude",
        status: "Published",
        durationMinutes: 30,
        duration_minutes: 30,
        totalMarks: 7,
        maxAttempts: 3,
        createdBy: admin._id,
      });
      console.log(" Created Published Exam:", test.title);
    } else {
      test.status = "Published";
      test.durationMinutes = 30;
      test.duration_minutes = 30;
      test.maxAttempts = 3;
      await test.save();
      console.log(" Exam set to Published status.");
    }

    // Test Settings
    let setting = await TestSetting.findOne({ testId: test._id });
    if (!setting) {
      setting = await TestSetting.create({
        testId: test._id,
        proctoringEnabled: true,
        tabSwitchLimit: 3,
        autoSubmit: true,
      });
      console.log(" Created Test Settings (Proctoring active, limit 3).");
    } else {
      setting.proctoringEnabled = true;
      setting.tabSwitchLimit = 3;
      setting.autoSubmit = true;
      await setting.save();
    }

    // Test Target: ALL students
    let target = await TestTarget.findOne({ testId: test._id });
    if (!target) {
      target = await TestTarget.create({
        testId: test._id,
        targetType: "All",
        departments: ["CSE"],
        batches: ["2021-2025"],
      });
      console.log(" Created Test Target (Available to ALL students).");
    } else {
      target.targetType = "All";
      await target.save();
    }

    // Test Schedule: Active currently
    let schedule = await TestSchedule.findOne({ testId: test._id });
    const now = new Date();
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    if (!schedule) {
      schedule = await TestSchedule.create({
        testId: test._id,
        startAt: now,
        endAt: nextWeek,
        status: "Active",
      });
      console.log(" Created Test Schedule (Active now through next 7 days).");
    } else {
      schedule.startAt = now;
      schedule.endAt = nextWeek;
      schedule.status = "Active";
      await schedule.save();
    }

    // Seed Questions if none exist for this test
    const existingQuestionsCount = await Question.countDocuments({ testId: test._id });
    if (existingQuestionsCount === 0) {
      console.log(" Seeding questions for exam...");
      for (const item of SAMPLE_QUESTIONS) {
        let topic = await Topic.findOne({ name: item.topicName });
        if (!topic) {
          topic = await Topic.create({ name: item.topicName, status: "active" });
        }

        const formattedOptions = item.options.map((text) => ({ text }));
        const qDoc = new Question({
          testId: test._id,
          topicId: topic._id,
          question_text: item.question_text,
          difficulty: item.difficulty,
          marks: item.marks,
          options: formattedOptions,
        });
        qDoc.correct_option_id = qDoc.options[item.correct_answer_index]._id;
        await qDoc.save();
      }
      console.log(" 5 Questions seeded.");
    } else {
      console.log(` Found ${existingQuestionsCount} questions already seeded.`);
    }

    console.log("\n=======================================================");
    console.log(" DEMO CREDENTIALS READY IN DATABASE!");
    console.log("=======================================================");
    console.log("👤 STUDENT LOGIN:");
    console.log("   - Email:       student@sasi.ac.in");
    console.log("   - Roll Number: 21K91A0501");
    console.log("   - Password:    password123");
    console.log("-------------------------------------------------------");
    console.log("🛡️ ADMIN LOGIN:");
    console.log("   - Email:       admin@sasi.ac.in (or Admin ID: ADMIN001)");
    console.log("   - Password:    adminpassword123");
    console.log("=======================================================");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding demo credentials:", err);
    process.exit(1);
  }
}

seed();
