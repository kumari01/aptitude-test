const express = require('express');

const router = express.Router();

const authController = require('../Controllers/auth.controller');

router.post('/signup', authController.RegisterStudent);
router.post('/login', authController.studentlogin);
module.exports = router;