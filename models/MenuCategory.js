const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  Price: { type: Number, required: true },
  description: String,
  imageUrl: String,
  isSpecial: { type: Boolean, default: false }
}, {
  timestamps: true // ✅ Automatically adds createdAt and updatedAt
});

const menuCategorySchema = new mongoose.Schema({
  category: { type: String, required: true },
  imageUrl: { type: String, default: "" }, // ✅ Category image
  items: { type: [menuItemSchema], default: [] }
}
  , {
    timestamps: true // ✅ Automatically adds createdAt and updatedAt
  });

module.exports = mongoose.model("MenuItem", menuCategorySchema);
