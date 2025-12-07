const mongoose = require('mongoose');

const SECTIONS = ['home', 'class11', 'class12', 'test'];
const TRACKS = ['NEET', 'JEE'];

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [2, 'Title must be at least 2 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [5, 'Description must be at least 5 characters'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  image: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: TRACKS,
      message: 'Category must be one of: ' + TRACKS.join(', ')
    }
  },
  section: {
    type: String,
    enum: {
      values: SECTIONS,
      message: 'Section must be one of: ' + SECTIONS.join(', ')
    },
    required: true,
    default: 'home'
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    max: [10000, 'Price cannot exceed ₹10,000']
  },
  priceDiscounted: {
    type: Number,
    min: [0, 'Discounted price cannot be negative'],
    max: [10000, 'Discounted price cannot exceed ₹10,000'],
    validate: {
      validator: function (value) {
        return !value || value <= this.price;
      },
      message: 'Discounted price cannot be higher than regular price'
    }
  },
  pages: {
    type: Number,
    min: [1, 'Pages must be at least 1'],
    max: [10000, 'Pages cannot exceed 10,000']
  },
  pdfUrl: {
    type: String,
    default: ''
  },
  badge: {
    type: String,
    default: '',
    maxlength: [20, 'Badge cannot exceed 20 characters']
  },
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
    default: 0,
    min: [0, 'Share count cannot be negative']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
bookSchema.index({ category: 1 });
bookSchema.index({ section: 1 });
bookSchema.index({ isFree: 1 });
bookSchema.index({ createdAt: -1 });
bookSchema.index({ price: 1 });

// Virtual for book ID
bookSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Virtual for effective price (discounted or regular)
bookSchema.virtual('effectivePrice').get(function () {
  return this.priceDiscounted && this.priceDiscounted > 0 ? this.priceDiscounted : this.price;
});

// Virtual for discount percentage
bookSchema.virtual('discountPercentage').get(function () {
  if (this.priceDiscounted && this.priceDiscounted > 0 && this.priceDiscounted < this.price) {
    return Math.round(((this.price - this.priceDiscounted) / this.price) * 100);
  }
  return 0;
});

module.exports = mongoose.model('Book', bookSchema);
