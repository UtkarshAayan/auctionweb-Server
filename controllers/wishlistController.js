const Wishlist = require('../models/Wishlist');
const Product = require('../models/sellerProductFormModel');
const createError = require('../middleware/error')
const createSuccess = require('../middleware/success')
// Get wishlist by user ID
exports.getWishlist = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const wishlist = await Wishlist.findOne({ userId })
      .populate({
        path: 'products',
        match: {
          status: 'active',
          isActive: true,
          proVerifyByAdmin: true,
          isSuspended: false,
        },
      });
    
    if (!wishlist) {
      return next(createError(404, "Wishlist not found"));
    }

    // Attach image URLs to each product in the wishlist
    const productsWithImageURLs = wishlist.products.map(product => {
      const imagesWithURLs = product.uploadDocuments.map(image => {
        return {
          ...image._doc,
        url: `http://88.222.212.120:3000/api/product/uploadDocuments/${image.filename}`,

        };
      });

      return {
        ...product._doc,
        uploadDocuments: imagesWithURLs,
      };
    });

    const wishlistWithImageURLs = {
      ...wishlist._doc,
      products: productsWithImageURLs,
    };

    return next(createSuccess(200, "All Wishlists", wishlistWithImageURLs));
  } catch (error) {
    return next(createError(500, "Something went wrong"));
  }
};


// Add product to wishlist
exports.addProductToWishlist = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { productId } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return next(createError(404, "Product not found"))
    }

    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId, products: [] });
    }

    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
      product.wishListStatus = true;
      await product.save();
    }

    await wishlist.save();
    return next(createSuccess(200, "Added Successfully To Wishlist", wishlist))
  } catch (error) {
    return next(createError(500, "Something went wrong"))
  }
};

// Remove product from wishlist
exports.removeProductFromWishlist = async (req, res, next) => {
  try {
    const { userId, productId } = req.params;

    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return next(createError(404, "Wishlist not found"))
    }

    wishlist.products = wishlist.products.filter((id) => id.toString() !== productId);

    const product = await Product.findById(productId);
    if (product) {
      product.wishListStatus = false;
      await product.save();
    }

    await wishlist.save();
    return next(createSuccess(200, "Removed Successfully From Wishlist", wishlist))

  } catch (error) {
    return next(createError(500, "Something went wrong"))
  }
};
