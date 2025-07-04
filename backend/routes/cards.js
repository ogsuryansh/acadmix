app.get('/api/cards', async (req, res) => {
  try {
    const cards = await Book.find().sort({ createdAt: -1 });
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});
