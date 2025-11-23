import React, { useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from '../config/api';

// 1. Notification Handler (App khula ho tab kaisa dikhe)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Pop-up dikhega
    shouldPlaySound: true, // Awaaz aayegi
    shouldSetBadge: false,
  }),
});

export default function NotificationManager() {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // A. Register for Token
    registerForPushNotificationsAsync().then(token => {
        if (token) sendTokenToBackend(token);
    });

    // B. Listen for incoming notifications (Foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log("🔔 Notification Received:", notification);
    });

    // C. Listen for user clicking the notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("👆 User clicked notification:", response);
      // Future: Yahan specific screen navigation logic aa sakti hai
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  // --- Helper: Send to Backend ---
  const sendTokenToBackend = async (token) => {
      try {
          const authToken = await AsyncStorage.getItem('userToken');
          if (!authToken) return; // Not logged in

          await fetch(`${API_URL}/auth/update-push-token`, {
              method: 'PUT',
              headers: { 
                  'Content-Type': 'application/json',
                  'x-auth-token': authToken 
              },
              body: JSON.stringify({ pushToken: token })
          });
          console.log("✅ Token synced with backend");
      } catch (error) {
          console.log("Failed to sync push token", error);
      }
  };

  return null; // Yeh component kuch render nahi karega, bas logic chalayega
}

// --- Helper: Get Permission & Token ---
async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    // Get Token (Project ID ki zarurat ab nahi padti usually, agar EAS use kar rahe ho)
    token = (await Notifications.getExpoPushTokenAsync()).data;
    
    console.log("📲 My Push Token:", token);
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}