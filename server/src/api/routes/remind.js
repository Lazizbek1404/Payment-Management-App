const express = require('express');
const router = express.Router();
const { pool } = require('../../db');
const { sendReminder } = require('../../bot');

// POST /api/remind/:clientId — send reminder to a specific client
router.post('/:clientId', async (req, res) => {
  try {
    const clientRes = await pool.query(
      `SELECT c.remaining_balance, c.monthly_payment, c.next_payment_date, c.status,
              u.telegram_id, u.full_name, u.language
       FROM clients c JOIN users u ON u.id = c.user_id
       WHERE c.id = $1`,
      [req.params.clientId]
    );

    if (clientRes.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const c = clientRes.rows[0];

    if (!c.telegram_id) {
      return res.status(400).json({ error: 'Client has no Telegram ID' });
    }

    const amount = c.monthly_payment;
    const dueDate = c.next_payment_date
      ? new Date(c.next_payment_date).toLocaleDateString('uz-UZ')
      : null;

    await sendReminder(
      Number(c.telegram_id),
      c.language,
      c.full_name,
      amount,
      dueDate
    );

    res.json({ success: true });
  } catch (err) {
    console.error('remind error:', err);
    if (err.description?.includes('bot was blocked')) {
      return res.status(400).json({ error: 'Client has blocked the bot' });
    }
    if (err.description?.includes('chat not found')) {
      return res.status(400).json({ error: 'Client has not started the bot yet' });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
