const express = require("express");
const { createProduct, getAllAuction, getAuction, getAuctionWithWish, updateAuction, deleteAuction, getProductsByUserId,getVerifiedProductsByUser, getImage, getCatagory, liveAuction, futureAuction, getCategoryWithAuctions, getAuctionHistory, getBidProducts, getDocs,createNotification } = require('../controllers/sellerProductController')
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/notifications', createNotification);
router.post('/create', upload, createProduct);
router.post('/', getAllAuction);
router.get('/:id', getAuction);
router.get('/pro/:id',  getAuctionWithWish);
router.put('/:id', upload, updateAuction);
router.delete('/:id', deleteAuction);
router.get('/proUser/:userId', getProductsByUserId);
router.get('/proUser/verified/:userId', getVerifiedProductsByUser);
router.get('/uploadDocuments/:filename', getImage);
router.get('/essentialDocs/:filename', getDocs);
router.post('/category',  getCatagory);
router.post('/liveAuction', liveAuction);
router.post('/futureAuction', futureAuction);
router.post('/category/auctions', getCategoryWithAuctions);
router.get('/history/:buyerId', getAuctionHistory);
router.get('/bidProducts/:userId', getBidProducts);

// router.post('/createproduct', upload.single('uploadDocuments'), createProduct); 





module.exports = router;