const { Student: studentModel, Admin: adminModel } = require('../model/user.model');
const ExamAttempt = require('../model/testModel/testAttempt.model');

const bcrypt = require('bcrypt');
const { issueAuthToken } = require('../utils/authToken');

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

        const token = issueAuthToken(res, student._id, "student");

        const studentData = student.toObject();
        delete studentData.password;

        res.status(201).json({
            message: 'Student created successfully',
            token,
            student: studentData
        });
    } catch (error) {
        res.status(400).json({message: error.message});
    }
}
const studentlogin = async(req,res) =>{
    try{
        const {rollno,password} = req.body;
        const student = await studentModel.findOne({ rollno });
        if(!student){
            return res.status(404).json({message: 'Student not found'});
        }

        if (student.status !== "active") {
            return res.status(403).json({message: 'Student account is not active'});
        }

        const isPasswordValid = await bcrypt.compare(password, student.password);
        if(!isPasswordValid){
            return res.status(401).json({message: 'Invalid password'});
        }

        const token = issueAuthToken(res, student._id, "student");

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

        const token = issueAuthToken(res, admin._id, "admin");

        const adminData = admin.toObject();
        delete adminData.password;

        res.status(201).json({
            message: 'Admin created successfully',
            token,
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

        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if(!isPasswordValid){
            return res.status(401).json({message: 'Invalid password'});
        }

        // Update last login timestamp
        admin.lastLoginAt = new Date();
        await admin.save();

        const token = issueAuthToken(res, admin._id, "admin");

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

    // Get total count of completed exams
    const examsCompleted = await ExamAttempt.countDocuments({
      student_id: studentId,
      status: { $in: ["Submitted", "Time Expired"] },
    });

    if (examsCompleted === 0) {
      return res.status(200).json({
        examsCompleted: 0,
        avgScore: "0%",
        bestScore: "0%",
        recentAttempts: [],
      });
    }

    // Fetch all completed attempts for score statistics
    const allAttempts = await ExamAttempt.find({
      student_id: studentId,
      status: { $in: ["Submitted", "Time Expired"] },
    }).populate("testId", "title category totalMarks");

    let totalPct = 0;
    let bestPct = 0;

    allAttempts.forEach((att) => {
      const totalMarks = att.testId?.totalMarks || 10;
      const pctValue = totalMarks > 0 ? Math.round((att.score / totalMarks) * 100) : 0;
      totalPct += pctValue;
      if (pctValue > bestPct) bestPct = pctValue;
    });

    // Fetch top 7 recent attempts for dashboard display
    const recentAttemptsDocs = await ExamAttempt.find({
      student_id: studentId,
      status: { $in: ["Submitted", "Time Expired"] },
    })
      .populate("testId", "title category totalMarks")
      .sort({ submitted_at: -1 })
      .limit(7);

    const recentAttempts = recentAttemptsDocs.map((att) => {
      const totalMarks = att.testId?.totalMarks || 10;
      const pctValue = totalMarks > 0 ? Math.round((att.score / totalMarks) * 100) : 0;

      return {
        id: att._id,
        title: att.testId?.title || "Exam Attempt",
        score: `${pctValue}%`,
        marks: `${att.score}/${totalMarks} marks`,
        status: pctValue >= 40 ? "Passed" : "Failed",
        date: att.submitted_at ? new Date(att.submitted_at).toLocaleDateString() : "N/A",
      };
    });

    const avgScore = `${Math.round(totalPct / (allAttempts.length || 1))}%`;
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