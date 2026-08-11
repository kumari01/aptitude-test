const mongoose = require("mongoose");

const testAttemptSchema = new mongoose.Schema({
    testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Test",
        required: true
    },
    scheduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TestSchedule"
    },
    assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TestAssignment"
    },
    rollNumber: {
        type: String,
        trim: true
    },
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student"
    },
    exam_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Test"
    },
    attemptNumber: {
        type: Number,
        default: 1
    },
    started_at: {
        type: Date,
        default: Date.now
    },
    submitted_at: {
        type: Date
    },
    score: {
        type: Number,
        default: 0
    },
    obtainedMarks: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ["Started", "Submitted", "Time Expired"],
        default: "Started"
    },
    tab_switches: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("TestAttempt", testAttemptSchema);
