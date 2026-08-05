const mongoose = require("mongoose");

const examAttemptSchema = new mongoose.Schema({
    student_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Student",
        required:true
    },

    exam_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Exam",
        required:true
    },

    started_at:{
        type:Date,
        default:Date.now
    },

    submitted_at:{
        type:Date
    },

    score:{
        type:Number,
        default:0
    },

    status:{
        type:String,
        enum:["Started","Submitted","Time Expired"],
        default:"Started"
    }

},{
    timestamps:true
});

module.exports = mongoose.model("ExamAttempt",examAttemptSchema);