const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

router.post('/create', categoryController.createCategory);
router.get('/', categoryController.getCategories);
router.get('/all', categoryController.getCategoriesWithSubcategories);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);
router.delete('/:categoryId/subcategories/:subcategoryId', categoryController.deleteSubcategory);
router.get('/all/:category', categoryController.getProductsByCategory);
router.get('/:category/sub/:subcategory', categoryController.getProductsByCatandSubcat);
router.get('/:categoryName', categoryController.getCategoryByName);


module.exports = router;
