const Test = require("../model/testModel/test.model");
const TestSetting = require("../model/testModel/testSetting.model");
const TestTarget = require("../model/testModel/testTarget.model");
const TestSchedule = require("../model/testModel/testSchedule.model");
const TestAssignment = require("../model/testModel/testAssignment.model");
const Section = require("../model/sectionModel/section.model");
const SectionQuestion = require("../model/sectionModel/sectionQuestion.model");
const Question = require("../model/question.model");
const ExamAttempt = require("../model/testModel/testAttempt.model");
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

// Update test target group (All / Department / Batch / SpecificStudents)
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

// List ALL tests (admin dashboard view) with settings & schedules
const listAllTests = async (req, res) => {
    try {
        const tests = await Test.find().sort({ createdAt: -1 });

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
        console.error("Error listing all tests:", err);
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

        const Question = require("../model/question.model");

        const setting = await TestSetting.findOne({ testId });
        const sections = await Section.find({ testId }).sort({ displayOrder: 1 });

        // Query direct questions from Question model
        const directQuestions = await Question.find({
            $or: [{ testId: testId }, { exam_id: testId }]
        });

        const sectionDetails = [];
        let totalSectionQuestions = 0;
        let totalSectionMarks = 0;

        for (const sec of sections) {
            const sqList = await SectionQuestion.find({ sectionId: sec._id });
            const secMarks = sqList.reduce((sum, sq) => sum + (sq.marks || 1), 0);
            sectionDetails.push({
                section: {
                    _id: sec._id,
                    name: sec.name,
                    totalMarks: sec.totalMarks || secMarks || 0,
                },
                questionCount: sqList.length
            });
            totalSectionQuestions += sqList.length;
            totalSectionMarks += (sec.totalMarks || secMarks || 0);
        }

        const totalDirectMarks = directQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
        const calculatedQuestions = Math.max(directQuestions.length, totalSectionQuestions);

        // If no explicit section exists but direct questions exist, synthesize a section entry
        if (sectionDetails.length === 0 && directQuestions.length > 0) {
            sectionDetails.push({
                section: {
                    _id: `default_${test._id}`,
                    name: `${test.testType || "General"} Questions`,
                    totalMarks: totalDirectMarks || directQuestions.length
                },
                questionCount: directQuestions.length
            });
        }

        const finalTotalMarks = test.totalMarks || totalDirectMarks || totalSectionMarks || calculatedQuestions || 10;
        const passingMarks = Math.ceil(finalTotalMarks * 0.4);

        const testData = {
            _id: test._id,
            title: test.title,
            testType: test.testType || "Aptitude",
            durationMinutes: test.durationMinutes || test.duration_minutes || 30,
            totalMarks: finalTotalMarks,
            passingMarks: passingMarks,
            totalQuestions: calculatedQuestions
        };

        res.status(200).json({
            test: testData,
            setting,
            sections: sectionDetails,
            totalQuestions: calculatedQuestions
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
            const attempt = await ExamAttempt.findOne({
                $or: [{ testId: t._id }, { exam_id: t._id }],
                student_id: student._id
            });

            detailedTests.push({
                test: t,
                setting,
                schedule,
                attempt: attempt ? {
                    _id: attempt._id,
                    status: attempt.status,
                    score: attempt.score,
                    started_at: attempt.started_at,
                    completed_at: attempt.completed_at
                } : null
            });
        }

        res.status(200).json({ tests: detailedTests });
    } catch (err) {
        console.error("Error listing assigned tests:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Admin Overview Dashboard Metrics
const getAdminOverview = async (req, res) => {
    try {
        const totalExams = await Test.countDocuments();
        const publishedExams = await Test.countDocuments({ status: "Published" });
        const draftExams = await Test.countDocuments({ status: "Draft" });
        const totalSchedules = await TestSchedule.countDocuments();
        const totalAttempts = await ExamAttempt.countDocuments({ status: { $in: ["Submitted", "Completed", "Auto Submitted"] } });
        const disqualifiedAttempts = await ExamAttempt.countDocuments({ status: "Auto Submitted" });
        const totalStudents = await Student.countDocuments();

        res.status(200).json({
            totalExams,
            publishedExams,
            draftExams,
            totalSchedules,
            totalAttempts,
            disqualifiedAttempts,
            totalStudents
        });
    } catch (err) {
        console.error("Error fetching admin overview metrics:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Admin: Fetch all student test attempts for admin dashboard
const getAdminAttempts = async (req, res) => {
    try {
        const attempts = await ExamAttempt.find()
            .populate("testId", "title testType durationMinutes totalMarks")
            .populate("student_id", "username name rollno department email")
            .sort({ updatedAt: -1 })
            .limit(100);

        const formatted = attempts.map(att => {
            const student = att.student_id;
            const test = att.testId;
            return {
                id: att._id,
                studentName: student?.username || student?.name || "Student",
                rollNumber: att.rollNumber || student?.rollno || "N/A",
                department: student?.department || "General",
                testTitle: test?.title || "Assessment",
                testType: test?.testType || "Aptitude",
                score: att.score || 0,
                obtainedMarks: att.obtainedMarks || 0,
                totalMarks: test?.totalMarks || 0,
                tabSwitches: att.tab_switches || 0,
                status: att.status || "Submitted",
                date: att.submitted_at || att.updatedAt || att.started_at
            };
        });

        res.status(200).json({ attempts: formatted });
    } catch (err) {
        console.error("Error fetching admin attempts:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    createTest,
    updateTestTarget,
    listAllTests,
    updateTestSettings,
    scheduleTest,
    createSection,
    addQuestionToSection,
    getTestDetails,
    listStudentAssignedTests,
    getAdminOverview,
    getAdminAttempts
};
