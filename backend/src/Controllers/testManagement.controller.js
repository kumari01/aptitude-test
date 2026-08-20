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
const ProctoringSession = require("../model/proctoring/proctoringSession");
const ProctoringEvent = require("../model/proctoring/proctoringEvent");

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

// Helper to compute dynamic test metadata (actual questions count, duration, total marks)
async function computeTestMetadata(testDoc) {
    const Question = require("../model/question.model");
    const directQuestions = await Question.find({
        $or: [{ testId: testDoc._id }, { exam_id: testDoc._id }]
    });
    const sections = await Section.find({ testId: testDoc._id });
    let totalSectionQuestions = 0;
    let totalSectionMarks = 0;

    for (const sec of sections) {
        const sqList = await SectionQuestion.find({ sectionId: sec._id });
        const secMarks = sqList.reduce((sum, sq) => sum + (sq.marks || 1), 0);
        totalSectionQuestions += sqList.length;
        totalSectionMarks += (sec.totalMarks || secMarks || 0);
    }

    const totalDirectMarks = directQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
    const calculatedQuestions = Math.max(testDoc.totalQuestions || 0, directQuestions.length, totalSectionQuestions);
    const finalTotalMarks = testDoc.totalMarks || totalDirectMarks || totalSectionMarks || (calculatedQuestions > 0 ? calculatedQuestions : 10);
    const passingMarks = testDoc.passingMarks || Math.ceil(finalTotalMarks * 0.4);
    const duration = testDoc.durationMinutes || testDoc.duration_minutes || 30;

    return {
        _id: testDoc._id,
        title: testDoc.title,
        description: testDoc.description || "",
        category: testDoc.category || testDoc.testType || "Aptitude",
        testType: testDoc.testType || testDoc.category || "Aptitude",
        durationMinutes: duration,
        duration_minutes: duration,
        totalQuestions: calculatedQuestions,
        totalMarks: finalTotalMarks,
        passingMarks: passingMarks,
        status: testDoc.status || "Draft",
        maxAttempts: testDoc.maxAttempts || 1,
        createdAt: testDoc.createdAt,
        updatedAt: testDoc.updatedAt
    };
}

