const Bid = require('../models/bidModel');
const Product = require('../models/sellerProductFormModel');
const User = require('../models/userModel');
const moment = require('moment');
const createError = require('../middleware/error')
const createSuccess = require('../middleware/success')
const InAppNotification = require('../models/inAppNotificationModel');

const createNotification = async (req, res,next) => {
  try {
    const { userId, message } = req.body;

    // Check if notifications are enabled for the user
    const user = await User.findById(userId);
    if (!user) {
      return next(createSuccess(404, "User not found"));
    }

    if (!user.notificationsEnabled) {
      return next(createSuccess(403, "Notifications are turned off for this user"));
    }

    // If notifications are enabled, create the notification
    const notification = new InAppNotification({ userId, message });
    await notification.save();
    return next(createSuccess(200, "Notifications Created", notification));
  } catch (error) {
    return next(createError(500, "Failed to create notification"))
  }
};

const getBidIncrement = (startingPrice) => {
  if (startingPrice >= 10 && startingPrice <= 100) return 10;
  if (startingPrice >= 101 && startingPrice <= 400) return 25;
  if (startingPrice >= 401 && startingPrice <= 1000) return 50;
  if (startingPrice >= 1001 && startingPrice <= 5000) return 100;
  if (startingPrice >= 5001) return 150;
  return 0;
};

exports.placeBid = async (req, res, next) => {
  const { productId, userId, bidAmount } = req.body;
  try {
    const product = await Product.findById(productId);
    const user = await User.findById(userId);

    if (!product) {
      return next(createError(400, "Product not found."));
    }

    if (!user) {
      return next(createError(400, "User not found."));
    }

    const now = new Date();
    const startTime = new Date(`${product.startDate}T${product.startTime}`);
    const endTime = new Date(`${product.endDate}T${product.stopTime}`);

    if (product.status === 'expired' || now < startTime) {
      return next(createError(400, "Bidding is not allowed at this time!."));
    }

    if (now > endTime) {
      product.status = 'expired';
      await product.save();
      return next(createError(400, "The auction has already ended."));
    }

    const latestBid = await Bid.findOne({ productId }).sort('-amount');
    const currentPrice = latestBid ? latestBid.amount : product.startingPrice;
    const bidIncrement = getBidIncrement(currentPrice);
    const nextValidBid = currentPrice + bidIncrement;

    if (bidAmount < nextValidBid) {
      // return res.status(400).json({ message: `Invalid bid amount. The minimum valid bid amount is ${nextValidBid}.` });
      return next(createError(400, `Invalid bid amount. The minimum valid bid amount is ${nextValidBid}.`));

    }

    const newBid = new Bid({ productId, userId, userEmail: user.email, username: user.username, amount: bidAmount });
    await newBid.save();

    // Update the product with the new bid
    product.bids.push(newBid._id);
    product.currentBid = bidAmount; // Update currentBid with the new bid amount
    product.winningBid = newBid._id; // Update winningBid to the new bid
    product.winningBuyer = userId; // Update winningBuyer to the user

    // Check if the bid is placed within the last minute of the auction
    const remainingTime = endTime - now;
    if (remainingTime <= 60 * 1000) {
      const extendedTime = moment(endTime).add(2, 'minutes');
      product.stopTime = extendedTime.format('HH:mm');
      console.log(`Auction time extended by 2 minutes. New stop time: ${product.stopTime}`);
    }

    // Update nextValidBid based on the bid amount
    const updatedBidIncrement = getBidIncrement(product.currentBid);
    product.nextValidBid = product.currentBid + updatedBidIncrement;

    await product.save();
    next(createSuccess(200, "Bid Placed Successfully", newBid));

    try {
      const message = `Your bid of ${bidAmount} was successfully placed on ${product.productName}.`;
      const notificationData = {
        userId: user._id,
        message
      };
      await createNotification({ body: notificationData }, res, next); // Call the imported function
    } catch (notificationError) {
      console.error("Failed to create notification:", notificationError);
    }
    
  } catch (error) {
    return next(createError(500, "Internal Server Error!"));
  }
};

