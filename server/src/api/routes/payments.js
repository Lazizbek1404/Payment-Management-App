const express = require('express');
const router = express.Router();
const { pool } = require('../../db');
const { v4: uuidv4 } = require('uuid');
const {
  countFullyPaidMonths,
  calculateNextPaymentDate,
  determineStatus,
  formatPayment,
  toDateStr,
} = require('./clients');

// POST /api/payments — add a payment with overflow logic
router.post('/', async (req, res) => {
  const { clientId, amount, date, monthNumber, note } = req.body;
  if (!clientId || !amount || !date || !monthNumber) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const db = await pool.connect();
  try {
    await db.query('BEGIN');

    const clientRes = await db.query('SELECT * FROM clients WHERE id = $1 FOR UPDATE', [clientId]);
    if (clientRes.rows.length === 0) throw new Error('Client not found');
    const c = clientRes.rows[0];

    const existingRes = await db.query('SELECT * FROM payments WHERE client_id = $1', [clientId]);
    const existingPayments = existingRes.rows;

    // ─── Overflow allocation (same logic as frontend) ────────────────────────
    const groupId = uuidv4();
    const newPayments = [];
    let remaining = amount;
    let targetMonth = monthNumber;
    const activePayments = existingPayments.filter((p) => !p.cancelled);

    while (remaining > 0 && targetMonth <= c.number_of_months) {
      const alreadyPaid = [...activePayments, ...newPayments]
        .filter((p) => p.month_number === targetMonth)
        .reduce((sum, p) => sum + p.amount, 0);
      const needed = c.monthly_payment - alreadyPaid;

      if (needed <= 0) { targetMonth++; continue; }

      const allocate = Math.min(remaining, needed);
      newPayments.push({
        client_id: clientId,
        amount: allocate,
        date,
        month_number: targetMonth,
        note: note || null,
        partial: allocate < needed,
        group_id: groupId,
        overpayment: false,
      });

      remaining -= allocate;
      if (allocate >= needed) targetMonth++;
      else break;
    }

    if (remaining > 0) {
      newPayments.push({
        client_id: clientId,
        amount: remaining,
        date,
        month_number: c.number_of_months,
        note: note || null,
        partial: false,
        group_id: groupId,
        overpayment: true,
      });
    }

    for (const p of newPayments) {
      await db.query(
        `INSERT INTO payments (id, client_id, amount, date, month_number, note, partial, group_id, overpayment)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [uuidv4(), p.client_id, p.amount, p.date, p.month_number, p.note, p.partial, p.group_id, p.overpayment]
      );
    }

    // ─── Recalculate client status ───────────────────────────────────────────
    const allPayments = [...existingPayments, ...newPayments];
    const totalPaid = allPayments
      .filter((p) => !p.cancelled && !p.overpayment)
      .reduce((sum, p) => sum + p.amount, 0);
    const remainingBalance = Math.max(0, c.installment_price - totalPaid);
    const paidMonthsCount = countFullyPaidMonths(allPayments, c.monthly_payment, c.number_of_months);
    const nextPaymentDate = calculateNextPaymentDate(toDateStr(c.start_date), paidMonthsCount, c.number_of_months);
    const status = determineStatus(remainingBalance, nextPaymentDate, c.number_of_months, paidMonthsCount);

    await db.query(
      'UPDATE clients SET remaining_balance = $1, status = $2, next_payment_date = $3 WHERE id = $4',
      [remainingBalance, status, nextPaymentDate, clientId]
    );

    await db.query('COMMIT');

    // Return updated payments for this client
    const updatedPaymentsRes = await pool.query(
      'SELECT * FROM payments WHERE client_id = $1 ORDER BY created_at ASC',
      [clientId]
    );
    res.json({
      remainingBalance,
      status,
      nextPaymentDate: nextPaymentDate || '',
      payments: updatedPaymentsRes.rows.map(formatPayment),
    });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('addPayment error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    db.release();
  }
});

// POST /api/payments/clear — cancel all payments for a month
router.post('/clear', async (req, res) => {
  const { clientId, monthNumber } = req.body;
  if (!clientId || !monthNumber) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const db = await pool.connect();
  try {
    await db.query('BEGIN');

    const cancelledAt = new Date().toISOString().slice(0, 10);
    await db.query(
      `UPDATE payments SET cancelled = true, cancelled_at = $1
       WHERE client_id = $2 AND month_number = $3 AND cancelled = false AND overpayment = false`,
      [cancelledAt, clientId, monthNumber]
    );

    const clientRes = await db.query('SELECT * FROM clients WHERE id = $1', [clientId]);
    const c = clientRes.rows[0];
    const paymentsRes = await db.query('SELECT * FROM payments WHERE client_id = $1', [clientId]);
    const payments = paymentsRes.rows;

    const totalPaid = payments
      .filter((p) => !p.cancelled && !p.overpayment)
      .reduce((sum, p) => sum + p.amount, 0);
    const remainingBalance = Math.max(0, c.installment_price - totalPaid);
    const paidMonthsCount = countFullyPaidMonths(payments, c.monthly_payment, c.number_of_months);
    const nextPaymentDate = calculateNextPaymentDate(toDateStr(c.start_date), paidMonthsCount, c.number_of_months);
    const status = determineStatus(remainingBalance, nextPaymentDate, c.number_of_months, paidMonthsCount);

    await db.query(
      'UPDATE clients SET remaining_balance = $1, status = $2, next_payment_date = $3 WHERE id = $4',
      [remainingBalance, status, nextPaymentDate, clientId]
    );

    await db.query('COMMIT');

    res.json({
      remainingBalance,
      status,
      nextPaymentDate: nextPaymentDate || '',
      payments: payments.map(formatPayment),
    });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('clearPayment error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    db.release();
  }
});

// POST /api/payments/refresh-statuses — recalculate all client statuses
router.post('/refresh-statuses', async (req, res) => {
  try {
    await refreshAllStatuses();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function refreshAllStatuses() {
  const clientsRes = await pool.query('SELECT * FROM clients');
  for (const c of clientsRes.rows) {
    const paymentsRes = await pool.query('SELECT * FROM payments WHERE client_id = $1', [c.id]);
    const payments = paymentsRes.rows;
    const paidMonthsCount = countFullyPaidMonths(payments, c.monthly_payment, c.number_of_months);
    const nextPaymentDate = calculateNextPaymentDate(toDateStr(c.start_date), paidMonthsCount, c.number_of_months);
    const status = determineStatus(c.remaining_balance, nextPaymentDate, c.number_of_months, paidMonthsCount);
    if (status !== c.status || nextPaymentDate !== toDateStr(c.next_payment_date)) {
      await pool.query(
        'UPDATE clients SET status = $1, next_payment_date = $2 WHERE id = $3',
        [status, nextPaymentDate, c.id]
      );
    }
  }
}

module.exports = router;
module.exports.refreshAllStatuses = refreshAllStatuses;
