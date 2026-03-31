// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    balance: { type: Number, default: 0 }
});

module.exports = mongoose.model("User", userSchema);