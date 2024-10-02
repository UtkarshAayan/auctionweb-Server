const express = require('express');
const router = express.Router();
const WishlistController = require('../controllers/wishlistController');

router.get('/:userId', WishlistController.getWishlist);
router.post('/:userId/add', WishlistController.addProductToWishlist);
router.delete('/:userId/remove/:productId', WishlistController.removeProductFromWishlist);

module.exports = router;
