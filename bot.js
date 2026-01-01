/**
 * 🛢️ Fortex OIL Service Bot - Mukammal Versiya
 * + Eslatma + Admin Panel + Nasiya Savdo
 */

const TelegramBot = require('node-telegram-bot-api');
const {
  BOT_TOKEN,
  MAIN_KEYBOARD,
  CANCEL_KEYBOARD,
  STATES,
  COMMON_OIL_TYPES,
  DEFAULT_COVERAGE_OPTIONS
} = require('./config');
const db = require('./database');
const utils = require('./utils');
const cron = require('node-cron');

db.initDatabase();

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const conversations = new Map();
const ADMIN_CODE = '1980';
const reminders = new Map(); // eslatma uchun

// Admin Panel klaviaturasi
const ADMIN_PANEL_KEYBOARD = {
  resize_keyboard: true,
  keyboard: [
    ['💳 Nasiya Savdo qo‘shish'],
    ['📋 Nasiya Savdochilar ro‘yhati'],
    ['🔙 Asosiy menyuga qaytish']
  ]
};

const NASIYA_KEYBOARD = {
  resize_keyboard: true,
  keyboard: [['❌ Bekor qilish']]
};

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

  const startMessage = `
👋 **Assalomu alaykum Fortex OIL kompaniyasining ishchisi Asrorbek!** 💪

🛢️ **Fortex OIL Service Bot** ga xush kelibsiz!

Men sizga mijozlarni qayd etish va moy almashtirishni boshqarishda yordam beraman. Har bir xizmat tez, aniq va professional! 🚗💨

📋 **Quyidagi variantlardan birini tanlang:**
  `;

  await bot.sendMessage(chatId, startMessage, {
    parse_mode: 'Markdown',
    reply_markup: MAIN_KEYBOARD
  });
});

/* ===================== Asosiy tugmalar ===================== */
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userInput = msg.text?.trim();

  if (!userInput || userInput.startsWith('/')) return;

  const conv = getConv(chatId);

  // Admin panelga kirish
  if (conv.state === 'ADMIN_CODE') {
    if (userInput === ADMIN_CODE) {
      conv.state = STATES.NONE;
      return bot.sendMessage(chatId, '🔐 **Admin Panelga xush kelibsiz!**', {
        parse_mode: 'Markdown',
        reply_markup: ADMIN_PANEL_KEYBOARD
      });
    } else {
      return bot.sendMessage(chatId, '❌ Noto‘g‘ri kod. Qayta urinib ko‘ring.', {
        reply_markup: CANCEL_KEYBOARD
      });
    }
  }

  // Admin panel tugmalari
  if (userInput === '💳 Nasiya Savdo qo‘shish') {
    conv.state = 'NASIYA_NAME';
    conv.data = { type: 'nasiya' };
    return bot.sendMessage(chatId, '📝 **Nasiya mijoz ismini kiriting:**', {
      parse_mode: 'Markdown',
      reply_markup: NASIYA_KEYBOARD
    });
  }

  if (userInput === '📋 Nasiya Savdochilar ro‘yhati') {
    return viewNasiyaList(chatId);
  }

  if (userInput === '🔙 Asosiy menyuga qaytish') {
    conv.state = STATES.NONE;
    return bot.sendMessage(chatId, '🔙 Asosiy menyuga qaytdingiz!', {
      reply_markup: MAIN_KEYBOARD
    });
  }

  // Oddiy tugmalar
  if (userInput === '➕ Mijoz qo‘shish') {
    conv.state = STATES.NAME;
    conv.data = { type: 'normal' };
    return bot.sendMessage(chatId, '📝 **Mijozning to‘liq ismini kiriting:**', {
      parse_mode: 'Markdown',
      reply_markup: CANCEL_KEYBOARD
    });
  }

  if (userInput === '📂 Eski mijozlar') {
    return viewAllCustomers(chatId);
  }

  if (userInput === '📊 Statistika') {
    return showStatistics(chatId);
  }

  if (userInput === '❓ Yordam') {
    return sendHelp(chatId);
  }

  if (userInput === '🔐 Admin Panel') {
    conv.state = 'ADMIN_CODE';
    return bot.sendMessage(chatId, '🔐 **Admin Panel kodi:**', {
      reply_markup: CANCEL_KEYBOARD
    });
  }

  if (userInput === '❌ Bekor qilish') {
    clearConv(chatId);
    return bot.sendMessage(chatId, '❌ Bekor qilindi.', {
      reply_markup: MAIN_KEYBOARD
    });
  }

  // Suhbat holatlari
  switch (conv.state) {
    case STATES.NAME:
    case 'NASIYA_NAME':
      return handleName(chatId, userInput);
    case STATES.KM:
      return handleKm(chatId, userInput);
    case STATES.COVERAGE:
      return handleCoverageInput(chatId, userInput);
    case STATES.OIL:
      return handleOilInput(chatId, userInput);
    case 'NASIYA_DEBT':
      return handleNasiyaDebt(chatId, userInput);
  }
});

