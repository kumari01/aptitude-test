require("dotenv").config();
const mongoose = require("mongoose");

async function checkData() {
  const Test = require("./src/model/testModel/test.model");
  const TestAssignment = require("./src/model/testModel/testAssignment.model");
  const TestSchedule = require("./src/model/testModel/testSchedule.model");
  const { Student } = require("./src/model/user.model");

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected!\n");

    // 1. Count all tests
    const testCount = await Test.countDocuments();
    console.log(`Total Tests in DB: ${testCount}`);
    const tests = await Test.find().select("title status totalMarks").limit(10);
    tests.forEach((t) => console.log(`  - ${t._id} | ${t.title} | ${t.status} | marks: ${t.totalMarks}`));

    // 2. Count all assignments
    const assignCount = await TestAssignment.countDocuments();
    console.log(`\nTotal TestAssignments in DB: ${assignCount}`);
    const assignments = await TestAssignment.find().limit(10);
    assignments.forEach((a) => console.log(`  - testId: ${a.testId} | rollNumber: ${a.rollNumber} | status: ${a.status}`));

    // 3. Count all schedules
    const schedCount = await TestSchedule.countDocuments();
    console.log(`\nTotal TestSchedules in DB: ${schedCount}`);
    const schedules = await TestSchedule.find().limit(10);
    schedules.forEach((s) => console.log(`  - testId: ${s.testId} | start: ${s.startAt} | end: ${s.endAt} | status: ${s.status}`));

    // 4. Count all students
    const studentCount = await Student.countDocuments();
    console.log(`\nTotal Students in DB: ${studentCount}`);
    const students = await Student.find().select("username rollno").limit(10);
    students.forEach((s) => console.log(`  - ${s._id} | ${s.username} | ${s.rollno}`));

    // 5. Check if any assignments match existing students
    console.log("\n--- Matching check ---");
    const allStudents = await Student.find().select("rollno");
    const allAssignments = await TestAssignment.find();
    const studentRolls = new Set(allStudents.map((s) => s.rollno));
    const assignedRolls = new Set(allAssignments.map((a) => a.rollNumber));
    console.log(`Student rolls: ${studentRolls.size}`);
    console.log(`Assigned rolls: ${assignedRolls.size}`);
    const matching = [...assignedRolls].filter((r) => studentRolls.has(r));
    console.log(`Matching rolls (assigned AND student exists): ${matching.length}`);
    matching.forEach((r) => console.log(`  - ${r}`));

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

checkData();