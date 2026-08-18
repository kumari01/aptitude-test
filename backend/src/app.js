const express = require('express');
const cors = require("cors");
const mongoose = require('mongoose');


const ExamRouter = require('./routes/Exam.router');
const AuthRouter = require('./routes/auth.router');
const AnswerRouter = require('./routes/answer.router');
const TestManagementRouter = require('./routes/testManagement.router');
const ProctoringEventRoute = require('./routes/proctoringEvent.route');
const proctoringSessionRoutes = require("./routes/proctoringSession.route");
const LeaderboardRouter = require('./routes/leaderboard.router');

const app = express();

// CORS

const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.use(cors({ origin: "http://localhost:5173", credentials: true }));


app.use(express.json());  

app.get('/',(req,res)=>{
    res.send('Welcome to the Quiz App API');
});

app.use('/api/auth', AuthRouter);
app.use('/api/exams', ExamRouter);
app.use('/api/answers', AnswerRouter);
app.use('/api/test-management', TestManagementRouter);
app.use("/api/v1/proctoring",proctoringSessionRoutes);
app.use("/api/v1/proctoring",ProctoringEventRoute);
app.use('/api/leaderboard', LeaderboardRouter);

module.exports = app;