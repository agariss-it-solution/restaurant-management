const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  Price: { type: Number, required: true },
  description: String,
  // imageUrl: String,
  isSpecial: { type: Boolean, default: false }
}, {
  timestamps: true 
});

const menuCategorySchema = new mongoose.Schema({
  category: { type: String, required: true },
  imageUrl: { type: String, default: "" }, 
  items: { type: [menuItemSchema], default: [] }
}
  , {
    timestamps: true 
  });

module.exports = mongoose.model("MenuItem", menuCategorySchema);
