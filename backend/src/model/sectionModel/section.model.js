const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema({
    testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Test",
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    displayOrder: {
        type: Number,
        default: 1
    },
    totalMarks: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Section", sectionSchema);
