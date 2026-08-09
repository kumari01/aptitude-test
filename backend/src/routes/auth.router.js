const express = require('express');

const router = express.Router();

const authController = require('../Controllers/auth.controller');
const authenticate = require("../middleware/auth.middleware");

// Student signup
router.post(
  "/signup",
  authController.RegisterStudent
);

router.post(
  "/student/signup",
  authController.RegisterStudent
);

// Student login
router.post(
  "/login",
  authController.studentlogin
);

router.post(
  "/student/login",
  authController.studentlogin
);

// Admin signup
router.post(
  "/admin/signup",
  authController.adminregister
);

// Admin login
router.post(
  "/admin/login",
  authController.adminlogin
);

// Protected student profile
router.get(
  "/student/profile",
  authenticate,
  authController.getStudentProfile
);

module.exports = router;