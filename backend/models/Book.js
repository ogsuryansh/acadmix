const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  imageUrl: String,
  category: String,
  page: String, // e.g. 'home', 'class10', 'neet'
  priceOriginal: Number,
  priceDiscounted: Number,
  badge: String,  // like "90% OFF"
  demo: String,   // e.g., "No Demo"
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);
