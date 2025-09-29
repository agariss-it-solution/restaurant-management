const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true, // prevent duplicate emails
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true, // usually required unless you have OAuth users
    },
    role: {
        type: String,
        enum: ['waiter', 'admin', 'chef'],
        default: 'waiter'
    },
    resetPasswordToken: String,  // Store the reset token here
    resetPasswordExpires: Date,  // Store the expiration date for the reset token
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
