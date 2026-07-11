const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const homeCookSchema = new mongoose.Schema({
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
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
  },
  speciality: [{
    type: String,
    trim: true,
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending',
  },
  hasFssai: {
    type: String,
    enum: ['yes', 'no'],
    default: 'no',
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalOrders: {
    type: Number,
    default: 0,
  },
  revenue: {
    type: Number,
    default: 0,
  },
  password: {
    type: String,
    default: '',
  },
  documents: {
    idProof: { type: String, default: '' },
    fssaiLicense: { type: String, default: '' },
  },
  profileImage: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    default: '',
  },
}, { timestamps: true });

// Hash password before saving
homeCookSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password
homeCookSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('HomeCook', homeCookSchema);
