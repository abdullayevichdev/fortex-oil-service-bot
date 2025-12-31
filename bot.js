/**
 * 🛢️ Fortex OIL Service Bot - Final Professional Versiya
 * Statistika 100% ishlaydi!
 */

const TelegramBot = require('node-telegram-bot-api');
const {
  BOT_TOKEN,
  ADMIN_IDS,
  MAIN_KEYBOARD,
  CANCEL_KEYBOARD,
  STATES,
  COMMON_OIL_TYPES,
  DEFAULT_COVERAGE_OPTIONS
} = require('./config');
const db = require('./database');
const utils = require('./utils');

db.initDatabase();

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const conversations = new Map();

function isAuthorized(userId) {
  return ADMIN_IDS.includes(userId);
}

function getConv(chatId) {
  if (!conversations.has(chatId)) {
    conversations.set(chatId, { state: STATES.NONE, data: {} });
  }
  return conversations.get(chatId);
}

function clearConv(chatId) {
  conversations.delete(chatId);
}

/* ===================== /start ===================== */
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // ADMIN TEKSHIRUVI O'CHIRILDI — hamma kira oladi

  const text = `
👋 **Assalomu alaykum Fortex OIL kompaniyasining ishchisi Asrorbek!** 💪

🛢️ **Fortex OIL Service Bot** ga xush kelibsiz!

Men sizga mijozlarni qayd etish va moy almashtirishni boshqarishda yordam beraman. Har bir xizmat tez, aniq va professional! 🚗💨

📋 **Quyidagi variantlardan birini tanlang:**
  `;

  await bot.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    reply_markup: MAIN_KEYBOARD
  });
});

/* ===================== Asosiy tugmalar ===================== */
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  const userId = msg.from.id;

  if (!text || text.startsWith('/')) return;
  // ADMIN TEKSHIRUVI O'CHIRILDI — hamma foydalana oladi

  const conv = getConv(chatId);

  if (text === '➕ Mijoz qo‘shish') {
    conv.state = STATES.NAME;
    conv.data = {};
    return bot.sendMessage(chatId, '📝 **Mijozning to‘liq ismini kiriting:**\n(Masalan: Ali Valiyev)', {
      parse_mode: 'Markdown',
      reply_markup: CANCEL_KEYBOARD
    });
  }

  if (text === '📂 Eski mijozlar') {
    return viewAllCustomers(chatId);
  }

  if (text === '📊 Statistika') {
    return showStatistics(chatId);
  }

  if (text === '❓ Yordam') {
    return sendHelp(chatId);
  }

  if (text === '❌ Bekor qilish') {
    clearConv(chatId);
    return bot.sendMessage(chatId, '❌ Amal bekor qilindi.\n\n💪 Yana tayyormiz!', {
      reply_markup: MAIN_KEYBOARD
    });
  }

  switch (conv.state) {
    case STATES.NAME:
      return handleName(chatId, text);
    case STATES.KM:
      return handleKm(chatId, text);
    case STATES.COVERAGE:
      return handleCoverageInput(chatId, text);
    case STATES.OIL:
      return handleOilInput(chatId, text);
  }
});

/* ===================== Ism ===================== */
async function handleName(chatId, text) {
  if (text.length < 3) {
    return bot.sendMessage(chatId, '⚠️ Ism juda qisqa. Iltimos, to‘liq ism kiriting:');
  }

  const conv = getConv(chatId);
  conv.data.name = text.trim();

  try {
    const existing = await db.getCustomersByName(text);
    if (existing.length > 0) {
      const keyboard = existing.slice(0, 8).map(c => [{
        text: `👤 ${c.name}`,
        callback_data: `cust_${c.customer_id}`
      }]);
      keyboard.push([{ text: '➕ Yangi mijoz', callback_data: 'new_cust' }]);

      await bot.sendMessage(chatId, `🔍 Topilgan mijozlar (${existing.length} ta):\nTanlang yoki yangi yarating:`, {
        reply_markup: { inline_keyboard: keyboard }
      });
      return;
    }
  } catch (err) {
    console.error('Ism qidirishda xato:', err);
  }

  conv.state = STATES.KM;
  await bot.sendMessage(chatId, '🚗 **Hozirgi kilometrni kiriting:**\n(Masalan: 45000 yoki 45k)', {
    parse_mode: 'Markdown',
    reply_markup: CANCEL_KEYBOARD
  });
}

