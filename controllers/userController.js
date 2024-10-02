const User = require('../models/userModel');
const Role = require('../models/roleModel');
const createError = require('../middleware/error')
const createSuccess = require('../middleware/success')
const nodemailer = require('nodemailer');
const Product = require('../models/sellerProductFormModel')
//to Create user 
const register = async (req, res, next) => {
    try {
        const role = await Role.find({ role: 'User' });
        const newUser = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            contactNumber: req.body.contactNumber,
            username: req.body.username,
            roles: role
        })
        await newUser.save();
        //return res.status(200).json("User Registered Successfully")
        return next(createSuccess(200, "User Registered Successfully"))
    }
    catch (error) {
        //return res.status(500).send("Something went wrong")
        return next(createError(500, "Something went wrong"))
    }
}
//get users
const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find();
        return next(createSuccess(200, "All Users", users));

    } catch (error) {
        return next(createError(500, "Internal Server Error!"))
    }
}
//get user
const getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return next(createError(404, "User Not Found"));
        }
        return next(createSuccess(200, "Single User", user));
    } catch (error) {
        return next(createError(500, "Internal Server Error1"))
    }
}

//update user
const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndUpdate(id, req.body);
        if (!user) {
            return next(createError(404, "User Not Found"));
        }
        return next(createSuccess(200, "User Details Updated", user));
    } catch (error) {
        return next(createError(500, "Internal Server Error1"))
    }
}


//delete user
const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return next(createError(404, "User Not Found"));
        }
        return next(createSuccess(200, "User Deleted", user));
    } catch (error) {
        return next(createError(500, "Internal Server Error1"))
    }
}

//user verification Start


// Create a transporter object using the default SMTP transport

//user Verification End



//product Verification start
const proTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: "ut.gupta29@gmail.com",
        pass: "yver vjuu fvbb hcot"
    }
});


const productVerificationEmail = async (userEmail) => {
    try {
        // Send mail with defined transport object
        const info = await proTransporter.sendMail({
            from: "ut.gupta29@gmail.com",
            to: userEmail,
            subject: 'Product Verified',
            text: 'Your Product has been verified successfully.'
        });
        console.log('Email sent: ', info.response);
    } catch (error) {
        console.error('Error sending email: ', error);
    }
}



const verifyProductByAdmin = async (req, res) => {
    try {
        const productId = req.params.id;
            
        const product = await Product.findByIdAndUpdate(productId, { proVerifyByAdmin: true }, { new: true });
        console.log(product)
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const userId = product.userId
        console.log(userId)
        const user = await User.findById(userId);
 
        console.log(user)
        await productVerificationEmail(user.email);
        res.json({ message: 'Product verified successfully' });
    } catch (error) {
        console.error('Error verifying Product: ', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

//product Verification end

//address
const addUserAddress = async (req, res, next) => {
    try {
      const userId = req.params.userId;
      const newAddress = {
        fullName: req.body.fullName,
        street: req.body.street,
        city: req.body.city,
        state: req.body.state,
        zip: req.body.zip,
        country:req.body.country
      };
  
      const user = await User.findByIdAndUpdate(
        userId,
        { $push: { addresses: newAddress } },
        { new: true, runValidators: true }
      );
  
      if (!user) {
        return next(createError(404, "User not found"));
      }
  
      return next(createSuccess(200, "Address added successfully", user));
    } catch (error) {
      return next(createError(500, "Something went wrong"));
    }
  };

  //update address

  const updateUserAddress = async (req, res, next) => {
    try {
      const userId = req.params.userId;
      const addressId = req.params.addressId;
      const updatedAddress = {
        fullName: req.body.fullName,
        street: req.body.street,
        city: req.body.city,
        state: req.body.state,
        zip: req.body.zip,
        country: req.body.country
      };
  
      const user = await User.findOneAndUpdate(
        { _id: userId, "addresses._id": addressId },
        { $set: { "addresses.$": updatedAddress } },
        { new: true, runValidators: true }
      );
  
      if (!user) {
        return next(createError(404, "User or address not found"));
      }
  
      return next(createSuccess(200, "Address updated successfully", user));
    } catch (error) {
      return next(createError(500, "Something went wrong"));
    }
  };
  
  //delete address

  const deleteUserAddress = async (req, res, next) => {
    try {
      const userId = req.params.userId;
      const addressId = req.params.addressId;
  
      const user = await User.findByIdAndUpdate(
        userId,
        { $pull: { addresses: { _id: addressId } } },
        { new: true }
      );
  
      if (!user) {
        return next(createError(404, "User or address not found"));
      }
  
      return next(createSuccess(200, "Address deleted successfully", user));
    } catch (error) {
      return next(createError(500, "Something went wrong"));
    }
  };
  
  const getuserAddress = async (req, res, next) => {
    try {
      const user = await User.findById(req.params.userId);
      if (!user) {
     
        return next(createSuccess(404, "User not found")); 
      }
      return next(createSuccess(200, "All Addresses ", user.addresses)); 
    } catch (error) {
      return next(createError(500, "Something went wrong"));
    }
  };
  
  const getUserAddByAddressId = async (req, res, next) => {
    try {
      const user = await User.findById(req.params.userId);
      if (!user) {
        return next(createSuccess(404, "User not found")); 
      }
  
      const address = user.addresses.id(req.params.addressId);
      if (!address) {
        return next(createError(404, "Address not found"));
      }
      return next(createSuccess(200, "Addresses ",address)); 
    } catch (error) {
      return next(createError(500, "Something went wrong"));
    }
  };



module.exports = {
    getAllUsers, getUser, deleteUser, updateUser, register,verifyProductByAdmin,addUserAddress,updateUserAddress,deleteUserAddress,getuserAddress,getUserAddByAddressId
}