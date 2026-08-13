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

    rollno: {
      type: String,
      trim: true,
    },

    rollNumber: {
      type: String,
      trim: true,
    },

    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
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

    started_at: {
      type: Date,
      default: Date.now,
    },

    submittedAt: {
      type: Date,
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

    status: {
      type: String,
      enum: [
        "Started",
        "Submitted",
        "Time Expired",
        "STARTED",
        "SUBMITTED",
        "TIME_EXPIRED",
        "AUTO_SUBMITTED",
        "DISQUALIFIED",
      ],
      default: "Started",
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

module.exports = mongoose.model("TestAttempt", testAttemptSchema);