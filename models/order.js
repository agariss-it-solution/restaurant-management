const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema({
    table: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
    items: [
        {
            menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuCategory", required: true },
            quantity: { type: Number, default: 1 },
            foodType: { type: String, enum: ["Regular", "Jain"], default: "Regular" },
            specialInstructions: { type: String, default: "" }
        }
    ],
    status: {
        type: String,
        enum: ["Pending", "Preparing", "Ready", "Completed"],
        default: "Pending"
    },
    Price: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model("Order", orderSchema);
