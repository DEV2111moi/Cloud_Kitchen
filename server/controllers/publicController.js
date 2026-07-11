const MenuItem = require('../models/MenuItem');
const HomeCook = require('../models/HomeCook');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const DeliveryPartner = require('../models/DeliveryPartner');

// @desc    Get all available menu items (public)
// @route   GET /api/public/menu
exports.getMenu = async (req, res) => {
  try {
    const { category, cuisine, search, veg, sort, city } = req.query;
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

    // Only show items from approved home cooks in the selected city
    const cookQuery = { status: 'approved' };
    if (city && city !== 'all') {
      cookQuery['address.city'] = { $regex: new RegExp(`^${city}$`, 'i') };
    }
    const approvedCooks = await HomeCook.find(cookQuery).select('_id');
    query.homeCookId = { $in: approvedCooks.map(c => c._id) };

    let sortOption = { createdAt: -1 };
    if (sort === 'price-low') sortOption = { price: 1 };
    if (sort === 'price-high') sortOption = { price: -1 };
    if (sort === 'rating') sortOption = { rating: -1 };
    if (sort === 'name') sortOption = { name: 1 };

    const menuItems = await MenuItem.find(query)
      .sort(sortOption)
      .populate('homeCookId', 'name rating speciality address')
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
    const { city } = req.query;
    const cookQuery = { status: 'approved' };
    if (city && city !== 'all') {
      cookQuery['address.city'] = { $regex: new RegExp(`^${city}$`, 'i') };
    }
    const cooks = await HomeCook.find(cookQuery)
      .sort({ rating: -1 })
      .select('name speciality rating totalOrders bio profileImage address')
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
    const { homeCookId } = req.body;
    
    // Find the home cook to know their city
    const cook = await HomeCook.findById(homeCookId);
    const cookCity = cook && cook.address && cook.address.city ? cook.address.city : null;

    let deliveryPartnerId = null;
    if (cookCity) {
      // Find an approved and available delivery partner in the cook's city
      const availablePartner = await DeliveryPartner.findOne({
        status: 'approved',
        isAvailable: true,
        city: { $regex: new RegExp(`^${cookCity}$`, 'i') }
      });

      if (availablePartner) {
        deliveryPartnerId = availablePartner._id;
      }
    }

    const orderData = { ...req.body };
    if (deliveryPartnerId) {
      orderData.deliveryPartnerId = deliveryPartnerId;
    }

    const order = await Order.create(orderData);

    if (deliveryPartnerId) {
      // Mark delivery partner as unavailable and set current order
      await DeliveryPartner.findByIdAndUpdate(deliveryPartnerId, {
        currentOrderId: order._id,
        isAvailable: false
      });
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('customerId', 'name phone email')
      .populate('deliveryPartnerId', 'name phone vehicleType')
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
      .populate('deliveryPartnerId', 'name phone vehicleType')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get active orders for delivery partner
// @route   GET /api/public/orders/delivery/:partnerId
exports.getDeliveryOrders = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const orders = await Order.find({
      deliveryPartnerId: partnerId,
      status: { $in: ['placed', 'preparing', 'ready', 'picked'] }
    })
      .populate('customerId', 'name phone email')
      .populate('homeCookId', 'name phone email address')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order delivery status (by delivery partner)
// @route   PUT /api/public/orders/:orderId/delivery-status
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body; // should be 'picked' or 'delivered'

    if (!['picked', 'delivered'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid delivery status' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    if (status === 'delivered') {
      order.paymentStatus = 'paid';
    }
    await order.save();

    // If delivered, release the delivery partner
    if (status === 'delivered' && order.deliveryPartnerId) {
      await DeliveryPartner.findByIdAndUpdate(order.deliveryPartnerId, {
        currentOrderId: null,
        isAvailable: true,
        $inc: { totalDeliveries: 1, earnings: 150 }
      });
    }

    const populatedOrder = await Order.findById(orderId)
      .populate('customerId', 'name phone email')
      .populate('homeCookId', 'name phone email address')
      .populate('deliveryPartnerId', 'name phone vehicleType')
      .lean();

    // Trigger Socket.io notification
    const io = req.app.get('io');
    if (io) {
      io.emit('orderUpdate', populatedOrder);
      io.emit('orderStatusUpdated', {
        orderId: populatedOrder._id,
        status: populatedOrder.status
      });
    }

    res.json({ success: true, data: populatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get delivery partner profile & stats
// @route   GET /api/public/delivery-partner/:partnerId/profile
exports.getDeliveryPartnerProfile = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const partner = await DeliveryPartner.findById(partnerId).lean();
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Delivery partner not found' });
    }

    // Count delivered orders from Order collection for accuracy
    const deliveredCount = await Order.countDocuments({
      deliveryPartnerId: partnerId,
      status: 'delivered'
    });

    res.json({
      success: true,
      data: {
        ...partner,
        totalDelivered: deliveredCount,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get delivered (completed) orders for delivery partner
// @route   GET /api/public/orders/delivery/:partnerId/history
exports.getDeliveredOrdersHistory = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const orders = await Order.find({
      deliveryPartnerId: partnerId,
      status: 'delivered'
    })
      .populate('customerId', 'name phone')
      .populate('homeCookId', 'name address')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
