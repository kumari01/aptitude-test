const express = require('express');
const mongoose = require('mongoose');

const ExamRouter = require('./routes/Exam.router');
const AuthRouter = require('./routes/auth.router');
const AnswerRouter = require('./routes/answer.router');

const app = express();

app.use(express.json());

app.get('/',(req,res)=>{
    res.send('Welcome to the Quiz App API');
});

app.use('/api/auth', AuthRouter);
app.use('/api/exams', ExamRouter);
app.use('/api/answers', AnswerRouter);

module.exports = app;