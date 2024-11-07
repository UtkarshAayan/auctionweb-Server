const Order = require('../models/orderSummaryModel');
const Product = require('../models/sellerProductFormModel');
const User = require('../models/userModel');
const Bid = require('../models/bidModel');
const createError = require('../middleware/error')
const createSuccess = require('../middleware/success')
const AdminSettings = require('../models/adminSettings');
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

const getFormattedAddress = (address) => {
  return `${address.fullName}, ${address.street}, ${address.city}, ${address.state}, ${address.zip}, ${address.country}`;
};

// Order for startingPrice
exports.createOrder = async (req, res, next) => {
  const { productId, buyerId, addressId } = req.body;

  try {
    // Fetch the user (buyer) by their ID
    const user = await User.findById(buyerId);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    // Fetch the product by its ID
    const product = await Product.findById(productId);
    if (!product) {
      return next(createError(404, "Product not found"));
    }

    // Check if shipping is required
    let address;
    let shippingPrice = 0; // Initialize shipping price
    if (product.shipping) {
      address = user.addresses.id(addressId);
      if (!address) {
        return next(createError(404, "Address not found"));
      }

      // Check if the country in the buyer's address matches any in shippingDetails
      const shippingDetail = product.shippingDetails.find(detail => detail.country === address.country);

      if (shippingDetail) {
        shippingPrice = shippingDetail.shippingPrice; // Set the shipping price from shippingDetails
      } else {
        return next(createError(400, "Shipping not available for this country"));
      }
    }

    const currentBid = product.currentBid; // Assuming 'currentBid' is stored in the product model

    // Fetch admin settings
    const adminSettings = await AdminSettings.findOne(); // Replace with your actual method to fetch admin settings
    if (!adminSettings) {
      return next(createError(404, "Admin settings not found"));
    }

    // Initialize pricing components
    let finalPrice = currentBid;
    let saleTaxPrice = 0;
    let buyerPremiumPrice = 0;

    // Calculate individual prices and final price
    if (product.saleTax) {
      saleTaxPrice = (currentBid * adminSettings.saleTax) / 100;
      finalPrice += saleTaxPrice;
    }
    if (product.buyerPremium) {
      buyerPremiumPrice = (currentBid * adminSettings.buyerPremium) / 100;
      finalPrice += buyerPremiumPrice;
    }
    if (product.shipping) {
      finalPrice += shippingPrice; // Add shipping price to final price
    }

    // Create a new order
    const order = new Order({
      product: productId,
      buyer: buyerId,
      address: product.shipping 
        ? getFormattedAddress(address) 
        : `${product.address}, ${product.town}, ${product.country}`,
      orderDate: new Date(),
      currentBid: currentBid,
      finalPrice: finalPrice, // Add final price
      shippingPrice: shippingPrice, // Add shipping price
      saleTaxPrice: saleTaxPrice, // Add sales tax price
      buyerPremiumPrice: buyerPremiumPrice, // Add buyer's premium price
    });

    // Save the order to the database
    await order.save();

    // Update product status to sold
    await Product.findByIdAndUpdate(productId, { status: 'Sold' });

    // Return success response with order details
     next(createSuccess(201, "Order created successfully", {
      _id: order._id, // Ensure _id is included in the response
      productId: order.product,
      address: order.address,
      buyer: {
        _id: user._id,
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber,
      },
      orderDate: order.orderDate,
      currentBid: order.currentBid,
      finalPrice: order.finalPrice, // Include final price in the response
      shippingPrice: order.shippingPrice, // Include shipping price in the response
      saleTaxPrice: order.saleTaxPrice, // Include sales tax price in the response
      buyerPremiumPrice: order.buyerPremiumPrice, // Include buyer's premium price in the response
      status: order.status
    }));
    try {
      const message = `Your order for  ${product.productName} is successfully created by Bidding process`;
      const notificationData = {
        userId: user._id,
        message
      };
      await createNotification({ body: notificationData }, res, next); // Call the imported function
    } catch (notificationError) {
      console.error("Failed to create notification:", notificationError);
    }
  } catch (error) {
    console.error('Error creating order:', error);
    return next(createError(500, "Could not create order"));
  }
};

