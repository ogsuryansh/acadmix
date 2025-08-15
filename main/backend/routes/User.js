const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true
  },
  photo: {
    type: String,
    default: ''
  }
}, {
  timestamps: true  // ⏱ adds createdAt and updatedAt
});

module.exports = mongoose.model('User', userSchema);

