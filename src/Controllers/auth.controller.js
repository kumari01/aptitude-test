const studentModel = require('../model/user.model');
const bcrypt = require('bcrypt');

const RegisterStudent = async(req,res) =>{
    try{
        const {username,rollno,email,password} = req.body;
        const existingStudent = await studentModel.findOne({$or: [{rollno}, {email}]});

        if(existingStudent){
            return res.status(400).json({message: 'Student with this roll number or email already exists'});
        }

        if(!password){
            return res.status(400).json({message: 'Password is required'});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const student = await studentModel.create({
            username,
            rollno,
            email,
            password: hashedPassword
        });

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
const adminregister = async(req,res) =>{
    try{
        const {username,email,adminid,password} = req.body;
        const isadmin = await adminModel.findOne({$or: [{email}, {adminid}]});

        if(isadmin){
            return res.status(400).json({message: 'Admin with this email or admin ID already exists'});
        }

        if(!password){
            return res.status(400).json({message: 'Password is required'});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await adminModel.create({
            username,
            email,
            adminid,
            password: hashedPassword
        });

        res.status(201).json({
            message: 'Admin created successfully',
            admin: adminData
        });
    } catch (error) {
        res.status(400).json({message: error.message});
    }
}
const adminlogin = async(req,res) =>{
    try{
        const {email,password} = req.body;
        const admin = await adminModel.findOne({email});
        if(!admin){
            return res.status(404).json({message: 'Admin not found'});
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if(!isPasswordValid){
            return res.status(401).json({message: 'Invalid password'});
        }

        const adminData = admin.toObject();
        delete adminData.password;

        res.status(200).json({
            message: 'Admin logged in successfully',
            admin: adminData
        });
    } catch (error) {
        res.status(400).json({message: error.message});
    }
}
module.exports = { RegisterStudent, studentlogin, adminregister, adminlogin };