# 🛢️ Fortex OIL Xizmat Stantsiyasi Bot - JavaScript Versiyasi

Mashhur Fortex OIL xizmat stantsiyasi uchun professional Telegram bot — JavaScript/Node.js versiyasi. Bu bot mijozlarni, avtomobillarni va xizmat tarixini boshqarish uchun mo'ljallangan.

![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-green.svg)
![Telegram Bot](https://img.shields.io/badge/Telegram-Bot-blue.svg)
![License](https://img.shields.io/badge/license-MIT-yellow.svg)

## 🌟 Xususiyatlari

### Asosiy Funksiyalar
- 🆕 **Yangi Xizmat Qaydlari** — Mijozlarni qo'shib, moy xizmatlarini tezda qayd etish
- 🔍 **Mijoz Qidirish** — Ism yoki telefon raqam bo'yicha mijozlarni topish
- 📂 **Ko'p Avtomobil Dastami** — Bir mijozga bir nechta avtomobil qo'shish
- 📊 **Statistika Dashboard** — Kunlik ish haqida hisobot ko'rish
- 🔢 **Aqlli Hisoblash** — Keyingi xizmat kilometri avtomatik hisoblash

### Foydalanuvchi Tajribasi
- 😊 **Emoji Boy Interfeys** — Do'stona va joz'ali ko'rinish
- 📱 **Mobil Birinchi Dizayn** — Telegram mobil ilovasi uchun optimallashtirilgan
- 🎯 **Oson Navigatsiya** — Tushunarli menyu tugmalari
- 💬 **Suhbat Uslubi** — Qadam-ba-qadam yo'naltirilgan kiritish

### Texnik Xususiyatlar
- 🔒 **Xavfsiz Ma'lumotlar** — Mijozlarning ma'lumotlari himoyalangan
- 💾 **Doimiy Xotira** — SQLite ma'lumotlar bazasi (PostgreSQL ga osongina ko'tariladi)
- ⚡ **Tez Javob** — Sekin internet uchun optimallashtirilgan
- 🔄 **Xatolar Tuzatish** — Tarmoq muammolarini oson bartaraf etish

## 🚀 Tez Boshlash

### Talablar
- Node.js 14.0 yoki yuqori
- Telegram hisobi
- Telegram Bot Token (@BotFather dan olish)

### O'rnatish

1. **Loyihani yuklab olish yoki nusxalash**
```bash
cd fortex_bot_js
```

2. **Dependencies o'rnatish**
```bash
npm install
```

3. **Konfiguratsiya qilish**
```bash
cp .env.example .env
# .env fayliga Bot Token va Telegram ID ni yozing
```

4. **Botni ishga tushirish**
```bash
npm start
```

## 📋 Buyruqlar

| Buyruq | Tavsif |
|--------|--------|
| `/start` | Botni ishga tushirish va asosiy menyuni ko'rsatish |
| `/help` | Yordam va ko'rsatmalar |
| `/cancel` | Joriy operatsiyani bekor qilish |
| `/view` | Barcha mijozlarni ko'rish |
| `/search [ism]` | Mijozlarni ism bo'yicha qidirish |
| `/stats` | Statistika dashboardini ko'rsatish |

## 📱 Menyuning Asosiy Variantlari

### 🆕 Yangi Xizmat
Mijoz qo'shib, moy almashtirish xizmatini qayd etish:
1. Mijoz ismini kiriting
2. Telefon raqamini qo'shing (ixtiyoriy)
3. Avtomobil qo'shing yoki tanlang
4. Hozirgi kilometrni kiriting
5. Moy qamrovini tanlang
6. Moy turini tanlang
7. Tasdiqlang va saqlang

### 🔍 Mijoz Qidirish
Mavjud mijozlarni ism yoki telefon raqam bo'yicha tez topish.

### 📊 Statistika
Kunlik ishingizni ko'rish:
- Jami xizmatlar soni
- Turli avtomobillar
- Eng mashhur moy turlari
- Oylik umumiy ko'rsatkichlar

### 📂 Mijozlarni Ko'rish
Barcha mijozlarni ko'rish va ularning avtomobil tarixiga kirish.

## 🏗️ Loyiha Strukturasi

```
fortex_bot_js/
├── bot.js              # Asosiy bot fayli va handlerlar
├── database.js         # Ma'lumotlar bazasi operatsiyalari
├── utils.js            # Yordamchi funksiyalar
├── config.js           # Konfiguratsiya sozlamalari
├── package.json        # Node.js dependencies
├── .env.example        # Environment variable shabloni
├── .env                # Environment variables (yaratish kerak)
└── README.md           # Hujjatlar
```

## ⚙️ Konfiguratsiya

### Environment O'zgaruvchilari

| O'zgaruvchi | Kerak | Tavsif |
|-------------|-------|--------|
| `BOT_TOKEN` | Ha | @BotFather dan olingan Telegram Bot Token |
| `ADMIN_ID` | Ha | Sizning Telegram User ID |
| `DB_TYPE` | Yo'q | Ma'lumotlar bazasi turi (sqlite, postgresql, mysql) |
| `LOG_LEVEL` | Yo'q | Loglash darajasi (DEBUG, INFO, WARNING, ERROR) |

### Telegram ID ni Olish

1. Telegram da @userinfobot ga yozing
2. U sizga user ID ni jo'natadi
3. Bu ID ni .env fayliga yozing

### Bot Token Yaratish

1. Telegram da @BotFather ga yozing
2. `/newbot` buyrug'ini yuboring
3. Ko'rsatmalarni bajaring
4. Bot tokenini .env fayliga yozing

## 🔧 Moslashtirish

### Yangi Moy Turlarini Qo'shish

`config.js` fayliga o'zgartirish kiriting:

```javascript
const COMMON_OIL_TYPES = [
  'Fortex 5W-30',
  'Fortex 10W-40',
  'Sizning Maxsus Moy Turi',  // Bu yerga qo'shing
];
```

### Qamrov Variantlarini O'zgartirish

```javascript
const DEFAULT_COVERAGE_OPTIONS = [
  5000,
  7500,
  10000,
  15000,
  20000,  // O'zingiz variantini qo'shing
];
```

### Ko'proq Adminlar Qo'shish

.env faylida bir nechta ID larni vergul bilan ajrating:

```env
ADMIN_ID=123456789,987654321,111222333
```

## 🗄️ Ma'lumotlar Bazasi Strukturasi

### Mijozlar Jadvali
- `customer_id` — Unique mijoz identifikatori
- `name` — Mijozning to'liq ismi
- `phone` — Telefon raqami (ixtiyoriy)
- `created_at` — Yaratilgan vaqt
- `updated_at` — Yangilangan vaqt

### Avtomobillar Jadvali
- `car_id` — Unique avtomobil identifikatori
- `customer_id` — Mijozga havola
- `model` — Avtomobil markasi
- `plate_number` — Davom raqami
- `created_at` — Yaratilgan vaqt

### Xizmatlar Jadvali
- `service_id` — Unique xizmat identifikatori
- `car_id` — Avtomobilga havola
- `staff_id` — Xizmat ko'rsatgan xodim
- `current_km` — Hozirgi kilometr
- `coverage_km` — Moy qamrovi
- `next_service_km` — Keyingi xizmat kilometri
- `oil_type` — Ishlatilgan moy turi
- `service_date` — Xizmat sanasi
- `notes` — Qo'shimcha eslatmalar

## 🔒 Xavfsizlik

- Barcha mijozlarning ma'lumotlari local SQLite da saqlanadi
- Tashqi serverlar yo'q — to'liq maxfiylik
- Faqat ruxsat etilgan Telegram foydalanuvchilari kira oladi
- Ixtiyoriy: sezgir ma'lumotlar uchun shifrlash

## 🚨 Muammolarni Hal Qilish

### Bot javob bermayapti
1. Internet aloqangizni tekshiring
2. .env dagi bot token to'g'ri ekanligini tasdiqlang
3. Telegram ID ADMIN_IDS da mavjudligini tekshiring

### Ma'lumotlar bazasi xatolari
1. fortex_data.db faylini o'chiring
2. `npm start` ni ishga tushiring
3. Jadval avtomatik qayta yaratiladi

### Sekin javoblar
1. Tarmoq aloqasini tekshiring
2. timeout qiymatlarini oshiring (config.js da)
3. Botni qayta ishga tushiring

## 📈 Kelajak Imkoniyatlari

- [ ] SMS/Email xabarnomalar
- [ ] Xizmat eslatma tizimi
- [ ] Ko'p stantsiya qo'llab-quvvatlash
- [ ] Ilg'or analitika
- [ ] Excel/CSV ga eksport
- [ ] Mijozlardan fikr-mulohazalar tizimi

## 🤝 Hissa Qo'shish

Hissa qo'shish xush keladi! Iltimos, issue va pull request yuboring.

## 📄 Litsenziya

MIT litsenziyasi ostida tarqatiladi — LICENSE faylini ko'ring.

## 🙏 Tan Olish

- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api) — Ajoyib Telegram bot kutubxonasi
- [Fortex OIL](https://fortexoil.com) — Bu loyihaga ilhom bergisi

---

## 💬 Qo'llab-Quvvatlash

Savollar yoki muammolar bo'lsa:
1. Yuqoridagi muammolarni hal qilish bo'limini ko'ring
2. Botda `/help` buyrug'ini ishlating
3. GitHub da issue yuboring

---

**🏆 Fortex OIL Xizmat Stantsiyasi uchun yaratilgan ❤️**

*Avtomobillarni bir moy almashtirish orqali silliq ishlashini ta'minlaymiz!*
