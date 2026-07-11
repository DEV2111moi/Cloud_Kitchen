const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const HomeCook = require('../models/HomeCook');

// @desc    Get Home Cook Dashboard stats (total orders, total revenue, rating, active orders)
// @route   GET /api/cook/stats
exports.getCookStats = async (req, res) => {
  try {
    const cookId = req.user._id;

    const cook = await HomeCook.findById(cookId);

    const orders = await Order.find({ homeCookId: cookId });
    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const activeOrders = orders.filter(o => ['placed', 'preparing', 'ready'].includes(o.status));

    res.json({
      success: true,
      data: {
        name: cook.name,
        rating: cook.rating || 0.0,
        totalOrders,
        totalRevenue,
        activeOrdersCount: activeOrders.length,
        status: cook.status
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Home Cook Orders
// @route   GET /api/cook/orders
exports.getCookOrders = async (req, res) => {
  try {
    const cookId = req.user._id;
    const { status } = req.query;

    const query = { homeCookId: cookId };
    if (status && status !== 'all') {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('customerId', 'name phone email')
      .populate('deliveryPartnerId', 'name phone vehicleType')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update status of an order
// @route   PATCH /api/cook/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;
    const cookId = req.user._id;

    if (!['placed', 'preparing', 'ready', 'picked', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status' });
    }

    const order = await Order.findOne({ _id: orderId, homeCookId: cookId });
    if (!order) {
      return res.status(455).json({ success: false, message: 'Order not found for this kitchen' });
    }

    order.status = status;
    await order.save();

    // Trigger Socket.io notification
    const io = req.app.get('io');
    const activeSockets = req.app.get('activeSockets');
    if (io) {
      // Notify the customer
      const customerSocketId = activeSockets.get(String(order.customerId));
      if (customerSocketId) {
        io.to(customerSocketId).emit('orderStatusUpdated', { orderId: order._id, status });
        console.log(`📡 Emitted orderStatusUpdated to customer socket ${customerSocketId}`);
      }
      // Broadcast general order update
      io.emit('orderUpdate', order);
    }

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Home Cook Menu Items
// @route   GET /api/cook/menu
exports.getCookMenu = async (req, res) => {
  try {
    const cookId = req.user._id;
    const items = await MenuItem.find({ homeCookId: cookId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new Menu Item
// @route   POST /api/cook/menu
exports.createCookMenuItem = async (req, res) => {
  try {
    const cookId = req.user._id;
    const { name, description, price, category, cuisine, isVeg, isAvailable, preparationTime, image } = req.body;

    if (!name || !price) {
      return res.status(400).json({ success: false, message: 'Name and price are required' });
    }

    const item = await MenuItem.create({
      name,
      description: description || '',
      price,
      category: category || 'main-course',
      cuisine: cuisine || 'Indian',
      isVeg: isVeg !== undefined ? isVeg : true,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      preparationTime: preparationTime || '30 mins',
      image: image || '',
      homeCookId: cookId
    });

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: item
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a Menu Item
// @route   PUT /api/cook/menu/:id
exports.updateCookMenuItem = async (req, res) => {
  try {
    const itemId = req.params.id;
    const cookId = req.user._id;

    let item = await MenuItem.findOne({ _id: itemId, homeCookId: cookId });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    const fieldsToUpdate = [
      'name', 'description', 'price', 'category', 'cuisine',
      'isVeg', 'isAvailable', 'preparationTime', 'image'
    ];

    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    });

    await item.save();

    res.json({
      success: true,
      message: 'Menu item updated successfully',
      data: item
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a Menu Item
// @route   DELETE /api/cook/menu/:id
exports.deleteCookMenuItem = async (req, res) => {
  try {
    const itemId = req.params.id;
    const cookId = req.user._id;

    const result = await MenuItem.findOneAndDelete({ _id: itemId, homeCookId: cookId });
    if (!result) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    res.json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
