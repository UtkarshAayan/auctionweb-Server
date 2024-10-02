const Stripe = require('stripe');
const stripe = Stripe('sk_test_51Px4vBDcRywLwCxuOtDr0FOmDzZbTeqLvxiXnI7TXArCLlDZWk7K6HzcPVFsjgmhF44ZGv16iBg7M0dUqxE1JO0G00BliBgnjZ'); // Replace with your Stripe secret key

module.exports = stripe;
