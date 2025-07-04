// public/backend/routes/cards.js
const express = require('express');
const router = express.Router();
const Book = require('./Book');

// GET /api/admin/cards
router.get('/cards', async (req, res) => {
  try {
    const cards = await Book.find().sort({ createdAt: -1 });
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

module.exports = router;
