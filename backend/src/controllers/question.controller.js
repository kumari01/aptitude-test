const mongoose = require('mongoose');
const questionModel = require('../model/question.model');


const createQuestion = async(req,res) =>{
    try{
        const examId = req.params.examId || req.body.exam_id;
        const { question_text, options, correct_answer, marks } = req.body;

        if (!mongoose.Types.ObjectId.isValid(examId)) {
            return res.status(400).json({ message: 'A valid exam id is required' });
        }

        if (!Array.isArray(options) || options.length < 2) {
            return res.status(400).json({ message: 'At least two options are required' });
        }

        const answerIndex = Number(correct_answer);
        if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= options.length) {
            return res.status(400).json({ message: 'A valid correct answer index is required' });
        }

        const question = new questionModel({
            testId: examId,
            exam_id: examId,
            question_text,
            options,
            marks: marks || 1
        });

        question.correct_option_id = question.options[answerIndex]._id;

        await question.save();
        res.status(201).json({
            message: 'Question created successfully',
            question
        });
    }
    catch(error){
        console.log(error);
        res.status(500).json({ message: 'Error creating question' });
    }
}

const getQuestions = async(req,res)=>{
    try{
        //retrieve all questions for a specific exam using unified questionservice
        const examId = req.params.examId || req.query?.exam_id || req.body?.exam_id;
        const { getTestQuestions } = require("../utils/questionService");
        const questions = await getTestQuestions(examId, { includeAnswerKey: false });
        res.status(200).json({ questions });
    }
    catch(error){
        console.log(error);
        res.status(500).json({ message: 'Error retrieving questions' });
    }
}

module.exports = { createQuestion, getQuestions };