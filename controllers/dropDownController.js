const Dropdown = require('../models/allDropDownModel');
const Role = require('../models/roleModel');
const createError = require('../middleware/error')
const createSuccess = require('../middleware/success')
//to Create user 
const createDropdown = async (req, res, next) => {
    try {
        const role = await Role.find({ role: 'Admin' });
        // const newDropdown = new Dropdown({
        //     category: req.body.category,
        //     color: req.body.color,
        //     productCondition: req.body.productCondition, //new
        //     roles: role,
        // })
        const { category,color,productCondition,lotNumber } = req.body;
        const dropdown = new Dropdown({ category,color,productCondition,lotNumber });
        // await category.save();
        await dropdown.save();
        // return res.status(200).json("Auction Created Successfully")
        return next(createSuccess(200, "Dropdown Created Successfully"))
    }
    catch (error) {
        //return res.status(500).send("Something went wrong")
        return next(createError(500, "Something went wrong"))
    }
}
//get All Dropdowns
const getAllDropdowns = async (req, res, next) => {
    try {
        const dropdowns = await Dropdown.find();
        return next(createSuccess(200, "All Dropdowns", dropdowns));

    } catch (error) {
        return next(createError(500, "Internal Server Error!"))
    }
}

module.exports = {
    createDropdown,getAllDropdowns
}