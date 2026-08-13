const mongoose = require("mongoose");

const testSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    testType: {
        type: String,
        enum: ["Practice", "Assessment", "Exam", "Aptitude", "Technical", "Logical", "Verbal", "Core Engineering"],
        default: "Aptitude"
    },
    status: {
        type: String,
        enum: ["Draft", "Published", "Archived"],
        default: "Draft"
    },
    duration_minutes: {
        type: Number,
        default: 30
    },
    totalMarks: {
        type: Number,
        default: 0
    },
    maxAttempts: {
        type: Number,
        default: 1
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Test", testSchema);
