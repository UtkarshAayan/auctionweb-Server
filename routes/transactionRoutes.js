const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// Route to create a transaction
router.post('/transactions', transactionController.createTransaction);

// Route to get all transactions (for testing purposes)
router.get('/transactions', transactionController.getAllTransactions);

module.exports = router;
