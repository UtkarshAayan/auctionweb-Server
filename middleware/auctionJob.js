const cron = require('node-cron');
const Product = require('../models/sellerProductFormModel');
const Bid = require('../models/bidModel');
const User = require('../models/userModel'); // Assuming you have a User model
const nodemailer = require('nodemailer');

// Set up nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ut.gupta29@gmail.com',
    pass: 'yver vjuu fvbb hcot'
  }
});

// Function to send email
const sendWinningEmail = (buyerEmail, productName, bidAmount) => {
  const mailOptions = {
    from: 'ut.gupta29@gmail.com',
    to: buyerEmail,
    subject: 'Congratulations! You won the auction',
    text: `Congratulations! You won the auction for ${productName} with a bid of $${bidAmount}.`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

const checkAuctions = async () => {
  try {
    console.log('Running auction status check...');
    const now = new Date();
    const products = await Product.find({ status: 'active' });

    for (let product of products) {
      const endTime = new Date(`${product.endDate}T${product.stopTime}`);

      if (now > endTime) {
        console.log(`Auction expired for product: ${product.productName}`);

        // Find the highest bid
        const highestBid = await Bid.findOne({ productId: product._id }).sort('-amount');

        if (highestBid) {
          console.log(`Winning bid: ${highestBid.amount} by user: ${highestBid.userId}`);
          product.winningBid = highestBid._id;
          product.winningBuyer = highestBid.userId;

          // Find the user email
          const user = await User.findById(highestBid.userId);
          if (user) {
            sendWinningEmail(user.email, product.productName, highestBid.amount);
          } else {
            console.log(`User not found for userId: ${highestBid.userId}`);
          }
        } else {
          console.log(`No bids found for product: ${product.productName}`);
        }

        product.status = 'expired';
        await product.save();
        console.log(`Product updated: ${product.productName}`);
      }
    }
  } catch (error) {
    console.error('Error checking auctions:', error);
  }
};

// Schedule job to run every minute
cron.schedule('* * * * *', checkAuctions);
