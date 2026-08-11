const { Student: studentModel, Admin: adminModel } = require('../model/user.model');
const ExamAttempt = require('../model/testModel/testAttempt.model');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const RegisterStudent = async(req,res) =>{
    try{
        const {username,rollno,email,password} = req.body;

        if (!email || !email.toLowerCase().endsWith("@sasi.ac.in")) {
            return res.status(400).json({ message: 'Only @sasi.ac.in email addresses are allowed' });
        }

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
        const token = jwt.sign(
            {
                id: student._id,
                role: "student"
            },
            process.env.JWT_SECRET || process.env.JWT || "default_jwt_secret",
            {
                expiresIn: "1h"
            }
        );
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 1000
        });

        const studentData = student.toObject();
        delete studentData.password;

        res.status(200).json({
            message: 'Student logged in successfully',
            token,
            student: studentData
        });
    } catch (error) {
        res.status(400).json({message: error.message});
    }
}
const adminregister = async(req,res) =>{
    try{
        const {username,email,adminid,password} = req.body;

        if (!email || !email.toLowerCase().endsWith("@sasi.ac.in")) {
            return res.status(400).json({ message: 'Only @sasi.ac.in email addresses are allowed' });
        }

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

        const adminData = admin.toObject();
        delete adminData.password;

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
        const {email, adminid, password} = req.body;
        const query = email ? {email} : {adminid};
        const admin = await adminModel.findOne(query);
        if(!admin){
            return res.status(404).json({message: 'Admin not found'});
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if(!isPasswordValid){
            return res.status(401).json({message: 'Invalid password'});
        }

        const token = jwt.sign(
            {
                id: admin._id,
                role: "admin"
            },
            process.env.JWT_SECRET || process.env.JWT || "default_jwt_secret",
            {
                expiresIn: "1h"
            }
        );
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 1000
        });

        const adminData = admin.toObject();
        delete adminData.password;

        res.status(200).json({
            message: 'Admin logged in successfully',
            token,
            admin: adminData
        });
    } catch (error) {
        res.status(400).json({message: error.message});
    }
};

const getStudentProfile = async (req, res) => {
  try {
    const student = await studentModel
      .findById(req.user.id)
      .select("-password");

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    res.status(200).json({
      student,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

const getStudentProgress = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Fetch all submitted attempts for this student, populated with exam details
    const attempts = await ExamAttempt.find({
      student_id: studentId,
      status: "Submitted",
    })
      .populate("exam_id", "title category totalMarks")
      .sort({ submitted_at: -1 }).limit(7);

    const examsCompleted = attempts.length;

    if (examsCompleted === 0) {
      return res.status(200).json({
        examsCompleted: 0,
        avgScore: "0%",
        bestScore: "0%",
        recentAttempts: [],
      });
    }

    let totalPct = 0;
    let bestPct = 0;

    const recentAttempts = attempts.map((att) => {
      const totalMarks = att.exam_id?.totalMarks || 30;
      const pctValue = Math.round((att.score / totalMarks) * 100);
      
      totalPct += pctValue;
      if (pctValue > bestPct) bestPct = pctValue;

      return {
        id: att._id,
        title: att.exam_id?.title || "Exam Attempt",
        score: `${pctValue}%`,
        marks: `${att.score}/${totalMarks} marks`,
        status: pctValue >= 50 ? "Passed" : "Failed",
        date: att.submitted_at ? new Date(att.submitted_at).toLocaleDateString() : "N/A",
      };
    });

    const avgScore = `${Math.round(totalPct / examsCompleted)}%`;
    const bestScore = `${bestPct}%`;

    res.status(200).json({
      examsCompleted,
      avgScore,
      bestScore,
      recentAttempts,
    });
  } catch (error) {
    console.error("Error fetching student progress:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { RegisterStudent, studentlogin, adminregister, adminlogin, getStudentProfile, getStudentProgress };