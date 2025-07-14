const express = require('express');
const QRCode = require('qrcode');
const router = express.Router();

// Assuming you have a function to fetch the book by ID or from req params:
router.get('/payment/:bookId', async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.bookId);
    if (!book) return res.status(404).send('Book not found');

    // Build the UPI deep‑link
    const upiLink = `upi://pay?pa=students4396@okhdfcbank&pn=Acadmix&am=${book.priceDiscounted}&cu=INR`;

    // Generate a Data‑URL for the QR code
    const qrDataUrl = await QRCode.toDataURL(upiLink, {
      errorCorrectionLevel: 'H',
      width: 300
    });

    // Render the view, passing both book and the generated QR Data‑URL
    res.render('payment', { book, qrDataUrl, upiLink });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
