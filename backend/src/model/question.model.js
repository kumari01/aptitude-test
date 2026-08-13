const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        _id: true
    }
);

const questionSchema = new mongoose.Schema(
    {
        testId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Test"
        },

        topicId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Topic",
            required: false
        },

        question_text: {
            type: String,
            required: true,
            trim: true
        },

        difficulty: {
            type: String,
            enum: ["easy", "medium", "hard"],
            required: true,
            default: "medium"
        },

        marks: {
            type: Number,
            required: true,
            default: 1
        },

        options: {
            type: [optionSchema],
            required: true,
            validate: {
                validator: function (options) {
                    return options.length >= 2;
                },
                message: "A question must have at least 2 options"
            }
        },

        correct_option_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Question", questionSchema);