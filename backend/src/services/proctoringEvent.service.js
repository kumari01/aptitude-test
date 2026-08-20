const ProctoringSession = require("../model/proctoring/proctoringSession");
const ProctoringEvent = require("../model/proctoring/proctoringEvent");
const ExamAttempt = require("../model/testModel/testAttempt.model");
const { submitAttempt } = require("./attempt.service");

const EVENT_SEVERITY = {
    TAB_SWITCH: "MEDIUM",
    FULLSCREEN_EXIT: "HIGH",
    WINDOW_BLUR: "LOW",
    COPY: "HIGH",
    PASTE: "HIGH",
    MULTIPLE_FACE: "CRITICAL",
    NO_FACE: "HIGH",
    SCREEN_SHARE_STOPPED: "CRITICAL"
};

// Risk score increment per severity level
const SEVERITY_RISK_INCREMENT = {
    LOW: 5,
    MEDIUM: 10,
    HIGH: 20,
    CRITICAL: 30
};

const createProctoringEvent = async ({ sessionId, eventType }) => {

    // 1. Find session
    const session = await ProctoringSession.findById(sessionId);

    if (!session) {
        throw new Error("Proctoring session not found");
    }

    // 2. Only active sessions can receive events
    if (session.status !== "ACTIVE") {
        throw new Error("Proctoring session is not active");
    }

    // 3. Determine severity on backend
    const severity = EVENT_SEVERITY[eventType];

    if (!severity) {
        throw new Error("Invalid proctoring event type");
    }

    // 4. Debounce check: If a tab/window violation event was logged within the last 3 seconds (e.g. while countdown modal is running), ignore duplicate
    if (eventType === "TAB_SWITCH" || eventType === "FULLSCREEN_EXIT" || eventType === "WINDOW_BLUR") {
        const lastViolation = await ProctoringEvent.findOne({
            sessionId: session._id,
            eventType: { $in: ["TAB_SWITCH", "FULLSCREEN_EXIT", "WINDOW_BLUR"] }
        }).sort({ timestamp: -1 });

        if (lastViolation && (Date.now() - new Date(lastViolation.timestamp).getTime()) < 1500) {
            return {
                event: lastViolation,
                session
            };
        }
    }

    // 5. Create event
    const event = await ProctoringEvent.create({
        sessionId: session._id,
        eventType,
        severity,
        timestamp: new Date()
    });

    // 6. Update session counters
    let updatedSession;

    if (eventType === "TAB_SWITCH" || eventType === "FULLSCREEN_EXIT") {

        const riskIncrement = SEVERITY_RISK_INCREMENT[severity] || 10;

        updatedSession = await ProctoringSession.findByIdAndUpdate(
            sessionId,
            {
                $inc: {
                    tabSwitchCount: 1,
                    riskScore: riskIncrement
                }
            },
            {
                returnDocument: 'after'
            }
        );

        if (updatedSession?.riskScore > 100) {
            updatedSession.riskScore = 100;
            await updatedSession.save();
        }

        if (updatedSession?.attemptId) {
            await ExamAttempt.findByIdAndUpdate(updatedSession.attemptId, {
                $inc: { tab_switches: 1 }
            });
        }

        // Limit check -> automatic submission
        let limit = 3;
        if (updatedSession.attemptId) {
            try {
                const attemptDoc = await ExamAttempt.findById(updatedSession.attemptId);
                if (attemptDoc) {
                    const targetTestId = attemptDoc.testId || attemptDoc.exam_id;
                    const TestSetting = require("../model/testModel/testSetting.model");
                    const setting = await TestSetting.findOne({ testId: targetTestId });
                    if (setting?.tabSwitchLimit) {
                        limit = setting.tabSwitchLimit;
                    }
                }
            } catch (err) {
                console.warn("Could not fetch test setting for limit check:", err);
            }
        }

        if (updatedSession.tabSwitchCount >= limit) {

            if (!updatedSession.attemptId) {
                throw new Error(
                    "Proctoring session is not linked to an attempt"
                );
            }

            // Check if attempt is already submitted/auto-submitted
            if (updatedSession.attemptId) {
                const attempt = await ExamAttempt.findById(updatedSession.attemptId);
                if (!attempt) {
                    throw new Error("Proctoring session references a non-existent attempt");
                }
                if (
                    attempt.status === "Submitted" ||
                    attempt.status === "Auto Submitted" ||
                    attempt.status === "Disqualified" ||
                    attempt.status === "Time Expired" ||
                    attempt.status === "Completed"
                ) {
                    throw new Error("Attempt has already been submitted or auto-submitted");
                }
            }

            // Automatically submit the attempt using shared submission service
            await submitAttempt(updatedSession.attemptId, "Auto Submitted");

            // Terminate proctoring session
            updatedSession.status = "TERMINATED";

            await updatedSession.save();
        }

    } else {

        // Non-TAB_SWITCH events increase the session risk score
        const riskIncrement = SEVERITY_RISK_INCREMENT[severity] || 0;

        updatedSession = await ProctoringSession.findByIdAndUpdate(
            sessionId,
            {
                $inc: {
                    riskScore: riskIncrement
                }
            },
            {
                returnDocument: 'after'
            }
        );

        // Cap riskScore at 100 (schema max)
        if (updatedSession.riskScore > 100) {
            updatedSession.riskScore = 100;
            await updatedSession.save();
        }

        // Increment tab_switches on attempt for window blur
        if (updatedSession.attemptId && eventType === "WINDOW_BLUR") {
            await ExamAttempt.findByIdAndUpdate(updatedSession.attemptId, {
                $inc: { tab_switches: 1 }
            });
        }
    }

    return {
        event,
        session: updatedSession
    };
};

module.exports = {
    createProctoringEvent
};