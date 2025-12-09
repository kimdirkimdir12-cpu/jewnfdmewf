const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const TOKEN = '8331628985:AAEcxjLxU3bb6BfbLFQJw1G5NTcYNn6JlaU';

let lastUpdateId = 0;

// 👉 HTML kim yuborganini saqlash
// { message_id: { chat_id, file_path } }
let DB = {};

function saveDB() {
  fs.writeFileSync("db.json", JSON.stringify(DB, null, 2));
}

function loadDB() {
  if (fs.existsSync("db.json")) {
    DB = JSON.parse(fs.readFileSync("db.json"));
  }
}
loadDB();


// 📌 HTMLni qabul qilish -> Telegramga yuborish
app.post('/upload-html', async (req, res) => {
  const html = req.body.html;
  if (!html) return res.status(400).json({ success: false, error: 'Bo‘sh HTML' });

  // Har bir yuborilgan HTML uchun alohida fayl
  const id = Date.now().toString();
  const filePath = path.join(__dirname, `${id}.html`);
  fs.writeFileSync(filePath, html);

  try {
    const form = new FormData();
    form.append('chat_id', '5728779626'); // sizning admin ID
    form.append('document', fs.createReadStream(filePath), `${id}.html`);

    const tgRes = await axios.post(
      `https://api.telegram.org/bot${TOKEN}/sendDocument`,
      form,
      { headers: form.getHeaders() }
    );

    const msg = tgRes.data.result;
    const chat_id = msg.chat.id;
    const message_id = msg.message_id;

    // ushbu HTML kimga tegishli ekanini saqlaymiz
    DB[message_id] = {
      chat_id,
      file: filePath
    };
    saveDB();

    res.json({ success: true, message_id });

  } catch (err) {
    console.error("❌ Telegramga yuborishda xatolik:", err.response?.data || err.message);
    res.status(500).json({ success: false });
  }
});


// 📌 Reply qilingan xabarlarni olish
app.get('/latest', async (req, res) => {
  try {
    const { data } = await axios.get(
      `https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${lastUpdateId + 1}`
    );

    if (data.ok && data.result.length > 0) {
      let reply = null;

      data.result.forEach(u => {
        lastUpdateId = u.update_id;

        if (u.message && u.message.reply_to_message) {
          const replyTo = u.message.reply_to_message.message_id;
          const text = u.message.text;

          if (DB[replyTo]) {
            reply = text;
          }
        }
      });

      return res.json({ success: !!reply, message: reply });
    }

    res.json({ success: false });

  } catch (err) {
    console.error("❌ Xabar olishda xatolik:", err.message);
    res.status(500).json({ success: false });
  }
});

// 🚀 Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server ishlayapti: http://localhost:${PORT}`));