//order for buynowPrice
exports.createOrderForBuynow = async (req, res, next) => {
  const { productId, buyerId, addressId } = req.body;

  try {
    // Fetch the user (buyer) by their ID
    const user = await User.findById(buyerId);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    // Fetch the product by its ID
    const product = await Product.findById(productId);
    if (!product) {
      return next(createError(404, "Product not found"));
    }

    // Check if shipping is required
    let address;
    let shippingPrice = 0; // Initialize shipping price
    if (product.shipping) {
      address = user.addresses.id(addressId);
      if (!address) {
        return next(createError(404, "Address not found"));
      }

      // Check if the country in the buyer's address matches any in shippingDetails
      const shippingDetail = product.shippingDetails.find(detail => detail.country === address.country);

      if (shippingDetail) {
        shippingPrice = shippingDetail.shippingPrice; // Set the shipping price from shippingDetails
      } else {
        return next(createError(400, "Shipping not available for this country"));
      }
    }

    const buyNowPrice = product.buyNowPrice; // Assuming 'buyNowPrice' is stored in the product model

    // Fetch admin settings
    const adminSettings = await AdminSettings.findOne(); // Replace with your actual method to fetch admin settings
    if (!adminSettings) {
      return next(createError(404, "Admin settings not found"));
    }

    // Initialize pricing components
    let finalPrice = buyNowPrice;
    let saleTaxPrice = 0;
    let buyerPremiumPrice = 0;

    // Calculate individual prices and final price
    if (product.saleTax) {
      saleTaxPrice = (buyNowPrice * adminSettings.saleTax) / 100;
      finalPrice += saleTaxPrice;
    }
    if (product.buyerPremium) {
      buyerPremiumPrice = (buyNowPrice * adminSettings.buyerPremium) / 100;
      finalPrice += buyerPremiumPrice;
    }
    if (product.shipping) {
      finalPrice += shippingPrice; // Add shipping price to final price
    }

    // Create a new order
    const order = new Order({
      product: productId,
      buyer: buyerId,
      address: product.shipping 
        ? getFormattedAddress(address) 
        : `${product.address}, ${product.town}, ${product.country}`,
      orderDate: new Date(),
      currentBid: buyNowPrice,
      finalPrice: finalPrice, // Add final price
      shippingPrice: shippingPrice, // Add shipping price
      saleTaxPrice: saleTaxPrice, // Add sales tax price
      buyerPremiumPrice: buyerPremiumPrice, // Add buyer's premium price
    });

    // Save the order to the database
    await order.save();

    // Update product status to sold
    await Product.findByIdAndUpdate(productId, { status: 'Sold' });

    // Return success response with order details
     next(createSuccess(201, "Order created successfully", {
      _id: order._id, // Ensure _id is included in the response
      productId: order.product,
      address: order.address,
      buyer: {
        _id: user._id,
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber,
      },
      orderDate: order.orderDate,
      currentBid: order.currentBid,
      finalPrice: order.finalPrice, // Include final price in the response
      shippingPrice: order.shippingPrice, // Include shipping price in the response
      saleTaxPrice: order.saleTaxPrice, // Include sales tax price in the response
      buyerPremiumPrice: order.buyerPremiumPrice, // Include buyer's premium price in the response
      status: order.status
    }));
    try {
      const message = `Your order for  ${product.productName} is successfully created by Buynow process`;
      const notificationData = {
        userId: user._id,
        message
      };
      await createNotification({ body: notificationData }, res, next); // Call the imported function
    } catch (notificationError) {
      console.error("Failed to create notification:", notificationError);
    }
  } catch (error) {
    console.error('Error creating order:', error);
    return next(createError(500, "Could not create order"));
  }
};

