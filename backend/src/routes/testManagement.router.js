const express = require("express");
const router = express.Router();
const controller = require("../Controllers/testManagement.controller");

// Create a new test with default settings and targeting
router.post("/create", controller.createTest);

// Update test proctoring & evaluation settings
router.put("/:testId/settings", controller.updateTestSettings);

// Schedule a test & assign to targeted students
router.post("/:testId/schedule", controller.scheduleTest);

// Add a section to a test
router.post("/:testId/sections", controller.createSection);

// Add a question to a section
router.post("/sections/:sectionId/questions", controller.addQuestionToSection);

// Get complete details of a test (sections, settings, schedules)
router.get("/student/assigned", controller.listStudentAssignedTests);
router.get("/:testId", controller.getTestDetails);

module.exports = router;
