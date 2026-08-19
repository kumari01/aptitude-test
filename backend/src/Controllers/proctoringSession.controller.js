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

// Admin: Get live proctoring sessions for a test
const getLiveSessionsForTest = async (req, res) => {
  try {
    const { testId } = req.params;
    const ProctoringEvent = require("../model/proctoring/proctoringEvent");
    const { Student } = require("../model/user.model");

    // 1. Find all attempts for this test
    const attempts = await ExamAttempt.find({
      $or: [{ testId }, { exam_id: testId }],
    }).sort({ createdAt: -1 });

    const attemptIds = attempts.map((a) => a._id);

    // 2. Find sessions linked to these attempts
    const sessions = await ProctoringSession.find({
      attemptId: { $in: attemptIds },
    }).sort({ updatedAt: -1 });

    const liveData = [];
    const processedAttemptIds = new Set();

    for (const session of sessions) {
      processedAttemptIds.add(session.attemptId.toString());
      const attempt = attempts.find((a) => a._id.toString() === session.attemptId.toString());
      let student = null;
      if (attempt?.student_id) {
        student = await Student.findById(attempt.student_id);
      }

      // Fetch recent 5 events for this session
      const events = await ProctoringEvent.find({ sessionId: session._id })
        .sort({ timestamp: -1 })
        .limit(5);

      liveData.push({
        sessionId: session._id,
        attemptId: session.attemptId,
        studentName: student?.username || student?.name || "Student",
        rollNumber: attempt?.rollNumber || student?.rollno || "N/A",
        tabSwitchCount: session.tabSwitchCount || attempt?.tab_switches || 0,
        riskScore: session.riskScore || (attempt?.tab_switches ? Math.min(100, attempt.tab_switches * 25) : 0),
        status: session.status || (attempt?.status === "Started" ? "ACTIVE" : "COMPLETED"),
        attemptStatus: attempt?.status,
        events,
        updatedAt: session.updatedAt || attempt?.updatedAt,
      });
    }

    // Include any active attempts that don't have a session document yet
    for (const attempt of attempts) {
      if (!processedAttemptIds.has(attempt._id.toString()) && (attempt.status === "Started" || attempt.status === "InProgress")) {
        let student = null;
        if (attempt.student_id) {
          student = await Student.findById(attempt.student_id);
        }
        liveData.push({
          sessionId: `att_${attempt._id}`,
          attemptId: attempt._id,
          studentName: student?.username || student?.name || "Student",
          rollNumber: attempt.rollNumber || student?.rollno || "N/A",
          tabSwitchCount: attempt.tab_switches || 0,
          riskScore: attempt.tab_switches ? Math.min(100, attempt.tab_switches * 25) : 0,
          status: "ACTIVE",
          attemptStatus: attempt.status,
          events: [],
          updatedAt: attempt.updatedAt || new Date()
        });
      }
    }

    return res.status(200).json({
      success: true,
      count: liveData.length,
      sessions: liveData,
    });
  } catch (error) {
    console.error("Error fetching live proctoring sessions:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Admin: Manually force terminate a student's session & disqualify attempt
const terminateSessionByAdmin = async (req, res) => {
  try {
    const { sessionId, reason } = req.body;
    const { submitAttempt } = require("../services/attempt.service");

    const session = await ProctoringSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    session.status = "TERMINATED";
    session.endedAt = new Date();
    await session.save();

    if (session.attemptId) {
      try {
        await submitAttempt(session.attemptId, "Auto Submitted");
      } catch (err) {
        // If already submitted/completed, update status directly
        await ExamAttempt.findByIdAndUpdate(session.attemptId, { status: "Auto Submitted" });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Proctoring session terminated and attempt disqualified",
      session,
    });
  } catch (error) {
    console.error("Error terminating session:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Student/System: Disqualify session due to proctoring violations (e.g. fullscreen exit timeout, tab switch limit)
const disqualifySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason, attemptId } = req.body;
    const mongoose = require("mongoose");
    const { submitAttempt } = require("../services/attempt.service");

    let session = null;
    if (sessionId && sessionId !== "undefined" && sessionId !== "null" && mongoose.Types.ObjectId.isValid(sessionId)) {
      session = await ProctoringSession.findById(sessionId);
    }

    if (!session && attemptId && mongoose.Types.ObjectId.isValid(attemptId)) {
      session = await ProctoringSession.findOne({ attemptId });
    }

    const targetAttemptId = attemptId || session?.attemptId;
    if (!targetAttemptId) {
      return res.status(404).json({ success: false, message: "Attempt ID or session not found" });
    }

    const attempt = await ExamAttempt.findById(targetAttemptId);
    if (!attempt) {
      return res.status(404).json({ success: false, message: "Attempt not found" });
    }

    // Verify student owns this attempt or is admin
    const currentUserId = req.user?.id || req.user?._id;
    if (attempt.student_id.toString() !== currentUserId?.toString() && req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden: You do not own this attempt" });
    }

    // Terminate proctoring session
    if (session) {
      session.status = "TERMINATED";
      session.endedAt = new Date();
      await session.save();
    }

    // Auto-submit / disqualify attempt
    try {
      await submitAttempt(targetAttemptId, "Disqualified");
    } catch (err) {
      // If already submitted/completed, force update status to Disqualified
      await ExamAttempt.findByIdAndUpdate(targetAttemptId, {
        status: "Disqualified",
        score: 0,
        obtainedMarks: 0,
        submitted_at: new Date()
      });
    }

    return res.status(200).json({
      success: true,
      message: "Attempt successfully disqualified and submitted",
      reason: reason || "Proctoring violation limit exceeded",
    });
  } catch (error) {
    console.error("Error disqualifying session:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createSession,
  getSession,
  endSession,
  getLiveSessionsForTest,
  terminateSessionByAdmin,
  disqualifySession,
};