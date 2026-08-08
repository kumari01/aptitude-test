const express = require('express');

const router = express.Router();

const authController = require('../Controllers/auth.controller');

router.post('/student/signup', authController.RegisterStudent);
router.post('/student/login', authController.studentlogin);
router.post('/admin/signup', authController.adminregister);
router.post('/admin/login', authController.adminlogin);
module.exports = router;