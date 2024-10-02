const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Create Order
router.post('/', orderController.createOrder);

router.post('/BuynowOrder', orderController.createOrderForBuynow);

// Get Order Summary
router.get('/:id', orderController.getOrderSummary);

router.get('/product/:productId', orderController.getOrderByProductId);

//allordersby sellerID
router.get('/all/seller/:userId', orderController.getAllOrderBySellerId);

module.exports = router;
