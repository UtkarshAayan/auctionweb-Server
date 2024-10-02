const Category = require('../models/Category');
const express = require('express');
const router = express.Router();
const Product = require('../models/sellerProductFormModel');
const createError = require("../middleware/error");
const createSuccess = require("../middleware/success");

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all categories
exports.getCategories = async (req, res,next) => {
  try {
    const categories = await Category.find();

    // Base URL for images
    const baseUrl = `http://51.21.59.126:3000`; // Ensure the path is correctly prefixed

    // Map through categories to add full URLs
    const categoriesWithFullUrls = categories.map(category => {
      // Map subcategories to include full URLs
      const subcategoriesWithUrls = category.subcategories.map(subcategory => ({
        ...subcategory.toObject(),
        subcategoryImage: subcategory.subcategoryImage
          ? `${baseUrl}${subcategory.subcategoryImage}`
          : null,
      }));

      return {
        ...category.toObject(),
        categoryImage: category.categoryImage
          ? `${baseUrl}${category.categoryImage}`
          : null,
        subcategories: subcategoriesWithUrls,
      };
    });

   // res.status(200).json({ success: true, data: categoriesWithFullUrls });
    return next(createSuccess(200, "all Categories",  categoriesWithFullUrls));
  } catch (error) {
    // res.status(400).json({ success: false, message: error.message });
    return next(createError(500, "Something went wrong"));


  }
};

// Update a category
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete subcategory
exports.deleteSubcategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const subcategoryId = req.params.subcategoryId;

    // Find category and remove subcategory
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).send('Category not found');
    }

    category.subcategories.id(subcategoryId).remove();
    await category.save();

    res.status(200).json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCategoriesWithSubcategories = async (req, res, next) => {
  try {
    // Fetch categories with populated subcategories
    const categories = await Category.find().populate('subcategories').exec();

    // Base URL for images
    const baseUrl = `http://51.21.59.126:3000`; // Ensure the path is correctly prefixed

    // Map through categories to add full URLs
    const categoriesWithFullUrls = categories.map(category => {
      // Map subcategories to include full URLs
      const subcategoriesWithUrls = category.subcategories.map(subcategory => ({
        ...subcategory.toObject(),
        subcategoryImage: subcategory.subcategoryImage
          ? `${baseUrl}${subcategory.subcategoryImage}`
          : null,
      }));

      return {
        ...category.toObject(),
        categoryImage: category.categoryImage
          ? `${baseUrl}${category.categoryImage}`
          : null,
        subcategories: subcategoriesWithUrls,
      };
    });

    return next(createSuccess(200, "Categories With Subcategories", categoriesWithFullUrls));
  } catch (error) {
    return next(createError(500, "Something went wrong"));
  }
}


// Get products by category
exports.getProductsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params; // Destructure category from params
    const { search = '', page = 1, limit = 10 } = req.query; // Get search term, page, and limit from query parameters
    const skip = (page - 1) * limit; // Calculate how many documents to skip for pagination

    // Build the query object
    let query = {
      category,
      status: 'active',
      isActive: true,
      proVerifyByAdmin: true,
      isSuspended: false,
    };

    // If search term is provided, add regex-based filtering for productName
    if (search) {
      query.productName = { $regex: search, $options: 'i' }; // 'i' for case-insensitive search
    }

    // Fetch total count of matching products for pagination purposes
    const totalProducts = await Product.countDocuments(query);

    // Fetch products with pagination and search functionality
    const products = await Product.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }); // Sort by latest products first

    // Map through products to include image URLs and essentialDocs
    const proWithImageURLs = products.map((product) => {
      const imagesWithURLs = product.uploadDocuments.map((image) => {
        return {
          ...image._doc,
          url: `http://localhost:3000/api/product/uploadDocuments/${image.filename}`,
        };
      });

      const essentialDocsWithURLs = product.essentialDocs.map((doc) => {
        return {
          ...doc._doc,
          url: `http://localhost:3000/api/product/essentialDocs/${doc.filename}`,
        };
      });

      return {
        ...product._doc,
        uploadDocuments: imagesWithURLs,
        essentialDocs: essentialDocsWithURLs, // Include essentialDocs in the response
      };
    });

    // Calculate pagination info
    const pagination = {
      totalProducts,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalProducts / limit),
      hasNextPage: page < Math.ceil(totalProducts / limit),
      hasPrevPage: page > 1,
    };

    // Send success response with products and pagination info
    return next(
      createSuccess(200, "Products By Category", {
        products: proWithImageURLs,
        pagination,
      })
    );
  } catch (err) {
    // Log the error for debugging purposes (optional)
    console.error('Error fetching products by category:', err);

    // Send error response
    return next(createError(500, "Something went wrong"));
  }
};




