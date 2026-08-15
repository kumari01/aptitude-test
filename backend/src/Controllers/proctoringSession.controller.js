const {
  createProctoringSession,
  getProctoringSession,
  endProctoringSession,
} = require("../services/proctoringSession.service");
const ProctoringSession = require("../model/proctoring/proctoringSession");
const ExamAttempt = require("../model/testModel/testAttempt.model");

const createSession = async (req, res) => {
  try {
    const { attemptId } = req.body;

    // Find the attempt and verify ownership
    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found"
      });
    }

    // Authorization: student must own this attempt
    if (attempt.student_id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not own this attempt"
      });
    }

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

    // Authorization: verify the session belongs to the authenticated student
    if (session.attemptId) {
      const attempt = await ExamAttempt.findById(session.attemptId);
      if (!attempt) {
        return res.status(404).json({
          success: false,
          message: "Attempt not found"
        });
      }

      if (attempt.student_id.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You do not own this proctoring session"
        });
      }
    }

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

    // Authorization: verify the session belongs to the authenticated student
    const session = await ProctoringSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Proctoring session not found"
      });
    }

    if (session.attemptId) {
      const attempt = await ExamAttempt.findById(session.attemptId);
      if (!attempt) {
        return res.status(404).json({
          success: false,
          message: "Attempt not found"
        });
      }

      if (attempt.student_id.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You do not own this proctoring session"
        });
      }
    }

    const endedSession = await endProctoringSession(sessionId);

    return res.status(200).json({
      success: true,
      message: "Proctoring session ended successfully",
      data: endedSession,
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