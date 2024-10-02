const User = require("../models/userModel");
const Role = require("../models/roleModel");
const Wishlist = require("../models/Wishlist");
const Product = require("../models/sellerProductFormModel");
const Category = require("../models/Category");
const InAppNotification = require('../models/inAppNotificationModel');
const Bid = require("../models/bidModel");
const createError = require("../middleware/error");
const createSuccess = require("../middleware/success");
const path = require("path");
const moment = require('moment-timezone');
const fs = require("fs");



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



const createProduct = async (req, res, next) => {
  const {
    productName,
    category,
    color,
    productCondition,
    productDescription,
    subcategory,
    lotNumber,
    brand,
    startingPrice,
    reservePrice,
    saleTax,
    startDate,
    endDate,
    buyerPremium,
    shipping,
    collect,
    startTime,
    stopTime,
    address,
    town,
    comment,
    country,
    userId,
    buyNowPrice,
    shippingDetails,
    dynamicFields  // Assume this comes as a parsed object/array
  } = req.body;
  console.log('Shipping Details:', shippingDetails); // Debugging output
  console.log('Dynamic Fields:', dynamicFields);
  try {
    const startingPriceNumber = Number(startingPrice);
    if (isNaN(startingPriceNumber)) {
      return next(createError(400, "Invalid starting price"));
    }

    const bidIncrement = getBidIncrement(startingPriceNumber);
    const nextValidBid = startingPriceNumber + bidIncrement;

    // Validate role fetching
    const role = await Role.find({ role: "Seller" });
    if (!role) {
      return next(createError(400, "Seller role not found"));
    }

    if (!req.files || req.files.length === 0) {
      return next(createError(400, "No files uploaded"));
    }

    // Validate category and subcategory
    const categoryDoc = await Category.findOne({ name: category });
    if (!categoryDoc) {
      return next(createError(400, "Category not found"));
    }

    const subcategoryExists = categoryDoc.subcategories.some(sub => sub.name === subcategory);
    if (!subcategoryExists) {
      return next(createError(400, "Subcategory not found in the specified category"));
    }

    // File handling
    const saveFiles = (files) => files.map((file) => {
      const filename = Date.now() + path.extname(file.originalname);
      const filepath = path.join(__dirname, "../uploads", filename);

      try {
        fs.writeFileSync(filepath, file.buffer);
      } catch (err) {
        console.error('File saving error:', err);
        throw createError(500, "Error saving files");
      }

      return { filename, contentType: file.mimetype };
    });

    const uploadDocuments = saveFiles(req.files['uploadDocuments'] || []);
    const essentialDocs = saveFiles(req.files['essentialDocs'] || []);

    let shippingDetailsArray = [];
    if (typeof shippingDetails === 'string') {
      try {
        shippingDetailsArray = JSON.parse(shippingDetails);
      } catch (error) {
        return next(createError(400, "Invalid shipping details format"));
      }
    } else if (Array.isArray(shippingDetails)) {
      shippingDetailsArray = shippingDetails;
    }

    console.log('Parsed Shipping Details:', shippingDetailsArray);

    let parsedDynamicFields = {};
    if (typeof dynamicFields === 'string') {
      try {
        parsedDynamicFields = JSON.parse(dynamicFields);
      } catch (error) {
        return next(createError(400, "Invalid dynamic fields format"));
      }
    } else if (typeof dynamicFields === 'object') {
      parsedDynamicFields = dynamicFields;
    }
    const newProductData = {
      productName,
      category,
      color,
      productCondition,
      productDescription,
      subcategory,
      lotNumber,
      brand,
      startingPrice: startingPriceNumber,
      currentBid: startingPriceNumber,
      nextValidBid,
      reservePrice,
      saleTax,
      startDate,
      endDate,
      buyerPremium,
      shipping,
      shippingDetails: shipping ? shippingDetailsArray : [],
      collect,
      startTime,
      stopTime,
      address,
      town,
      comment,
      country,
      uploadDocuments,
      essentialDocs,
      buyNowPrice,
      proVerifyByAdmin: false,
      isActive: true,
      wishListStatus: false,
      isSuspended: false,
      userId,
      roles: role,
      dynamicFields: parsedDynamicFields
    };
    const newProduct = new Product(newProductData);

    await newProduct.save();

    next(createSuccess(200, "Auction Created Successfully"));

    // Asynchronously trigger notification (without disturbing the response)
    const notificationMessage = `Your product "${productName}" has been successfully created.`;
    createNotification({
      body: {
        userId,
        message: notificationMessage
      }
    }, res, next).catch((error) => {
      console.error('Error creating notification:', error);
    });

  } catch (error) {
    console.error('Error creating product:', error);
    return next(createError(500, "Something went wrong"));
  }
};



