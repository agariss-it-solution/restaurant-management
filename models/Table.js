const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema({
  number: { type: Number, unique: true },
  status: {
    type: String,
    enum: ["Available", "Occupied"],
    default: "Available",
  },
});

// ✅ Auto-assign "number" (reuse deleted slots)
tableSchema.pre("save", async function (next) {
  if (this.isNew) {
    const Table = mongoose.model("Table");

    // Get all table numbers sorted
    const tables = await Table.find().sort({ number: 1 });

    let expected = 1;
    for (let i = 0; i < tables.length; i++) {
      if (tables[i].number !== expected) {
        this.number = expected; // found a gap → assign this
        return next();
      }
      expected++;
    }

    // If no gaps, assign next available number
    this.number = expected;
  }
  next();
});

module.exports = mongoose.model("Table", tableSchema);
