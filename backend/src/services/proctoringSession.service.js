const ProctoringSession = require("../model/proctoring/proctoringSession");

const createProctoringSession = async (attemptId = null) => {
  const session = await ProctoringSession.create({
    attemptId,
    riskScore: 0,
    tabSwitchCount: 0,
    status: "ACTIVE",
  });

  return session;
};

const findProctoringSessionByAttemptId = async (attemptId) => {
  return ProctoringSession.findOne({ attemptId });
};

const getProctoringSession = async (sessionId) => {
  const session = await ProctoringSession.findById(sessionId);

  if (!session) {
    throw new Error("Proctoring session not found");
  }

  return session;
};

const endProctoringSession = async (sessionId) => {
  const session = await ProctoringSession.findById(sessionId);

  if (!session) {
    throw new Error("Proctoring session not found");
  }

  if (session.status !== "ACTIVE") {
    throw new Error("Proctoring session is already closed");
  }

  session.status = "COMPLETED";
  session.endedAt = new Date();

  await session.save();

  return session;
};

module.exports = {
  createProctoringSession,
  findProctoringSessionByAttemptId,
  getProctoringSession,
  endProctoringSession,
};
