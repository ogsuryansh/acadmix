const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  title:           { type: String, required: true },
  category:        { type: String, required: true },
  image:           { type: String, required: true },
  originalPrice:   { type: Number, required: true },
  discountedPrice: { type: Number, required: true },
  badge:           { type: String },
  demo:            { type: String },
}, {
  timestamps: true
});

module.exports = mongoose.model('Card', cardSchema);
