const { Telegraf, Markup } = require('telegraf');
const { pool } = require('../db');
const { getMsg, langButtons, setLangButtons, formatCurrency } = require('./messages');

const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_USERNAMES = new Set(
  (process.env.ADMIN_USERNAMES || '').split(',').map((u) => u.trim()).filter(Boolean)
);

const STATUS_BTN_TEXTS = new Set([
  '📊 Holatimni tekshirish',
  '📊 Проверить статус',
  '📊 Check my status',
]);
const CHANGE_LANG_TEXTS = new Set([
  "🌐 Tilni o'zgartirish",
  '🌐 Изменить язык',
  '🌐 Change language',
]);

const sessions = new Map();

function isAdmin(ctx) {
  return ADMIN_USERNAMES.has(ctx.from?.username);
}

function getMenuKeyboard(lang) {
  return Markup.keyboard([getMsg(lang).menuKeyboard]).resize().persistent();
}

async function getUserLang(telegramId) {
  const res = await pool.query('SELECT language FROM users WHERE telegram_id = $1', [telegramId]);
  return res.rows[0]?.language || 'uz';
}

// ─── /start ───────────────────────────────────────────────────────────────────
bot.start(async (ctx) => {
  if (isAdmin(ctx)) {
    return ctx.reply(
      "👋 Salom, Admin!\n\nMavjud buyruqlar:\n/overdue — Muddati o'tgan to'lovlar\n/stats — Umumiy statistika"
    );
  }

  const telegramId = ctx.from.id;
  const username = ctx.from.username || '';

  try {
    const existing = await pool.query(
      'SELECT language, status FROM users WHERE telegram_id = $1',
      [telegramId]
    );

    if (existing.rows.length > 0) {
      const { language, status } = existing.rows[0];
      if (status === 'active') return sendStatusMessage(ctx, telegramId, language);
      return ctx.reply(getMsg(language).alreadyRegistered, getMenuKeyboard(language));
    }

    sessions.set(telegramId, { step: 'language', username });
    return ctx.reply(getMsg('uz').askLanguage, Markup.inlineKeyboard([langButtons]));
  } catch (err) {
    console.error('start error:', err);
    return ctx.reply('Xatolik yuz berdi. Iltimos, qaytadan /start bosing.');
  }
});

// ─── Admin commands (registered BEFORE bot.on('text')) ────────────────────────
bot.command('overdue', async (ctx) => {
  if (!isAdmin(ctx)) return;
  try {
    const result = await pool.query(`
      SELECT u.full_name, u.phone_number, c.remaining_balance, c.next_payment_date
      FROM clients c JOIN users u ON u.id = c.user_id
      WHERE c.status = 'overdue'
      ORDER BY c.next_payment_date ASC
    `);

    if (result.rows.length === 0) return ctx.reply("✅ Muddati o'tgan to'lovlar yo'q!");

    const list = result.rows
      .map((r, i) =>
        `${i + 1}. ${r.full_name}\n   📞 ${r.phone_number}\n   💰 ${formatCurrency(r.remaining_balance)}\n   📅 ${r.next_payment_date?.toISOString().split('T')[0] || 'N/A'}`
      )
      .join('\n\n');

    return ctx.reply(`⚠️ Muddati o'tgan mijozlar (${result.rows.length}):\n\n${list}`);
  } catch (err) {
    console.error('overdue error:', err);
    return ctx.reply('Xatolik yuz berdi.');
  }
});

bot.command('stats', async (ctx) => {
  if (!isAdmin(ctx)) return;
  try {
    const [totalRes, overdueRes, collectedRes, pendingRes] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM clients'),
      pool.query("SELECT COUNT(*) FROM clients WHERE status = 'overdue'"),
      pool.query("SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE cancelled = false AND overpayment = false"),
      pool.query("SELECT COUNT(*) FROM users WHERE status = 'inactive'"),
    ]);

    return ctx.reply(
      `📊 Statistika:\n\n` +
      `👥 Jami mijozlar: ${totalRes.rows[0].count}\n` +
      `⚠️ Muddati o'tgan: ${overdueRes.rows[0].count}\n` +
      `💰 Jami yig'ilgan: ${formatCurrency(parseInt(collectedRes.rows[0].total))}\n` +
      `📝 Ro'yxatdan o'tganlar (qo'shilmagan): ${pendingRes.rows[0].count}`
    );
  } catch (err) {
    console.error('stats error:', err);
    return ctx.reply('Xatolik yuz berdi.');
  }
});