//get All Auction
const getAllAuction = async (req, res, next) => {
  try {
    const { search } = req.body;
    let products;

    if (search) {
      products = await Product.find({
        productName: { $regex: search, $options: "i" },
      });
    } else {
      products = await Product.find();
    }

    const proWithImageURLs = products.map((user) => {
      // Map uploadDocuments to include URLs
      const imagesWithURLs = user.uploadDocuments.map((image) => {
        return {
          ...image._doc,
          url: `http://localhost:3000/api/product/uploadDocuments/${image.filename}`,

        };
      });

      // Map essentialDocs to include URLs
      const essentialDocsWithURLs = user.essentialDocs ? user.essentialDocs.map((doc) => {
        return {
          ...doc._doc,
          url: `http://localhost:3000/api/product/essentialDocs/${doc.filename}`,

        };
      }) : [];

      return {
        ...user._doc,
        uploadDocuments: imagesWithURLs,
        essentialDocs: essentialDocsWithURLs, // Add essentialDocs with URLs
      };
    });

    return next(createSuccess(200, "All Products", proWithImageURLs));
  } catch (error) {
    return next(createError(500, "Internal Server Error!"));
  }
};

//get Auction without wishlist
const getAuction = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('bids').exec();

    if (!product) {
      return next(createError(404, "Product Not Found"));
    }

    // Sort bids by amount in descending order
    product.bids.sort((a, b) => b.amount - a.amount);

    // Map uploadDocuments to include URLs
    const imagesWithURLs = product.uploadDocuments.map((image) => {
      return {
        ...image._doc,
        url: `http://localhost:3000/api/product/uploadDocuments/${image.filename}`,

      };
    });

    // Map essentialDocs to include URLs
    const essentialDocsWithURLs = product.essentialDocs ? product.essentialDocs.map((doc) => {
      return {
        ...doc._doc,
        url: `http://localhost:3000/api/product/essentialDocs/${doc.filename}`,

      };
    }) : [];

    const productWithImageURLs = {
      ...product._doc,
      uploadDocuments: imagesWithURLs,
      essentialDocs: essentialDocsWithURLs, // Add essentialDocs with URLs
    };

    return next(createSuccess(200, "Single Product", productWithImageURLs));
  } catch (error) {
    return next(createError(500, "Internal Server Error"));
  }
};




//get auction by id with wishlist

const getAuctionWithWish = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate({
      path: 'bids',
      options: { sort: { 'timestamp': -1 } } // Sort bids from latest to oldest
    }).exec();

    if (!product) {
      return next(createError(404, "Product Not Found"));
    }

    // Assuming userId is passed as a query parameter
    const { userId } = req.query;

    // Fetch the user's wishlist
    const wishlist = await Wishlist.findOne({ userId });

    // Check if the product is in the user's wishlist
    const isWishlisted = wishlist ? wishlist.products.includes(product._id.toString()) : false;

    // Map uploadDocuments to include URLs
    const imagesWithURLs = product.uploadDocuments.map((image) => {
      return {
        ...image._doc,
        url: `http://localhost:3000/api/product/uploadDocuments/${image.filename}`,

      };
    });

    // Map essentialDocs to include URLs
    const essentialDocsWithURLs = product.essentialDocs ? product.essentialDocs.map((doc) => {
      return {
        ...doc._doc,
        url: `http://localhost:3000/api/product/essentialDocs/${doc.filename}`,

      };
    }) : [];

    const productWithImageURLs = {
      ...product._doc,
      uploadDocuments: imagesWithURLs,
      essentialDocs: essentialDocsWithURLs, // Add essentialDocs with URLs
      isWishlisted, // Add the isWishlisted status to the product
    };

    return next(createSuccess(200, "Single Product with Wishlist Status", productWithImageURLs));
  } catch (error) {
    return next(createError(500, "Internal Server Error"));
  }
};


