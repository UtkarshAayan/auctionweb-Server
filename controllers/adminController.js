const Product = require('../models/sellerProductFormModel');
const User = require('../models/userModel'); // Assuming you have a User model to get user details
const Sequence = require('../models/lotSequenceModel');
const nodemailer = require('nodemailer');
const EmailTemplate = require('../models/emailTemplateModel');

// Nodemailer configuration
const proTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Function to send product verification email
const productVerificationEmail = async (userEmail, userName, lotNumber) => {
    try {
        // Fetch the Product Verification email template from the database
        const template = await EmailTemplate.findOne({ title: 'Product Verification' });

        if (!template) {
            console.error('Error: Email template not found');
            return;
        }

        // Replace placeholders in the template with actual values
        const emailBody = template.body
            .replace('{{name}}', userName)
            .replace('{{lotNumber}}', lotNumber);
        // Configure the email details
        const mailDetails = {
            from: process.env.SMTP_USER,
            to: userEmail,
            subject: template.subject,
            html: emailBody
        };

        // Send the email
        const info = await proTransporter.sendMail(mailDetails);

    } catch (error) {
        console.error('Error sending email:', error);
    }
};



// Function to get and increment the sequence number
const getNextSequence = async (name) => {
    const sequence = await Sequence.findOneAndUpdate(
        { name },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
    );
    return sequence.value;
};

// Function to generate lot number
const generateLotNumber = async () => {
    const year = new Date().getFullYear().toString().slice(-2); // Get last two digits of the year
    const sequenceNumber = await getNextSequence('productLotNumber');
    const paddedSequence = sequenceNumber.toString().padStart(5, '0'); // Pad sequence number with leading zeros
    return `Lot-${year}${paddedSequence}`;
};

// Verify product by admin and generate lot number
const verifyProductByAdmin = async (req, res, next) => {
    try {
        const productId = req.params.id;

        if (!productId) {
            return res.status(400).json({ error: 'Product ID is required' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        product.proVerifyByAdmin = true;
        product.lotNumber = await generateLotNumber(); // Generate the lot number
        await product.save();

        const user = await User.findById(product.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await productVerificationEmail(user.email, user.name, product.lotNumber); // Include user's name and lot number in the email

        res.json({ message: 'Product verified successfully', lotNumber: product.lotNumber });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};




//user Verification
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,  // Ensure these are set in your environment variables
        pass: process.env.SMTP_PASS
    }
});

const sendVerificationEmail = async (userEmail, userName) => {
    try {
        // Fetch the account verification email template from the database
        const template = await EmailTemplate.findOne({ title: 'Account Verification' });

        if (!template) {
            console.error('Error: Email template not found');
            return;
        }

        // Replace placeholders in the template with actual values
        const emailBody = template.body
            .replace('{{name}}', userName);

        // Configure the email details
        const mailDetails = {
            from: process.env.SMTP_USER,
            to: userEmail,
            subject: template.subject,
            html: emailBody
        };

        // Send the email
        const info = await transporter.sendMail(mailDetails);
        console.log('Email sent:', info.response);

    } catch (error) {
        console.error('Error sending email:', error);
    }
};


const verifyUserByAdmin = async (req, res) => {
    try {
        const userId = req.params.id;

        // Find and update the user to mark as verified
        const user = await User.findByIdAndUpdate(userId, { verifiedByAdmin: true }, { new: true });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Send verification email using the dynamic template
        await sendVerificationEmail(user.email, user.name); // Pass the user's name

        res.json({ message: 'User verified successfully' });
    } catch (error) {
        console.error('Error verifying user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



module.exports = { verifyProductByAdmin,verifyUserByAdmin };
