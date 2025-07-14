const express = require("express");
const QRCode = require("qrcode");
const Book = require("../models/Book");
const Payment = require("../models/Payment");
const isLoggedIn = require("../middleware/isLoggedIn"); // ✅ Import the middleware

const router = express.Router();

// Show payment page
router.get("/payment/:bookId", isLoggedIn, async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.bookId);
    if (!book) return res.status(404).send("Book not found");

    const upiLink = `upi://pay?pa=students4396@okhdfcbank&pn=Acadmix&am=${book.priceDiscounted}&cu=INR`;
    const qrDataUrl = await QRCode.toDataURL(upiLink, {
      errorCorrectionLevel: "H",
      width: 300,
    });

    res.render("payment", {
      book,
      qrDataUrl,
      upiLink,
      user: req.user, // ✅ Make sure EJS template gets user
    });
  } catch (err) {
    next(err);
  }
});

// Handle payment submission
router.post("/payment/submit", isLoggedIn, async (req, res, next) => {
  try {
    const { utr, bookId } = req.body;
    await Payment.create({
      user: req.user._id,
      book: bookId,
      utr,
      status: "pending",
      submittedAt: new Date(),
    });

    res.send(`
      <h2>✅ Payment Submitted!</h2>
      <p>Once your payment is <strong>approved by admin</strong>, you’ll be able to access your book.</p>
      <a href="/">⬅️ Go back to Home</a>
    `);
  } catch (err) {
    console.error("❌ Payment submission error:", err);
    next(err);
  }
});

module.exports = router;
