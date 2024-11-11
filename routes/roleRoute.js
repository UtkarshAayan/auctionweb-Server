const express = require("express");
const Role = require('../models/roleModel');
const {createRole,updateRole,getRoles,deleteRole} = require('../controllers/roleController')

const router = express.Router();
router.post('/create', createRole);
router.put('/update/:id', updateRole);
router.get('/getAll', getRoles);
router.delete('/delete/:id', deleteRole);
module.exports = router;