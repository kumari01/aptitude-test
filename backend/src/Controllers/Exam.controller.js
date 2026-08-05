const Exam = require("../model/exam_model");
const ExamAttempt = require("../model/examAttempt_model");




const createExam = async(req,res)=>{
    try{
        const { title, duration_minutes, start_time, end_time, total_marks } = req.body;

        const exam = new Exam({
            title,
            duration_minutes,
            start_time,
            end_time,
            total_marks
        });

        await exam.save();
        res.status(201).json({
            message: 'Exam created successfully'
        })
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}

const startExam = async(req,res)=>{
    try{
        const { examId } = req.params;
        const { studentId } = req.body;

        const exam = await Exam.findById(examId);
        if(!exam){
            return res.status(400).json({
                message:'exam not found'
            })
        }

        const attempt = new ExamAttempt({
            student_id: studentId,
            exam_id: examId,
        });
        await attempt.save();
        res.status(200).json({
            message: 'Exam started successfully',
            attempt
        });
    }
    catch(err){
        console.error('Error starting exam:', err);
        res.status(500).json({
            message: 'Internal server error'
        })
    }
}


module.exports = { createExam, startExam };