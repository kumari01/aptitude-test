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
    },
    department: {
        type: String,
        default: ""
    },
    batch: {
        type: String,
        default: ""
    },
    section: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        default: "active"
    },
    phone: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
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
    },
    phone: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        default: "active"
    },
    lastLoginAt: {
        type: Date
    }
}, {
    timestamps: true
});

const Student = mongoose.model('Student', studentSchema);
const Admin = mongoose.model('Admin', adminSchema);

module.exports = { Student, Admin };
