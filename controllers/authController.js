const User = require('../models/userModel');
const Role = require('../models/roleModel');
const UserToken = require('../models/userTokenModel')
const createError = require('../middleware/error')
const createSuccess = require('../middleware/success')
const jwt = require('jsonwebtoken')
const nodemailer= require('nodemailer')
const config = require('../config');
const EmailTemplate = require('../models/emailTemplateModel');
//signup
const signup = async (req, res, next) => {
  try {
    const role = await Role.find({ role: 'User' });
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      contactNumber: req.body.contactNumber,
      username: req.body.username,
      verifiedByAdmin: false,
      roles: role
    })
    await newUser.save();
   // return res.status(200).json("User Registered Successfully")
   return next(createSuccess(200, "User Registered Successfully"))
  }
  catch (error) {
    //return res.status(500).send("Something went wrong")
    return next(createError(500, "Something went wrong"))
  }
}
//to login

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).populate("roles", "role");

    // Check if user exists
    if (!user) {
      return next(createError(404, "User Not Found"));
    }

    // Check if password matches (insecure method, do not use in production)
    if (user.password !== password) {
      return next(createError(404, "Password is Incorrect"));
    }

    // Generate JWT token
    const { _id, isAdmin, roles } = user;
    const token = jwt.sign(
      { id: _id, isAdmin, roles },
      config.secret,
      { expiresIn: '1h' }
    );

    // Set cookies and send response
    res.cookie("access_token", token, { httpOnly: true });
    res.status(200).json({
      userId: _id,
      token,
      status: 200,
      message: "Login Success",
      data: user
    });
  } catch (error) {
    return next(createError(500, "Something went wrong"));
  }
};


//Register Admin

const registerAdmin = async (req, res, next) => {
  try {
    const role = await Role.find({});
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      contactNumber: req.body.contactNumber,
      username: req.body.username,
      isAdmin: true,
      isSeller: false,
      isBuyer: false,
      roles: role,
      addresses: [] // Initializing addresses as empty array
    });
    await newUser.save();
    return next(createSuccess(200, "Admin Registered Successfully"));
  } catch (error) {
    return next(createError(500, "Something went wrong"));
  }
};

const registerSeller = async (req, res, next) => {
  try {
    const role = await Role.find({ role: "Seller" });
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      contactNumber: req.body.contactNumber,
      username: req.body.username,
      isAdmin: false,
      isSeller: true,
      isBuyer: false,
      verifiedByAdmin: false,
      roles: role,
      addresses: [] // Initializing addresses as empty array
    });
    await newUser.save();
    return next(createSuccess(200, "Seller Registered Successfully"));
  } catch (error) {
    return next(createError(500, "Something went wrong"));
  }
};

const registerBuyer = async (req, res, next) => {
  try {
    const role = await Role.find({ role: "Buyer" });
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      contactNumber: req.body.contactNumber,
      username: req.body.username,
      isAdmin: false,
      isSeller: false,
      isBuyer: true,
      verifiedByAdmin: false,
      roles: role,
      addresses: [] // Initializing addresses as empty array
    });
    await newUser.save();
    return next(createSuccess(200, "Buyer Registered Successfully"));
  } catch (error) {
    return next(createError(500, "Something went wrong"));
  }
};

//sendresetmail

// const sendEmail = async (req, res, next) => {
//   const email = req.body.email;
//   const user = await User.findOne({ email: { $regex: '^' + email + '$', $options: 'i' } });
// if(!user){
//   return next(createError(404, "User Not found"))
// }
//  const payload={
//   email:user.email
//  }
//  const expiryTime = 900;
//  const token = jwt.sign(payload,process.env.JWT_SECRET,{expiresIn:expiryTime});
//  const newToken = new UserToken({
//   userId: user._id,
//   token: token
//  });
//  const mailTransporter = nodemailer.createTransport({
//   service:"gmail",
//   auth:{
//     user:"ut.gupta29@gmail.com",
//     pass:"yver vjuu fvbb hcot"
//    }
//  });
//  //const resetLink = `http://88.222.212.120/reset/${token}`;
//  let mailDetails={
//   from: "ut.gupta29@gmail.com",
//   subject: "Reset Password !",
//   to: email,
// //  text: `Click the following link to reset your password: ${resetLink}`,
//   html: `<html>
//   <head>
//       <title>Password Reset Request</title>
//   </head>
//   <body>
//       <h1>Password Reset Request</h1>
//       <p>Dear ${user.name},</p>
//       <p>We have received a request to reset your password for your account with Auction Bidding Application. To complete the password reset process, please click on the button below:</p>
//       <a href=${process.env.LIVE_URL}/reset-password/${token}><button style="background-color: #4CAF50; color: white; padding: 14px 20px; border: none;
//       cursor: pointer; border-radius: 4px;">Reset Password</button></a>
//       <p>Please note that this link is only valid for a <b>15 minutes</b>.
//       If you did not request a password reset, please ignore this message.</p>
//       <p>Thank you,</p>
//       <p>Auction Bidding</p>
//   </body>
//   </html>`,
//  };
//  mailTransporter.sendMail(mailDetails,async(err,data)=>{
//   if(err){
//     console.log(err);
//     return next(createError(500, "Something went wrong"))
//   }
//   else{
//   console.log("Email sent successfully !!!");
//   await newToken.save();
//   return next(createSuccess(200, "Email Sent Successfully"))
//   }
//  });
// }


