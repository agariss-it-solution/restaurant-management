const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema({
    number: { type: Number, unique: true },
    status: {
        type: String,
        enum: ["Available", "Occupied"],
        default: "Available"
    }
});

// Auto-assign "number"
tableSchema.pre("save", async function (next) {
    if (this.isNew) {
        const lastTable = await mongoose.model("Table").findOne().sort({ number: -1 });
        this.number = lastTable ? lastTable.number + 1 : 1; // continue or restart at 1
    }
    next();
});

module.exports = mongoose.model("Table", tableSchema);
