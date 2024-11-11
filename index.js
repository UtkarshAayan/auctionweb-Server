require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cron = require('node-cron');
require('./middleware/auctionJob'); // Start the job

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


//routes
app.use('/categories', categoryRoutes);
app.use('/role', roleRoute)
app.use('/auth', authRoute)
app.use('/user', userRoute)
app.use('/item', itemInventoryRoute)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/product', sellerProductRoute)
app.use('/bids',bidRoute );
app.use('/admin', adminRoutes);
app.use('/dropdown', dropdownRoute)
app.use('/buyer',buyerRoute)
app.use('/wishlist', wishlistRoutes);
app.use('/orders', orderRoutes);
app.use('/adminSettings', adminSettingsRoutes);
app.use('/help', helpRoutes);
app.use('/', howToSellRoutes);
app.use('/', howToBuyRoutes);
app.use('/request', requestRoute);
app.use('/', emailTemplateRoutes);
app.use('/terms', termsRoute);
app.use('/privacy', privacyRoute);
app.use('/country', countryRoute);
app.use('/', inAppNotificationRoute);
app.use('/payments', paymentRoutes);
app.use('/banner', bannerRoutes);
app.use('/about', aboutRoute);
app.use('/', transactionRoutes);
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
