const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    username:{
        type: String,
        required:true,
    },
    rollno:{
        type: String,
        required:true,
        unique:true
    },
    email:{
        type: String,
        required:true,
        unique:true
    },
    role:{
        type:String,
        enum:["student","admin"],
        default:"student"
    }
})

module.exports = mongoose.model('Student',studentSchema);