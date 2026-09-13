const AuditLog = require("../model/auditLog.model");

async function logAdminAction({ adminId, action, targetType = "Exam", targetId = null, details = {} }) {
  try {
    await AuditLog.create({
      adminId,
      action,
      targetType,
      targetId,
      details,
    });
  } catch (err) {
    console.warn("Failed to write audit log:", err.message);
  }
}

module.exports = { logAdminAction };
