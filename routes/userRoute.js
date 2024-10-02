const express = require("express");
const User = require('../models/userModel');
const { getAllUsers, getUser,deleteUser,updateUser,register,verifyProductByAdmin,addUserAddress,getuserAddress,updateUserAddress,deleteUserAddress,getUserAddByAddressId } = require('../controllers/userController')
const { verifyAdmin, verifyUser } = require('../middleware/verifyToken')
// const company_route = express();
const router = express.Router();
router.get('/', verifyAdmin, getAllUsers);
router.get('/:id', verifyUser, getUser);
router.put('/:id', verifyAdmin, updateUser);
router.delete('/:id', verifyAdmin, deleteUser);
router.post('/register', register);
router.put('/proVerify/:id', verifyProductByAdmin);

//address

router.post('/:userId/address', addUserAddress);
router.put('/:userId/address/:addressId', updateUserAddress);
router.delete('/:userId/address/:addressId', deleteUserAddress);
router.get('/:userId/addresses', getuserAddress);
router.get('/:userId/address/:addressId', getUserAddByAddressId);
module.exports = router;