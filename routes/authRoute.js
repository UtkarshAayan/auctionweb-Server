const express = require('express');
const {login,registerAdmin,sendEmail,resetPassword,signup,registerSeller,registerBuyer,sendEmail1,verifyOTP1,resetPassword1} = require('../controllers/authController')

//as User
const router = express.Router();
router.post('/signup', signup);
router.post('/login', login);
//as Admin
router.post('/register-admin', registerAdmin);
//as Seller
router.post('/register-seller', registerSeller);
//as Buyer
router.post('/register-buyer', registerBuyer);
//send reset email

router.post('/send-email',sendEmail)

//Reset Password
router.post("/resetPassword", resetPassword);

//otp based forget password
router.post('/send-email1',sendEmail1)
router.post('/verify-otp1', verifyOTP1);
router.post('/resetPassword1', resetPassword1);



module.exports = router;