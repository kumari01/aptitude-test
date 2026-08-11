const mongoose = require("mongoose");

const proctoringSessionSchema = new mongoose.Schema(
  {
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attempt",
      unique: true,
      sparse: true,
    },

    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    tabSwitchCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "ACTIVE",
        "COMPLETED",
        "TERMINATED",
        "FLAGGED",
      ],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  }
);

const ProctoringSession = mongoose.model(
  "ProctoringSession",
  proctoringSessionSchema
);

module.exports = ProctoringSession;