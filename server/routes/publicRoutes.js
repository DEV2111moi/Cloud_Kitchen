const express = require('express');
const router = express.Router();
const {
  getMenu,
  getFeaturedCooks,
  registerAsCook,
  getCustomers,
  registerCustomer,
  placeOrder,
  getActiveOrders
} = require('../controllers/publicController');

// All public routes - no auth required
router.get('/menu', getMenu);
router.get('/home-cooks', getFeaturedCooks);
router.post('/register-cook', registerAsCook);

// Order and Customer Simulation Routes
router.get('/customers', getCustomers);
router.post('/customers', registerCustomer);
router.post('/orders', placeOrder);
router.get('/orders/active', getActiveOrders);

module.exports = router;
