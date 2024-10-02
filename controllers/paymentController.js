const stripe = require('../middleware/stripe');

exports.createPaymentIntent = async (req, res) => {
    const { amount } = req.body;
  
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency: 'usd',
      });
      console.log('Payment Intent:', paymentIntent); // Log the payment intent for debugging
      res.send({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error('Error creating payment intent:', error); // Log the error
      res.status(500).send({ error: error.message });
    }
  };
  

  exports.getAllTransactions = async (req, res) => {
    try {
      const transactions = await stripe.paymentIntents.list({
        limit: 10, // You can adjust the limit as needed
      });
      res.send(transactions.data); // Send transaction data to the frontend
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).send({ error: error.message });
    }
  };