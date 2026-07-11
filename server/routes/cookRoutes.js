const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getCookStats,
  getCookOrders,
  updateOrderStatus,
  getCookMenu,
  createCookMenuItem,
  updateCookMenuItem,
  deleteCookMenuItem
} = require('../controllers/cookDashboardController');

// All home cook routes are protected by JWT authentication
router.use(protect);

router.get('/stats', getCookStats);
router.get('/orders', getCookOrders);
router.patch('/orders/:id/status', updateOrderStatus);
router.get('/menu', getCookMenu);
router.post('/menu', createCookMenuItem);
router.put('/menu/:id', updateCookMenuItem);
router.delete('/menu/:id', deleteCookMenuItem);

module.exports = router;
