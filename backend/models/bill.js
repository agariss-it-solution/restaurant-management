const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    table: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },

    totalAmount: {
        type: Number,
        required: true,
        default: 0,
    },

    // 👇 ADD THESE FIELDS
    discountValue: {
        type: Number,
        default: 0, // Flat discount in ₹
    },
    finalAmount: {
        type: Number,
        default: 0, // Total after discount
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

    tableNumber: {
        type: Number, // Backup of table number
    },

    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// 👇 Auto-calculate finalAmount if not manually set
billSchema.pre("save", function (next) {
    if (!this.finalAmount || this.finalAmount === 0) {
        this.finalAmount = this.totalAmount - (this.discountValue || 0);
    }
    next();
});

module.exports = mongoose.model("Bill", billSchema);