const sendEmail = async (req, res, next) => {
  const email = req.body.email;
  const user = await User.findOne({ email: { $regex: '^' + email + '$', $options: 'i' } });
  if (!user) {
    return next(createError(404, "User Not found"));
  }

  const payload = { email: user.email };
  const expiryTime = 900;
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: expiryTime });
  const newToken = new UserToken({ userId: user._id, token: token });

  // Fetch the email template from the database
  const template = await EmailTemplate.findOne({ title: 'Password Reset Request' });

  if (!template) {
    return next(createError(404, "Email template not found"));
  }

  const mailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "ut.gupta29@gmail.com",
      pass: "yver vjuu fvbb hcot"
    }
  });

  let mailDetails = {
    from: "ut.gupta29@gmail.com",
    subject: template.subject,
    to: email,
    html: template.body.replace('{{name}}', user.name).replace('{{resetLink}}', `${process.env.LIVE_URL}/reset-password/${token}`)
  };

  mailTransporter.sendMail(mailDetails, async (err, data) => {
    if (err) {
      console.log(err);
      return next(createError(500, "Something went wrong"));
    } else {
      console.log("Email sent successfully !!!");
      await newToken.save();
      return next(createSuccess(200, "Email Sent Successfully"));
    }
  });
};


// Reset Password
 const resetPassword = (req, res, next) => {
  const token = req.body.token;
  const newPassword = req.body.password;

  jwt.verify(token, process.env.JWT_SECRET, async (err, data) => {
      if (err)
      {
          return next(CreateError(500, "Password Reset Link is Expired!"));
      }
      else
      {
          const response = data;
          const user = await User.findOne({ email: { $regex: '^' + response.email + '$', $options: 'i'}});
          user.password = newPassword;
          try
          {
              const updatedUser = await User.findOneAndUpdate(
              { _id: user._id },
              { $set: user },
              { new: true });
              return next(createSuccess(200, "Password Reset Success!"));
          }
          catch (error)
          {
              return next(createError(500, "Something went wrong while resetting the password!"))
          }
      }
  });
}

//forget password for flutter OTP based

//sendresetmail
// const sendEmail1 = async (req, res, next) => {
//   const email = req.body.email;
//   try {
//     const user = await User.findOne({ email: { $regex: '^' + email + '$', $options: 'i' } });

//     if (!user) {
//       return next(createError(404, "User Not found"))
//     }

//     const otp = Math.floor(1000 + Math.random() * 9000).toString();
//     user.otp = otp;
//     user.otpExpiration = Date.now() + 15 * 60 * 1000;
//     await user.save();

//     const ResetPasswordLink = `http://88.222.212.120:3000/reset-password?token=${otp}`;

//     const mailTransporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASS
//       }
//     });

//     const mailDetails = {
//       from: process.env.SMTP_USER,
//       to: email,
//       subject: "Password Reset OTP",
//       html: `<p>Your OTP for password reset is: <strong>${otp}</strong></p><p>This OTP is valid for 15 minutes.</p>
//       <p><a href="${ResetPasswordLink}" style="padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">Reset Password</a></p>`
//     };

//     await mailTransporter.sendMail(mailDetails);
//     res.status(200).json({ message: "OTP sent to your email" });
//   }
//   catch (error) {
//     console.error("Error sending OTP email:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }

// };

const sendEmail1 = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find user by email (case-insensitive)
    const user = await User.findOne({ email: { $regex: `^${email}$`, $options: 'i' } });
    if (!user) {
      return next(createError(404, "User not found"));
    }

    // Generate OTP and set expiration time
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    user.otp = otp;
    user.otpExpiration = Date.now() + 15 * 60 * 1000; // 15 minutes expiration
    await user.save();

    // Fetch the OTP email template from the database
    const template = await EmailTemplate.findOne({ title: 'Password Reset OTP' });
    if (!template) {
      return next(createError(404, "Email template not found"));
    }

    // Replace placeholders in the template with actual values
    const resetLink = `${process.env.LIVE_URL}/reset-password?token=${otp}`;
    const emailBody = template.body
      .replace('{{name}}', user.name) // If your template includes a {{name}} placeholder
      .replace('{{otp}}', otp)
      .replace('{{resetLink}}', resetLink);

    // Configure email transporter
    const mailTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Set up email details
    const mailDetails = {
      from: process.env.SMTP_USER,
      to: email,
      subject: template.subject,
      html: emailBody
    };

    // Send the email
    await mailTransporter.sendMail(mailDetails);

    // Respond with success
    res.status(200).json({ message: "OTP sent to your email" });

  } catch (error) {
    console.error("Error sending OTP email:", error);
    return next(createError(500, "Internal Server Error"));
  }
};



// verify otp
const verifyOTP1 = async (req, res, next) => {
  const { otp } = req.body;
  try {
    const user = await User.findOne({ otp, otpExpiration: { $gt: Date.now() } });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.otp = undefined;
    user.otpExpiration = undefined;
    await user.save();

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
    res.status(200).json({ message: "OTP verified successfully", token });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Reset Password
const resetPassword1 = async (req, res, next) => {
  const { token, newPassword } = req.body;

  try {
    // Decode the token to get the user's email
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userEmail = decodedToken.email;

    // Find the user by their email
    const user = await User.findOne({ email: userEmail });

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user's password with the new password directly (without hashing)
    user.password = newPassword;

    // Save the updated user object
    await user.save();

    // Respond with success message
    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



module.exports = {
  login, registerAdmin,sendEmail,resetPassword,signup,registerSeller,registerBuyer,sendEmail1,verifyOTP1,resetPassword1
}