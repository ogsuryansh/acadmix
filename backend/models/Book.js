const mongoose = require('mongoose');

const SECTIONS = ['home', 'class10', 'neet'];  // extend as needed

const bookSchema = new mongoose.Schema({
  title:           { type: String, required: true },
  imageUrl:        { type: String, required: true },
  category:        { type: String, required: true },
  section:         { 
    type: String,
    enum: SECTIONS,
    required: true,
    default: 'home'
  },
  pageCount:       { type: Number, min: 1 },      // if you ever want actual page counts
  priceOriginal:   { type: Number, required: true },
  priceDiscounted: { type: Number, required: true },
  badge:           { type: String },
  demo: {
  type: String,
  enum: ['Yes', 'No'],
  default: 'No'
}

}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);
