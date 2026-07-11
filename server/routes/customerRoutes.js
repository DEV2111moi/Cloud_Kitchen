const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomer,
  updateCustomer,
  updateStatus,
  deleteCustomer,
} = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.route('/').get(getCustomers);
router.route('/:id').get(getCustomer).put(updateCustomer).delete(deleteCustomer);
router.patch('/:id/status', updateStatus);

module.exports = router;
