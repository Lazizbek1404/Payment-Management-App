require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');
const { startBot } = require('./bot');
const { startScheduler } = require('./jobs/scheduler');
const authMiddleware = require('./api/middleware/auth');
const usersRouter = require('./api/routes/users');
const { router: clientsRouter } = require('./api/routes/clients');
const paymentsRouter = require('./api/routes/payments');
const { refreshAllStatuses } = require('./api/routes/payments');
const statsRouter = require('./api/routes/stats');
const remindRouter = require('./api/routes/remind');

const app = express();

app.use(cors({
  origin: (origin, callback) => callback(null, true),
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(authMiddleware);

app.use('/api/users', usersRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/remind', remindRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

async function main() {
  await initDb();
  await refreshAllStatuses();
  console.log('Statuses refreshed');
  startBot();
  startScheduler();

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
