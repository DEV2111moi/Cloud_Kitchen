const DeliveryPartner = require('../models/DeliveryPartner');
const Order = require('../models/Order');

// @desc    Get all delivery partners
// @route   GET /api/delivery-partners
exports.getDeliveryPartners = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, available } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (available !== undefined) {
      query.isAvailable = available === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await DeliveryPartner.countDocuments(query);
    const partners = await DeliveryPartner.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: partners,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single delivery partner
// @route   GET /api/delivery-partners/:id
exports.getDeliveryPartner = async (req, res) => {
  try {
    const partner = await DeliveryPartner.findById(req.params.id)
      .populate('currentOrderId');
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Delivery partner not found' });
    }
    res.json({ success: true, data: partner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create delivery partner
// @route   POST /api/delivery-partners
exports.createDeliveryPartner = async (req, res) => {
  try {
    const partner = await DeliveryPartner.create(req.body);
    res.status(201).json({ success: true, data: partner });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update delivery partner
// @route   PUT /api/delivery-partners/:id
exports.updateDeliveryPartner = async (req, res) => {
  try {
    const partner = await DeliveryPartner.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Delivery partner not found' });
    }
    res.json({ success: true, data: partner });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update delivery partner status
// @route   PATCH /api/delivery-partners/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'approved', 'rejected', 'suspended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const partner = await DeliveryPartner.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Delivery partner not found' });
    }
    res.json({ success: true, data: partner });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Verify delivery partner documents
// @route   PATCH /api/delivery-partners/:id/verify
exports.verifyDocuments = async (req, res) => {
  try {
    const partner = await DeliveryPartner.findByIdAndUpdate(
      req.params.id,
      { 'documents.verified': true },
      { new: true }
    );
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Delivery partner not found' });
    }
    res.json({ success: true, data: partner, message: 'Documents verified successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Assign order to delivery partner
// @route   PATCH /api/delivery-partners/:id/assign
exports.assignOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const partner = await DeliveryPartner.findByIdAndUpdate(
      req.params.id,
      { currentOrderId: orderId, isAvailable: false },
      { new: true }
    );
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Delivery partner not found' });
    }

    // Update order with delivery partner
    await Order.findByIdAndUpdate(orderId, { deliveryPartnerId: partner._id, status: 'picked' });

    res.json({ success: true, data: partner, message: 'Order assigned successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete delivery partner
// @route   DELETE /api/delivery-partners/:id
exports.deleteDeliveryPartner = async (req, res) => {
  try {
    const partner = await DeliveryPartner.findByIdAndDelete(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Delivery partner not found' });
    }
    res.json({ success: true, message: 'Delivery partner deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
