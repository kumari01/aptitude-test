const ProctoringSession = require("../model/proctoring/proctoringSession");
const ProctoringEvent = require("../model/proctoring/proctoringEvent");

const EVENT_SEVERITY = {
  TAB_SWITCH: "MEDIUM",
  FULLSCREEN_EXIT: "HIGH",
  WINDOW_BLUR: "LOW",
  COPY: "HIGH",
  PASTE: "HIGH",
  MULTIPLE_FACE: "CRITICAL",
  NO_FACE: "HIGH",
  SCREEN_SHARE_STOPPED: "CRITICAL",
};

const createProctoringEvent = async ({ sessionId, eventType }) => {
  // 1. Find the proctoring session
  const session = await ProctoringSession.findById(sessionId);

  if (!session) {
    throw new Error("Proctoring session not found");
  }

  // 2. Events can only be recorded for active sessions
  if (session.status !== "ACTIVE") {
    throw new Error("Proctoring session is not active");
  }

  // 3. Backend determines severity
  const severity = EVENT_SEVERITY[eventType];

  if (!severity) {
    throw new Error("Invalid proctoring event type");
  }

  // 4. Create the event
  const event = await ProctoringEvent.create({
    sessionId: session._id,
    eventType,
    severity,
    timestamp: new Date(),
  });

  // 5. Update session statistics
  const update = {};

  switch (eventType) {
    case "TAB_SWITCH":
      update.$inc = {
        tabSwitchCount: 1,
      };
      break;

    default:
      update.$inc = {
        suspiciousActivityCount: 1,
      };
  }

  // 6. Update the session
  const updatedSession = await ProctoringSession.findByIdAndUpdate(
    sessionId,
    update,
    {
      new: true,
    }
  );

  return {
    event,
    session: updatedSession,
  };
};

module.exports = {
  createProctoringEvent,
};