const express = require("express");
const router = express.Router();
const controller = require("../Controllers/testManagement.controller");
const authenticate = require("../Middleware/auth.middleware");
const requireAdmin = require("../Middleware/admin.middleware");

// Create a new test with default settings and targeting
router.post("/create", authenticate, requireAdmin, controller.createTest);

// Update test proctoring & evaluation settings
router.put("/:testId/settings", authenticate, requireAdmin, controller.updateTestSettings);

// Update test target group
router.put("/:testId/target", authenticate, requireAdmin, controller.updateTestTarget);

// Schedule a test & assign to targeted students
router.post("/:testId/schedule", authenticate, requireAdmin, controller.scheduleTest);

// Add a section to a test
router.post("/:testId/sections", authenticate, requireAdmin, controller.createSection);

// Add a question to a section
router.post("/sections/:sectionId/questions", authenticate, requireAdmin, controller.addQuestionToSection);

// Get complete details of a test (sections, settings, schedules)
router.get("/student/assigned", authenticate, controller.listStudentAssignedTests);
router.get("/:testId", authenticate, controller.getTestDetails);

// Delete routes
router.delete("/all", authenticate, requireAdmin, controller.deleteAllTests);
router.delete("/:testId", authenticate, requireAdmin, controller.deleteTest);

module.exports = router;
