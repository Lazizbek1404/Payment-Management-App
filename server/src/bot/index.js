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

async function getAdminChatIds() {
  const res = await pool.query('SELECT telegram_id FROM admins');
  return res.rows.map((r) => r.telegram_id);
}

// ─── /start ───────────────────────────────────────────────────────────────────
bot.start(async (ctx) => {
  if (isAdmin(ctx)) {
    // Save admin chat ID so we can forward verification requests
    await pool.query(
      `INSERT INTO admins (username, telegram_id) VALUES ($1, $2)
       ON CONFLICT (username) DO UPDATE SET telegram_id = $2`,
      [ctx.from.username, ctx.from.id]
    ).catch((err) => console.error('admin save error:', err));

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

// Admin: verify a user
bot.action(/^verify_(\d+)$/, async (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('Access denied');

  const targetTelegramId = parseInt(ctx.match[1]);

  try {
    const userRes = await pool.query(
      'SELECT full_name, language, verified FROM users WHERE telegram_id = $1',
      [targetTelegramId]
    );

    if (userRes.rows.length === 0) return ctx.answerCbQuery('Foydalanuvchi topilmadi');
    if (userRes.rows[0].verified) return ctx.answerCbQuery('Allaqachon tasdiqlangan');

    const { full_name, language } = userRes.rows[0];

    await pool.query('UPDATE users SET verified = true WHERE telegram_id = $1', [targetTelegramId]);

    await bot.telegram.sendMessage(targetTelegramId, getMsg(language).verified, getMenuKeyboard(language));

    await ctx.editMessageReplyMarkup({
      inline_keyboard: [[{ text: `✅ Tasdiqlandi: ${full_name}`, callback_data: 'noop' }]],
    });

    return ctx.answerCbQuery(`✅ ${full_name} tasdiqlandi`);
  } catch (err) {
    console.error('verify error:', err);
    return ctx.answerCbQuery('Xatolik yuz berdi');
  }
});

bot.action('noop', (ctx) => ctx.answerCbQuery());

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
    session.step = 'national_id';
    sessions.set(telegramId, session);
    return ctx.reply(getMsg(lang).askNationalId);
  }

  if (session.step === 'national_id') {
    if (text.length < 5) return ctx.reply(getMsg(lang).askNationalId);
    session.nationalId = text;
    session.step = 'photo';
    sessions.set(telegramId, session);
    return ctx.reply(getMsg(lang).askPhoto);
  }
});

// ─── Photo handler (ID card photo during registration) ───────────────────────
bot.on('photo', async (ctx) => {
  if (isAdmin(ctx)) return;

  const telegramId = ctx.from.id;
  const session = sessions.get(telegramId);
  if (!session || session.step !== 'photo') return;

  const lang = session.lang || 'uz';
  const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;

  try {
    await pool.query(
      `INSERT INTO users (telegram_id, telegram_username, full_name, phone_number, language, national_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (telegram_id) DO UPDATE SET
         full_name = $3, phone_number = $4, language = $5, national_id = $6`,
      [telegramId, session.username, session.name, session.phone, lang, session.nationalId]
    );

    // Forward photo + info to all admins with a Verify button
    const adminIds = await getAdminChatIds();
    const caption =
      `🆕 Yangi ro'yxatdan o'tish:\n` +
      `👤 Ism: ${session.name}\n` +
      `📞 Tel: ${session.phone}\n` +
      `🪪 Passport: ${session.nationalId}\n` +
      `🌐 Til: ${lang.toUpperCase()}`;

    for (const adminId of adminIds) {
      await bot.telegram.sendPhoto(adminId, fileId, {
        caption,
        reply_markup: {
          inline_keyboard: [[{ text: '✅ Tasdiqlash', callback_data: `verify_${telegramId}` }]],
        },
      });
    }

    sessions.delete(telegramId);
    return ctx.reply(getMsg(lang).pendingVerification, getMenuKeyboard(lang));
  } catch (err) {
    console.error('photo registration error:', err);
    return ctx.reply(getMsg(lang).error);
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

// ─── Send reminder (called from scheduler) ───────────────────────────────────
async function sendReminder(telegramId, lang, name, amount, dueDate) {
  const msg = getMsg(lang);
  const text = dueDate ? msg.reminder(name, amount, dueDate) : msg.overdue(name, amount);
  await bot.telegram.sendMessage(telegramId, text, getMenuKeyboard(lang));
}

// ─── Send "added to system" notification (called from clients route) ──────────
async function sendAddedToSystem(telegramId, lang) {
  await bot.telegram.sendMessage(telegramId, getMsg(lang).addedToSystem, getMenuKeyboard(lang));
}

function startBot() {
  bot.launch();
  console.log('Bot started');
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

module.exports = { startBot, sendReminder, sendAddedToSystem };
