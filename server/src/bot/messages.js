const formatCurrency = (amount) =>
  new Intl.NumberFormat('uz-UZ').format(amount) + ' UZS';

const langButtons = [
  { text: "🇺🇿 O'zbek", callback_data: 'lang_uz' },
  { text: '🇷🇺 Русский', callback_data: 'lang_ru' },
  { text: '🇬🇧 English', callback_data: 'lang_en' },
];

const setLangButtons = [
  { text: "🇺🇿 O'zbek", callback_data: 'setlang_uz' },
  { text: '🇷🇺 Русский', callback_data: 'setlang_ru' },
  { text: '🇬🇧 English', callback_data: 'setlang_en' },
];

function statusEmoji(status) {
  if (status === 'completed') return '✅';
  if (status === 'overdue') return '⚠️';
  return '🔄';
}

const messages = {
  uz: {
    askLanguage: "🌐 Tilni tanlang / Выберите язык / Choose language:",
    askName: "👋 Assalomu alaykum! Kurbanova Expert kursiga xush kelibsiz.\n\nIltimos, to'liq ismingizni kiriting:",
    askPhone: "📱 Telefon raqamingizni kiriting (masalan: +998901234567):",
    askNationalId: "🪪 Pasport seriya va raqamingizni kiriting (masalan: AB1234567):",
    askPhoto: "📸 Pasport yoki ID kartangizning rasmini yuboring.\n\n⚠️ Eslatma: Rasm faqat admin tomonidan vizual tekshirish uchun ishlatiladi va ma'lumotlar bazasida saqlanmaydi.",
    pendingVerification: "⏳ Ma'lumotlaringiz adminga yuborildi. Tez orada tekshirib, sizni tasdiqlashadi.\n\nTasdiqlangandan so'ng, sizga xabar beriladi. 🙏",
    verified: "✅ Siz admin tomonidan tasdiqlandingiz!\n\nEndi admin sizni tizimga qo'shishini kuting. Qo'shilganingizdan so'ng xabar olasiz. 🙏",
    addedToSystem: "🎉 Siz tizimga qo'shildingiz!\n\nEndi to'lov holatingizni quyidagi tugma orqali tekshirishingiz mumkin.",
    registered: "✅ Ro'yxatdan muvaffaqiyatli o'tdingiz!\n\nAdmin siz bilan tez orada bog'lanadi. Rahmat! 🙏",
    alreadyRegistered: "ℹ️ Siz allaqachon ro'yxatdan o'tgansiz. Admin siz bilan bog'lanadi.",
    notYetActive: "ℹ️ Siz hali kursga qo'shilmagansiz. Admin tez orada siz bilan bog'lanadi.",
    error: "Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.",
    checkStatusBtn: "📊 Holatimni tekshirish",
    changeLangBtn: "🌐 Tilni o'zgartirish",
    languageChanged: "✅ Til o'zgartirildi: O'zbek",
    menuKeyboard: ["📊 Holatimni tekshirish", "🌐 Tilni o'zgartirish"],
    statusMessage: (name, status, paid, remaining, monthly, nextDate) => {
      const emoji = statusEmoji(status);
      const statusLabel =
        status === 'completed' ? "To'liq to'langan" :
        status === 'overdue' ? "Muddati o'tgan" : "To'lanmoqda";
      return (
        `${emoji} ${name}, sizning to'lov holatingiz:\n\n` +
        `📌 Status: ${statusLabel}\n` +
        `✅ To'langan: ${formatCurrency(paid)}\n` +
        `💳 Qoldiq: ${formatCurrency(remaining)}\n` +
        `📅 Keyingi to'lov: ${nextDate}\n` +
        `💰 Oylik to'lov: ${formatCurrency(monthly)}`
      );
    },
    reminder: (name, amount, dueDate) =>
      `👋 Salom, ${name}!\n\n📚 Kurbanova Expert\n💰 Oylik to'lov: ${formatCurrency(amount)}\n📅 To'lov sanasi: ${dueDate}\n\nIltimos, o'z vaqtida to'lang. Rahmat! 🙏`,
    overdue: (name, amount) =>
      `⚠️ Salom, ${name}!\n\n📚 Kurbanova Expert\n💰 To'lov muddati o'tib ketdi!\nTo'lov miqdori: ${formatCurrency(amount)}\n\nIltimos, imkon qadar tezroq to'lang. Rahmat! 🙏`,
  },

  ru: {
    askLanguage: "🌐 Tilni tanlang / Выберите язык / Choose language:",
    askName: '👋 Здравствуйте! Добро пожаловать в курс Kurbanova Expert.\n\nПожалуйста, введите ваше полное имя:',
    askPhone: '📱 Введите ваш номер телефона (например: +998901234567):',
    askNationalId: '🪪 Введите серию и номер паспорта (например: AB1234567):',
    askPhoto: '📸 Отправьте фото вашего паспорта или ID-карты.\n\n⚠️ Примечание: Фото используется только для визуальной проверки администратором и не сохраняется в базе данных.',
    pendingVerification: '⏳ Ваши данные отправлены администратору. Он проверит и подтвердит вас в ближайшее время.\n\nПосле подтверждения вы получите уведомление. 🙏',
    verified: '✅ Вы подтверждены администратором!\n\nОжидайте, пока администратор добавит вас в систему. Вы получите уведомление. 🙏',
    addedToSystem: '🎉 Вы добавлены в систему!\n\nТеперь вы можете проверить статус своей оплаты с помощью кнопки ниже.',
    registered: '✅ Вы успешно зарегистрированы!\n\nАдминистратор свяжется с вами в ближайшее время. Спасибо! 🙏',
    alreadyRegistered: 'ℹ️ Вы уже зарегистрированы. Администратор свяжется с вами.',
    notYetActive: 'ℹ️ Вы ещё не добавлены в курс. Администратор скоро свяжется с вами.',
    error: 'Произошла ошибка. Пожалуйста, попробуйте ещё раз.',
    checkStatusBtn: '📊 Проверить статус',
    changeLangBtn: '🌐 Изменить язык',
    languageChanged: '✅ Язык изменён: Русский',
    menuKeyboard: ['📊 Проверить статус', '🌐 Изменить язык'],
    statusMessage: (name, status, paid, remaining, monthly, nextDate) => {
      const emoji = statusEmoji(status);
      const statusLabel =
        status === 'completed' ? 'Полностью оплачено' :
        status === 'overdue' ? 'Просрочено' : 'Оплачивается';
      return (
        `${emoji} ${name}, ваш статус оплаты:\n\n` +
        `📌 Статус: ${statusLabel}\n` +
        `✅ Оплачено: ${formatCurrency(paid)}\n` +
        `💳 Остаток: ${formatCurrency(remaining)}\n` +
        `📅 Следующий платёж: ${nextDate}\n` +
        `💰 Ежемесячный платёж: ${formatCurrency(monthly)}`
      );
    },
    reminder: (name, amount, dueDate) =>
      `👋 Здравствуйте, ${name}!\n\n📚 Kurbanova Expert\n💰 Ежемесячный платёж: ${formatCurrency(amount)}\n📅 Дата оплаты: ${dueDate}\n\nПожалуйста, оплатите вовремя. Спасибо! 🙏`,
    overdue: (name, amount) =>
      `⚠️ Здравствуйте, ${name}!\n\n📚 Kurbanova Expert\n💰 Срок оплаты истёк!\nСумма к оплате: ${formatCurrency(amount)}\n\nПожалуйста, оплатите как можно скорее. Спасибо! 🙏`,
  },

  en: {
    askLanguage: "🌐 Tilni tanlang / Выберите язык / Choose language:",
    askName: '👋 Hello! Welcome to Kurbanova Expert course.\n\nPlease enter your full name:',
    askPhone: '📱 Enter your phone number (e.g. +998901234567):',
    askNationalId: '🪪 Enter your passport series and number (e.g. AB1234567):',
    askPhoto: '📸 Send a photo of your passport or ID card.\n\n⚠️ Note: The photo is used only for visual verification by the admin and will not be stored in the database.',
    pendingVerification: '⏳ Your details have been sent to the admin. They will verify you shortly.\n\nYou will be notified once verified. 🙏',
    verified: '✅ You have been verified by the admin!\n\nWait for the admin to add you to the system. You will be notified. 🙏',
    addedToSystem: '🎉 You have been added to the system!\n\nYou can now check your payment status using the button below.',
    registered: '✅ You have been successfully registered!\n\nThe admin will contact you soon. Thank you! 🙏',
    alreadyRegistered: 'ℹ️ You are already registered. The admin will contact you.',
    notYetActive: 'ℹ️ You have not been added to the course yet. The admin will contact you soon.',
    error: 'An error occurred. Please try again.',
    checkStatusBtn: '📊 Check my status',
    changeLangBtn: '🌐 Change language',
    languageChanged: '✅ Language changed: English',
    menuKeyboard: ['📊 Check my status', '🌐 Change language'],
    statusMessage: (name, status, paid, remaining, monthly, nextDate) => {
      const emoji = statusEmoji(status);
      const statusLabel =
        status === 'completed' ? 'Fully paid' :
        status === 'overdue' ? 'Overdue' : 'Paying';
      return (
        `${emoji} ${name}, your payment status:\n\n` +
        `📌 Status: ${statusLabel}\n` +
        `✅ Paid: ${formatCurrency(paid)}\n` +
        `💳 Remaining: ${formatCurrency(remaining)}\n` +
        `📅 Next payment: ${nextDate}\n` +
        `💰 Monthly payment: ${formatCurrency(monthly)}`
      );
    },
    reminder: (name, amount, dueDate) =>
      `👋 Hello, ${name}!\n\n📚 Kurbanova Expert\n💰 Monthly payment: ${formatCurrency(amount)}\n📅 Due date: ${dueDate}\n\nPlease pay on time. Thank you! 🙏`,
    overdue: (name, amount) =>
      `⚠️ Hello, ${name}!\n\n📚 Kurbanova Expert\n💰 Your payment is overdue!\nAmount due: ${formatCurrency(amount)}\n\nPlease pay as soon as possible. Thank you! 🙏`,
  },
};

function getMsg(lang) {
  return messages[lang] || messages.uz;
}

module.exports = { messages, getMsg, langButtons, setLangButtons, formatCurrency };