/* ===================== Ism ===================== */
async function handleName(chatId, input) {
  if (input.length < 3) {
    return bot.sendMessage(chatId, '⚠️ Ism qisqa. To‘liq kiriting.');
  }

  const conv = getConv(chatId);
  conv.data.name = input.trim();

  conv.state = STATES.KM;
  await bot.sendMessage(chatId, '🚗 **Hozirgi kilometrni kiriting:**', {
    parse_mode: 'Markdown',
    reply_markup: CANCEL_KEYBOARD
  });
}

/* ===================== Kilometr ===================== */
async function handleKm(chatId, input) {
  const km = utils.parseKmInput(input);
  if (!km || km <= 0) {
    return bot.sendMessage(chatId, '⚠️ Noto‘g‘ri km. Masalan: 50000');
  }

  const conv = getConv(chatId);
  conv.data.currentKm = km;
  conv.state = STATES.COVERAGE;

  const keyboard = DEFAULT_COVERAGE_OPTIONS.map(v => [{ text: `${utils.formatNumber(v)} km`, callback_data: `cov_${v}` }]);
  keyboard.push([{ text: '✏️ Boshqa', callback_data: 'cov_custom' }]);

  await bot.sendMessage(chatId, `✅ Hozirgi km: **${utils.formatNumber(km)} km**\n\n⛽ **Qamrov necha km?**`, {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: keyboard }
  });
}

/* ===================== Qamrov ===================== */
async function handleCoverageInput(chatId, input) {
  const km = utils.parseKmInput(input);
  if (!km || km < 1000 || km > 50000) {
    return bot.sendMessage(chatId, '⚠️ 1000–50000 km orasida kiriting');
  }
  await handleCoverage(chatId, km);
}

async function handleCoverage(chatId, value) {
  const conv = getConv(chatId);
  conv.data.coverageKm = value;
  conv.state = STATES.OIL;

  const keyboard = COMMON_OIL_TYPES.slice(0, 8).map(oil => [{ text: oil, callback_data: `oil_${oil}` }]);
  keyboard.push([{ text: '✏️ Boshqa moy', callback_data: 'oil_custom' }]);

  await bot.sendMessage(chatId, `✅ Qamrov: **${utils.formatNumber(value)} km**\n\n🛢️ **Moy turi?**`, {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: keyboard }
  });
}

/* ===================== Moy ===================== */
async function handleOilInput(chatId, input) {
  if (input.length < 3) {
    return bot.sendMessage(chatId, '⚠️ Moy turini to‘liq kiriting');
  }
  await handleOil(chatId, input.trim());
}

