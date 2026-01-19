const express = require("express");
const QRCode = require("qrcode");
const Book = require("../models/Book");
const Payment = require("../models/Payment");
const User = require("../models/User");

// Optional imports with fallback
let Config, logger;
try {
  Config = require("../models/Config");
  logger = require("../utils/logger");
} catch (err) {
  // Fallback if Config or logger not available
  logger = {
    info: (...args) => console.log('[INFO]', ...args),
    warn: (...args) => console.warn('[WARN]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
    debug: (...args) => console.log('[DEBUG]', ...args)
  };
}

const router = express.Router();

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ success: false, error: "Authentication required" });
};

const requireAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ success: false, error: "Admin access required" });
};

// Get payment configuration with fallback
const getPaymentConfig = async () => {
  try {
    if (Config && Config.getPaymentConfig) {
      return await Config.getPaymentConfig();
    }
  } catch (err) {
    logger.warn ? logger.warn('Config model not available, using env vars') : console.warn('Config model not available, using env vars');
  }

  // Fallback to environment variables
  return {
    upiId: process.env.UPI_ID || 'anshgiri@fam',
    payeeName: process.env.PAYEE_NAME || 'Acadmix',
    bankName: process.env.BANK_NAME || 'Paytm'
  };
};

// Generate QR code for payment
const generateQRCode = async (amount, upiId, payeeName) => {
  const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR`;
  return await QRCode.toDataURL(upiLink, {
    errorCorrectionLevel: "H",
    width: 300,
  });
};

// Get payment data for a book
router.get("/payment/:bookId", requireAuth, async (req, res) => {
  try {
    logger.debug("Payment request for bookId", { bookId: req.params.bookId, userId: req.user._id });

    const book = await Book.findById(req.params.bookId);
    if (!book) {
      logger.warn("Book not found", { bookId: req.params.bookId });
      return res.status(404).json({ success: false, error: "Book not found" });
    }

    logger.debug("Book found", { title: book.title });
    const config = await getPaymentConfig();

    // Calculate the amount to charge
    let amount;
    if (book.isFree) {
      amount = 0;
    } else if (book.priceDiscounted && book.priceDiscounted > 0) {
      // Use discounted price if available and greater than 0
      amount = book.priceDiscounted;
    } else if (book.price && book.price > 0) {
      // Fall back to regular price
      amount = book.price;
    } else {
      // If no valid price, set to 0 (free)
      amount = 0;
    }

    logger.debug("Amount calculated", { amount });

    // Generate QR code
    let qrCode = null;
    try {
      qrCode = await generateQRCode(amount, config.upiId, config.payeeName);
      logger.debug("QR code generated successfully");
    } catch (qrError) {
      logger.error("QR code generation failed", { error: qrError.message });
      // Continue without QR code if generation fails
    }

    // Check if user already has a pending payment for this book
    const existingPayment = await Payment.findOne({
      user: req.user._id,
      book: req.params.bookId,
      status: "pending"
    });

    logger.debug("Existing payment", { found: !!existingPayment });

    res.json({
      success: true,
      book,
      qrCode,
      upiId: config.upiId,
      payeeName: config.payeeName,
      amount,
      existingPayment
    });
  } catch (err) {
    logger.error("Payment API error", { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      error: "Failed to generate payment data",
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Submit payment
router.post("/payment/submit", requireAuth, async (req, res) => {
  try {
    logger.info("Payment submission request", { userId: req.user._id, bookId: req.body.bookId });

    const { utr, bookId, amount } = req.body;

    if (!utr || !bookId || !amount) {
      return res.status(400).json({ success: false, error: "UTR number, book ID, and amount are required" });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({
      user: req.user._id,
      book: bookId,
      status: { $in: ["pending", "approved"] }
    });

    if (existingPayment) {
      return res.status(400).json({ success: false, error: "Payment already exists for this book" });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, error: "Book not found" });
    }

    // Validate the payment amount matches the book price
    let expectedAmount;
    if (book.isFree) {
      expectedAmount = 0;
    } else if (book.priceDiscounted && book.priceDiscounted > 0) {
      expectedAmount = book.priceDiscounted;
    } else if (book.price && book.price > 0) {
      expectedAmount = book.price;
    } else {
      expectedAmount = 0;
    }

    if (parseFloat(amount) !== expectedAmount) {
      return res.status(400).json({
        success: false,
        error: `Payment amount mismatch. Expected: ₹${expectedAmount}, Received: ₹${amount}`,
        expectedAmount,
        receivedAmount: amount
      });
    }

    const config = await getPaymentConfig();
    const qrCode = await generateQRCode(amount, config.upiId, config.payeeName);

    // Check if UTR already exists in DB (Primary Duplicate Check)
    const existingUTR = await Payment.findOne({ utr });
    if (existingUTR) {
      logger.warn("Duplicate UTR attempt", { utr, userId: req.user._id });
      return res.status(400).json({
        success: false,
        error: "This UTR number has already been used. Please enter a unique transaction reference number."
      });
    }

    // Auto-Verify via Email (with smart retry)
    let status = "pending";
    let approvedAt = undefined;
    let approvedBy = undefined;
    let notes = undefined;

    try {
      const { verifyPaymentEmail } = require('../utils/emailVerifier');
      const MAX_RETRIES = 3;
      const DELAY_MS = 5000;
      let isVerified = false;

      // Try multiple times to allow for email delivery delays
      for (let i = 0; i < MAX_RETRIES; i++) {
        logger.info(`🔄 Verification attempt ${i + 1}/${MAX_RETRIES} for UTR: ${utr}`);

        isVerified = await verifyPaymentEmail(utr);

        if (isVerified) {
          break; // Found it! Stop waiting.
        }

        if (i < MAX_RETRIES - 1) {
          logger.info(`⏳ Payment email not found yet. Waiting ${DELAY_MS / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        }
      }

      if (isVerified) {
        status = "approved";
        approvedAt = new Date();
        approvedBy = req.user._id; // Approved by system
        notes = "Auto-approved via Email Verification (Slice)";
        logger.info(`✅ Payment ${utr} auto-approved via email!`);
      } else {
        logger.info(`ℹ️ Payment ${utr} could not be verified after ${MAX_RETRIES} attempts. Marked as pending for manual review.`);
      }
    } catch (emailErr) {
      logger.error('Email verification process error', emailErr);
      // Continue as pending
    }

    const payment = await Payment.create({
      user: req.user._id,
      book: bookId,
      utr,
      amount,
      status, // pending or approved
      submittedAt: new Date(),
      approvedAt,
      approvedBy,
      notes,
      qrCode,
      upiId: config.upiId,
      payeeName: config.payeeName
    });

    logger.info("Payment submitted successfully", { paymentId: payment._id, status });

    res.json({
      success: true,
      message: status === 'approved' ? "Payment verified and approved instantly!" : "Payment submitted successfully. Waiting for admin approval.",
      paymentId: payment._id,
      status
    });
  } catch (err) {
    // Handle duplicate key error
    if (err.code === 11000) {
      logger.warn("Duplicate key error in payment submission", { error: err.message });
      return res.status(400).json({
        success: false,
        error: "This UTR number has already been used. Please use a different transaction reference number."
      });
    }

    logger.error("Payment submission error", { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      error: "Payment submission failed",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get user's payment history
router.get("/payments/history", requireAuth, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate('book', 'title image price priceDiscounted category')
      .sort({ submittedAt: -1 });

    res.json({ success: true, payments });
  } catch (err) {
    logger.error("Payment history error", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to fetch payment history" });
  }
});

// Get payment status
router.get("/payment/:paymentId/status", requireAuth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate('book', 'title image price priceDiscounted category')
      .populate('approvedBy', 'name');

    if (!payment) {
      return res.status(404).json({ success: false, error: "Payment not found" });
    }

    // Check if user owns this payment
    if (payment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    res.json({ success: true, payment });
  } catch (err) {
    logger.error("Payment status error", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to fetch payment status" });
  }
});

// Admin: Get all pending payments
router.get("/admin/payments/pending", requireAdmin, async (req, res) => {
  try {
    const payments = await Payment.find({ status: "pending" })
      .populate('user', 'name email')
      .populate('book', 'title image price priceDiscounted category')
      .sort({ submittedAt: -1 });

    res.json({ success: true, payments });
  } catch (err) {
    logger.error("Admin payments error", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to fetch pending payments" });
  }
});

// Admin: Approve payment
router.put("/admin/payment/:paymentId/approve", requireAdmin, async (req, res) => {
  try {
    const { notes } = req.body;
    const payment = await Payment.findById(req.params.paymentId);

    if (!payment) {
      return res.status(404).json({ success: false, error: "Payment not found" });
    }

    if (payment.status !== "pending") {
      return res.status(400).json({ success: false, error: "Payment is not pending" });
    }

    payment.status = "approved";
    payment.approvedAt = new Date();
    payment.approvedBy = req.user._id;
    payment.notes = notes;

    await payment.save();

    logger.info("Payment approved", { paymentId: payment._id, approvedBy: req.user._id });

    res.json({
      success: true,
      message: "Payment approved successfully",
      payment
    });
  } catch (err) {
    logger.error("Payment approval error", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to approve payment" });
  }
});

// Admin: Reject payment
router.put("/admin/payment/:paymentId/reject", requireAdmin, async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const payment = await Payment.findById(req.params.paymentId);

    if (!payment) {
      return res.status(404).json({ success: false, error: "Payment not found" });
    }

    if (payment.status !== "pending") {
      return res.status(400).json({ success: false, error: "Payment is not pending" });
    }

    payment.status = "rejected";
    payment.rejectedAt = new Date(); // FIX: Added missing rejectedAt timestamp
    payment.rejectionReason = rejectionReason;

    await payment.save();

    logger.info("Payment rejected", { paymentId: payment._id, reason: rejectionReason });

    res.json({
      success: true,
      message: "Payment rejected successfully",
      payment
    });
  } catch (err) {
    logger.error("Payment rejection error", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to reject payment" });
  }
});

// Admin: Get payment configuration
router.get("/admin/payment-config", requireAdmin, async (req, res) => {
  try {
    const config = await getPaymentConfig();
    res.json({ success: true, config });
  } catch (err) {
    logger.error("Payment config fetch error", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to fetch payment configuration" });
  }
});

// Admin: Update payment configuration
router.put("/admin/payment-config", requireAdmin, async (req, res) => {
  try {
    const { upiId, payeeName, bankName } = req.body;

    // Store configuration in database instead of mutating environment
    await Config.setPaymentConfig({ upiId, payeeName, bankName }, req.user._id);

    const updatedConfig = await getPaymentConfig();

    logger.info("Payment configuration updated", { updatedBy: req.user._id });

    res.json({
      success: true,
      message: "Payment configuration updated successfully",
      config: updatedConfig
    });
  } catch (err) {
    logger.error("Payment config update error", { error: err.message });
    res.status(500).json({ success: false, error: "Failed to update payment configuration" });
  }
});

module.exports = router;
