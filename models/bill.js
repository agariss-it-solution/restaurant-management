const mongoose = require('mongoose')

const billSchema = new mongoose.Schema({
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    table: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
    totalAmount: {
        type: Number,
        required: true,
        default: 0,
    },
    status: { type: String, enum: ["Unpaid", "Paid"], default: "Unpaid" },
    paymentMethod: { 
        type: String, 
        enum: ["online", "cash"], // Add all payment methods you support
        default: "cash" // or default to null if not paid yet
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Bill", billSchema);
