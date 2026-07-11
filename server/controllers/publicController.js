const MenuItem = require('../models/MenuItem');
const HomeCook = require('../models/HomeCook');
const Order = require('../models/Order');
const Customer = require('../models/Customer');

// @desc    Get all available menu items (public)
// @route   GET /api/public/menu
exports.getMenu = async (req, res) => {
  try {
    const { category, cuisine, search, veg, sort } = req.query;
    const query = { isAvailable: true };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (cuisine && cuisine !== 'all') {
      query.cuisine = { $regex: cuisine, $options: 'i' };
    }

    if (veg === 'true') {
      query.isVeg = true;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { cuisine: { $regex: search, $options: 'i' } },
      ];
    }

    // Only show items from approved home cooks
    const approvedCooks = await HomeCook.find({ status: 'approved' }).select('_id');
    query.homeCookId = { $in: approvedCooks.map(c => c._id) };

    let sortOption = { createdAt: -1 };
    if (sort === 'price-low') sortOption = { price: 1 };
    if (sort === 'price-high') sortOption = { price: -1 };
    if (sort === 'rating') sortOption = { rating: -1 };
    if (sort === 'name') sortOption = { name: 1 };

    const menuItems = await MenuItem.find(query)
      .sort(sortOption)
      .populate('homeCookId', 'name rating speciality')
      .lean();

    // Get unique categories for filter
    const categories = await MenuItem.distinct('category', { isAvailable: true });
    const cuisines = await MenuItem.distinct('cuisine', { isAvailable: true });

    res.json({
      success: true,
      data: menuItems,
      filters: { categories, cuisines },
      total: menuItems.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get featured home cooks (public)
// @route   GET /api/public/home-cooks
exports.getFeaturedCooks = async (req, res) => {
  try {
    const cooks = await HomeCook.find({ status: 'approved' })
      .sort({ rating: -1 })
      .select('name speciality rating totalOrders bio profileImage')
      .lean();

    res.json({ success: true, data: cooks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register as a home cook (public)
// @route   POST /api/public/register-cook
exports.registerAsCook = async (req, res) => {
  try {
    const { name, email, phone, speciality, bio, address, hasFssai } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Name, email, and phone are required' });
    }

    // Check if already registered
    const existing = await HomeCook.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    const homeCook = await HomeCook.create({
      name,
      email: email.toLowerCase(),
      phone,
      speciality: Array.isArray(speciality) ? speciality : (speciality || '').split(',').map(s => s.trim()).filter(Boolean),
      bio: bio || '',
      address: address || {},
      hasFssai: hasFssai || 'no',
      status: 'pending', // Will need admin approval
    });

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully! Your application will be reviewed by our admin team.',
      data: {
        _id: homeCook._id,
        name: homeCook.name,
        email: homeCook.email,
        status: homeCook.status,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all active customers for selection
// @route   GET /api/public/customers
exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ status: 'active' }).sort({ name: 1 });
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register a new customer (public simulation)
// @route   POST /api/public/customers
exports.registerCustomer = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    let customer = await Customer.findOne({ email: email.toLowerCase() });
    if (!customer) {
      customer = await Customer.create({
        name,
        email: email.toLowerCase(),
        phone,
        addresses: address ? [address] : [],
        status: 'active'
      });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Place order (public simulation)
// @route   POST /api/public/orders
exports.placeOrder = async (req, res) => {
  try {
    const order = await Order.create(req.body);
    const populatedOrder = await Order.findById(order._id)
      .populate('customerId', 'name phone email')
      .lean();

    // Trigger Socket.io notification
    const io = req.app.get('io');
    const activeSockets = req.app.get('activeSockets');
    if (io) {
      // Notify the home cook
      const cookSocketId = activeSockets.get(String(populatedOrder.homeCookId));
      if (cookSocketId) {
        io.to(cookSocketId).emit('newOrder', populatedOrder);
        console.log(`📡 Emitted newOrder to cook socket ${cookSocketId}`);
      }
      // Also broadcast general order update
      io.emit('orderUpdate', populatedOrder);
    }

    res.status(201).json({ success: true, data: populatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get active orders for customer
// @route   GET /api/public/orders/active
exports.getActiveOrders = async (req, res) => {
  try {
    const { customerId } = req.query;
    if (!customerId) {
      return res.status(400).json({ success: false, message: 'Customer ID is required' });
    }
    const orders = await Order.find({
      customerId,
      status: { $in: ['placed', 'preparing', 'ready', 'picked'] }
    })
      .populate('homeCookId', 'name phone speciality')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
