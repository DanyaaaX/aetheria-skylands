const express = require('express');
const router = express.Router();

// Імпорт контролера (переконайтеся, що шлях до файлу правильний)
const mintController = require('../controllers/mintController');

// Маршрут 1: Mock verification (з першого фрагмента)
router.post('/verify', async (req, res) => {
  res.json({ success: true, message: 'Payment verification service standby.' });
});

// Маршрут 2: Verify Mint (з другого фрагмента)
// POST /api/payment/verify-mint (залежно від того, де підключений цей роутер)
router.post('/verify-mint', mintController.verifyMint);

module.exports = router;