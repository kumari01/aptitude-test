const ProctoringSession = require("../model/proctoring/proctoringSession");

const createProctoringSession = async () => {
  const session = await ProctoringSession.create({
    riskScore: 0,
    tabSwitchCount: 0,
    status: "ACTIVE",
  });

  return session;
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
  getProctoringSession,
  endProctoringSession,
};