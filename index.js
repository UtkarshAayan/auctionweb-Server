require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const config = require('./config');
const cron = require('node-cron');
require('./middleware/auctionJob'); // Start the job
// const multer = require('multer')
// const path= require('path')
// const companyLoginRoutes = require('./routes/companyLoginRoutes')
const roleRoute = require('./routes/roleRoute')
const authRoute = require('./routes/authRoute')
const paymentRoutes = require('./routes/paymentRoutes');
const buyerRoute = require('./routes/buyerRoute')
const userRoute = require('./routes/userRoute')
const emailTemplateRoutes = require('./routes/emailTemplateRoutes');
const bidRoute = require('./routes/bidRoute')
const bodyParser = require('body-parser')
const wishlistRoutes = require('./routes/wishlist');
const itemInventoryRoute = require('./routes/itemInventoryRoute')
const sellerProductRoute = require('./routes/sellerProductRoutes')
const adminRoutes = require('./routes/adminRoute');
const dropdownRoute =require('./routes/dropDownRoutes')
const adminSettingsRoutes = require('./routes/adminSettingsRoutes');
const orderRoutes = require('./routes/orderRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const aboutRoute = require('./routes/aboutRoute');
const helpRoutes = require('./routes/helpRoutes');
const howToSellRoutes = require('./routes/howToSellRoute');
const howToBuyRoutes = require('./routes/howToBuyRoute');
const requestRoute = require('./routes/requestRoute');
const termsRoute = require('./routes/termsRoute');
const privacyRoute = require('./routes/privacyRoute');
const countryRoute = require('./routes/countryRoute');
const inAppNotificationRoute = require('./routes/inAppNotificationRoute');
const bannerRoutes = require('./routes/homeBannerImageRoute');
const transactionRoutes = require('./routes/transactionRoutes');

// const errorMiddleware = require('./middleware/errorMiddleware')
const path = require('path');
const fs = require('fs');
const PORT = process.env.PORT || 3000
const MONGO_URL = process.env.MONGO_URL
const FRONTEND = process.env.FRONTEND
const cookieParser = require('cookie-parser')
var cors = require('cors')
var app = express();
var corsOptions = {
    origin: FRONTEND,
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
    Credentials: true
}
app.use(bodyParser.json({ limit: '50mb' })); // To handle large JSON payloads if needed
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
// app.use('/api/login', companyLoginRoutes)


// app.use('/api/products', productRoutes);
// app.use('/api/bids', bidRoutes1);

app.use('/api/categories', categoryRoutes);
//to create roles
app.use('/api/role', roleRoute)
//to register and login
app.use('/api/auth', authRoute)
//to list users
app.use('/api/user', userRoute)
// to add iteminventory
app.use('/api/item', itemInventoryRoute)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
//to use sellerproduct
app.use('/api/product', sellerProductRoute)
//buyer
app.use('/api/bids',bidRoute );
//admin
app.use('/api/admin', adminRoutes);
//to use dropdown
app.use('/api/dropdown', dropdownRoute)
app.use('/api/buyer',buyerRoute)
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/adminSettings', adminSettingsRoutes);
app.use('/api/help', helpRoutes);
app.use('/api', howToSellRoutes);
app.use('/api', howToBuyRoutes);
app.use('/api/request', requestRoute);
app.use('/api', emailTemplateRoutes);
app.use('/api/terms', termsRoute);
app.use('/api/privacy', privacyRoute);
app.use('/api/country', countryRoute);
app.use('/api', inAppNotificationRoute);
app.use('/api/payments', paymentRoutes);
app.use('/api/banner', bannerRoutes);
app.use('/api/about', aboutRoute);
app.use('/api', transactionRoutes);
//app.use('/uploads/uploadDocuments', express.static(path.join(__dirname, 'uploads/uploadDocuments')));
//Response handler Middleware

app.use((obj, req, res, next) => {
    const statusCode = obj.status || 500;
    const message = obj.message || "Something went wrong!";
    return res.status(statusCode).json({
        success: [200, 201, 204].some(a => a === obj.status) ? true : false,
        status: statusCode,
        message: message,
        data: obj.data
    })
})
// app.use(errorMiddleware);

//database connect

mongoose.set("strictQuery", false)
mongoose.
    connect(MONGO_URL)
    .then(() => {
        console.log('connected to MongoDB')
        app.listen(PORT, () => {
            console.log(`Node API app is running on port ${PORT}`)
        });
    }).catch((error) => {
        console.log(error)
    })
