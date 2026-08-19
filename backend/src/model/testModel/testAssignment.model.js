const mongoose = require("mongoose");

const testAssignmentSchema = new mongoose.Schema({
    testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Test",
        required: true
    },
    scheduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TestSchedule",
        required: true
    },
    rollno: {
        type: String,
        trim: true
    },
    rollNumber: {
        type: String,
        trim: true
    },
    attemptLimit: {
        type: Number,
        default: 1
    },
    status: {
        type: String,
        enum: ["Assigned", "In Progress", "Completed", "Expired"],
        default: "Assigned"
    }
}, {
    timestamps: true,
    strict: false
});

module.exports = mongoose.model("TestAssignment", testAssignmentSchema);