/* ===================== Kilometr ===================== */
async function handleKm(chatId, text) {
  const km = utils.parseKmInput(text);
  if (!km || km <= 0) {
    return bot.sendMessage(chatId, '⚠️ Noto‘g‘ri format. Misol: 50000, 45k, 120000');
  }

  const conv = getConv(chatId);
  conv.data.currentKm = km;
  conv.state = STATES.COVERAGE;

  const keyboard = DEFAULT_COVERAGE_OPTIONS.map(v => [{ text: `${utils.formatNumber(v)} km`, callback_data: `cov_${v}` }]);
  keyboard.push([{ text: '✏️ Boshqa qiymat', callback_data: 'cov_custom' }]);

  await bot.sendMessage(chatId, `✅ Hozirgi km: **${utils.formatNumber(km)} km**\n\n⛽ **Moy necha km ga yetadi?**`, {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: keyboard }
  });
}

/* ===================== Qamrov (custom) ===================== */
async function handleCoverageInput(chatId, text) {
  const km = utils.parseKmInput(text);
  if (!km || km < 1000 || km > 50000) {
    return bot.sendMessage(chatId, '⚠️ 1000–50000 km orasida qiymat kiriting (masalan: 10000)');
  }
  await handleCoverage(chatId, km);
}

/* ===================== Qamrov tanlash ===================== */
async function handleCoverage(chatId, value) {
  const conv = getConv(chatId);
  conv.data.coverageKm = value;
  conv.state = STATES.OIL;

  const keyboard = COMMON_OIL_TYPES.slice(0, 8).map(oil => [{ text: oil, callback_data: `oil_${oil}` }]);
  keyboard.push([{ text: '✏️ Boshqa moy', callback_data: 'oil_custom' }]);

  await bot.sendMessage(chatId, `✅ Qamrov: **${utils.formatNumber(value)} km**\n\n🛢️ **Qaysi moy ishlatildi?**`, {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: keyboard }
  });
}

/* ===================== Moy (custom) ===================== */
async function handleOilInput(chatId, text) {
  if (text.length < 3) {
    return bot.sendMessage(chatId, '⚠️ Moy turini to‘liq kiriting');
  }
  await handleOil(chatId, text.trim());
}

/* ===================== Moy tanlash ===================== */
async function handleOil(chatId, oilType) {
  const conv = getConv(chatId);
  conv.data.oilType = oilType;

  const nextKm = utils.calculateNextService(conv.data.currentKm, conv.data.coverageKm);

  const text = `
📋 **Xizmat xulosasi** 📋

👤 **Mijoz:** ${conv.data.name}
🚗 **Hozirgi km:** ${utils.formatNumber(conv.data.currentKm)} km
🛢️ **Moy turi:** ${oilType}
⛽ **Qamrov:** ${utils.formatNumber(conv.data.coverageKm)} km
📅 **Keyingi xizmat:** ${utils.formatNumber(nextKm)} km

✅ **Tasdiqlaysizmi?**
  `;

  const keyboard = [
    [{ text: '✅ Ha, saqlash', callback_data: 'save_service' }],
    [{ text: '❌ Bekor qilish', callback_data: 'cancel_service' }]
  ];

  conv.state = STATES.CONFIRM;
  await bot.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: keyboard }
  });
}

/* ===================== Saqlash ===================== */
async function saveService(chatId) {
  const conv = getConv(chatId);

  try {
    let customerId = conv.data.customerId;
    if (!customerId) {
      customerId = await db.addCustomer(conv.data.name);
    }

    const carId = await db.addCar(customerId);

    await db.addService(carId, conv.data.currentKm, conv.data.coverageKm, conv.data.oilType);

    const nextKm = utils.calculateNextService(conv.data.currentKm, conv.data.coverageKm);

    const successText = `
🎉 **Xizmat muvaffaqiyatli saqlandi!** 🎉

👤 ${conv.data.name}
🚗 ${utils.formatNumber(conv.data.currentKm)} km → ${utils.formatNumber(nextKm)} km
🛢️ ${conv.data.oilType}

💪 Ajoyib ish! Yana bir mijoz xursand bo‘ldi! 🌟
${utils.getMotivationalPhrase()}
    `;

    clearConv(chatId);
    await bot.sendMessage(chatId, successText, {
      parse_mode: 'Markdown',
      reply_markup: MAIN_KEYBOARD
    });
  } catch (err) {
    console.error('Saqlashda xato:', err);
    await bot.sendMessage(chatId, '⚠️ Saqlashda xato yuz berdi. Qayta urinib ko‘ring.');
  }
}

