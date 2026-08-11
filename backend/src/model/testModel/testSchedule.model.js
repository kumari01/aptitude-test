const mongoose = require("mongoose");

const testScheduleSchema = new mongoose.Schema({
    testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Test",
        required: true
    },
    startAt: {
        type: Date,
        required: true
    },
    endAt: {
        type: Date,
        required: true
    },
    targetDepartments: [{
        type: String
    }],
    targetBatches: [{
        type: String
    }],
    status: {
        type: String,
        enum: ["Scheduled", "Active", "Completed", "Cancelled"],
        default: "Scheduled"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("TestSchedule", testScheduleSchema);
