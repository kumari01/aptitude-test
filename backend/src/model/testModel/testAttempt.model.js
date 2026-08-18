const mongoose = require("mongoose");

const testAttemptSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
    },

    exam_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
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

    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },

    attemptNumber: {
      type: Number,
      default: 1,
      min: 1,
    },

    started_at: {
      type: Date,
      default: Date.now,
    },

    submitted_at: {
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

    tab_switches: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "Started",
        "Submitted",
        "Time Expired",
        "Auto Submitted",
        "Disqualified",
      ],
      default: "Started",
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

testAttemptSchema.index({
  student_id: 1,
  testId: 1,
});

testAttemptSchema.index({
  testId: 1,
  status: 1,
});

module.exports = mongoose.model("TestAttempt",testAttemptSchema);