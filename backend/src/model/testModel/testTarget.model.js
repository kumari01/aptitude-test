const mongoose = require("mongoose");

const testTargetSchema = new mongoose.Schema({
    testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Test",
        required: true
    },
    targetType: {
        type: String,
        enum: ["All", "Department", "Batch", "SpecificStudents"],
        default: "All"
    },
    departments: [{
        type: String
    }],
    batches: [{
        type: String
    }],
    studentRollNumbers: [{
        type: String
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model("TestTarget", testTargetSchema);
