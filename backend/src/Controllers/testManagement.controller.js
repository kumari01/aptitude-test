const mongoose = require("mongoose");
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
        const { title, testType, duration_minutes, totalMarks, total_marks, maxAttempts, status, proctoringEnabled, tabSwitchLimit, autoSubmit, targetType, departments, batches, studentRollNumbers } = req.body;

        if (!title) {
            return res.status(400).json({ message: "Test title is required" });
        }

        // A newly created test isn't ready to be taken yet — it still needs
        // questions and a schedule. scheduleTest() is what flips this to
        // "Published", matching the ADMIN workflow.
        const test = new Test({
            title,
            testType: testType || "Aptitude",
            status: status || "Draft",
            duration_minutes: duration_minutes || 30,
            totalMarks: totalMarks || total_marks || 0,
            maxAttempts: maxAttempts || 1,
            createdBy: req.user.id
        });
        await test.save();

        const setting = new TestSetting({
            testId: test._id,
            proctoringEnabled: proctoringEnabled !== undefined ? proctoringEnabled : true,
            tabSwitchLimit: tabSwitchLimit || 3,
            autoSubmit: autoSubmit !== undefined ? autoSubmit : true
        });
        await setting.save();

        // All Departments vs Selected Departments lives here, as part of
        // Test Settings — scheduleTest() reads this back rather than
        // accepting a second copy of the same targeting fields.
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
            { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
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

// Update test target group (All / Department / Batch / SpecificStudents) —
// part of Test Settings, editable independently of scheduling
const updateTestTarget = async (req, res) => {
    try {
        const { testId } = req.params;
        const { targetType, departments, batches, studentRollNumbers } = req.body;

        const target = await TestTarget.findOneAndUpdate(
            { testId },
            {
                targetType: targetType || "All",
                departments: departments || [],
                batches: batches || [],
                studentRollNumbers: studentRollNumbers || []
            },
            { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({
            message: "Test target updated successfully",
            target
        });
    } catch (err) {
        console.error("Error updating test target:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Schedule a test & assign to targeted students
const scheduleTest = async (req, res) => {
    try {
        const { testId } = req.params;
        const { startAt, endAt } = req.body;

        if (!startAt || !endAt) {
            return res.status(400).json({ message: "startAt and endAt timestamps are required" });
        }

        const test = await Test.findById(testId);
        if (!test) {
            return res.status(404).json({ message: "Test not found" });
        }

        // TestTarget (set in Test Settings, at createTest time) is the single
        // source of truth for who this test targets. Scheduling reads it
        // back instead of accepting a second, possibly conflicting copy of
        // the same targeting fields.
        const target = await TestTarget.findOne({ testId });

        const schedule = new TestSchedule({
            testId,
            startAt,
            endAt,
            targetDepartments: target?.departments || [],
            targetBatches: target?.batches || [],
            status: "Scheduled"
        });
        await schedule.save();

        // Scheduling is what actually publishes the test
        test.status = "Published";
        await test.save();

        // Resolve which students to assign based on the saved target group.
        // targetType matches the TestTarget schema enum exactly:
        // All | Department | Batch | SpecificStudents
        let rollNumbersToAssign = [];
        if (target?.targetType === "SpecificStudents" && target.studentRollNumbers?.length) {
            rollNumbersToAssign = target.studentRollNumbers;
        } else {
            const query = {};
            if (target?.targetType === "Department" && target.departments?.length) {
                query.department = { $in: target.departments };
            } else if (target?.targetType === "Batch" && target.batches?.length) {
                query.batch = { $in: target.batches };
            }
            // "All" (or no TestTarget saved yet) -> empty query = every student
            const students = await Student.find(query, { rollno: 1 });
            rollNumbersToAssign = students.map(s => s.rollno);
        }

        // Bulk-upsert all assignments in a single round trip instead of one
        // findOneAndUpdate per student — matters once a test targets
        // hundreds of students at once.
        if (rollNumbersToAssign.length > 0) {
            const bulkOps = rollNumbersToAssign.map(roll => ({
                updateOne: {
                    filter: { testId, scheduleId: schedule._id, rollno: roll },
                    update: { $set: { attemptLimit: test.maxAttempts || 1, status: "Assigned" } },
                    upsert: true
                }
            }));
            await TestAssignment.bulkWrite(bulkOps);
        }

        res.status(200).json({
            message: "Test scheduled and assigned successfully",
            schedule,
            totalAssigned: rollNumbersToAssign.length
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

        const section = await Section.findById(sectionId);
        if (!section) {
            return res.status(404).json({ message: "Section not found" });
        }

        const sectionQuestion = new SectionQuestion({
            sectionId,
            questionId,
            displayOrder: displayOrder || 1,
            marks: marks || 1
        });
        await sectionQuestion.save();

        // Recompute this section's total marks
        const allSecQuestions = await SectionQuestion.find({ sectionId });
        const sectionMarks = allSecQuestions.reduce((sum, sq) => sum + (sq.marks || 1), 0);
        await Section.findByIdAndUpdate(sectionId, { totalMarks: sectionMarks });

        // Keep the parent test's totalMarks in sync with its sections, so
        // results/leaderboard percentages never drift from the question set.
        const allSections = await Section.find({ testId: section.testId });
        const testTotalMarks = allSections.reduce((sum, sec) => sum + (sec.totalMarks || 0), 0);
        await Test.findByIdAndUpdate(section.testId, { totalMarks: testTotalMarks });

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
        if (!mongoose.Types.ObjectId.isValid(testId)) {
            return res.status(404).json({ message: "Test not found" });
        }
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
        console.error("Error retrieving test details:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// List tests assigned to a student
const listStudentAssignedTests = async (req, res) => {
    try {
        let rollno = req.query.rollno;

        // This route is authenticated — if the caller is a student, always
        // use their own rollno rather than trusting a query param. Otherwise
        // one student could look up another student's assigned tests just
        // by passing a different rollno.
        let studentObj = null;
        if (req.user?.role === "student") {
            studentObj = await Student.findById(req.user.id);
            rollno = studentObj?.rollno;
        }

        let query = {};
        if (rollno) {
            const assignments = await TestAssignment.find({ rollno });
            const assignedTestIds = assignments.map(a => a.testId);

            const targets = await TestTarget.find({
                $or: [
                    { targetType: "All" },
                    { targetType: "Department", departments: studentObj?.department || "" },
                    { targetType: "Batch", batches: studentObj?.batch || "" },
                    { targetType: "SpecificStudents", studentRollNumbers: rollno }
                ]
            });
            const targetedTestIds = targets.map(t => t.testId);

            const combinedIds = [...new Set([...assignedTestIds.map(id => id.toString()), ...targetedTestIds.map(id => id.toString())])];
            query = {
                _id: { $in: combinedIds },
                status: "Published"
            };
        } else if (req.user?.role === "student") {
            query = { status: "Published" };
        }

        const tests = await Test.find(query);
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

// Delete a single test by ID
const deleteTest = async (req, res) => {
    try {
        const { testId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(testId)) {
            return res.status(400).json({ message: "Invalid test ID" });
        }
        await Test.findByIdAndDelete(testId);
        await TestSetting.deleteMany({ testId });
        await TestTarget.deleteMany({ testId });
        await TestSchedule.deleteMany({ testId });
        await TestAssignment.deleteMany({ testId });
        const sections = await Section.find({ testId });
        const sectionIds = sections.map(s => s._id);
        await SectionQuestion.deleteMany({ sectionId: { $in: sectionIds } });
        await Section.deleteMany({ testId });

        res.status(200).json({ message: "Test deleted successfully" });
    } catch (err) {
        console.error("Error deleting test:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Delete all tests from database
const deleteAllTests = async (req, res) => {
    try {
        await Test.deleteMany({});
        await TestSetting.deleteMany({});
        await TestTarget.deleteMany({});
        await TestSchedule.deleteMany({});
        await TestAssignment.deleteMany({});
        await Section.deleteMany({});
        await SectionQuestion.deleteMany({});
        res.status(200).json({ message: "All tests deleted successfully" });
    } catch (err) {
        console.error("Error clearing tests:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    createTest,
    updateTestSettings,
    updateTestTarget,
    scheduleTest,
    createSection,
    addQuestionToSection,
    getTestDetails,
    listStudentAssignedTests,
    deleteTest,
    deleteAllTests
};