async function handleOil(chatId, oilType) {
  const conv = getConv(chatId);
  conv.data.oilType = oilType;

  if (conv.data.type === 'nasiya') {
    conv.state = 'NASIYA_DEBT';
    return bot.sendMessage(chatId, '💳 **Qarz summasini kiriting (so‘mda):**', {
      parse_mode: 'Markdown',
      reply_markup: NASIYA_KEYBOARD
    });
  }

  const nextKm = utils.calculateNextService(conv.data.currentKm, conv.data.coverageKm);

  const summaryMessage = `
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
  await bot.sendMessage(chatId, summaryMessage, {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: keyboard }
  });
}

/* ===================== Nasiya qarz ===================== */
async function handleNasiyaDebt(chatId, input) {
  const debt = parseInt(input.replace(/[^0-9]/g, ''));
  if (isNaN(debt) || debt <= 0) {
    return bot.sendMessage(chatId, '⚠️ To‘g‘ri summa kiriting (raqamlar)');
  }

  const conv = getConv(chatId);
  conv.data.debt = debt;

  const nextKm = utils.calculateNextService(conv.data.currentKm, conv.data.coverageKm);

  const nasiyaSummary = `
📋 **Nasiya savdo xulosasi** 📋

👤 **Mijoz:** ${conv.data.name}
🚗 **Hozirgi km:** ${utils.formatNumber(conv.data.currentKm)} km
🛢️ **Moy turi:** ${conv.data.oilType}
⛽ **Qamrov:** ${utils.formatNumber(conv.data.coverageKm)} km
📅 **Keyingi xizmat:** ${utils.formatNumber(nextKm)} km
💳 **Qarz:** ${utils.formatNumber(debt)} so‘m

✅ **Tasdiqlaysizmi?**
  `;

  const keyboard = [
    [{ text: '✅ Ha, saqlash', callback_data: 'save_nasiya' }],
    [{ text: '❌ Bekor qilish', callback_data: 'cancel_service' }]
  ];

  conv.state = STATES.CONFIRM;
  await bot.sendMessage(chatId, nasiyaSummary, {
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

    const successMessage = `
🎉 **Xizmat saqlandi!** 🎉

👤 ${conv.data.name}
🚗 ${utils.formatNumber(conv.data.currentKm)} km → ${utils.formatNumber(nextKm)} km
🛢️ ${conv.data.oilType}

💪 Ajoyib ish!
    `;

    clearConv(chatId);
    await bot.sendMessage(chatId, successMessage, {
      parse_mode: 'Markdown',
      reply_markup: MAIN_KEYBOARD
    });

    // Eslatma saqlash
    reminders.set(carId, {
      chatId,
      name: conv.data.name,
      nextKm,
      oilType: conv.data.oilType,
      stopReminder: false
    });

  } catch (err) {
    console.error('Xato:', err);
    await bot.sendMessage(chatId, '⚠️ Xato yuz berdi.');
  }
}

async function saveNasiya(chatId) {
  const conv = getConv(chatId);

  try {
    let customerId = conv.data.customerId;
    if (!customerId) {
      customerId = await db.addCustomer(conv.data.name);
    }

    const carId = await db.addCar(customerId);

    await db.addNasiya(carId, conv.data.currentKm, conv.data.coverageKm, conv.data.oilType, conv.data.debt);

    const nextKm = utils.calculateNextService(conv.data.currentKm, conv.data.coverageKm);

    const nasiyaSuccess = `
🎉 **Nasiya saqlandi!** 🎉

👤 ${conv.data.name}
🚗 ${utils.formatNumber(conv.data.currentKm)} km → ${utils.formatNumber(nextKm)} km
🛢️ ${conv.data.oilType}
💳 **Qarz:** ${utils.formatNumber(conv.data.debt)} so‘m

⏳ Ro‘yxatda turadi!
    `;

    clearConv(chatId);
    await bot.sendMessage(chatId, nasiyaSuccess, {
      parse_mode: 'Markdown',
      reply_markup: ADMIN_PANEL_KEYBOARD
    });

    reminders.set(carId, {
      chatId,
      name: conv.data.name,
      nextKm,
      oilType: conv.data.oilType,
      stopReminder: false
    });

  } catch (err) {
    console.error('Nasiya xato:', err);
    await bot.sendMessage(chatId, '⚠️ Xato yuz berdi.');
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
      return bot.sendMessage(chatId, '✏️ Necha km?');
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

  if (data === 'save_nasiya') {
    return saveNasiya(chatId);
  }

  if (data === 'cancel_service') {
    clearConv(chatId);
    return bot.sendMessage(chatId, '❌ Bekor qilindi.', { reply_markup: MAIN_KEYBOARD });
  }

  if (data === 'refresh_stats') {
    return showStatistics(chatId);
  }

  // Eslatma tugmalari
  if (data === 'reminder_yes') {
    for (const [carId, info] of reminders.entries()) {
      if (info.chatId === chatId && !info.stopReminder) {
        reminders.set(carId, { ...info, stopReminder: true });
        break;
      }
    }
    await bot.sendMessage(chatId, '✅ Rahmat! Tez orada kutamiz! 🚗');
  }

  if (data === 'reminder_no') {
    await bot.sendMessage(chatId, '🙂 Yaxshi, keyingi haftada eslatamiz!');
  }

  // Nasiya to'landi
  if (data.startsWith('nasiya_paid_')) {
    const id = data.split('_')[2];
    await db.deleteNasiya(id);
    await bot.sendMessage(chatId, '✅ Qarz to‘landi va o‘chirildi!');
    viewNasiyaList(chatId);
  }
});

/* ===================== Nasiya ro'yhati ===================== */
async function viewNasiyaList(chatId) {
  try {
    const list = await db.getAllNasiya();

    if (list.length === 0) {
      return bot.sendMessage(chatId, '📋 Nasiya yo‘q', {
        reply_markup: ADMIN_PANEL_KEYBOARD
      });
    }

    let listMessage = `💳 **Nasiya ro‘yhati** (${list.length} ta)\n\n`;
    const keyboard = [];

    for (const n of list) {
      const nextKm = n.current_km + n.coverage_km;
      listMessage += `👤 **${n.name}**\n`;
      listMessage += `🚗 ${utils.formatNumber(n.current_km)} → ${utils.formatNumber(nextKm)} km\n`;
      listMessage += `🛢️ ${n.oil_type}\n`;
      listMessage += `💳 ${utils.formatNumber(n.debt)} so‘m\n\n`;

      keyboard.push([{
        text: `✅ ${n.name} to‘ladi`,
        callback_data: `nasiya_paid_${n.id}`
      }]);
    }

    await bot.sendMessage(chatId, listMessage, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });
  } catch (err) {
    await bot.sendMessage(chatId, '⚠️ Xato');
  }
}

/* ===================== Eski mijozlar ===================== */
async function viewAllCustomers(chatId) {
  try {
    const customers = await db.getRecentCustomers(20);
    if (customers.length === 0) {
      return bot.sendMessage(chatId, '📂 Mijoz yo‘q', {
        reply_markup: MAIN_KEYBOARD
      });
    }

    let customersMessage = `📂 **Mijozlar** (${customers.length} ta)\n\n`;
    const keyboard = [];

    for (const c of customers) {
      const carCount = c.car_count || 0;
      customersMessage += `👤 **${c.name}** 🚗 ${carCount} ta\n\n`;
      keyboard.push([{ text: `👤 ${c.name}`, callback_data: `cust_${c.customer_id}` }]);
    }

    await bot.sendMessage(chatId, customersMessage, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });
  } catch (err) {
    await bot.sendMessage(chatId, '⚠️ Xato');
  }
}

/* ===================== Statistika ===================== */
async function showStatistics(chatId) {
  try {
    const stats = await db.getTodayStats();

    const statsMessage = `
📊 **Bugun**

🚗 **Xizmat:** ${stats.totalServices} ta
🛢️ **Eng ko‘p moy:** ${stats.mostUsedOil}

💪 Davom eting!
    `;

    const keyboard = [[{ text: '🔄 Yangilash', callback_data: 'refresh_stats' }]];

    await bot.sendMessage(chatId, statsMessage, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });
  } catch (err) {
    await bot.sendMessage(chatId, '⚠️ Xato');
  }
}

/* ===================== Yordam ===================== */
async function sendHelp(chatId) {
  const helpMessage = `
❓ **Yordam**

➕ Mijoz qo‘shish
📂 Eski mijozlar
📊 Statistika

🔐 Admin Panel (kod 1980)

Omad!
  `;

  await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown', reply_markup: MAIN_KEYBOARD });
}

/* ===================== Haftalik eslatma ===================== */
async function sendWeeklyReminders() {
  const phrases = [
    '⏰ {name}! Moy vaqti yaqinlashmoqda — {nextKm} km',
    '🛢️ Salom {name}! {oilType} moyingiz {nextKm} km ga yetishi kerak',
    '🚨 Eslatma {name}! Keyingi xizmat: {nextKm} km',
    '👋 {name}, moy almashtirish vaqti keldi mi?'
  ];

  for (const [carId, info] of reminders.entries()) {
    if (info.stopReminder) continue;

    const reminderText = phrases[Math.floor(Math.random() * phrases.length)]
      .replace('{name}', info.name)
      .replace('{nextKm}', utils.formatNumber(info.nextKm))
      .replace('{oilType}', info.oilType);

    const keyboard = [
      [{ text: '✅ Ha, tez orada boraman', callback_data: 'reminder_yes' }],
      [{ text: '❌ Yo‘q, hali', callback_data: 'reminder_no' }]
    ];

    try {
      await bot.sendMessage(info.chatId, reminderText, {
        reply_markup: { inline_keyboard: keyboard }
      });
    } catch (err) {
      reminders.delete(carId);
    }
  }
}

cron.schedule('0 10 * * 1,3,5', sendWeeklyReminders);

console.log('🚀 Bot ishga tushdi! Barcha funksiyalar faol!');