// Get products by category and subcategory

exports.getProductsByCatandSubcat = async (req, res, next) => {
  try {
    const { category, subcategory } = req.params; // Destructure category and subcategory from params
    const { search = '', page = 1, limit = 10 } = req.query; // Get search term, page, and limit from query parameters
    const skip = (page - 1) * limit; // Calculate the number of documents to skip for pagination

    // Build the query object
    let query = {
      category,
      subcategory,
      status: 'active',
      isActive: true,
      proVerifyByAdmin: true,
      isSuspended: false,
    };

    // If search term is provided, add regex-based filtering for productName
    if (search) {
      query.productName = { $regex: search, $options: 'i' }; // 'i' for case-insensitive search
    }

    // Fetch total count of matching products for pagination purposes
    const totalProducts = await Product.countDocuments(query);

    // Fetch products with pagination and search functionality
    const products = await Product.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }); // Sort by latest products first

    // Map through products to include image URLs and essentialDocs
    const proWithImageURLs = products.map((product) => {
      const imagesWithURLs = product.uploadDocuments.map((image) => ({
        ...image._doc,
        url: `http://localhost:3000/api/product/uploadDocuments/${image.filename}`,
      }));

      const essentialDocsWithURLs = product.essentialDocs.map((doc) => ({
        ...doc._doc,
        url: `http://localhost:3000/api/product/essentialDocs/${doc.filename}`,
      }));

      return {
        ...product._doc,
        uploadDocuments: imagesWithURLs,
        essentialDocs: essentialDocsWithURLs,
      };
    });

    // Calculate pagination info
    const pagination = {
      totalProducts,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalProducts / limit),
      hasNextPage: page < Math.ceil(totalProducts / limit),
      hasPrevPage: page > 1,
    };

    // Send success response with products and pagination info
    return next(
      createSuccess(200, "Products By Category and SubCategory", {
        products: proWithImageURLs,
        pagination,
      })
    );
  } catch (err) {
    // Log the error for debugging purposes
    console.error('Error fetching products by category and subcategory:', err);

    // Send error response
    return next(createError(500, "Something went wrong"));
  }
};



exports.getCategoryByName = async (req, res, next) => {
  try {
    const categoryName = req.params.categoryName;
    const category = await Category.findOne({ name: categoryName });

    if (!category) {
      return next(createError(404, "Category not found"));
    }

    // Base URL for images
    const baseUrl = `http://51.21.59.126:3000`;

    // Map through the subcategories to add full URLs
    const subcategoriesWithUrls = category.subcategories.map(subcategory => ({
      ...subcategory.toObject(),
      subcategoryImage: subcategory.subcategoryImage
        ? `${baseUrl}${subcategory.subcategoryImage}`
        : null,
    }));

    // Add the full URL for the category image
    const categoryWithFullUrl = {
      ...category.toObject(),
      categoryImage: category.categoryImage
        ? `${baseUrl}${category.categoryImage}`
        : null,
      subcategories: subcategoriesWithUrls, // Include subcategories with full image URLs
    };

    return next(createSuccess(200, "Category By Name", categoryWithFullUrl));

  } catch (err) {
    return next(createError(500, "Something went wrong"));
  }
};


