const mongoose = require('mongoose')

const billSchema = new mongoose.Schema({
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }], // ✅ array of orders
    table: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["Unpaid", "Paid"], default: "Unpaid" },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Bill", billSchema);
