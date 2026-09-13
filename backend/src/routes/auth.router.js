const express = require('express');

const router = express.Router();

const authController = require('../controllers/auth.controller');
const authenticate = require("../middleware/auth.middleware");

// Student signup
router.post("/student/signup",authController.RegisterStudent);

// Student login
router.post("/student/login",authController.studentlogin);

// Protected student profile
router.get("/student/profile",authenticate, authController.getStudentProfile);

// Protected student progress
router.get("/student/progress",authenticate, authController.getStudentProgress);

// Admin signup
router.post("/admin/signup", authController.adminregister);

// Admin login
router.post("/admin/login",authController.adminlogin);

// Sliding token refresh
router.post("/refresh", authController.refreshToken);

module.exports = router;