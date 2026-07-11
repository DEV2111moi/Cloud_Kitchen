const express = require('express');
const router = express.Router();
const {
  getHomeCooks,
  getHomeCook,
  createHomeCook,
  updateHomeCook,
  updateStatus,
  deleteHomeCook,
} = require('../controllers/homeCookController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.route('/').get(getHomeCooks).post(createHomeCook);
router.route('/:id').get(getHomeCook).put(updateHomeCook).delete(deleteHomeCook);
router.patch('/:id/status', updateStatus);

module.exports = router;