exports.getOrderSummary = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('product')
      .populate('buyer');

    if (!order) {
      return next(createError(404, "Order not found"));
    }

    const user = await User.findById(order.buyer);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    const product = await Product.findById(order.product._id);
    if (!product) {
      return next(createError(404, "Product not found"));
    }

    const imagesWithURLs = product.uploadDocuments.map((image) => {
      return {
        ...image._doc,
      url: `http://localhost:3000/api/product/uploadDocuments/${image.filename}`,

      };
    });

    const productWithImageURLs = {
      ...product._doc,
      uploadDocuments: imagesWithURLs,
    };

    return next(createSuccess(200, "Order summary fetched successfully", {
      _id: order._id, // Ensure _id is included in the response
      product: productWithImageURLs,
      buyer: {
        _id: user._id,
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber,
      },
      orderDate: order.orderDate,
      status: order.status,
      address: order.address,
      currentBid: order.currentBid,
      finalPrice: order.finalPrice, 
      shippingPrice: order.shippingPrice, 
      saleTaxPrice: order.saleTaxPrice, 
      buyerPremiumPrice: order.buyerPremiumPrice,

    }));
  } catch (error) {
    console.error('Error fetching order summary:', error);
    return next(createError(500, "Internal server error"));
  }
};

// Get order by product ID
exports.getOrderByProductId = async (req, res,next) => {
  try {
    const { productId } = req.params;  // Get product ID from request parameters

    // Find the order that corresponds to the product ID
    const order = await Order.findOne({ product: productId })
      .populate('product')  // Optionally populate product details
      .populate('buyer');   // Optionally populate buyer details

    if (!order) {
      return next(createError(404, "Order not found for this product"));
    }

    // Return the order details
    return next(createSuccess(200, order));
  } catch (error) {
    return next(createError(500, "Internal server error"));
  }
};


// orderlist for sellers
exports.getAllOrderBySellerId = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    // Get pagination parameters from query (default: page=1, limit=10)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Step 1: Find all products by the seller's userId
    const productsByUser = await Product.find({ userId: userId }).select('_id');

    if (!productsByUser || productsByUser.length === 0) {
      return next(createError(404, "No products found for this user"));
    }

    const productIds = productsByUser.map(product => product._id);

    // Step 2: Count the total number of orders for pagination
    const totalOrders = await Order.countDocuments({
      product: { $in: productIds }
    });

    if (totalOrders === 0) {
      return next(createError(404, "No orders found for this user"));
    }

    // Step 3: Fetch the orders based on product IDs with pagination
    const orders = await Order.find({
      product: { $in: productIds }
    })
      .populate('product')  // Populate product details
      .populate('buyer')  // Optionally populate the buyer details
      .skip(skip)
      .limit(limit)
      .exec();

    if (orders.length === 0) {
      return next(createError(404, "No orders found for this user"));
    }

    // Step 4: Return the paginated order data
    return next(
      createSuccess(200, "All Seller Orders", {
        success: true,
        page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        orders,
      })
    );
  } catch (err) {
    console.error(err);
    return next(createError(500, "Internal server error"));
  }
};

//orderlist for buyers

exports.getOrderHistory = async (req, res,next) => {
  const buyerId = req.params.buyerId;

  try {
    // Find orders where the buyer matches the provided buyer ID
    const orders = await Order.find({ buyer: buyerId })
      .populate('product', 'productName') // Populate product details (add more fields if needed)
      .populate('buyer', 'name email') // Populate buyer details (name, email, etc.)
      .sort({ createdAt: -1 }); // Sort orders by most recent

    if (!orders || orders.length === 0) {
      return next(createError(404, "No orders found for this buyer."));
    }

 
    return next(
      createSuccess(200, "All Buyers Orders", 
        orders)
    );
  } catch (error) {
    return next(createError(500, "Internal server error"));
  }
};








