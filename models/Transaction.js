// models/Transaction.js
const mongoose = require("mongoose");

const txSchema = new mongoose.Schema({
    userId: String,
    type: String, // deposit / withdraw
    method: String, // bank / btc
    amount: Number,
    status: { type: String, default: "Pending" },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Transaction", txSchema);