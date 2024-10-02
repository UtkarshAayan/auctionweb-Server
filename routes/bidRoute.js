const express = require('express');
const { placeBid } = require('../controllers/bidController');
// const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/create', placeBid);
module.exports = router;
