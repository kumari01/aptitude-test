const {createProctoringEvent,} = require("../services/proctoringEvent.service");
const ProctoringSession = require("../model/proctoring/proctoringSession");
const ExamAttempt = require("../model/testModel/testAttempt.model");

const createEvent = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { eventType } = req.body;

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

      // Authorization: student must own this attempt
      if (attempt.student_id.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You do not own this proctoring session"
        });
      }
    }

    const result = await createProctoringEvent({
      sessionId,
      eventType,
    });

    return res.status(201).json({
      success: true,
      message: "Proctoring event recorded successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createEvent,
};