//bySellerId for Sellers Dashboard

const getProductsByUserId = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    // Get search query and pagination parameters from request query
    const { search = '', page = 1, limit = 10 } = req.query;

    // Create a filter for productName if search query is provided
    const searchFilter = search
      ? { productName: { $regex: search, $options: 'i' } } // Case-insensitive search
      : {};

    // Pagination: Convert `page` and `limit` to numbers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Fetch only active products for the given userId with search and pagination
    const products = await Product.find({
      userId,
      ...searchFilter,
    })
      .skip(skip) // Skip products for pagination
      .limit(limitNumber); // Limit the number of products returned

    // Count the total number of products for pagination metadata
    const totalProducts = await Product.countDocuments({
      userId,
      ...searchFilter,
    });

    // Map the products to include image URLs
    const proWithImageURLs = products.map((product) => {
      // Map uploadDocuments to include URLs
      const imagesWithURLs = product.uploadDocuments.map((image) => {
        return {
          ...image._doc,
          url: `http://localhost:3000/api/product/uploadDocuments/${image.filename}`,
        };
      });

      // Map essentialDocs to include URLs
      const essentialDocsWithURLs = product.essentialDocs
        ? product.essentialDocs.map((doc) => {
            return {
              ...doc._doc,
              url: `http://localhost:3000/api/product/essentialDocs/${doc.filename}`,
            };
          })
        : [];

      return {
        ...product._doc,
        uploadDocuments: imagesWithURLs,
        essentialDocs: essentialDocsWithURLs,
      };
    });

    // Return the paginated result and total count
    return next(
      createSuccess(200, 'Products By UserId', {
        products: proWithImageURLs,
        totalProducts,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalProducts / limitNumber),
      })
    );
  } catch (error) {
    return next(createError(500, 'Internal Server Error!'));
  }
};


//bySellerId for Auction Page with verified Filter

const getVerifiedProductsByUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    // Get search query and pagination parameters from request query
    const { search = '', page = 1, limit = 10 } = req.query;

    // Create a filter for productName if search query is provided
    const searchFilter = search
      ? { productName: { $regex: search, $options: 'i' } } // Case-insensitive search
      : {};

    // Pagination: Convert `page` and `limit` to numbers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Fetch only products where proVerifyByAdmin == true for the given userId with search and pagination
    const products = await Product.find({
      userId,
      proVerifyByAdmin: true,  // Add condition to filter products verified by admin
      ...searchFilter,
    })
      .skip(skip) // Skip products for pagination
      .limit(limitNumber); // Limit the number of products returned

    // Count the total number of products for pagination metadata
    const totalProducts = await Product.countDocuments({
      userId,
      proVerifyByAdmin: true,  // Add condition to count only verified products
      ...searchFilter,
    });

    // Map the products to include image URLs
    const proWithImageURLs = products.map((product) => {
      // Map uploadDocuments to include URLs
      const imagesWithURLs = product.uploadDocuments.map((image) => {
        return {
          ...image._doc,
          url: `http://localhost:3000/api/product/uploadDocuments/${image.filename}`,
        };
      });

      // Map essentialDocs to include URLs
      const essentialDocsWithURLs = product.essentialDocs
        ? product.essentialDocs.map((doc) => {
            return {
              ...doc._doc,
              url: `http://localhost:3000/api/product/essentialDocs/${doc.filename}`,
            };
          })
        : [];

      return {
        ...product._doc,
        uploadDocuments: imagesWithURLs,
        essentialDocs: essentialDocsWithURLs,
      };
    });

    // Return the paginated result and total count
    return next(
      createSuccess(200, 'Products By UserId', {
        products: proWithImageURLs,
        totalProducts,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalProducts / limitNumber),
      })
    );
  } catch (error) {
    return next(createError(500, 'Internal Server Error!'));
  }
};

