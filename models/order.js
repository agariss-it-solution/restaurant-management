const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MenuItem",
    required: true,
  },
  name: { type: String, required: true },
  Price: { type: Number, required: true, min: 0 },
  quantity: {
    type: Number,
    default: 1,
    min: 1,
  },
  foodType: {
    type: String,
    enum: ["Regular", "Jain"],
    default: "Regular",
  },
  specialInstructions: {
    type: String,
    default: "",
  },
});

const orderSchema = new mongoose.Schema(
  {
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: true,
    },
    items: {
      type: [orderItemSchema],
      validate: [v => v.length > 0, "Order must have at least one item"],
    },
    status: {
      type: String,
      enum: ["Pending", "Preparing", "Ready", "Completed"],
      default: "Pending",
    },
    Price: {
      type: Number,
      required: true,
      min: 0,
    },
    bill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bill",
    },
  },
  {
    timestamps: true, // ✅ Automatically adds createdAt and updatedAt
  }
);

module.exports = mongoose.model("Order", orderSchema);
