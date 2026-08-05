const studentModel = require('../model/user.model');
const bcrypt = require('bcrypt');

const RegisterStudent = async(req,res) =>{
    try{
        const {username,rollno,email,password} = req.body;

        if(!password){
            return res.status(400).json({message: 'Password is required'});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const student = new studentModel({username,rollno,email,password: hashedPassword});
        await student.save();
        const studentData = student.toObject();
        delete studentData.password;

        res.status(201).json({
            message: 'Student created successfully',
            student: studentData
        });
    } catch (error) {
        res.status(400).json({message: error.message});
    }
}
const studentlogin = async(req,res) =>{
    try{
        const {rollno,password} = req.body;
        const student = await studentModel.findOne({rollno});
        if(!student){
            return res.status(404).json({message: 'Student not found'});
        }

        const isPasswordValid = await bcrypt.compare(password, student.password);
        if(!isPasswordValid){
            return res.status(401).json({message: 'Invalid password'});
        }

        const studentData = student.toObject();
        delete studentData.password;

        res.status(200).json({
            message: 'Student logged in successfully',
            student: studentData
        });
    } catch (error) {
        res.status(400).json({message: error.message});
    }
}
module.exports = { RegisterStudent, studentlogin };