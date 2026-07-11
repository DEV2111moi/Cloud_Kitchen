const HomeCook = require('../models/HomeCook');

// @desc    Get all home cooks
// @route   GET /api/home-cooks
exports.getHomeCooks = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await HomeCook.countDocuments(query);
    const homeCooks = await HomeCook.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: homeCooks,
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

// @desc    Get single home cook
// @route   GET /api/home-cooks/:id
exports.getHomeCook = async (req, res) => {
  try {
    const homeCook = await HomeCook.findById(req.params.id);
    if (!homeCook) {
      return res.status(404).json({ success: false, message: 'Home cook not found' });
    }
    res.json({ success: true, data: homeCook });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create home cook
// @route   POST /api/home-cooks
exports.createHomeCook = async (req, res) => {
  try {
    const homeCook = await HomeCook.create(req.body);
    res.status(201).json({ success: true, data: homeCook });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update home cook
// @route   PUT /api/home-cooks/:id
exports.updateHomeCook = async (req, res) => {
  try {
    const homeCook = await HomeCook.findById(req.params.id);
    if (!homeCook) {
      return res.status(404).json({ success: false, message: 'Home cook not found' });
    }

    const updates = { ...req.body };
    // If password is not provided or empty, do not update it
    if (!updates.password) {
      delete updates.password;
    }

    Object.keys(updates).forEach((key) => {
      homeCook[key] = updates[key];
    });

    await homeCook.save();

    res.json({ success: true, data: homeCook });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update home cook status
// @route   PATCH /api/home-cooks/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'approved', 'rejected', 'suspended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const homeCook = await HomeCook.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!homeCook) {
      return res.status(404).json({ success: false, message: 'Home cook not found' });
    }
    res.json({ success: true, data: homeCook });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete home cook
// @route   DELETE /api/home-cooks/:id
exports.deleteHomeCook = async (req, res) => {
  try {
    const homeCook = await HomeCook.findByIdAndDelete(req.params.id);
    if (!homeCook) {
      return res.status(404).json({ success: false, message: 'Home cook not found' });
    }
    res.json({ success: true, message: 'Home cook deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
