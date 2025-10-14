const mongoose = require("mongoose");

const billSchema = new mongoose.Schema(
  {
    // Linked dine-in or takeaway orders
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],

    // 🟢 Table is required only for Dine-In orders
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: function () {
        return this.orderType === "Dine-In";
      },
    },

    // 🟢 Add this for Takeaway bills
    orderType: {
      type: String,
      enum: ["Dine-In", "Takeaway"],
      default: "Dine-In",
    },

    customerName: {
      type: String,
      trim: true,
      default: "",
    },

    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },

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
      default: "Unpaid",
    },

    paymentMethod: {
      type: String,
      enum: ["online", "cash", "split"],
      default: "cash",
    },

    paymentAmounts: {
      cash: { type: Number, default: 0 },
      online: { type: Number, default: 0 },
    },

    // Optional for quick reference / legacy tracking
    tableNumber: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// 🧮 Auto-calculate finalAmount if not manually set
billSchema.pre("save", function (next) {
  if (!this.finalAmount || this.finalAmount === 0) {
    this.finalAmount = this.totalAmount - (this.discountValue || 0);
  }
  next();
});

module.exports = mongoose.model("Bill", billSchema);
