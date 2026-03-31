const express = require('express');
const router = express.Router();
const { pool } = require('../../db');

// GET /api/users — all inactive (registered but not yet added as clients)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE status = 'inactive' ORDER BY registered_at DESC"
    );
    res.json(result.rows.map(formatUser));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function formatUser(u) {
  return {
    id: u.id,
    telegramId: u.telegram_id,
    telegramUsername: u.telegram_username,
    fullName: u.full_name,
    phoneNumber: u.phone_number,
    language: u.language,
    status: u.status,
    registeredAt: u.registered_at,
  };
}

module.exports = router;
