
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
            "FriedItems",
            "GarlicBread",
            "Sandwich",
            "Pasta",
            "Chaap",
            "Starter",
            "Tandoor Starter",
            "Chopsy",
            "Manchurian",
            "Noodles",
            "Rice",
            "Paneer",
            "Bhel",
            "Sada Dosa",
            "Mysore Dosa",
            "Masala Dosa",
            "Fancy Dosa",
            "Pav Bhaji",
            "Pulav",
            "Extra",
            "Punjabi",
            "Chinese",
            "Italian",
            "Mexican",
            "South Indian",
            "Sizzler",
            "Soups  ",
            "Pizza",
            "Vegetable Bar",
            "Paneer Khajana",
            "Cheese Bar",
            "Kaju Bar",
            "Basmati Ka Kamal",
            "Chaap Sabzi",
            "Dal Fry",
            "Roti Bar",
            "Paratha",
            "Special Paratha",
            "Pizza Paratha"
        ],
        required: true
    },
    items: [menuItemSchema] // array of items inside category
});

module.exports = mongoose.model("MenuCategory", menuCategorySchema);
