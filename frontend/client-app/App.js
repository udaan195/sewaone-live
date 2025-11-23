import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform, LogBox, Alert, Button } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import WalletScreen from './screens/WalletScreen';
import OtherServicesMenuScreen from './screens/OtherServicesMenuScreen';
// Screens Imports (Wahi purane)
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import MainTabNavigator from './navigation/MainTabNavigator';
import GovtJobsScreen from './screens/GovtJobsScreen';
import JobDetailsScreen from './screens/JobDetailsScreen';
import CheckEligibilityScreen from './screens/CheckEligibilityScreen';
import ApplicationWizardScreen from './screens/ApplicationWizardScreen';
import UserApplicationDetailsScreen from './screens/UserApplicationDetailsScreen';
import GovtJobsMenuScreen from './screens/GovtJobsMenuScreen';
import UpdatesListScreen from './screens/UpdatesListScreen';
import ServiceListScreen from './screens/ServiceListScreen';
import PrivateJobsScreen from './screens/PrivateJobsScreen';
import ServiceDetailsScreen from './screens/ServiceDetailsScreen';
import ServiceWizardScreen from './screens/ServiceWizardScreen';
import NotificationScreen from './screens/NotificationScreen';
import LegalScreen from './screens/LegalScreen';
import ReferralScreen from './screens/ReferralScreen';
import CitizenServicesMenu from './screens/CitizenServicesMenu';
    import GovtSchemesMenu from './screens/GovtSchemesMenu';
import API_URL from './config/api';

LogBox.ignoreLogs(['expo-notifications']);

// 1. NOTIFICATION HANDLER (Ye batata hai ki notification kaise dikhana hai)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,   // Alert dikhao
    shouldPlaySound: true,   // Sound bajao
    shouldSetBadge: false,
  }),
});

const Stack = createStackNavigator();

export default function App() {
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Track latest notification ID to avoid duplicates
  const lastSeenNotificationId = useRef(null);

  useEffect(() => {
    const initApp = async () => {
        await checkToken();
        await registerForPushNotificationsAsync(); // Permission maango
        setIsLoading(false);
    };
    initApp();

    // --- 2. SMART POLLING SYSTEM (Har 5 second mein check karega) ---
    const interval = setInterval(async () => {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
            console.log("🔔 Checking for new notifications..."); // Debug Log
            await checkForNewNotifications(token);
        }
    }, 5000); // 5 Seconds

    return () => clearInterval(interval);
  }, []);

  // 3. CHECK LOGIC
  const checkForNewNotifications = async (token) => {
      try {
          const res = await fetch(`${API_URL}/auth/my-notifications`, {
              headers: { 'x-auth-token': token }
          });
          
          if (res.ok) {
              const list = await res.json();
              if (list.length > 0) {
                  const latest = list[0]; // Sabse nayi notification
                  
                  // Agar ye notification humne abhi tak nahi dekhi
                  if (latest._id !== lastSeenNotificationId.current) {
                      
                      // ID update karein taaki bar-bar na baje
                      lastSeenNotificationId.current = latest._id;

                      // Agar ye Unread hai, tabhi bajao
                      if (!latest.isRead) {
                          console.log("🚀 New Notification Found:", latest.title);
                          await sendLocalNotification(latest.title, latest.message);
                      }
                  }
              }
          }
      } catch (e) {
          console.log("Polling Error:", e.message);
      }
  };

  // 4. TRIGGER LOCAL NOTIFICATION
  const sendLocalNotification = async (title, body) => {
      await Notifications.scheduleNotificationAsync({
          content: {
              title: title,
              body: body,
              sound: true,
              vibrate: [0, 250, 250, 250],
          },
          trigger: null, // null = Abhi turant dikhao
      });
  };

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) setUserToken(token);
    } catch (e) {}
  };

  // 5. PERMISSION REQUEST
  async function registerForPushNotificationsAsync() {
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
        Alert.alert('Permission Required', 'Please enable notifications in settings to receive updates.');
        return;
      }
    }
  }

  const handleLogin = async (token) => {
    try {
      await AsyncStorage.setItem('userToken', token);
      setUserToken(token);
      checkForNewNotifications(token); // Login karte hi check karo
    } catch (e) { console.error(e); }
  };
  
  const handleLogout = async () => {
    try { await AsyncStorage.removeItem('userToken'); setUserToken(null); } catch (e) {}
  };

  if (isLoading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2563eb"/></View>;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {userToken == null ? (
            <>
              <Stack.Screen name="Login">{(props) => <LoginScreen {...props} onLogin={handleLogin} />}</Stack.Screen>
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="MainApp">{(props) => <MainTabNavigator {...props} onLogout={handleLogout} />}</Stack.Screen>
              
              <Stack.Screen name="GovtJobsMenu" component={GovtJobsMenuScreen} />
              <Stack.Screen name="GovtJobs" component={GovtJobsScreen} />
              <Stack.Screen name="UpdatesList" component={UpdatesListScreen} />
              
              <Stack.Screen name="ServiceList" component={ServiceListScreen} />
              <Stack.Screen name="ServiceDetails" component={ServiceDetailsScreen} />
              <Stack.Screen name="ServiceWizard" component={ServiceWizardScreen} />
              
              <Stack.Screen name="Referral" component={ReferralScreen} />

              <Stack.Screen name="PrivateJobs" component={PrivateJobsScreen} />
              
              <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
              <Stack.Screen name="CheckEligibility" component={CheckEligibilityScreen} />
              <Stack.Screen name="OtherServicesMenu" component={OtherServicesMenuScreen} />
              <Stack.Screen name="ApplicationWizard" component={ApplicationWizardScreen} />
              <Stack.Screen name="Wallet" component={WalletScreen} />
              <Stack.Screen name="CitizenServicesMenu" component={CitizenServicesMenu} />
    <Stack.Screen name="GovtSchemesMenu" component={GovtSchemesMenu} />
              <Stack.Screen name="UserAppDetails" component={UserApplicationDetailsScreen} />
              <Stack.Screen name="Notifications" component={NotificationScreen} />
              <Stack.Screen name="Legal" component={LegalScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});