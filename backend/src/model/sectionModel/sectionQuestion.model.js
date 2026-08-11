const mongoose = require("mongoose");

const sectionQuestionSchema = new mongoose.Schema({
    sectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Section",
        required: true
    },
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: true
    },
    displayOrder: {
        type: Number,
        default: 1
    },
    marks: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("SectionQuestion", sectionQuestionSchema);
