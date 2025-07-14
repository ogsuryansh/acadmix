// backend/routes/payment.js
const express = require("express");
const QRCode  = require("qrcode");
const Book    = require("../models/Book");    // ← import Book
const Payment = require("../models/Payment"); // ← import Payment
const router  = express.Router();

// Show payment page (with QR & form)
router.get("/payment/:bookId", async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.bookId);
    if (!book) return res.status(404).send("Book not found");

    const upiLink   = `upi://pay?pa=students4396@okhdfcbank&pn=Acadmix&am=${book.priceDiscounted}&cu=INR`;
    const qrDataUrl = await QRCode.toDataURL(upiLink, { errorCorrectionLevel: "H", width: 300 });

    res.render("payment", { book, qrDataUrl, upiLink });
  } catch (err) {
    next(err);
  }
});

// Handle submission (store pending payment)
router.post("/payment/submit", async (req, res, next) => {
  try {
    const { utr, bookId } = req.body;
    // you’ll want to check req.user here in real code
    await Payment.create({ user: req.user._id, book: bookId, utr, status: "pending" });
    res.send("Payment submitted—awaiting admin approval.");
  } catch (err) {
    next(err);
  }
});

module.exports = router;
