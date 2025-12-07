const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, 'User is required'],
    index: true
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: [true, 'Book is required'],
    index: true
  },
  utr: {
    type: String,
    required: [true, 'UTR is required'],
    trim: true,
    minlength: [8, 'UTR must be at least 8 characters'],
    maxlength: [50, 'UTR cannot exceed 50 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative'],
    max: [10000, 'Amount cannot exceed ₹10,000']
  },
  status: {
    type: String,
    enum: {
      values: ["pending", "approved", "rejected"],
      message: 'Status must be one of: pending, approved, rejected'
    },
    default: "pending",
    index: true
  },
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  approvedAt: {
    type: Date,
    index: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  rejectedAt: {
    type: Date,
    index: true
  },
  rejectionReason: {
    type: String,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  qrCode: {
    type: String,
    default: ''
  },
  upiId: {
    type: String,
    default: ''
  },
  payeeName: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
paymentSchema.index({ user: 1, book: 1 });
paymentSchema.index({ status: 1, submittedAt: -1 });
paymentSchema.index({ utr: 1 }, { unique: true }); // Not sparse since UTR is required
paymentSchema.index({ rejectedAt: 1 });
paymentSchema.index({ approvedAt: 1 });

// Virtual for payment ID
paymentSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Virtual for payment duration
paymentSchema.virtual('duration').get(function () {
  if (this.approvedAt) {
    return this.approvedAt - this.submittedAt;
  }
  return Date.now() - this.submittedAt;
});

module.exports = mongoose.model("Payment", paymentSchema);
