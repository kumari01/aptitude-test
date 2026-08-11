const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true,
    },
    email:{
        type: String,
        required: true,
        unique: true,
        match: [/@sasi\.ac\.in$/, "Only @sasi.ac.in emails are allowed"]
    },
    rollno:{
        type: String,
        required: true,
        unique: true,
        match: [/^\d{2}[A-Za-z]\d{2}[A-Za-z]\d{2}[A-Za-z0-9]{2}$/, "incorrect roll number format"]    
    },
    password:{
        type: String,
        required: true,
    }
});

const adminSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true,
    },
    email:{
        type: String,
        required: true,
        unique: true,
        match: [/@sasi\.ac\.in$/, "Only @sasi.ac.in emails are allowed"]
    },
    adminid:{
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true,
    }
});

const Student = mongoose.model('Student', studentSchema);
const Admin = mongoose.model('Admin', adminSchema);

module.exports = { Student, Admin };