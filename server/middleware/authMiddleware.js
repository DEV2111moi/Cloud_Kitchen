const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const HomeCook = require('../models/HomeCook');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Try to find admin first
      let user = await Admin.findById(decoded.id).select('-password');
      let userType = 'admin';
      
      if (!user) {
        // Try to find home cook
        user = await HomeCook.findById(decoded.id).select('-password');
        userType = 'homecook';
      }

      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      // If home cook, ensure they are still approved
      if (userType === 'homecook' && user.status !== 'approved') {
        return res.status(403).json({ success: false, message: 'Your account is not approved or is suspended' });
      }

      req.user = user;
      req.userType = userType;
      // Backward compatibility
      req.admin = user;
      
      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
