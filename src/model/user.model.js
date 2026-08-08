const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    username:{
        type: String,
        required:true,
    },
    rollno:{
        type: String,
        required:true,
        unique:true,
        match: [/^\d{2}[A-Za-z]\d{2}[A-Za-z]\d{2}[A-Za-z0-9]{2}$/, "incorrect roll number format"]    
    },
    email:{
        type: String,
        required:true,
        unique:true
    },
    password:{
        type: String,
        required:true
    },
})
const adminSchema = new mongoose.Schema({
    username:{
        type: String,
        required:true,
    },
    email:{
        type: String,
        required:true,
        unique:true
    },
     adminid:{
        type: String,
        required:true,
        unique:true
    },
    password:{
        type: String,
        required:true
    }
   
})
module.exports = mongoose.model('Student',studentSchema);
module.exports = mongoose.model('Admin',adminSchema);