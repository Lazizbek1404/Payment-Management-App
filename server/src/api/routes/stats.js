const express = require('express');
const router = express.Router();
const { pool } = require('../../db');
const { addMonths, format } = require('date-fns');

// GET /api/stats
router.get('/', async (req, res) => {
  try {
    const [totalRes, overdueRes, collectedRes] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM clients'),
      pool.query("SELECT COUNT(*) FROM clients WHERE status = 'overdue'"),
      pool.query(
        "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE cancelled = false AND overpayment = false"
      ),
    ]);

    // Monthly data for last 6 months
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = addMonths(new Date(), -i);
      const monthKey = format(date, 'yyyy-MM');
      const monthName = format(date, 'MMM');

      const result = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM payments
         WHERE cancelled = false AND overpayment = false AND date::text LIKE $1`,
        [`${monthKey}%`]
      );

      monthlyData.push({ month: monthName, amount: parseInt(result.rows[0].total) });
    }

    res.json({
      totalClients: parseInt(totalRes.rows[0].count),
      overdueClients: parseInt(overdueRes.rows[0].count),
      totalCollected: parseInt(collectedRes.rows[0].total),
      monthlyData,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
