const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: false,
    },
    action: {
      type: String,
      required: true,
    },
    targetType: {
      type: String,
      default: "Exam",
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    details: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
