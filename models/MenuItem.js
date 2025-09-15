
const mongoose = require('mongoose')
const menuItemSchema = new mongoose.Schema({
    name: { type: String, required: true },       // Veg Manchow Soup
    Price: { type: Number, required: true },      // 200
    description: { type: String },                // optional
    imageUrl: { type: String },                   // optional
    isSpecial: { type: Boolean, default: false }  // for highlighting
});

const menuCategorySchema = new mongoose.Schema({
    category: {
        type: String,
        enum: [
            "Punjabi",
            "Chinese",
            "Italian",
            "Mexican",
            "South Indian",
            "Sizzler",
            "Soups & Starters",
            "Pizza",
            "Paratha"
        ],
        required: true
    },
    items: [menuItemSchema] // array of items inside category
});

module.exports = mongoose.model("MenuCategory", menuCategorySchema);
