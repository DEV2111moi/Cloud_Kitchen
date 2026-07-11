const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    default: '',
  },
  addresses: [{
    label: { type: String, default: 'Home' },
    street: String,
    city: String,
    state: String,
    pincode: String,
  }],
  status: {
    type: String,
    enum: ['active', 'blocked'],
    default: 'active',
  },
  totalOrders: {
    type: Number,
    default: 0,
  },
  totalSpent: {
    type: Number,
    default: 0,
  },
  profileImage: {
    type: String,
    default: '',
  },
  lastOrderDate: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
