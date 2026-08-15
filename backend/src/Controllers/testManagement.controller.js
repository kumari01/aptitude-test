const Test = require("../model/testModel/test.model");
const TestSetting = require("../model/testModel/testSetting.model");
const TestTarget = require("../model/testModel/testTarget.model");
const TestSchedule = require("../model/testModel/testSchedule.model");
const TestAssignment = require("../model/testModel/testAssignment.model");
const Section = require("../model/sectionModel/section.model");
const SectionQuestion = require("../model/sectionModel/sectionQuestion.model");
const { Student } = require("../model/user.model");

// Create a new test with settings & target group
const createTest = async (req, res) => {
    try {
        const { title, testType, maxAttempts, createdBy, proctoringEnabled, tabSwitchLimit, autoSubmit, targetType, departments, batches, studentRollNumbers } = req.body;

        if (!title) {
            return res.status(400).json({ message: "Test title is required" });
        }

        const test = new Test({
            title,
            testType: testType || "Aptitude",
            status: "Draft",
            maxAttempts: maxAttempts || 1,
            createdBy
        });
        await test.save();

        const setting = new TestSetting({
            testId: test._id,
            proctoringEnabled: proctoringEnabled !== undefined ? proctoringEnabled : true,
            tabSwitchLimit: tabSwitchLimit || 3,
            autoSubmit: autoSubmit !== undefined ? autoSubmit : true
        });
        await setting.save();

        const target = new TestTarget({
            testId: test._id,
            targetType: targetType || "All",
            departments: departments || [],
            batches: batches || [],
            studentRollNumbers: studentRollNumbers || []
        });
        await target.save();

        res.status(201).json({
            message: "Test created successfully",
            test,
            setting,
            target
        });
    } catch (err) {
        console.error("Error creating test:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update test proctoring & evaluation settings
const updateTestSettings = async (req, res) => {
    try {
        const { testId } = req.params;
        const { proctoringEnabled, tabSwitchLimit, autoSubmit } = req.body;

        const setting = await TestSetting.findOneAndUpdate(
            { testId },
            { proctoringEnabled, tabSwitchLimit, autoSubmit },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({
            message: "Test settings updated successfully",
            setting
        });
    } catch (err) {
        console.error("Error updating test settings:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Schedule a test & assign to targeted students
const scheduleTest = async (req, res) => {
    try {
        const { testId } = req.params;
        const { startAt, endAt, targetDepartments, targetBatches, studentRollNumbers } = req.body;

        if (!startAt || !endAt) {
            return res.status(400).json({ message: "startAt and endAt timestamps are required" });
        }

        const test = await Test.findById(testId);
        if (!test) {
            return res.status(404).json({ message: "Test not found" });
        }

        const schedule = new TestSchedule({
            testId,
            startAt,
            endAt,
            targetDepartments: targetDepartments || [],
            targetBatches: targetBatches || [],
            status: "Scheduled"
        });
        await schedule.save();

        test.status = "Published";
        await test.save();

        // Target student assignments
        let rollNumbersToAssign = studentRollNumbers || [];
        if (!rollNumbersToAssign.length) {
            const query = {};
            if (targetDepartments && targetDepartments.length) query.department = { $in: targetDepartments };
            if (targetBatches && targetBatches.length) query.batch = { $in: targetBatches };

            const students = await Student.find(query, { rollno: 1 });
            rollNumbersToAssign = students.map(s => s.rollno);
        }

        // Filter out invalid/empty roll numbers to avoid broken assignments
        const validRollNumbers = rollNumbersToAssign.filter(
            (roll) => roll && typeof roll === "string" && roll.trim().length > 0
        );

        const assignments = [];
        for (const roll of validRollNumbers) {
            const assignment = await TestAssignment.findOneAndUpdate(
                { testId, scheduleId: schedule._id, rollNumber: roll },
                { attemptLimit: test.maxAttempts || 1, status: "Assigned" },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            assignments.push(assignment);
        }

        res.status(200).json({
            message: "Test scheduled and assigned successfully",
            schedule,
            totalAssigned: assignments.length
        });
    } catch (err) {
        console.error("Error scheduling test:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Add a section to a test
const createSection = async (req, res) => {
    try {
        const { testId } = req.params;
        const { name, displayOrder, totalMarks } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Section name is required" });
        }

        const section = new Section({
            testId,
            name,
            displayOrder: displayOrder || 1,
            totalMarks: totalMarks || 0
        });
        await section.save();

        res.status(201).json({
            message: "Section created successfully",
            section
        });
    } catch (err) {
        console.error("Error creating section:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Link question to a section
const addQuestionToSection = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const { questionId, displayOrder, marks } = req.body;

        if (!questionId) {
            return res.status(400).json({ message: "questionId is required" });
        }

        const sectionQuestion = new SectionQuestion({
            sectionId,
            questionId,
            displayOrder: displayOrder || 1,
            marks: marks || 1
        });
        await sectionQuestion.save();

        // Update section total marks
        const allSecQuestions = await SectionQuestion.find({ sectionId });
        const sectionMarks = allSecQuestions.reduce((sum, sq) => sum + (sq.marks || 1), 0);
        await Section.findByIdAndUpdate(sectionId, { totalMarks: sectionMarks });

        res.status(201).json({
            message: "Question added to section successfully",
            sectionQuestion
        });
    } catch (err) {
        console.error("Error adding question to section:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get complete test configuration
const getTestDetails = async (req, res) => {
    try {
        const { testId } = req.params;
        const test = await Test.findById(testId);
        if (!test) {
            return res.status(404).json({ message: "Test not found" });
        }

        const setting = await TestSetting.findOne({ testId });
        const target = await TestTarget.findOne({ testId });
        const schedules = await TestSchedule.find({ testId });
        const sections = await Section.find({ testId }).sort({ displayOrder: 1 });

        const sectionDetails = [];
        for (const sec of sections) {
            const sqList = await SectionQuestion.find({ sectionId: sec._id }).populate("questionId");
            sectionDetails.push({
                section: sec,
                questions: sqList
            });
        }

        res.status(200).json({
            test,
            setting,
            target,
            schedules,
            sections: sectionDetails
        });
    } catch (err) {
        console.error("Error retrieving test details:", err.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// List tests assigned to a student
const listStudentAssignedTests = async (req, res) => {
    try {
        // Resolve the authenticated student's roll number
        const student = await Student.findById(req.user.id);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        const rollNumber = student.rollno;
        const assignments = await TestAssignment.find({ rollNumber });
        const testIds = assignments.map(a => a.testId);

        const tests = await Test.find({ _id: { $in: testIds } });
        const detailedTests = [];
        for (const t of tests) {
            const setting = await TestSetting.findOne({ testId: t._id });
            const schedule = await TestSchedule.findOne({ testId: t._id }).sort({ createdAt: -1 });
            detailedTests.push({
                test: t,
                setting,
                schedule
            });
        }

        res.status(200).json({ tests: detailedTests });
    } catch (err) {
        console.error("Error listing assigned tests:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    createTest,
    updateTestSettings,
    scheduleTest,
    createSection,
    addQuestionToSection,
    getTestDetails,
    listStudentAssignedTests
};
