import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    table: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
    items: [
        {
            menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
            quantity: { type: Number, default: 1 }
        }
    ],
    status: {
        type: String,
        enum: ["Pending", "Completed"],
        default: "Pending"
    },
    totalPrice: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Order", orderSchema);
