const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0,
  },
  category: {
    type: String,
    enum: ['starters', 'main-course', 'biryani', 'breads', 'desserts', 'beverages', 'snacks', 'thali'],
    default: 'main-course',
  },
  cuisine: {
    type: String,
    default: 'Indian',
  },
  image: {
    type: String,
    default: '',
  },
  homeCookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HomeCook',
    required: true,
  },
  isVeg: {
    type: Boolean,
    default: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  preparationTime: {
    type: String,
    default: '30 mins',
  },
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