/* ===================== Callback ===================== */
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  await bot.answerCallbackQuery(query.id);

  const conv = getConv(chatId);

  if (data.startsWith('cust_')) {
    const cid = data.split('_')[1];
    const cust = await db.getCustomer(cid);
    if (cust) {
      conv.data.customerId = cid;
      conv.data.name = cust.name;
      conv.state = STATES.KM;
      return bot.sendMessage(chatId, '🚗 **Hozirgi kilometrni kiriting:**', {
        parse_mode: 'Markdown',
        reply_markup: CANCEL_KEYBOARD
      });
    }
  }

  if (data === 'new_cust') {
    conv.state = STATES.KM;
    return bot.sendMessage(chatId, '🚗 **Hozirgi kilometrni kiriting:**', {
      parse_mode: 'Markdown',
      reply_markup: CANCEL_KEYBOARD
    });
  }

  if (data.startsWith('cov_')) {
    if (data === 'cov_custom') {
      conv.state = STATES.COVERAGE;
      return bot.sendMessage(chatId, '✏️ Necha km ga yetadi? (masalan: 10000)');
    }
    const val = parseInt(data.split('_')[1]);
    return handleCoverage(chatId, val);
  }

  if (data.startsWith('oil_')) {
    if (data === 'oil_custom') {
      conv.state = STATES.OIL;
      return bot.sendMessage(chatId, '✏️ Moy turini kiriting:');
    }
    const oil = data.substring(4);
    return handleOil(chatId, oil);
  }

  if (data === 'save_service') {
    return saveService(chatId);
  }

  if (data === 'cancel_service') {
    clearConv(chatId);
    return bot.sendMessage(chatId, '❌ Bekor qilindi.', { reply_markup: MAIN_KEYBOARD });
  }

  if (data === 'refresh_stats') {
    return showStatistics(chatId);
  }
});

/* ===================== Eski mijozlar ===================== */
async function viewAllCustomers(chatId) {
  try {
    const customers = await db.getRecentCustomers(20);
    if (customers.length === 0) {
      return bot.sendMessage(chatId, '📂 Hozircha mijoz yo‘q.\n\n➕ "Mijoz qo‘shish" tugmasini bosing!', {
        reply_markup: MAIN_KEYBOARD
      });
    }

    let text = `📂 **Jami mijozlar: ${customers.length} ta** 📂\n\n`;
    const keyboard = [];

    for (const c of customers) {
      const carCount = c.car_count || 0;
      text += `👤 **${c.name}** 🚗 ${carCount} ta avtomobil\n\n`;
      keyboard.push([{ text: `👤 ${c.name}`, callback_data: `cust_${c.customer_id}` }]);
    }

    await bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });
  } catch (err) {
    console.error('Mijozlarni olishda xato:', err);
    await bot.sendMessage(chatId, '⚠️ Mijozlarni yuklashda xato. Qayta urinib ko‘ring.');
  }
}

/* ===================== Statistika (yaxshilandi!) ===================== */
async function showStatistics(chatId) {
  try {
    const stats = await db.getTodayStats();

    const text = `
📊 **Bugungi natijalar** 📊

🚗 Xizmat ko‘rsatilgan: **${stats.totalServices}** ta
🛢️ Eng ko‘p ishlatilgan moy: **${stats.mostUsedOil}**

💪 Ajoyib ish! Davom eting! 🔥
    `;

    const keyboard = [[{ text: '🔄 Yangilash', callback_data: 'refresh_stats' }]];

    await bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });
  } catch (err) {
    console.error('Statistikada xato:', err);
    await bot.sendMessage(chatId, '⚠️ Statistika yuklanmadi. Keyinroq urinib ko‘ring.');
  }
}

/* ===================== Yordam ===================== */
async function sendHelp(chatId) {
  const text = `
❓ **Yordam**

➕ **Mijoz qo‘shish** — Yangi mijoz uchun moy xizmati qayd etish
📂 **Eski mijozlar** — Oldingi mijozlarni ko‘rish va ularga xizmat qo‘shish
📊 **Statistika** — Bugungi natijalarni ko‘rish

🚗💨 Ishingizga omad! Fortex OIL jamoasi siz bilan!
  `;

  await bot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: MAIN_KEYBOARD });
}

console.log('🚀 Fortex OIL Bot ishga tushdi! Statistika to\'liq ishlaydi!');