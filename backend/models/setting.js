const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    restaurantName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    address: { type: String, required: true },
    email: { type: String },
    thankYouMessage: { type: String },
    qr: { type: String },
    logo: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
