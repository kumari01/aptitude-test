const mongoose = require("mongoose");

const testAttemptSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true,
    },

    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TestSchedule",
    },

    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TestAssignment",
    },

    rollNumber: {
      type: String,
      trim: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },

    attemptNumber: {
      type: Number,
      default: 1,
      min: 1,
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    submittedAt: {
      type: Date,
    },

    score: {
      type: Number,
      default: 0,
    },

    obtainedMarks: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "STARTED",
        "SUBMITTED",
        "TIME_EXPIRED",
        "AUTO_SUBMITTED",
        "DISQUALIFIED",
      ],
      default: "STARTED",
    },
  },
  {
    timestamps: true,
  }
);

testAttemptSchema.index({
  studentId: 1,
  testId: 1,
});

testAttemptSchema.index({
  testId: 1,
  status: 1,
});

module.exports = mongoose.model("TestAttempt",testAttemptSchema);