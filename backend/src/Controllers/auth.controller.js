const { Student: studentModel, Admin: adminModel } = require('../model/user.model');
const ExamAttempt = require('../model/testModel/testAttempt.model');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const RegisterStudent = async(req,res) =>{
    try{
        const {username,rollno,email,password,department,batch,section,phone} = req.body;

        if (!email || !email.toLowerCase().endsWith("@sasi.ac.in")) {
            return res.status(400).json({ message: 'Only @sasi.ac.in email addresses are allowed' });
        }

        const existingStudent = await studentModel.findOne({
            $or: [
                { rollno: rollno },
                { email },
            ]
        });

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
            password: hashedPassword,
            department: department || "",
            batch: batch || "",
            section: section || "",
            phone: phone || "",
            status: "active"
        });

        const studentData = student.toObject();
        delete studentData.password;
        delete studentData.passwordHash;

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
        const student = await studentModel.findOne({
            $or: [
                { rollNumber: rollno },
                { rollno: rollno }
            ]
        });
        if(!student){
            return res.status(404).json({message: 'Student not found'});
        }

        if (student.status !== "active") {
            return res.status(403).json({message: 'Student account is not active'});
        }

        const isPasswordValid = await bcrypt.compare(password, student.passwordHash || student.password);
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
        delete studentData.passwordHash;

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
        const {username,email,adminid,password,phone} = req.body;

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
            password: hashedPassword,
            phone: phone || "",
            status: "active"
        });

        const adminData = admin.toObject();
        delete adminData.password;
        delete adminData.passwordHash;

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

        if (admin.status !== "active") {
            return res.status(403).json({message: 'Admin account is not active'});
        }

        const isPasswordValid = await bcrypt.compare(password, admin.passwordHash || admin.password);
        if(!isPasswordValid){
            return res.status(401).json({message: 'Invalid password'});
        }

        // Update last login timestamp
        admin.lastLoginAt = new Date();
        await admin.save();

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
        delete adminData.passwordHash;

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

    // Fetch all completed/submitted/auto-submitted/disqualified attempts for this student
    const attempts = await ExamAttempt.find({
      student_id: studentId,
      status: { $in: ["Submitted", "Auto Submitted", "Completed", "Disqualified"] },
    }).sort({ submitted_at: -1, createdAt: -1 });

    const totalAttempts = attempts.length;

    if (totalAttempts === 0) {
      const Test = require("../model/testModel/test.model");
      let totalExams = 0;
      try {
        totalExams = await Test.countDocuments({ status: { $ne: "Archived" } });
      } catch (e) {}

      return res.status(200).json({
        totalAttempts: 0,
        passedCount: 0,
        examsCompleted: 0,
        totalExams: totalExams || 0,
        totalConducted: totalExams || 0,
        avgScore: "0%",
        bestScore: "0%",
        rank: "—",
        recentAttempts: [],
      });
    }

    let totalPct = 0;
    let bestPct = 0;
    let passedCount = 0;

    const Test = require("../model/testModel/test.model");
    const completedExamIds = new Set();
    const recentAttempts = [];

    for (const att of attempts) {
      const targetTestId = att.testId || att.exam_id;
      if (targetTestId) {
        completedExamIds.add(targetTestId.toString());
      }

      let testObj = null;
      if (targetTestId) {
        testObj = await Test.findById(targetTestId);
      }

      let totalMarks = testObj?.totalMarks || 0;
      if (!totalMarks || totalMarks <= 0) {
        if (targetTestId) {
          const Question = require("../model/question.model");
          const qList = await Question.find({ $or: [{ testId: targetTestId }, { exam_id: targetTestId }] });
          if (qList.length > 0) {
            totalMarks = qList.reduce((sum, q) => sum + (q.marks || 1), 0);
            try {
              await Test.findByIdAndUpdate(targetTestId, { totalMarks });
            } catch (e) {}
          }
        }
      }

      if (!totalMarks || totalMarks <= 0) {
        totalMarks = Math.max(att.score, 100);
      }

      const rawScore = typeof att.obtainedMarks === "number" && att.obtainedMarks > 0 
        ? att.obtainedMarks 
        : (typeof att.score === "number" ? att.score : 0);

      const pctValue = Math.min(100, Math.max(0, Math.round((rawScore / totalMarks) * 100)));
      
      totalPct += pctValue;
      if (pctValue > bestPct) bestPct = pctValue;

      const isDisqualified = att.status === "Auto Submitted" || att.status === "Disqualified";
      const isPassed = !isDisqualified && pctValue >= 40;
      if (isPassed) passedCount++;

      const statusText = isDisqualified ? "Disqualified" : (isPassed ? "Passed" : "Failed");

      recentAttempts.push({
        id: att._id,
        examId: targetTestId,
        title: testObj?.title || "Assessment Attempt",
        category: testObj?.testType || "Aptitude",
        score: `${pctValue}%`,
        fraction: `${rawScore}/${totalMarks}`,
        status: statusText,
        disqualified: isDisqualified,
        date: att.submitted_at ? new Date(att.submitted_at).toLocaleDateString() : (att.started_at ? new Date(att.started_at).toLocaleDateString() : "N/A"),
      });
    }

    const examsCompletedCount = completedExamIds.size;

    const avgScore = totalAttempts > 0 ? `${Math.round(totalPct / totalAttempts)}%` : "0%";
    const bestScore = `${bestPct}%`;

    let totalConducted = 0;
    try {
      // Total number of exams created by Admin
      const totalAdminCreated = await Test.countDocuments({ status: { $ne: "Archived" } });
      totalConducted = Math.max(totalAdminCreated, examsCompletedCount);
    } catch (e) {
      totalConducted = Math.max(1, examsCompletedCount);
    }

    let rank = "—";
    try {
      const Leaderboard = require("../model/leaderboard.model");
      const latestEntry = await Leaderboard.findOne({
        student_id: studentId
      }).sort({ updatedAt: -1 });

      if (latestEntry?.rank) {
        rank = `#${latestEntry.rank}`;
      }
    } catch (e) {}

    res.status(200).json({
      totalAttempts,
      passedCount,
      examsCompleted: examsCompletedCount,
      totalExams: totalConducted,
      totalConducted,
      avgScore,
      bestScore,
      rank,
      recentAttempts,
    });
  } catch (error) {
    console.error("Error fetching student progress:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { RegisterStudent, studentlogin, adminregister, adminlogin, getStudentProfile, getStudentProgress };