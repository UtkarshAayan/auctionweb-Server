const express = require("express");
const { createProduct, getAllAuction, getAuction, getAuctionWithWish, updateAuction, deleteAuction, getProductsByUserId,getVerifiedProductsByUser, getImage, getCatagory, liveAuction, futureAuction, getCategoryWithAuctions, getAuctionHistory, getBidProducts, getDocs,createNotification } = require('../controllers/sellerProductController')
const { verifyAdmin, verifyUser } = require('../middleware/verifyToken')
const upload = require('../middleware/upload');
// const company_route = express();
const router = express.Router();

router.post('/notifications', createNotification);
router.post('/create', verifyAdmin, upload, createProduct);
router.post('/', verifyAdmin, getAllAuction);
router.get('/:id', verifyUser, getAuction);
router.get('/pro/:id', verifyUser, getAuctionWithWish);
router.put('/:id', verifyAdmin, upload, updateAuction);
router.delete('/:id', verifyAdmin, deleteAuction);
router.get('/proUser/:userId', getProductsByUserId);
router.get('/proUser/verified/:userId', getVerifiedProductsByUser);
router.get('/uploadDocuments/:filename', getImage);
router.get('/essentialDocs/:filename', getDocs);
router.post('/category', verifyAdmin, getCatagory);
router.post('/liveAuction', verifyAdmin, liveAuction);
router.post('/futureAuction', verifyAdmin, futureAuction);
router.post('/category/auctions', getCategoryWithAuctions);
router.get('/history/:buyerId', getAuctionHistory);
router.get('/bidProducts/:userId', getBidProducts);

// router.post('/createproduct', upload.single('uploadDocuments'), createProduct); 





module.exports = router;