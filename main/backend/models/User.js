const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: String,
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password required only for non-Google users
    }
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ googleId: 1 });

module.exports = mongoose.model('User', userSchema);
