const express = require("express");

const {
    getLeaderboard,
    getStudentRank
} = require("../Controllers/leaderboard.controller");

const router = express.Router();


// Get complete leaderboard
router.get("/:examId", getLeaderboard);


// Get specific student's rank
router.get(
    "/:examId/student/:studentId",
    getStudentRank
);

module.exports = router;