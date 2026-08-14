const {createProctoringEvent,} = require("../services/proctoringEvent.service");

const createEvent = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { eventType } = req.body;

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