const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const DeliveryPartner = require('../models/DeliveryPartner');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// @desc    Get all orders
// @route   GET /api/orders
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, city } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.orderNumber = { $regex: search, $options: 'i' };
    }

    // Filter by city (using homeCookId's city)
    if (city && city !== 'all') {
      const HomeCook = require('../models/HomeCook');
      const cooksInCity = await HomeCook.find({
        'address.city': { $regex: new RegExp(`^${city}$`, 'i') }
      }).select('_id');
      query.homeCookId = { $in: cooksInCity.map(c => c._id) };
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('customerId', 'name phone email')
      .populate('homeCookId', 'name phone address')
      .populate('deliveryPartnerId', 'name phone vehicleType')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Assign delivery partner manually
// @route   PATCH /api/orders/:id/assign-delivery
router.patch('/:id/assign-delivery', async (req, res) => {
  try {
    const { deliveryPartnerId } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Release old partner if any
    if (order.deliveryPartnerId) {
      await DeliveryPartner.findByIdAndUpdate(order.deliveryPartnerId, {
        currentOrderId: null,
        isAvailable: true
      });
    }

    if (deliveryPartnerId) {
      // Assign new partner
      const partner = await DeliveryPartner.findById(deliveryPartnerId);
      if (!partner) {
        return res.status(404).json({ success: false, message: 'Delivery partner not found' });
      }

      order.deliveryPartnerId = deliveryPartnerId;
      await order.save();

      await DeliveryPartner.findByIdAndUpdate(deliveryPartnerId, {
        currentOrderId: order._id,
        isAvailable: false
      });
    } else {
      order.deliveryPartnerId = null;
      await order.save();
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('customerId', 'name phone email')
      .populate('homeCookId', 'name phone address')
      .populate('deliveryPartnerId', 'name phone vehicleType')
      .lean();

    // Notify clients via socket
    const io = req.app.get('io');
    if (io) {
      io.emit('orderUpdate', populatedOrder);
    }

    res.json({ success: true, data: populatedOrder, message: 'Delivery partner updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update order status manually
// @route   PATCH /api/orders/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    if (status === 'delivered') {
      order.paymentStatus = 'paid';
    }
    await order.save();

    // Release partner if status becomes delivered or cancelled
    if (['delivered', 'cancelled'].includes(status) && order.deliveryPartnerId) {
      await DeliveryPartner.findByIdAndUpdate(order.deliveryPartnerId, {
        currentOrderId: null,
        isAvailable: true
      });
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('customerId', 'name phone email')
      .populate('homeCookId', 'name phone address')
      .populate('deliveryPartnerId', 'name phone vehicleType')
      .lean();

    // Notify clients via socket
    const io = req.app.get('io');
    if (io) {
      io.emit('orderUpdate', populatedOrder);
      io.emit('orderStatusUpdated', { orderId: order._id, status });
    }

    res.json({ success: true, data: populatedOrder, message: 'Order status updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
