const Order = require('../models/Order');
const HomeCook = require('../models/HomeCook');
const Customer = require('../models/Customer');
const DeliveryPartner = require('../models/DeliveryPartner');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
exports.getStats = async (req, res) => {
  try {
    const [
      totalOrders,
      totalCustomers,
      totalHomeCooks,
      totalDeliveryPartners,
      pendingHomeCooks,
      pendingDeliveryPartners,
      revenueResult,
      recentOrders,
    ] = await Promise.all([
      Order.countDocuments(),
      Customer.countDocuments(),
      HomeCook.countDocuments(),
      DeliveryPartner.countDocuments(),
      HomeCook.countDocuments({ status: 'pending' }),
      DeliveryPartner.countDocuments({ status: 'pending' }),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('customerId', 'name')
        .populate('homeCookId', 'name')
        .lean(),
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        totalCustomers,
        totalHomeCooks,
        totalDeliveryPartners,
        pendingApprovals: pendingHomeCooks + pendingDeliveryPartners,
        pendingHomeCooks,
        pendingDeliveryPartners,
        recentOrders,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get chart data
// @route   GET /api/dashboard/charts
exports.getChartData = async (req, res) => {
  try {
    // Orders by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const ordersByMonth = await Order.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartData = ordersByMonth.map(item => ({
      month: months[item._id.month - 1],
      orders: item.orders,
      revenue: item.revenue,
    }));

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Top home cooks
    const topHomeCooks = await HomeCook.find({ status: 'approved' })
      .sort({ totalOrders: -1 })
      .limit(5)
      .select('name totalOrders rating revenue')
      .lean();

    res.json({
      success: true,
      data: {
        ordersTrend: chartData,
        ordersByStatus,
        topHomeCooks,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
