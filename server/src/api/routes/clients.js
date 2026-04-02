const express = require('express');
const router = express.Router();
const { pool } = require('../../db');
const { addMonths, format, parseISO, isBefore, startOfDay } = require('date-fns');
const { sendAddedToSystem } = require('../../bot');

// ─── Helpers (same logic as original frontend) ────────────────────────────────

function countFullyPaidMonths(payments, monthlyPayment, numberOfMonths) {
  return Array.from({ length: numberOfMonths }, (_, i) => i + 1).filter((month) => {
    const total = payments
      .filter((p) => p.month_number === month && !p.cancelled && !p.overpayment)
      .reduce((sum, p) => sum + p.amount, 0);
    return total >= monthlyPayment;
  }).length;
}

function calculateNextPaymentDate(startDate, paymentsMade, numberOfMonths) {
  if (paymentsMade >= numberOfMonths) return null;
  return format(addMonths(parseISO(startDate), paymentsMade), 'yyyy-MM-dd');
}

function determineStatus(remainingBalance, nextPaymentDate, numberOfMonths, paymentsMade) {
  if (remainingBalance <= 0 || paymentsMade >= numberOfMonths) return 'completed';
  if (!nextPaymentDate) return 'overdue';
  const today = startOfDay(new Date());
  const next = parseISO(nextPaymentDate);
  if (isBefore(next, today)) return 'overdue';
  return 'paying';
}

function formatClient(c, payments = []) {
  return {
    id: c.id,
    userId: c.user_id,
    fullName: c.full_name,
    phoneNumber: c.phone_number,
    telegramUsername: c.telegram_username,
    telegramId: Number(c.telegram_id),
    language: c.language,
    courseName: 'Kurbanova Expert',
    installmentPrice: c.installment_price,
    numberOfMonths: c.number_of_months,
    startDate: toDateStr(c.start_date),
    monthlyPayment: c.monthly_payment,
    remainingBalance: c.remaining_balance,
    status: c.status,
    nextPaymentDate: c.next_payment_date ? toDateStr(c.next_payment_date) : '',
    createdAt: c.created_at,
    payments: payments.map(formatPayment),
  };
}

function formatPayment(p) {
  return {
    id: p.id,
    clientId: p.client_id,
    amount: p.amount,
    date: toDateStr(p.date),
    monthNumber: p.month_number,
    note: p.note,
    partial: p.partial,
    groupId: p.group_id,
    cancelled: p.cancelled,
    cancelledAt: p.cancelled_at ? toDateStr(p.cancelled_at) : null,
    overpayment: p.overpayment,
  };
}

function toDateStr(d) {
  if (!d) return '';
  if (typeof d === 'string') return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/clients
router.get('/', async (req, res) => {
  try {
    const clientsRes = await pool.query(`
      SELECT c.*, u.full_name, u.phone_number, u.telegram_username, u.telegram_id, u.language
      FROM clients c
      JOIN users u ON u.id = c.user_id
      ORDER BY c.created_at DESC
    `);

    const clients = await Promise.all(
      clientsRes.rows.map(async (c) => {
        const paymentsRes = await pool.query(
          'SELECT * FROM payments WHERE client_id = $1 ORDER BY created_at ASC',
          [c.id]
        );
        return formatClient(c, paymentsRes.rows);
      })
    );

    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/clients/:id
router.get('/:id', async (req, res) => {
  try {
    const clientRes = await pool.query(
      `SELECT c.*, u.full_name, u.phone_number, u.telegram_username, u.telegram_id, u.language
       FROM clients c JOIN users u ON u.id = c.user_id WHERE c.id = $1`,
      [req.params.id]
    );
    if (clientRes.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const paymentsRes = await pool.query(
      'SELECT * FROM payments WHERE client_id = $1 ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json(formatClient(clientRes.rows[0], paymentsRes.rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clients
router.post('/', async (req, res) => {
  const { userId, installmentPrice, numberOfMonths, startDate } = req.body;
  if (!userId || !installmentPrice || !numberOfMonths || !startDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const monthlyPayment = Math.round(installmentPrice / numberOfMonths);

  try {
    const result = await pool.query(
      `INSERT INTO clients (user_id, installment_price, number_of_months, start_date, monthly_payment, remaining_balance, status, next_payment_date)
       VALUES ($1, $2, $3, $4, $5, $6, 'paying', $4) RETURNING id`,
      [userId, installmentPrice, numberOfMonths, startDate, monthlyPayment, installmentPrice]
    );

    await pool.query("UPDATE users SET status = 'active' WHERE id = $1", [userId]);

    const clientRes = await pool.query(
      `SELECT c.*, u.full_name, u.phone_number, u.telegram_username, u.telegram_id, u.language
       FROM clients c JOIN users u ON u.id = c.user_id WHERE c.id = $1`,
      [result.rows[0].id]
    );

    const newClient = clientRes.rows[0];
    res.status(201).json(formatClient(newClient, []));

    // Notify user via Telegram
    if (newClient.telegram_id) {
      sendAddedToSystem(newClient.telegram_id, newClient.language).catch(console.error);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/clients/:id
router.delete('/:id', async (req, res) => {
  try {
    const clientRes = await pool.query('SELECT user_id FROM clients WHERE id = $1', [req.params.id]);
    if (clientRes.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const userId = clientRes.rows[0].user_id;
    await pool.query('DELETE FROM clients WHERE id = $1', [req.params.id]);
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { router, countFullyPaidMonths, calculateNextPaymentDate, determineStatus, formatPayment, toDateStr };