//update Auction
const updateAuction = async (req, res, next) => {
  try {
    const id = req.params.id;
    const {
      productName,
      category,
      color,
      productCondition,
      productDescription,
      subcategory,
      lotNumber,
      brand,
      startingPrice,
      reservePrice,
      currentBid,
      saleTax,
      startDate,
      endDate,
      buyerPremium,
      shipping,
      collect,
      startTime,
      stopTime,
      address,
      town,
      comment,
      buyNowPrice,
      country,
      shippingDetails,
      dynamicFields
    } = req.body;

    console.log('Request Body:', req.body);

    // Find the product by ID
    const product = await Product.findById(id);
    if (!product) {
      return next(createError(404, "Product Not Found"));
    }

    // Handle file uploads
    let uploadDocuments = product.uploadDocuments;
    if (req.files['uploadDocuments'] && req.files['uploadDocuments'].length > 0) {
      // Delete old images from the file system
      uploadDocuments.forEach((image) => {
        const filepath = path.join(__dirname, "../uploads", image.filename);
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      });

      // Save new files
      uploadDocuments = req.files['uploadDocuments'].map((file) => {
        const filename = Date.now() + path.extname(file.originalname);
        const filepath = path.join(__dirname, "../uploads", filename);
        fs.writeFileSync(filepath, file.buffer);
        return {
          filename,
          contentType: file.mimetype,
        };
      });
    }

    // Handle essentialDocs updates
    let essentialDocs = product.essentialDocs;
    if (req.files['essentialDocs'] && req.files['essentialDocs'].length > 0) {
      // Delete old essential docs from the file system
      essentialDocs.forEach((doc) => {
        const filepath = path.join(__dirname, "../uploads", doc.filename);
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      });

      // Save new essential docs
      essentialDocs = req.files['essentialDocs'].map((file) => {
        const filename = Date.now() + path.extname(file.originalname);
        const filepath = path.join(__dirname, "../uploads", filename);
        fs.writeFileSync(filepath, file.buffer);
        return {
          filename,
          contentType: file.mimetype,
        };
      });
    }

    // Update product details
    product.productName = productName || product.productName;
    product.category = category || product.category;
    product.color = color || product.color;
    product.productCondition = productCondition || product.productCondition;
    product.productDescription = productDescription || product.productDescription;
    product.subcategory = subcategory || product.subcategory;
    product.lotNumber = lotNumber || product.lotNumber;
    product.brand = brand || product.brand;
    product.startingPrice = startingPrice || product.startingPrice;
    product.currentBid = currentBid || product.currentBid;
    product.reservePrice = reservePrice || product.reservePrice;
    product.saleTax = saleTax || product.saleTax;
    product.startDate = startDate || product.startDate;
    product.endDate = endDate || product.endDate;
    product.shipping = shipping ? (shipping.toLowerCase() === 'true') : product.shipping;
    product.collect = collect || product.collect;
    product.buyerPremium = buyerPremium || product.buyerPremium;
    product.startTime = startTime || product.startTime;
    product.stopTime = stopTime || product.stopTime;
    product.address = address || product.address;
    product.town = town || product.town;
    product.comment = comment || product.comment;
    product.buyNowPrice = buyNowPrice || product.buyNowPrice;
    product.country = country || product.country;
    product.uploadDocuments = uploadDocuments;
    product.essentialDocs = essentialDocs;

    // Process dynamic fields
    if (dynamicFields) {
      try {
        product.dynamicFields = typeof dynamicFields === 'string'
          ? JSON.parse(dynamicFields)
          : dynamicFields;
      } catch (error) {
        return next(createError(400, "Invalid format for dynamic fields"));
      }
    }

    // Process shipping details
    let parsedShippingDetails = shippingDetails;
    if (shipping) {
      if (shippingDetails) {
        // If shippingDetails is a string, parse it to an object
        if (typeof shippingDetails === 'string') {
          try {
            parsedShippingDetails = JSON.parse(shippingDetails);
          } catch (error) {
            console.error("Error parsing shippingDetails JSON:", error);
            return res.status(400).json({ message: "Invalid format for shippingDetails" });
          }
        }

        // Validate shipping details
        if (Array.isArray(parsedShippingDetails) && parsedShippingDetails.length > 0) {
          const validShippingDetails = parsedShippingDetails.map(detail => {
            if (!detail.country || detail.shippingPrice == null || isNaN(Number(detail.shippingPrice))) {
              console.error("Invalid shipping detail:", detail);
              return null; // Skip invalid details
            }
            return {
              country: detail.country,
              shippingPrice: parseFloat(detail.shippingPrice)  // Ensure it's a number
            };
          }).filter(detail => detail !== null);

          if (validShippingDetails.length > 0) {
            product.shippingDetails = validShippingDetails;
          } else {
            console.error("All shipping details are invalid");
            return res.status(400).json({ message: "All shipping details are invalid" });
          }
        } else {
          console.error("Shipping details are missing or invalid:", parsedShippingDetails);
          return res.status(400).json({ message: "Shipping details are required when shipping is enabled" });
        }
      } else {
        product.shippingDetails = [];
      }
    } else {
      product.shippingDetails = [];
    }

    console.log('Updated Shipping Details:', product.shippingDetails);
    await product.save();
    next(createSuccess(200, "Product updated successfully"));

    const userId = product.userId; // Assuming product has userId field
    const message = `Your product ${product.productName} has been updated successfully.`;

    // Call notification creation asynchronously (doesn't block the API response)
    const user = await User.findById(userId);
    if (user && user.notificationsEnabled) {
      const notification = new InAppNotification({ userId, message });
      await notification.save();
    }


  } catch (error) {
    console.error("Error updating product:", error);
    return next(createError(500, "Something went wrong"));
  }
};




