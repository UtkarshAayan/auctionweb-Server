// routes/bannerRoutes.js
const express = require('express');
const router = express.Router();

const {  getBannerImages } = require('../controllers/homeBannerImageController');

router.get('/view', getBannerImages);

module.exports = router;
