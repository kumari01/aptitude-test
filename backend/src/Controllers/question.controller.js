const mongoose = require('mongoose');
const questionModel = require('../model/question.model');
const Test = require('../model/testModel/test.model');
const Topic = require('../model/topic.model');

const createQuestion = async(req,res) =>{
    try{
        const testId = req.params.examId || req.body.testId;
        const { question_text, options, correct_answer, correct_option_id, marks, topicId, topicName, topic_name, topic, difficulty } = req.body;

        if (!mongoose.Types.ObjectId.isValid(testId)) {
            return res.status(400).json({ message: 'A valid test id is required' });
        }

        if (!Array.isArray(options) || options.length < 2) {
            return res.status(400).json({ message: 'At least two options are required' });
        }

        const questionMarks = marks || 1;

        // Resolve Topic ID (by topicId or topicName)
        let resolvedTopicId = null;
        if (topicId && mongoose.Types.ObjectId.isValid(topicId)) {
            resolvedTopicId = topicId;
        } else {
            const nameToFind = topicName || topic_name || topic;
            if (nameToFind && typeof nameToFind === 'string' && nameToFind.trim()) {
                const cleanName = nameToFind.trim();
                let foundTopic = await Topic.findOne({ name: cleanName });
                if (!foundTopic) {
                    foundTopic = new Topic({ name: cleanName, status: 'active' });
                    await foundTopic.save();
                }
                resolvedTopicId = foundTopic._id;
            }
        }

        const question = new questionModel({
            testId,
            topicId: resolvedTopicId,
            question_text,
            difficulty: difficulty || "medium",
            options,
            marks: questionMarks
        });

        if (correct_option_id && mongoose.Types.ObjectId.isValid(correct_option_id)) {
            question.correct_option_id = correct_option_id;
        } else {
            const answerIndex = Number(correct_answer);
            if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= options.length) {
                return res.status(400).json({ message: 'A valid correct answer or correct_option_id is required' });
            }
            question.correct_option_id = question.options[answerIndex]._id;
        }

        await question.save();

        // Keep the test's totalMarks in sync so results/leaderboard
        // percentages never drift from the actual question set.
        await Test.findByIdAndUpdate(testId, { $inc: { totalMarks: questionMarks } });

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
        const testId = req.params.examId || req.query?.testId || req.body?.testId;
        const questions = await questionModel.find(
            { testId },
            {
                correct_option_id: 0,
                __v: 0
            }
        ).populate('topicId', 'name status');
        
        res.status(200).json({ questions });
    }
    catch(error){
        console.log(error);
        res.status(500).json({ message: 'Error retrieving questions' });
    }
}

module.exports = { createQuestion, getQuestions };