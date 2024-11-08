const Product = require('../models/sellerProductFormModel')
const Wishlist = require('../models/Wishlist')
const createError = require('../middleware/error')
const createSuccess = require('../middleware/success')

const getAllBuyer = async (req, res, next) => {
    try {
      // Find products with the specified conditions
      const products = await Product.find({
        status: 'active',
        isActive: true,
        proVerifyByAdmin: true,
        isSuspended: false
      });
  
      // Map through the products and add URLs to the images and essentialDocs
      const proWithImageAndDocURLs = products.map(product => {
        const imagesWithURLs = product.uploadDocuments.map(image => {
          return {
            ...image._doc,
            url: `http://88.222.212.120:3000/api/product/uploadDocuments/${image.filename}`,
          };
        });
  
        const essentialDocsWithURLs = product.essentialDocs.map(doc => {
          return {
            ...doc._doc,
            url: `http://88.222.212.120:3000/api/product/essentialDocs/${doc.filename}`,
          };
        });
  
        return {
          ...product._doc,
          uploadDocuments: imagesWithURLs,
          essentialDocs: essentialDocsWithURLs // Include essentialDocs in the response
        };
      });
  
      // Return the products with the image and essentialDocs URLs
      return next(createSuccess(200, "All Verified Products", proWithImageAndDocURLs));
  
    } catch (error) {
      // Handle any errors
      return next(createError(500, "Internal Server Error!"));
    }
  };
  


module.exports = { getAllBuyer }