const mongoose = require('mongoose');

const SECTIONS = ['home', 'class11', 'class12', 'test'];
const TRACKS = ['NEET', 'JEE'];

const bookSchema = new mongoose.Schema({
  title:           { type: String, required: true },
  imageUrl:        { type: String, required: true },
  category:        { type: String, required: true },
  section: {
    type: String,
    enum: SECTIONS,
    required: true,
    default: 'home'
  },
  track: {
    type: String,
    enum: TRACKS,
    required: true,
    default: 'NEET'
  },
  pageCount:       { type: Number, min: 1 },
  priceOriginal:   { type: Number, required: true },
  priceDiscounted: { type: Number, required: true },
  badge:           { type: String },
  demo: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'No'
  },

  // ✅ Add this field to store path of uploaded PDF
  pdfPath: {
    type: String,
    required: false  // Optional in case some books don't have PDFs
  }

}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);
