const mongoose = require("mongoose");

const testSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    testType: {
        type: String,
        enum: ["Practice", "Assessment", "Exam", "Aptitude", "Technical", "Reasoning", "Verbal", "Coding"],
        default: "Aptitude"
    },
    status: {
        type: String,
        enum: ["Draft", "Published", "Archived"],
        default: "Draft"
    },
    totalMarks: {
        type: Number,
        default: 0
    },
    durationMinutes: {
        type: Number,
        default: 30
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
