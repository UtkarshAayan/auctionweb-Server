const express = require("express");
const Role = require('../models/roleModel');
const {createDropdown,getAllDropdowns} = require('../controllers/dropDownController')

const router = express.Router();
router.post('/create', createDropdown);
router.get('/getAll', getAllDropdowns);
module.exports = router;