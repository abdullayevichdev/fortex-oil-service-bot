/**
 * 🛠️ Fortex OIL Bot - Yangi Utils (soddalashtirilgan)
 */

function parseKmInput(text) {
  if (!text) return null;
  text = text.trim().toLowerCase();

  // 50k → 50000
  if (text.endsWith('k')) {
    const num = parseFloat(text.slice(0, -1));
    if (!isNaN(num)) return Math.round(num * 1000);
  }

  // raqamlarni ajratib olish
  const cleaned = text.replace(/[^0-9]/g, '');
  if (cleaned.length === 0) return null;

  const num = parseInt(cleaned, 10);
  return (num > 0 && num < 2000000) ? num : null;
}

function formatNumber(num) {
  if (!num) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function calculateNextService(currentKm, coverage) {
  return currentKm + coverage;
}

function getMotivationalPhrase() {
  const phrases = [
    '🌟 Ajoyib ish! Har bir xizmat dvigatelni silliq ishlashini taʼminlaydi!',
    '🚗💨 Yana bir xursand mijoz! Shu tarzda davom eting!',
    '⭐ Mukammal xizmat! Mehnatingiz uchun rahmat!',
    '🏆 Siz ajoyibsiz! Fortex OIL siz bilan faxrlanadi!',
    '💪 Har bir moy almashtirish yo‘llarni xavfsizroq qiladi!',
    '🎉 Yana bir muvaffaqiyatli kun! Davom eting!'
  ];
  return phrases[Math.floor(Math.random() * phrases.length)];
}

module.exports = {
  parseKmInput,
  formatNumber,
  calculateNextService,
  getMotivationalPhrase
};