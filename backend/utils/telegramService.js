const axios = require('axios');

// ⚠️ YAHAN APNA TOKEN AUR CHAT ID DALEIN
const BOT_TOKEN = "7178445265:AAFRMgEnC_t10ivkjhlEu9VCvT7JoJy-oB0"; 
const GROUP_CHAT_ID = "7882393836"; // e.g. -100123456789

const sendTelegramMessage = async (message) => {
    if (!BOT_TOKEN || !GROUP_CHAT_ID) return;

    try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        
        // Telegram API Call
        await axios.post(url, {
            chat_id: GROUP_CHAT_ID,
            text: message,
            parse_mode: 'Markdown' // Taaki hum Bold/Italic use kar sakein
        });
        
        console.log("✅ Telegram Notification Sent");
    } catch (error) {
        console.error("❌ Telegram Error:", error.message);
    }
};

module.exports = { sendTelegramMessage };