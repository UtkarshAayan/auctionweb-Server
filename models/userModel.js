const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const addressSchema = new Schema({
    fullName: { type: String, default: '' },
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zip: { type: String, default: '' },
    country: {type: String, default: ''}
    // Add more fields as needed
  });
const UserSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        contactNumber: {
            type: Number,
            required: false
        },
        username: {
            type: String,
            required: false
        },
        isAdmin: {
            type: Boolean,
            default: false
        },
        isSeller: {
            type:Boolean,
            default: false
        },
        isBuyer:{
            type: Boolean,
            default: false
        },
        verifiedByAdmin:{
            type: Boolean,
            default: false
        },
        notificationsEnabled: { type: Boolean, default: true },
        addresses: { type: [addressSchema], default: [] },
        otp: { type: String },
        otpExpiration: { type: Date }, 
        roles: {
            type: [Schema.Types.ObjectId],
            required: true,
            ref: "Role"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('User', UserSchema);