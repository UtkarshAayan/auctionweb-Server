const About = require('../models/aboutusModel');
const createError = require('../middleware/error')
const createSuccess = require('../middleware/success')


  exports.getAbout = async (req, res, next) => {
    try {
      const contents = await About.find();
      return next(createSuccess(200, "All About Us Content", contents));
    } catch (err) {
      return next(createError(500, "Something went wrong"))
    }
  };
  


  