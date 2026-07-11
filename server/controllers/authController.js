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

const Customer = require('../models/Customer');

// @desc    Register a new customer account (Signup)
// @route   POST /api/auth/customer/signup
exports.customerSignup = async (req, res) => {
  try {
    const { name, email, phone, password, address } = req.body;

    let customer = await Customer.findOne({ email: email.toLowerCase() });
    if (customer) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const addresses = address ? [{
      label: 'Home',
      street: address.street || '',
      city: address.city || '',
      state: address.state || '',
      pincode: address.pincode || ''
    }] : [];

    customer = await Customer.create({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      addresses,
      status: 'active'
    });

    const token = generateToken(customer._id);

    res.status(201).json({
      success: true,
      message: 'Signup successful',
      data: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        role: 'customer',
        token
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Authenticate customer (Login)
// @route   POST /api/auth/customer/login
exports.customerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const customer = await Customer.findOne({ email: email.toLowerCase() });
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (customer.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Your account has been blocked by the admin' });
    }

    const isMatch = await customer.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(customer._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        role: 'customer',
        token
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
