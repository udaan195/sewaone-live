const fetch = require('node-fetch'); // Agar node 18+ hai to inbuilt hai, warna npm install node-fetch

// User ko notification bhejne ka function
const sendPushNotification = async (pushToken, title, body, data = {}) => {
  // 1. Check karo ki token sahi hai ya nahi
  if (!pushToken || !pushToken.startsWith('ExponentPushToken')) {
    console.log("Invalid Push Token:", pushToken);
    return;
  }

  // 2. Message Message
  const message = {
    to: pushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data, // Extra data (jaise screen name)
    _displayInForeground: true,
  };

  // 3. Expo Server ko bhejo
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    console.log("Notification Sent:", title);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

module.exports = { sendPushNotification };