//delete Auction
const deleteAuction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return next(createError(404, "Product Not Found"));
    }

    // Send the success response for product deletion
    next(createSuccess(200, "Product Deleted Successfully", product));

    // After deletion, create a notification for the user
    const userId = product.userId; // Assuming product has userId field
    const message = `Your product ${product.productName} has been successfully deleted.`; // Customize the message as needed
    
    // Call notification creation asynchronously (doesn't block the API response)
    const user = await User.findById(userId);
    if (user && user.notificationsEnabled) {
      const notification = new InAppNotification({ userId, message });
      await notification.save();
    }

  } catch (error) {
    console.error("Error deleting product:", error);
    return next(createError(500, "Internal Server Error"));
  }
};


//for productImage
const getImage = (req, res, next) => {
  const filepath = path.join(__dirname, "../uploads", req.params.filename);
  fs.readFile(filepath, (err, data) => {
    if (err) {
      return next(createError(404, "Image Not Found"));
    }
    const image = data;
    const mimeType = req.params.filename.split(".").pop();
    res.setHeader("Content-Type", `image/${mimeType}`);
    res.send(image);
  });
};
//for documents
const getDocs = (req, res, next) => {
  const filepath = path.join(__dirname, "../uploads", req.params.filename);
  fs.readFile(filepath, (err, data) => {
    if (err) {
      return next(createError(404, "Docs Not Found"));
    }
    const image = data;
    const mimeType = req.params.filename.split(".").pop();
    res.setHeader("Content-Type", `image/${mimeType}`);
    res.send(image);
  });
};



const getCatagory = async (req, res, next) => {
  try {
    const { selectedItem } = req.body;
    const products = await Product.find({ category: selectedItem });

    const proWithImageURLs = products.map((user) => {
      // Map uploadDocuments to include URLs
      const imagesWithURLs = user.uploadDocuments.map((image) => {
        return {
          ...image._doc,
          url: `http://localhost:3000/api/product/uploadDocuments/${image.filename}`,

        };
      });

      // Map essentialDocs to include URLs
      const essentialDocsWithURLs = user.essentialDocs ? user.essentialDocs.map((doc) => {
        return {
          ...doc._doc,
          url: `http://localhost:3000/api/product/essentialDocs/${doc.filename}`,

        };
      }) : [];

      return {
        ...user._doc,
        uploadDocuments: imagesWithURLs,
        essentialDocs: essentialDocsWithURLs, // Add essentialDocs with URLs
      };
    });

    return next(createSuccess(200, "All Products", proWithImageURLs));
  } catch (error) {
    return next(createError(500, "Internal Server Error!"));
  }
};


