const mongoose = require("mongoose");

const studentAnswer =  new mongoose.Schema({
    attempt_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TestAttempt",
        required: true
    },
    question_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: true
    },
    selected_option_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    is_correct: {
        type: Boolean,
        default: false
    },
    marks_awarded: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});


module.exports = mongoose.model("StudentAnswer", studentAnswer);
