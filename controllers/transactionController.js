const Transaction = require('../models/transactionModel');

// POST a new transaction
exports.createTransaction = async (req, res) => {
  try {
    const { transactionId, email, status, transactionDate, amount, orderId } = req.body;

    // Create a new transaction object
    const newTransaction = new Transaction({
      transactionId,
      email,
      status,
      transactionDate: transactionDate || Date.now(),  // Default to current date if not provided
      amount,
      orderId
    });

    // Save transaction to DB
    const savedTransaction = await newTransaction.save();
    res.status(201).json(savedTransaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ message: 'Internal Server Error', error });
  }
};

// GET all transactions (for listing or testing purposes)
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find();
    res.status(200).json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
