// backend/models/Payment.js
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
  utr:  { type: String, required: true },
  status: { type: String, enum: ["pending","approved","rejected"], default: "pending" },
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Payment", paymentSchema);
