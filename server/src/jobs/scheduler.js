const cron = require('node-cron');
const { pool } = require('../db');
const { sendReminder } = require('../bot');
const { toDateStr } = require('../api/routes/clients');
const { refreshAllStatuses } = require('../api/routes/payments');

// Runs every day at 9:00 AM
function startScheduler() {
  cron.schedule('0 9 * * *', async () => {
    console.log('[Scheduler] Running daily reminder check...');
    try {
      // Refresh statuses first so overdue list is accurate
      await refreshAllStatuses();

      // Only send reminders to overdue clients
      const result = await pool.query(
        `SELECT c.id, c.monthly_payment, c.next_payment_date, c.status,
                u.telegram_id, u.full_name, u.language
         FROM clients c
         JOIN users u ON u.id = c.user_id
         WHERE c.status = 'overdue'`
      );

      console.log(`[Scheduler] Sending reminders to ${result.rows.length} clients`);

      for (const c of result.rows) {
        try {
          const dueDate = c.next_payment_date
            ? toDateStr(c.next_payment_date)
            : null;

          await sendReminder(
            Number(c.telegram_id),
            c.language,
            c.full_name,
            c.monthly_payment,
            dueDate
          );

          // Small delay to avoid hitting Telegram rate limits
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (err) {
          console.error(`[Scheduler] Failed to send to ${c.full_name}:`, err.message);
        }
      }

      console.log('[Scheduler] Done.');
    } catch (err) {
      console.error('[Scheduler] Error:', err);
    }
  });

  console.log('Scheduler started (daily reminders at 9:00 AM)');
}

module.exports = { startScheduler };
