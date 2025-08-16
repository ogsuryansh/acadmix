const express = require("express");
const QRCode = require("qrcode");
const Book = require("../models/Book");
const Payment = require("../models/Payment");
const User = require("../models/User");
const authenticateToken = require("../middleware/authenticateToken");

const router = express.Router();

// Get payment configuration
const getPaymentConfig = () => {
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
router.get("/payment/:bookId", authenticateToken, async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId);
    if (!book) return res.status(404).json({ error: "Book not found" });

    const config = getPaymentConfig();
    
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
    
    // Generate QR code
    const qrCode = await generateQRCode(amount, config.upiId, config.payeeName);
    
    // Check if user already has a pending payment for this book
    const existingPayment = await Payment.findOne({
      user: req.user.id,
      book: req.params.bookId,
      status: "pending"
    });

    res.json({
      book,
      qrCode,
      upiId: config.upiId,
      payeeName: config.payeeName,
      amount,
      existingPayment
    });
  } catch (err) {
    console.error("❌ Payment API error:", err);
    res.status(500).json({ error: "Failed to generate payment data" });
  }
});

// Submit payment
router.post("/payment/submit", authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Payment submission request:', {
      user: req.user,
      body: req.body,
      timestamp: new Date().toISOString()
    });
    
    const { utr, bookId, amount } = req.body;
    
    if (!utr || !bookId || !amount) {
      return res.status(400).json({ error: "UTR number, book ID, and amount are required" });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({
      user: req.user.id,
      book: bookId,
      status: { $in: ["pending", "approved"] }
    });

    if (existingPayment) {
      return res.status(400).json({ error: "Payment already exists for this book" });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
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
        error: `Payment amount mismatch. Expected: ₹${expectedAmount}, Received: ₹${amount}`,
        expectedAmount,
        receivedAmount: amount
      });
    }

    const config = getPaymentConfig();
    const qrCode = await generateQRCode(amount, config.upiId, config.payeeName);

    const payment = await Payment.create({
      user: req.user.id,
      book: bookId,
      utr,
      amount,
      status: "pending",
      submittedAt: new Date(),
      qrCode,
      upiId: config.upiId,
      payeeName: config.payeeName
    });

    res.json({ 
      message: "Payment submitted successfully",
      paymentId: payment._id
    });
  } catch (err) {
    console.error("❌ Payment submission error:", err);
    res.status(500).json({ error: "Payment submission failed" });
  }
});

// Get user's payment history
router.get("/payments/history", authenticateToken, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate('book', 'title image price priceDiscounted category')
      .sort({ submittedAt: -1 });

    res.json({ payments });
  } catch (err) {
    console.error("❌ Payment history error:", err);
    res.status(500).json({ error: "Failed to fetch payment history" });
  }
});

// Get payment status
router.get("/payment/:paymentId/status", authenticateToken, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate('book', 'title image price priceDiscounted category')
      .populate('approvedBy', 'name');

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // Check if user owns this payment
    if (payment.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ payment });
  } catch (err) {
    console.error("❌ Payment status error:", err);
    res.status(500).json({ error: "Failed to fetch payment status" });
  }
});

// Admin: Get all pending payments
router.get("/admin/payments/pending", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    const payments = await Payment.find({ status: "pending" })
      .populate('user', 'name email')
      .populate('book', 'title image price priceDiscounted category')
      .sort({ submittedAt: -1 });

    res.json({ payments });
  } catch (err) {
    console.error("❌ Admin payments error:", err);
    res.status(500).json({ error: "Failed to fetch pending payments" });
  }
});

// Admin: Approve payment
router.put("/admin/payment/:paymentId/approve", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { notes } = req.body;
    const payment = await Payment.findById(req.params.paymentId);

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    if (payment.status !== "pending") {
      return res.status(400).json({ error: "Payment is not pending" });
    }

    payment.status = "approved";
    payment.approvedAt = new Date();
    payment.approvedBy = req.user.id;
    payment.notes = notes;

    await payment.save();

    res.json({ 
      message: "Payment approved successfully",
      payment
    });
  } catch (err) {
    console.error("❌ Payment approval error:", err);
    res.status(500).json({ error: "Failed to approve payment" });
  }
});

// Admin: Reject payment
router.put("/admin/payment/:paymentId/reject", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { rejectionReason } = req.body;
    const payment = await Payment.findById(req.params.paymentId);

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    if (payment.status !== "pending") {
      return res.status(400).json({ error: "Payment is not pending" });
    }

    payment.status = "rejected";
    payment.rejectionReason = rejectionReason;

    await payment.save();

    res.json({ 
      message: "Payment rejected successfully",
      payment
    });
  } catch (err) {
    console.error("❌ Payment rejection error:", err);
    res.status(500).json({ error: "Failed to reject payment" });
  }
});

// Admin: Get payment configuration
router.get("/admin/payment-config", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    res.json({ config: getPaymentConfig() });
  } catch (err) {
    console.error("❌ Payment config fetch error:", err);
    res.status(500).json({ error: "Failed to fetch payment configuration" });
  }
});

// Admin: Update payment configuration
router.put("/admin/payment-config", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { upiId, payeeName, bankName } = req.body;
    
    // Update environment variables (you might want to store these in a database instead)
    if (upiId) process.env.UPI_ID = upiId;
    if (payeeName) process.env.PAYEE_NAME = payeeName;
    if (bankName) process.env.BANK_NAME = bankName;

    res.json({ 
      message: "Payment configuration updated successfully",
      config: getPaymentConfig()
    });
  } catch (err) {
    console.error("❌ Payment config update error:", err);
    res.status(500).json({ error: "Failed to update payment configuration" });
  }
});

module.exports = router;
