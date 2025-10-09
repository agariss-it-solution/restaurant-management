const mongoose = require('mongoose')

const billSchema = new mongoose.Schema({
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    table: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
    totalAmount: {
        type: Number,
        required: true,
        default: 0,
    },
    status: { type: String, enum: ["Unpaid", "Paid", "Canceled"], default: "Unpaid" },
    paymentMethod: {
        type: String,
        enum: ["online", "cash"],
        default: "cash"
    },
    tableNumber: {
        type: Number, // Save the table number here as a backup
    },
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

module.exports = mongoose.model("Bill", billSchema);
