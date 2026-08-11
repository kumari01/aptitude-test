const mongoose = require("mongoose");
const Test = require("../model/testModel/test.model");
const ExamAttempt = require("../model/testModel/testAttempt.model");
const questionModel = require("../model/question.model");

const createExam = async(req,res)=>{
    try{
        const { title, testType, duration_minutes, total_marks, totalMarks, maxAttempts } = req.body;

        const test = new Test({
            title,
            testType: testType || "Aptitude",
            status: "Published",
            totalMarks: totalMarks || total_marks || 0,
            maxAttempts: maxAttempts || 1
        });

        await test.save();
        res.status(201).json({
            message: 'Exam created successfully',
            exam: test,
            test
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}

const startExam = async(req,res)=>{
    try{
        const { examId } = req.params;
        const studentId = req.body.studentId || req.body.student_id;

        const test = await Test.findById(examId);
        if(!test){
            return res.status(404).json({
                message:'Exam not found'
            });
        }

        // Check for existing active attempt to resume
        const query = {
            $or: [{ testId: examId }, { exam_id: examId }],
            status: "Started"
        };
        if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
            query.student_id = studentId;
        }

        let attempt = await ExamAttempt.findOne(query);

        if (!attempt) {
            attempt = new ExamAttempt({
                testId: examId,
                exam_id: examId,
                student_id: (studentId && mongoose.Types.ObjectId.isValid(studentId)) ? studentId : new mongoose.Types.ObjectId(),
                started_at: new Date()
            });
            await attempt.save();
        }

        // Fetch questions without exposing correct_option_id
        const questions = await questionModel.find(
            { $or: [{ testId: examId }, { exam_id: examId }] },
            { correct_option_id: 0, __v: 0 }
        );

        res.status(200).json({
            message: 'Exam started successfully',
            attempt,
            exam: test,
            test,
            questions
        });
    }
    catch(err){
        console.error('Error starting exam:', err);
        res.status(500).json({
            message: 'Internal server error'
        });
    }
}


module.exports = { createExam, startExam };