const express = require('express');
const router = express.Router();
const {
  getDeliveryPartners,
  getDeliveryPartner,
  createDeliveryPartner,
  updateDeliveryPartner,
  updateStatus,
  verifyDocuments,
  assignOrder,
  deleteDeliveryPartner,
} = require('../controllers/deliveryPartnerController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.route('/').get(getDeliveryPartners).post(createDeliveryPartner);
router.route('/:id').get(getDeliveryPartner).put(updateDeliveryPartner).delete(deleteDeliveryPartner);
router.patch('/:id/status', updateStatus);
router.patch('/:id/verify', verifyDocuments);
router.patch('/:id/assign', assignOrder);

module.exports = router;
