const { Expo } = require('expo-server-sdk');

// Create a new Expo SDK client
let expo = new Expo();

const sendPushNotification = async (pushToken, title, body, data = {}) => {
  // 1. Check if token is valid
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Push token ${pushToken} is not a valid Expo push token`);
    return;
  }

  // 2. Construct Message
  const messages = [{
    to: pushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data, // Extra data like Application ID
    priority: 'high',
    channelId: 'default',
  }];

  // 3. Send
  try {
    let ticketChunk = await expo.sendPushNotificationsAsync(messages);
    console.log('🔔 Notification Sent:', ticketChunk);
  } catch (error) {
    console.error('❌ Error sending notification:', error);
  }
};

module.exports = { sendPushNotification };