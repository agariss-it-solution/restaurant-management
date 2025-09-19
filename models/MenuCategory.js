    const mongoose = require("mongoose");

    const menuItemSchema = new mongoose.Schema({
      name: { type: String, required: true },
      Price: { type: Number, required: true },
      description: String,
      imageUrl: String,
      isSpecial: { type: Boolean, default: false }
    });

    const menuCategorySchema = new mongoose.Schema({
      category: { type: String, required: true },
      imageUrl: { type: String, default: "" }, // ✅ Category image
      items: { type: [menuItemSchema], default: [] }
    });

    module.exports = mongoose.model("MenuItem", menuCategorySchema);
