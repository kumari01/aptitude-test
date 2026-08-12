const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema({

    text:{
        type:String,
        required:true
    }

},{ _id:true });

const questionSchema = new mongoose.Schema({

    testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Test",
    },

    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Test"
    },

    question_text:{
        type:String,
        required:true
    },
    marks:{
        type:Number,
        default:1
    },

    options:[optionSchema],

    correct_option_id:{
        type:mongoose.Schema.Types.ObjectId,
        required:true
    }

});

module.exports = mongoose.model("Question",questionSchema);