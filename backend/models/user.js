const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true, 
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true, 
    },
    role: {
        type: String,
        enum: ['waiter', 'admin', 'chef'],
        default: 'waiter'
    },
    resetPasswordToken: String, 
    resetPasswordExpires: Date, 
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
