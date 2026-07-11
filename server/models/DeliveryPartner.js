const mongoose = require('mongoose');

const deliveryPartnerSchema = new mongoose.Schema({
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
    required: [true, 'Phone number is required'],
  },
  vehicleType: {
    type: String,
    enum: ['bike', 'scooter', 'car'],
    default: 'bike',
  },
  vehicleNumber: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending',
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  documents: {
    drivingLicense: { type: String, default: '' },
    idProof: { type: String, default: '' },
    vehicleRC: { type: String, default: '' },
    verified: { type: Boolean, default: false },
  },
  currentOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null,
  },
  totalDeliveries: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  earnings: {
    type: Number,
    default: 0,
  },
  profileImage: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('DeliveryPartner', deliveryPartnerSchema);
