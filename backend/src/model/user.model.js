const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    username:{
        type: String,
        required:true,
    },
    email:{
        type: String,
        required:true,
        unique:true,
        match: [/@sasi\.ac\.in$/, "Only @sasi.ac.in emails are allowed"]
    },
    rollNumber:{
        type: String,
        required:true,
        unique:true,
        alias: 'rollno',
        match: [/^\d{2}[A-Za-z]\d{2}[A-Za-z]\d{2}[A-Za-z0-9]{2}$/, "incorrect roll number format"]    
    },
    passwordHash:{
        type: String,
        required:true,
        alias: 'password'
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
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true }
});

const adminSchema = new mongoose.Schema({
    username:{
        type: String,
        required:true,
    },
    email:{
        type: String,
        required:true,
        unique:true,
        match: [/@sasi\.ac\.in$/, "Only @sasi.ac.in emails are allowed"]
    },
    adminid:{
        type: String,
        required:true,
        unique:true
    },
    passwordHash:{
        type: String,
        required:true,
        alias: 'password'
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
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true }
});

const Student = mongoose.model('Student', studentSchema);
const Admin = mongoose.model('Admin', adminSchema);

module.exports = { Student, Admin };