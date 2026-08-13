const mongoose = require("mongoose");

const leaderboardSchema = new mongoose.Schema(
    {
        exam_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Test",
            required: true
        },

        attempt_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TestAttempt",
            required: true,
            unique: true
        },

        student_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true
        },

        score: {
            type: Number,
            required: true,
            default: 0
        },

        percentage: {
            type: Number,
            required: true,
            default: 0
        },

        rank: {
            type: Number,
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Quickly get leaderboard for an exam
leaderboardSchema.index({
    exam_id: 1,
    rank: 1
});

const Leaderboard = mongoose.model(
    "LeaderboardEntry",
    leaderboardSchema
);

module.exports = Leaderboard;