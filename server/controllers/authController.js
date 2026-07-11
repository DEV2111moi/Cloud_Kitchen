const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const HomeCook = require('../models/HomeCook');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc    Login user (admin or homecook)
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Try finding admin first
    let user = await Admin.findOne({ email }).select('+password');
    let role = user ? user.role : null;

    if (!user) {
      // Try finding home cook
      user = await HomeCook.findOne({ email });
      if (user) {
        if (!(await user.matchPassword(password))) {
          return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        if (user.status !== 'approved') {
          return res.status(403).json({ success: false, message: `Your home cook account is ${user.status}. Access denied.` });
        }
        role = 'homecook';
      }
    } else {
      // Validate admin password
      if (!(await user.matchPassword(password))) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: role,
        token,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
exports.getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
