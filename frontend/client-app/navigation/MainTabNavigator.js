import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, FileText, Star, HelpCircle, User } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from '../config/api';

// Screens
import HomeScreen from '../screens/HomeScreen';
import ApplicationScreen from '../screens/ApplicationScreen';
import OpportunityScreen from '../screens/OpportunityScreen';
import HelpScreen from '../screens/HelpScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator({ onLogout }) {
  const [counts, setCounts] = useState({ appCount: 0, helpCount: 0 });

  // Polling for notifications
  useEffect(() => {
    let isMounted = true;
    
    const fetchCounts = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if(!token) return;
        const res = await fetch(`${API_URL}/auth/notifications`, {
           headers: { 'x-auth-token': token }
        });
        if(res.ok && isMounted) {
            const data = await res.json();
            setCounts(prev => ({
                // Agar hum abhi bhi usi tab par hain (local 0 hai), to server ka purana data mat dikhao
                // Yeh logic thoda complex hai, isliye simpler rakhte hain: 
                // Server hamesha sach bolega ab kyunki humne backend fix kar diya hai.
                appCount: data.appCount,
                helpCount: data.helpCount
            }));
        }
      } catch(e){}
    };
    
    fetchCounts();
    const interval = setInterval(fetchCounts, 3000); // 3 sec fast polling
    
    return () => {
        isMounted = false;
        clearInterval(interval);
    };
  }, []);

  const markRead = async (type) => {
      // 1. Optimistic Update: Turant 0 kar do
      setCounts(prev => ({ 
          ...prev, 
          [type === 'application' ? 'appCount' : 'helpCount']: 0 
      }));

      // 2. Backend Update
      try {
        const token = await AsyncStorage.getItem('userToken');
        await fetch(`${API_URL}/auth/mark-read/${type}`, {
            method: 'PUT', headers: { 'x-auth-token': token }
        });
      } catch(e) { console.error("Mark read failed", e); }
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#004e92', 
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { paddingBottom: 5, height: 60 },
        tabBarLabelStyle: { fontSize: 11 },
        tabBarBadgeStyle: { backgroundColor: '#ef4444', color: '#fff', fontSize: 10 },
        
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Home') return <Home color={color} size={size} />;
          if (route.name === 'Application') return <FileText color={color} size={size} />;
          if (route.name === 'Opportunity') return <Star color={color} size={size} />;
          if (route.name === 'Help') return <HelpCircle color={color} size={size} />;
          if (route.name === 'Profile') return <User color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      
      <Tab.Screen 
        name="Application" 
        component={ApplicationScreen} 
        options={{ 
          tabBarBadge: counts.appCount > 0 ? counts.appCount : null 
        }} 
        listeners={{ 
            tabPress: () => markRead('application'),
            focus: () => markRead('application') // Focus hone par bhi read karo
        }}
      />

      <Tab.Screen name="Opportunity" component={OpportunityScreen} />
      
      <Tab.Screen 
        name="Help" 
        component={HelpScreen} 
        options={{ 
          tabBarBadge: counts.helpCount > 0 ? counts.helpCount : null 
        }}
        listeners={{ 
            tabPress: () => markRead('help'),
            focus: () => markRead('help')
        }}
      />

      <Tab.Screen name="Profile">
        {(props) => <ProfileScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}