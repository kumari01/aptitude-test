const studentModel = require('../model/user.model');

const RegisterStudent = async(req,res) =>{
    try{
        const {username,rollno,email} = req.body;

        const student = new studentModel({username,rollno,email});
        await student.save();

        res.status(201).json({
            message: 'Student created successfully',
            student
        });
    } catch (error) {
        res.status(400).json({message: error.message});
    }
}

module.exports = { RegisterStudent };