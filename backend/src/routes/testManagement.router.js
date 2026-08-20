const express = require("express");
const router = express.Router();
const controller = require("../Controllers/testManagement.controller");
const authenticate = require("../Middleware/auth.middleware");
const requireAdmin = require("../Middleware/admin.middleware");

// Create a new test with default settings and targeting
router.post("/create", authenticate, requireAdmin, controller.createTest);

// Update test proctoring & evaluation settings
router.put("/:testId/settings", authenticate, requireAdmin, controller.updateTestSettings);

// Unified full exam configuration update (General, Proctoring, Target, Schedule)
router.put("/:testId/full-update", authenticate, requireAdmin, controller.updateFullTestConfiguration);

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

// Admin: list all tests for admin dashboard
router.get("/admin/all", authenticate, requireAdmin, controller.listAllTests);

// Admin: summary overview metrics
router.get("/admin/overview", authenticate, requireAdmin, controller.getAdminOverview);

// Admin: all student exam attempts log
router.get("/admin/attempts", authenticate, requireAdmin, controller.getAdminAttempts);

router.get("/:testId", authenticate, controller.getTestDetails);

module.exports = router;
