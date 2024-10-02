// controllers/bannerController.js
const path = require('path');
const Banner = require('../models/homeBannerImage');
const fs = require('fs');

// Fetch banner images
const getBannerImages = async (req, res) => {
    const banner = await Banner.findOne(); // Fetch the latest banner (or you can modify to fetch all)
  
    if (!banner) {
      return res.status(404).json({ message: 'No banner images found' });
    }
  
    res.status(200).json({
      bannerImages: banner.bannerImages.map(img => {
        // Ensure forward slashes for URLs
        return `http://51.21.59.126:3000${img.replace(/\\/g, '/')}`;
      })
    });
  };
  




module.exports = { getBannerImages };