const liveAuction = async (req, res, next) => {
  try {
    const now = new Date();
    const todayDate = now.toISOString().split('T')[0]; // Current date in yyyy-mm-dd format
    const currentTime = now.toTimeString().slice(0, 5); // Current time in HH:mm format

    const products = await Product.find({
      status: 'active',
      isActive: true,
      proVerifyByAdmin: true,
      $and: [
        // Auction must have started
        { $expr: { $lte: [{ $concat: ["$startDate", "T", "$startTime"] }, `${todayDate}T${currentTime}`] } },
        // Auction must not have ended
        { $expr: { $gte: [{ $concat: ["$endDate", "T", "$stopTime"] }, `${todayDate}T${currentTime}`] } }
      ]
    });

    const productsWithImageURLs = products.map((product) => {
      // Map uploadDocuments to include URLs
      const imagesWithURLs = product.uploadDocuments.map((image) => ({
        ...image._doc,
        url: `http://localhost:3000/api/product/uploadDocuments/${image.filename}`,
      }));

      // Map essentialDocs to include URLs
      const essentialDocsWithURLs = product.essentialDocs ? product.essentialDocs.map((doc) => ({
        ...doc._doc,
        url: `http://localhost:3000/api/product/essentialDocs/${doc.filename}`,
      })) : [];

      return {
        ...product._doc,
        uploadDocuments: imagesWithURLs,
        essentialDocs: essentialDocsWithURLs,
      };
    });

    return next(createSuccess(200, "Live auctions fetched successfully", productsWithImageURLs));
  } catch (error) {
    return next(createError(500, "Internal Server Error!"));
  }
};


const futureAuction = async (req, res, next) => {
  try {
    const now = new Date();
    const todayDate = now.toISOString().split('T')[0]; // Current date in yyyy-mm-dd format
    const currentTime = now.toTimeString().slice(0, 5); // Current time in HH:mm format

    const products = await Product.find({
      status: 'active',
      isActive: true,
      proVerifyByAdmin: true,
      // Auction must not have started yet
      $expr: { $gt: [{ $concat: ["$startDate", "T", "$startTime"] }, `${todayDate}T${currentTime}`] }
    });

    const productsWithImageURLs = products.map((product) => {
      // Map uploadDocuments to include URLs
      const imagesWithURLs = product.uploadDocuments.map((image) => ({
        ...image._doc,
        url: `http://localhost:3000/api/product/uploadDocuments/${image.filename}`,
      }));

      // Map essentialDocs to include URLs
      const essentialDocsWithURLs = product.essentialDocs ? product.essentialDocs.map((doc) => ({
        ...doc._doc,
        url: `http://localhost:3000/api/product/essentialDocs/${doc.filename}`,
      })) : [];

      return {
        ...product._doc,
        uploadDocuments: imagesWithURLs,
        essentialDocs: essentialDocsWithURLs,
      };
    });

    return next(createSuccess(200, "Future auctions fetched successfully", productsWithImageURLs));
  } catch (error) {
    return next(createError(500, "Internal Server Error!"));
  }
};


const getCategoryWithAuctions = async (req, res, next) => {
  try {
    const { selectedItem, page = 1, limit = 10 } = req.body;
    const products = await Product.find({
      category: selectedItem,
      proVerifyByAdmin: true // Add this condition
    });

    const currentDate = moment().utc();
    const startOfDay = currentDate.clone().startOf('day');
    const endOfDay = currentDate.clone().endOf('day');

    const liveAuctions = products.filter(product =>
      product.isActive &&
      product.startDate <= endOfDay &&
      product.endDate >= startOfDay
    );

    const futureAuctions = products.filter(product =>
      product.isActive &&
      product.startDate > startOfDay
    );

    const formatProducts = (products) => {
      return products.map((product) => {
        // Map uploadDocuments to include URLs
        const imagesWithURLs = product.uploadDocuments.map((image) => {
          return {
            ...image._doc,
            url: `http://localhost:3000/api/product/uploadDocuments/${image.filename}`,

          };
        });

        // Map essentialDocs to include URLs
        const essentialDocsWithURLs = product.essentialDocs ? product.essentialDocs.map((doc) => {
          return {
            ...doc._doc,
            url: `http://localhost:3000/api/product/essentialDocs/${doc.filename}`,

          };
        }) : [];

        return {
          ...product._doc,
          uploadDocuments: imagesWithURLs,
          essentialDocs: essentialDocsWithURLs, // Add essentialDocs with URLs
        };
      });
    };

    // Pagination logic for live auctions
    const liveAuctionsWithImages = formatProducts(liveAuctions);
    const totalLiveAuctions = liveAuctionsWithImages.length;
    const startLiveIndex = (page - 1) * limit;
    const endLiveIndex = startLiveIndex + limit;
    const paginatedLiveAuctions = liveAuctionsWithImages.slice(startLiveIndex, endLiveIndex);

    // Pagination logic for future auctions
    const futureAuctionsWithImages = formatProducts(futureAuctions);
    const totalFutureAuctions = futureAuctionsWithImages.length;
    const startFutureIndex = (page - 1) * limit;
    const endFutureIndex = startFutureIndex + limit;
    const paginatedFutureAuctions = futureAuctionsWithImages.slice(startFutureIndex, endFutureIndex);

    return next(createSuccess(200, "Category Products with Auctions", {
      liveAuctions: paginatedLiveAuctions,
      totalLiveAuctions,
      futureAuctions: paginatedFutureAuctions,
      totalFutureAuctions,
      currentPage: page,
      totalPages: Math.ceil(totalLiveAuctions / limit)
    }));
  } catch (error) {
    return next(createError(500, "Internal Server Error!"));
  }
};


