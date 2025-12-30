/**
 * ⚙️ Fortex OIL Bot - Config (yangilangan)
 */

require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_IDS = (process.env.ADMIN_ID || '').split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN .env faylda topilmadi! Iltimos, .env fayl yarating.');
  process.exit(1);
}

const DB_PATH = process.env.DB_PATH || './fortex_data.db';

const DEFAULT_COVERAGE_OPTIONS = [5000, 7500, 10000, 15000, 20000];

const COMMON_OIL_TYPES = [
  'Fortex 5W-30',
  'Fortex 10W-40',
  'Fortex 0W-20',
  'Fortex 15W-40',
  'Fortex 5W-20',
  'Fortex 5W-40',
  'Fortex 10W-30',
  'Fortex 20W-50'
];

const MAIN_KEYBOARD = {
  resize_keyboard: true,
  keyboard: [
    ['➕ Mijoz qo‘shish', '📂 Eski mijozlar'],
    ['📊 Statistika', '❓ Yordam']
  ]
};

const CANCEL_KEYBOARD = {
  resize_keyboard: true,
  keyboard: [['❌ Bekor qilish']]
};

const STATES = {
  NONE: 'NONE',
  NAME: 'NAME',
  KM: 'KM',
  COVERAGE: 'COVERAGE',
  OIL: 'OIL',
  CONFIRM: 'CONFIRM'
};

module.exports = {
  BOT_TOKEN,
  ADMIN_IDS,
  DB_PATH,
  DEFAULT_COVERAGE_OPTIONS,
  COMMON_OIL_TYPES,
  MAIN_KEYBOARD,
  CANCEL_KEYBOARD,
  STATES
};