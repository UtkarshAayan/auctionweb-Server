const express = require("express");
const User = require('../models/userModel');
const { getAllUsers, getUser,deleteUser,updateUser,register,verifyProductByAdmin,addUserAddress,getuserAddress,updateUserAddress,deleteUserAddress,getUserAddByAddressId } = require('../controllers/userController')

const router = express.Router();
router.get('/',  getAllUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.post('/register', register);
router.put('/proVerify/:id', verifyProductByAdmin);

//address

router.post('/:userId/address', addUserAddress);
router.put('/:userId/address/:addressId', updateUserAddress);
router.delete('/:userId/address/:addressId', deleteUserAddress);
router.get('/:userId/addresses', getuserAddress);
router.get('/:userId/address/:addressId', getUserAddByAddressId);
module.exports = router;