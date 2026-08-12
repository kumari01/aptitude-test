const mongoose = require("mongoose");

const studentAnswer =  new mongoose.Schema({
    attemptId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ExamAttempt",
        required: true
    },
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: true
    },
    selectedOptionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    isIorrect: {
        type: Boolean,
        default: false
    },
    marksAwarded: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});


module.exports = mongoose.model("StudentAnswer", studentAnswer);