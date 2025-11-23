import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Screens Imports ---
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
import WalletScreen from './screens/WalletScreen';
import OtherServicesMenuScreen from './screens/OtherServicesMenuScreen';

// --- Notification Logic Import ---
import NotificationManager from './components/NotificationManager';

// Ignore unnecessary warnings
LogBox.ignoreLogs(['expo-notifications']);

const Stack = createStackNavigator();

export default function App() {
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) setUserToken(token);
      } catch (e) {
        console.log(e);
      } finally {
        setIsLoading(false);
      }
    };
    checkToken();
  }, []);

  const handleLogin = async (token) => {
    try {
      await AsyncStorage.setItem('userToken', token);
      setUserToken(token);
    } catch (e) { console.error(e); }
  };
  
  const handleLogout = async () => {
    try { 
        await AsyncStorage.removeItem('userToken'); 
        setUserToken(null); 
    } catch (e) {}
  };

  if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb"/>
        </View>
      );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        
        {/* ✅ CORRECT PLACEMENT: Notification Manager yahan chupchap kaam karega */}
        <NotificationManager />

        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {userToken == null ? (
            <>
              <Stack.Screen name="Login">{(props) => <LoginScreen {...props} onLogin={handleLogin} />}</Stack.Screen>
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="MainApp">{(props) => <MainTabNavigator {...props} onLogout={handleLogout} />}</Stack.Screen>
              
              {/* Jobs & Services */}
              <Stack.Screen name="GovtJobsMenu" component={GovtJobsMenuScreen} />
              <Stack.Screen name="GovtJobs" component={GovtJobsScreen} />
              <Stack.Screen name="PrivateJobs" component={PrivateJobsScreen} />
              <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
              
              {/* Services & Wizard */}
              <Stack.Screen name="ServiceList" component={ServiceListScreen} />
              <Stack.Screen name="ServiceDetails" component={ServiceDetailsScreen} />
              <Stack.Screen name="ServiceWizard" component={ServiceWizardScreen} />
              <Stack.Screen name="CitizenServicesMenu" component={CitizenServicesMenu} />
              <Stack.Screen name="GovtSchemesMenu" component={GovtSchemesMenu} />
              <Stack.Screen name="OtherServicesMenu" component={OtherServicesMenuScreen} />
              
              {/* User Stuff */}
              <Stack.Screen name="UserAppDetails" component={UserApplicationDetailsScreen} />
              <Stack.Screen name="Wallet" component={WalletScreen} />
              <Stack.Screen name="Notifications" component={NotificationScreen} />
              <Stack.Screen name="ApplicationWizard" component={ApplicationWizardScreen} />
              
              {/* Misc */}
              <Stack.Screen name="UpdatesList" component={UpdatesListScreen} />
              <Stack.Screen name="CheckEligibility" component={CheckEligibilityScreen} />
              <Stack.Screen name="Referral" component={ReferralScreen} />
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