// List ALL tests (admin dashboard view) with settings & schedules
const listAllTests = async (req, res) => {
    try {
        const tests = await Test.find().sort({ createdAt: -1 });

        const detailedTests = [];
        for (const t of tests) {
            const setting = await TestSetting.findOne({ testId: t._id });
            const schedule = await TestSchedule.findOne({ testId: t._id }).sort({ createdAt: -1 });
            const computed = await computeTestMetadata(t);

            detailedTests.push({
                test: computed,
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
                { testId, scheduleId: schedule._id, $or: [{ rollno: roll }, { rollNumber: roll }] },
                { testId, scheduleId: schedule._id, rollno: roll, rollNumber: roll, attemptLimit: test.maxAttempts || 1, status: "Assigned" },
                { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
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
        const schedule = await TestSchedule.findOne({ testId }).sort({ createdAt: -1 });
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
            schedule,
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
        const assignments = await TestAssignment.find({
            $or: [
                { rollNumber: rollNumber },
                { rollno: rollNumber },
                { rollNumber: new RegExp(`^${rollNumber}$`, 'i') },
                { rollno: new RegExp(`^${rollNumber}$`, 'i') }
            ]
        });
        const assignedTestIds = assignments.map(a => a.testId.toString());

        // Also find tests with target "ALL" or "All"
        const allTargets = await TestTarget.find({ targetType: { $in: ["ALL", "All", "all"] } });
        const allTargetTestIds = allTargets.map(t => t.testId.toString());

        let targetedIds = [];
        if (student.department || student.batch) {
            const orConditions = [];
            if (student.department) {
                orConditions.push(
                    { departments: student.department },
                    { departments: new RegExp(`^${student.department.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
                );
            }
            if (student.batch) {
                orConditions.push(
                    { batches: student.batch },
                    { batches: new RegExp(`^${student.batch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
                );
            }
            if (orConditions.length > 0) {
                const matchingTargets = await TestTarget.find({ $or: orConditions });
                targetedIds = matchingTargets.map(t => t.testId.toString());
            }
        }

        let combinedIds = Array.from(new Set([...assignedTestIds, ...allTargetTestIds, ...targetedIds]));

        let testQuery = {};
        if (combinedIds.length > 0) {
            testQuery = { _id: { $in: combinedIds } };
        }

        // Return latest exams first
        const tests = await Test.find(testQuery).sort({ createdAt: -1 });
        const detailedTests = [];
        for (const t of tests) {
            const setting = await TestSetting.findOne({ testId: t._id });
            const schedule = await TestSchedule.findOne({ testId: t._id }).sort({ createdAt: -1 });
            const attempt = await ExamAttempt.findOne({
                $or: [{ testId: t._id }, { exam_id: t._id }],
                student_id: student._id
            }).sort({ createdAt: -1 });

            const computed = await computeTestMetadata(t);

            detailedTests.push({
                test: computed,
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
        const totalAttempts = await ExamAttempt.countDocuments({ status: { $in: ["Submitted", "Completed", "Auto Submitted", "Disqualified"] } });
        const disqualifiedAttempts = await ExamAttempt.countDocuments({ status: { $in: ["Auto Submitted", "Disqualified"] } });
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
            .populate("exam_id", "title testType durationMinutes totalMarks")
            .populate("student_id", "username name rollno rollNumber department email")
            .sort({ updatedAt: -1 })
            .limit(100);

        // Deduplicate attempts per student + test to ensure single consolidated telemetry row per attempt
        const getRawIdStr = (val) => {
            if (!val) return "";
            if (typeof val === "object" && val._id) return val._id.toString();
            return val.toString();
        };

        const uniqueMap = new Map();
        for (const att of attempts) {
            const studentIdStr = getRawIdStr(att.student_id) || att.rollNumber || "unknown";
            const testIdStr = getRawIdStr(att.testId) || getRawIdStr(att.exam_id) || "test";
            const key = `${studentIdStr}_${testIdStr}`;

            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, att);
            } else {
                const existing = uniqueMap.get(key);
                const existingScore = Math.max(existing.score || 0, existing.obtainedMarks || 0);
                const newScore = Math.max(att.score || 0, att.obtainedMarks || 0);

                // Prefer submitted/auto-submitted/disqualified over started, or higher score
                if (existing.status === "Started" && att.status !== "Started") {
                    uniqueMap.set(key, att);
                } else if (existing.status !== "Started" && att.status === "Started") {
                    // keep existing submitted attempt
                } else if (newScore > existingScore) {
                    uniqueMap.set(key, att);
                }
            }
        }

        const consolidatedAttempts = Array.from(uniqueMap.values());
        const attemptIds = consolidatedAttempts.map(a => a._id);

        // Prefetch any missing tests and questions for accurate totalMarks
        const allTestIds = [...new Set(consolidatedAttempts.map(a => 
            (a.testId?._id || a.testId || a.exam_id?._id || a.exam_id)?.toString()
        ).filter(Boolean))];

        const testDocs = await Test.find({ _id: { $in: allTestIds } });
        const testMap = new Map(testDocs.map(t => [t._id.toString(), t]));

        // Calculate total marks per test by aggregating question marks
        const questionsList = await Question.find({
            $or: [
                { testId: { $in: allTestIds } },
                { exam_id: { $in: allTestIds } }
            ]
        });

        const testMarksMap = new Map();
        questionsList.forEach(q => {
            const tId = (q.testId || q.exam_id)?.toString();
            if (tId) {
                const currentSum = testMarksMap.get(tId) || 0;
                testMarksMap.set(tId, currentSum + (q.marks || 1));
            }
        });

        // Prefetch student answers for manual scoring fallback
        const StudentAnswer = require("../model/studentAnswer.model");
        const allAnswers = await StudentAnswer.find({ attempt_id: { $in: attemptIds } });
        const answersMap = new Map();
        allAnswers.forEach(ans => {
            const aId = ans.attempt_id?.toString();
            if (aId) {
                if (!answersMap.has(aId)) answersMap.set(aId, []);
                answersMap.get(aId).push(ans);
            }
        });

        // Prefetch any missing students
        const allStudentIds = [...new Set(consolidatedAttempts.map(a => 
            (a.student_id?._id || a.student_id)?.toString()
        ).filter(Boolean))];

        const { Student } = require("../model/user.model");
        const studentDocs = await Student.find({ _id: { $in: allStudentIds } });
        const studentMap = new Map(studentDocs.map(s => [s._id.toString(), s]));

        // Fetch proctoring sessions for these attempts
        const sessions = await ProctoringSession.find({
            attemptId: { $in: attemptIds }
        });
        const sessionMap = new Map();
        sessions.forEach(s => {
            if (s.attemptId) sessionMap.set(s.attemptId.toString(), s);
        });

        const sessionIds = sessions.map(s => s._id);
        const eventCounts = await ProctoringEvent.aggregate([
            { $match: { sessionId: { $in: sessionIds } } },
            { 
                $group: { 
                    _id: "$sessionId", 
                    totalEvents: { $sum: 1 }, 
                    types: { $push: "$eventType" },
                    tabSwitches: { 
                        $sum: { 
                            $cond: [{ $eq: ["$eventType", "TAB_SWITCH"] }, 1, 0] 
                        } 
                    },
                    fullscreenExits: {
                        $sum: {
                            $cond: [{ $eq: ["$eventType", "FULLSCREEN_EXIT"] }, 1, 0]
                        }
                    }
                } 
            }
        ]);
        const eventCountMap = new Map();
        eventCounts.forEach(e => eventCountMap.set(e._id.toString(), e));

        const formatted = consolidatedAttempts.map(att => {
            const targetTestId = (att.testId?._id || att.testId || att.exam_id?._id || att.exam_id)?.toString();
            const testObj = (att.testId && att.testId.title) ? att.testId : ((att.exam_id && att.exam_id.title) ? att.exam_id : (targetTestId ? testMap.get(targetTestId) : null));

            const studentObj = (att.student_id && (att.student_id.username || att.student_id.name)) ? att.student_id : (att.student_id ? studentMap.get(att.student_id.toString()) : null);

            const session = sessionMap.get(att._id.toString());
            const eventStats = session ? eventCountMap.get(session._id.toString()) : null;

            // Compute total violations & switches from proctoring session and events
            const sessionSwitches = session?.tabSwitchCount ?? 0;
            const eventSwitches = eventStats?.tabSwitches ?? 0;
            const calculatedSwitches = Math.max(att.tab_switches || 0, sessionSwitches, eventSwitches);
            
            const totalViolations = eventStats?.totalEvents ?? calculatedSwitches;
            const riskScore = session?.riskScore ?? (calculatedSwitches > 0 ? Math.min(100, calculatedSwitches * 25) : 0);

            // Determine effective status
            let effectiveStatus = att.status || "Submitted";
            if (session?.status === "TERMINATED" && (effectiveStatus === "Started" || effectiveStatus === "Submitted")) {
                effectiveStatus = "Disqualified";
            }

            // Calculate total marks for test
            let totalMarks = testObj?.totalMarks || (targetTestId ? testMarksMap.get(targetTestId) : 0) || 0;
            if (!totalMarks || totalMarks <= 0) {
                totalMarks = 10;
            }

            const isStarted = effectiveStatus === "Started";
            const isDisqualified = effectiveStatus === "Disqualified";

            let obtainedMarks = 0;
            let percentage = 0;

            if (isDisqualified) {
                obtainedMarks = 0;
                percentage = 0;
            } else if (!isStarted) {
                if (typeof att.obtainedMarks === "number" && att.obtainedMarks > 0) {
                    obtainedMarks = att.obtainedMarks;
                } else if (typeof att.score === "number" && att.score > 0) {
                    obtainedMarks = att.score;
                }

                // If obtainedMarks is 0, check student answers for graded marks
                const attemptAnswers = answersMap.get(att._id.toString()) || [];
                if (obtainedMarks === 0 && attemptAnswers.length > 0) {
                    let manualSum = 0;
                    for (const ans of attemptAnswers) {
                        const q = questionsList.find(qItem => qItem._id.toString() === ans.question_id?.toString());
                        if (q && q.correct_option_id && ans.selected_option_id && q.correct_option_id.toString() === ans.selected_option_id.toString()) {
                            manualSum += (q.marks || 1);
                        }
                    }
                    if (manualSum > 0) obtainedMarks = manualSum;
                }

                percentage = totalMarks > 0 ? Math.min(100, Math.max(0, Math.round((obtainedMarks / totalMarks) * 100))) : 0;
            }

            return {
                id: att._id,
                testId: targetTestId,
                exam_id: targetTestId,
                studentId: (studentObj?._id || att.student_id?._id || att.student_id)?.toString(),
                studentName: studentObj?.username || studentObj?.name || att.studentName || "Student",
                rollNumber: att.rollNumber || studentObj?.rollno || studentObj?.rollNumber || "N/A",
                department: studentObj?.department || "General",
                testTitle: testObj?.title || "Assessment",
                testType: testObj?.category || testObj?.testType || "Aptitude",
                score: percentage,
                percentage: percentage,
                obtainedMarks: obtainedMarks,
                totalMarks: totalMarks,
                tabSwitches: calculatedSwitches,
                violations: totalViolations,
                riskScore: riskScore,
                status: effectiveStatus,
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
