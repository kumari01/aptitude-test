const ProctoringSession = require("../model/proctoring/proctoringSession");
const ProctoringEvent = require("../model/proctoring/proctoringEvent");
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

        // 6. Fourth tab switch = automatic submission
        if (updatedSession.tabSwitchCount >= 4) {

            if (!updatedSession.attemptId) {
                throw new Error(
                    "Proctoring session is not linked to an attempt"
                );
            }

            // 7. Automatically submit the attempt
            await submitAttempt(
                updatedSession.attemptId,
                "Auto Submitted"
            );

            // 8. Terminate proctoring session
            updatedSession.status = "TERMINATED";

            await updatedSession.save();
        }

    } else {

        updatedSession = await ProctoringSession.findByIdAndUpdate(
            sessionId,
            {
                $inc: {
                    suspiciousActivityCount: 1
                }
            },
            {
                returnDocument: 'after'
            }
        );
    }

    return {
        event,
        session: updatedSession
    };
};

module.exports = {
    createProctoringEvent
};