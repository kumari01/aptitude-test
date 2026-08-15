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

    // 4. Create event
    const event = await ProctoringEvent.create({
        sessionId: session._id,
        eventType,
        severity,
        timestamp: new Date()
    });

    // 5. Update session counters
    let updatedSession;

    if (eventType === "TAB_SWITCH") {

        updatedSession = await ProctoringSession.findByIdAndUpdate(
            sessionId,
            {
                $inc: {
                    tabSwitchCount: 1
                }
            },
            {
                returnDocument: 'after'
            }
        );

        // 3rd TAB_SWITCH = automatic submission
        if (updatedSession.tabSwitchCount >= 3) {

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
                    attempt.status === "Time Expired"
                ) {
                    throw new Error("Attempt has already been submitted or auto-submitted");
                }
            }

            // 7. Automatically submit the attempt using shared submission service
            await submitAttempt(updatedSession.attemptId, "Auto Submitted");

            // 8. Terminate proctoring session
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
    }

    return {
        event,
        session: updatedSession
    };
};

module.exports = {
    createProctoringEvent
};