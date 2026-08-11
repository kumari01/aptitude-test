const mongoose = require("mongoose");

const testSettingSchema = new mongoose.Schema({
    testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Test",
        required: true,
        unique: true
    },
    proctoringEnabled: {
        type: Boolean,
        default: true
    },
    tabSwitchLimit: {
        type: Number,
        default: 3
    },
    autoSubmit: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("TestSetting", testSettingSchema);
