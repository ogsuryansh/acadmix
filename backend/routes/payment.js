const express = require("express");
const QRCode = require("qrcode");
const Book = require("../models/Book");
const Payment = require("../models/Payment");
const isLoggedIn = require("../middleware/isLoggedIn");

const router = express.Router();

// Get payment configuration (UPI ID, payee name, etc.)
const getPaymentConfig = () => {
  return {
    upiId: process.env.UPI_ID || 'acadmix@paytm',
    payeeName: process.env.PAYEE_NAME || 'Acadmix',
    bankName: process.env.BANK_NAME || 'Paytm'
  };
};

// Show payment page
router.get("/payment/:bookId", isLoggedIn, async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.bookId);
    if (!book) return res.status(404).send("Book not found");

    const config = getPaymentConfig();
    const amount = book.priceDiscounted || book.price;
    const upiLink = `upi://pay?pa=${config.upiId}&pn=${encodeURIComponent(config.payeeName)}&am=${amount}&cu=INR`;
    
    const qrDataUrl = await QRCode.toDataURL(upiLink, {
      errorCorrectionLevel: "H",
      width: 300,
    });

    res.render("payment", {
      book,
      qrDataUrl,
      upiLink,
      user: req.user,
      paymentConfig: config
    });
  } catch (err) {
    next(err);
  }
});

// API endpoint for payment data
router.get("/api/payment/:bookId", isLoggedIn, async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId);
    if (!book) return res.status(404).json({ error: "Book not found" });

    const config = getPaymentConfig();
    const amount = book.priceDiscounted || book.price;
    const upiLink = `upi://pay?pa=${config.upiId}&pn=${encodeURIComponent(config.payeeName)}&am=${amount}&cu=INR`;
    
    const qrDataUrl = await QRCode.toDataURL(upiLink, {
      errorCorrectionLevel: "H",
      width: 300,
    });

    res.json({
      book,
      qrCode: qrDataUrl,
      upiLink,
      upiId: config.upiId,
      payeeName: config.payeeName,
      amount
    });
  } catch (err) {
    console.error("❌ Payment API error:", err);
    res.status(500).json({ error: "Failed to generate payment data" });
  }
});

// Dynamic QR code generation endpoint
router.get("/api/payment/:bookId/qr", isLoggedIn, async (req, res) => {
  try {
    const { amount, upiId, payeeName } = req.query;
    const book = await Book.findById(req.params.bookId);
    
    if (!book) return res.status(404).json({ error: "Book not found" });
    
    const config = getPaymentConfig();
    const finalAmount = amount || (book.priceDiscounted || book.price);
    const finalUpiId = upiId || config.upiId;
    const finalPayeeName = payeeName || config.payeeName;
    
    const upiLink = `upi://pay?pa=${finalUpiId}&pn=${encodeURIComponent(finalPayeeName)}&am=${finalAmount}&cu=INR`;
    
    const qrDataUrl = await QRCode.toDataURL(upiLink, {
      errorCorrectionLevel: "H",
      width: 300,
    });

    res.json({
      qrCode: qrDataUrl,
      upiLink,
      amount: finalAmount,
      upiId: finalUpiId,
      payeeName: finalPayeeName
    });
  } catch (err) {
    console.error("❌ QR generation error:", err);
    res.status(500).json({ error: "Failed to generate QR code" });
  }
});

// Handle payment submission
router.post("/api/payment/submit", isLoggedIn, async (req, res) => {
  try {
    const { utr, bookId } = req.body;
    
    if (!utr || !bookId) {
      return res.status(400).json({ error: "UTR number and book ID are required" });
    }

    await Payment.create({
      user: req.user._id,
      book: bookId,
      utr,
      status: "pending",
      submittedAt: new Date(),
    });

    res.json({ message: "Payment submitted successfully" });
  } catch (err) {
    console.error("❌ Payment submission error:", err);
    res.status(500).json({ error: "Payment submission failed" });
  }
});

// Admin endpoint to update payment configuration
router.put("/api/admin/payment-config", isLoggedIn, async (req, res) => {
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

// Admin endpoint to get current payment configuration
router.get("/api/admin/payment-config", isLoggedIn, async (req, res) => {
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

module.exports = router;
