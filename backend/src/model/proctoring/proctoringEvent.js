const mongoose = require("mongoose");

const proctoringEventSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProctoringSession",
      required: true,
      index: true,
    },

    eventType: {
      type: String,
      required: true,
      enum: [
        "TAB_SWITCH",
        "FULLSCREEN_EXIT",
        "WINDOW_BLUR",
        "COPY",
        "PASTE",
        "MULTIPLE_FACE",
        "NO_FACE",
        "SCREEN_SHARE_STOPPED",
      ],
    },

    severity: {
      type: String,
      required: true,
      enum: [
        "LOW",
        "MEDIUM",
        "HIGH",
        "CRITICAL",
      ],
    },

    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

proctoringEventSchema.index({
  sessionId: 1,
  timestamp: -1,
});

const ProctoringEvent = mongoose.model(
  "ProctoringEvent",
  proctoringEventSchema
);

module.exports = ProctoringEvent;