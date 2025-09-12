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
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
            