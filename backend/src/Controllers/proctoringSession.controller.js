const {
  createProctoringSession,
  getProctoringSession,
  endProctoringSession,
} = require("../services/proctoringSession.service");

const createSession = async (req, res) => {
  try {
    const { attemptId } = req.body;
    const session = await createProctoringSession(attemptId);

    return res.status(201).json({
      success: true,
      message: "Proctoring session created successfully",
      data: session,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await getProctoringSession(sessionId);

    return res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await endProctoringSession(sessionId);

    return res.status(200).json({
      success: true,
      message: "Proctoring session ended successfully",
      data: session,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
module.exports = {
  createSession,
  getSession,
  endSession,
};