// ─── Inline callbacks ─────────────────────────────────────────────────────────

// Registration: language selection
for (const lang of ['uz', 'ru', 'en']) {
  bot.action(`lang_${lang}`, async (ctx) => {
    const telegramId = ctx.from.id;
    const session = sessions.get(telegramId);
    if (session && session.step === 'language') {
      session.lang = lang;
      session.step = 'name';
      sessions.set(telegramId, session);
      await ctx.editMessageText(getMsg(lang).askName);
    }
    return ctx.answerCbQuery();
  });
}

// Existing users: change language
for (const lang of ['uz', 'ru', 'en']) {
  bot.action(`setlang_${lang}`, async (ctx) => {
    const telegramId = ctx.from.id;
    try {
      await pool.query('UPDATE users SET language = $1 WHERE telegram_id = $2', [lang, telegramId]);
      await ctx.editMessageText(getMsg(lang).languageChanged);
      await ctx.reply(getMsg(lang).alreadyRegistered, getMenuKeyboard(lang));
    } catch (err) {
      console.error('setlang error:', err);
    }
    return ctx.answerCbQuery();
  });
}

// ─── Text messages (registered AFTER commands) ────────────────────────────────
bot.on('text', async (ctx) => {
  if (isAdmin(ctx)) return;

  const telegramId = ctx.from.id;
  const text = ctx.message.text.trim();

  // Bottom menu: Check status
  if (STATUS_BTN_TEXTS.has(text)) {
    const lang = await getUserLang(telegramId);
    return sendStatusMessage(ctx, telegramId, lang);
  }

  // Bottom menu: Change language
  if (CHANGE_LANG_TEXTS.has(text)) {
    const lang = await getUserLang(telegramId);
    return ctx.reply(getMsg(lang).askLanguage, Markup.inlineKeyboard([setLangButtons]));
  }

  // Registration flow
  const session = sessions.get(telegramId);
  if (!session) return;

  const lang = session.lang || 'uz';

  if (session.step === 'name') {
    if (text.length < 2) return ctx.reply(getMsg(lang).askName);
    session.name = text;
    session.step = 'phone';
    sessions.set(telegramId, session);
    return ctx.reply(getMsg(lang).askPhone);
  }

  if (session.step === 'phone') {
    session.phone = text;
    try {
      await pool.query(
        `INSERT INTO users (telegram_id, telegram_username, full_name, phone_number, language)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (telegram_id) DO NOTHING`,
        [telegramId, session.username, session.name, session.phone, lang]
      );
      sessions.delete(telegramId);
      return ctx.reply(getMsg(lang).registered, getMenuKeyboard(lang));
    } catch (err) {
      console.error('Registration error:', err);
      return ctx.reply(getMsg(lang).error);
    }
  }
});

// ─── Status message ───────────────────────────────────────────────────────────
async function sendStatusMessage(ctx, telegramId, lang) {
  try {
    const result = await pool.query(
      `SELECT c.status, c.remaining_balance, c.monthly_payment, c.next_payment_date,
              c.installment_price, u.full_name
       FROM clients c JOIN users u ON u.id = c.user_id
       WHERE u.telegram_id = $1`,
      [telegramId]
    );

    const msg = getMsg(lang);

    if (result.rows.length === 0) {
      return ctx.reply(msg.notYetActive, getMenuKeyboard(lang));
    }

    const c = result.rows[0];
    const totalPaid = c.installment_price - c.remaining_balance;
    const nextDate = c.next_payment_date
      ? new Date(c.next_payment_date).toLocaleDateString(
          lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-US' : 'uz-UZ'
        )
      : '—';

    return ctx.reply(
      msg.statusMessage(c.full_name, c.status, totalPaid, c.remaining_balance, c.monthly_payment, nextDate),
      getMenuKeyboard(lang)
    );
  } catch (err) {
    console.error('sendStatusMessage error:', err);
    return ctx.reply('Xatolik yuz berdi.');
  }
}

// ─── Send reminder (called from API / scheduler) ──────────────────────────────
async function sendReminder(telegramId, lang, name, amount, dueDate) {
  const msg = getMsg(lang);
  const text = dueDate ? msg.reminder(name, amount, dueDate) : msg.overdue(name, amount);
  await bot.telegram.sendMessage(telegramId, text, getMenuKeyboard(lang));
}

function startBot() {
  bot.launch();
  console.log('Bot started');
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

module.exports = { startBot, sendReminder };
