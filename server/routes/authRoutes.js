const express = require('express');
const router = express.Router();
const { login, getProfile, customerSignup, customerLogin } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', login);
router.get('/profile', protect, getProfile);

// Customer Specific Auth
router.post('/customer/signup', customerSignup);
router.post('/customer/login', customerLogin);

module.exports = router;