const getAuctionHistory = async (req, res, next) => {
  try {
    const buyerId = req.params.buyerId; // Get buyer ID from request parameters
    const history = await Product.find({ winningBuyer: buyerId }).populate('winningBuyer', 'username'); // Adjust fields as necessary

    if (!history.length) {
      return next(createSuccess(404, "No auction history found for this buyer."));
    }

    const proWithImageURLs = history.map((product) => {
      // Map uploadDocuments to include URLs
      const imagesWithURLs = product.uploadDocuments.map((image) => {
        return {
          ...image._doc,
          url: `http://localhost:3000/api/product/uploadDocuments/${image.filename}`,

        };
      });

      // Map essentialDocs to include URLs
      const essentialDocsWithURLs = product.essentialDocs ? product.essentialDocs.map((doc) => {
        return {
          ...doc._doc,
          url: `http://localhost:3000/api/product/essentialDocs/${doc.filename}`,

        };
      }) : [];

      return {
        ...product._doc,
        uploadDocuments: imagesWithURLs,
        essentialDocs: essentialDocsWithURLs, // Add essentialDocs with URLs
      };
    });

    return next(createSuccess(200, "All Product History", proWithImageURLs));
  } catch (error) {
    console.error(error);
    return next(createError(500, "Internal Server Error!"));
  }
};

const getBidProducts = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const bids = await Bid.find({ userId }).select('productId').exec();
    const productIds = bids.map(bid => bid.productId);
    const products = await Product.find({ _id: { $in: productIds } })
      .populate({
        path: 'bids',
        match: { userId: userId },
        populate: { path: 'userId', select: 'username email' }
      })
      .exec();

    if (!products.length) {
      return next(createSuccess(404, "No products found for this Buyer"));
    }

    const proWithImageURLs = products.map((product) => {
      // Map uploadDocuments to include URLs
      const imagesWithURLs = product.uploadDocuments.map((image) => {
        return {
          ...image._doc,
          url: `http://localhost:3000/api/product/uploadDocuments/${image.filename}`,

        };
      });

      // Map essentialDocs to include URLs
      const essentialDocsWithURLs = product.essentialDocs ? product.essentialDocs.map((doc) => {
        return {
          ...doc._doc,
          url: `http://localhost:3000/api/product/essentialDocs/${doc.filename}`,

        };
      }) : [];

      return {
        ...product._doc,
        uploadDocuments: imagesWithURLs,
        essentialDocs: essentialDocsWithURLs, // Add essentialDocs with URLs
      };
    });

    return next(createSuccess(200, "All Bids Products", proWithImageURLs));
  } catch (error) {
    return next(createError(500, "Internal Server Error!"));
  }
};


module.exports = {
  createProduct,
  getCatagory,
  liveAuction,
  futureAuction,
  getAllAuction,
  getAuction,
  getAuctionWithWish,
  updateAuction,
  deleteAuction,
  getProductsByUserId,
  getVerifiedProductsByUser,
  getImage,
  getCategoryWithAuctions,
  getAuctionHistory,
  getBidProducts,
  getDocs,
  createNotification
};
