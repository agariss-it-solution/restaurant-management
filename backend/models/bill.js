const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    table: { type: mongoose.Schema.Types.ObjectId, ref: "Table" },

    orderType: {
        type: String,
        enum: ["Dine-in", "Takeaway"],
        default: "Dine-in",
    },
    customerName: {
        type: String
    },
    totalAmount: {
        type: Number,
        required: true,
        default: 0,
    },

    discountValue: {
        type: Number,
        default: 0,
    },

    finalAmount: {
        type: Number,
        default: 0,
    },

    status: {
        type: String,
        enum: ["Unpaid", "Paid", "Canceled"],
        default: "Unpaid"
    },

    paymentMethod: {
        type: String,
        enum: ["online", "cash", "split"],
        default: "cash"
    },

    paymentAmounts: {
        cash: { type: Number, default: 0 },
        online: { type: Number, default: 0 },
    },

    tableNumber: { type: Number },

    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

billSchema.pre("save", function (next) {
    const discount = this.discountValue || 0;
    this.finalAmount = Math.max(0, this.totalAmount - discount);
    next();
});

module.exports = mongoose.model("Bill", billSchema);
