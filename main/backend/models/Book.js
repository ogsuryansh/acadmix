const mongoose = require('mongoose');

const SECTIONS = ['home', 'class11', 'class12', 'test'];
const TRACKS = ['NEET', 'JEE'];

const bookSchema = new mongoose.Schema({
  title:           { type: String, required: true },
  description:     { type: String, required: true },
  image:           { type: String },
  category:        { type: String, required: true },
  section: {
    type: String,
    enum: SECTIONS,
    required: true,
    default: 'home'
  },
  price:           { type: Number, required: true },
  priceDiscounted: { type: Number },
  pages:           { type: Number },
  pdfUrl:          { type: String },
  badge:           { type: String },
  demo: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'No'
  },
  isFree: {
    type: Boolean,
    default: false
  },
  shareCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);
