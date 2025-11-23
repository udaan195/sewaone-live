import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StatusBar, Image, Dimensions, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Briefcase, Building, Users, Award, MoreHorizontal, CheckCircle, Rss, Wallet, FileText } from 'lucide-react-native'; // Wallet icon added
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import API_URL from '../config/api';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [userName, setUserName] = useState('User');
  const [loading, setLoading] = useState(true);
  
  // Badge Counts
  const [counts, setCounts] = useState({ 
    appCount: 0, helpCount: 0, jobCount: 0, totalGovtBadge: 0, bellCount: 0 
  });
  
  // Dynamic Data States
  const [banners, setBanners] = useState([]);
  const [whatsNew, setWhatsNew] = useState([]); 

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) { setLoading(false); return; }

      // 1. User Name
      const userRes = await fetch(`${API_URL}/auth/me`, {
        method: 'GET', headers: { 'x-auth-token': token },
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        if (!userData) {
            await AsyncStorage.removeItem('userToken');
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            return;
        }
        setUserName(userData.firstName || 'User');
      }

      // 2. Notifications Count
      const notifRes = await fetch(`${API_URL}/auth/notifications`, {
         headers: { 'x-auth-token': token }
      });
      if (notifRes.ok) {
          setCounts(await notifRes.json());
      }

      // 3. Banners
      const bannerRes = await fetch(`${API_URL}/admin/banners`); 
      if (bannerRes.ok) {
          const bData = await bannerRes.json();
          setBanners(bData.filter(b => b.isActive !== false));
      }

      // 4. What's New
      const whatsNewRes = await fetch(`${API_URL}/updates/whats-new`);
      if (whatsNewRes.ok) {
          setWhatsNew(await whatsNewRes.json());
      }

    } catch (err) { console.error("Home fetch error:", err); } finally { setLoading(false); }
  };
  
  const openLink = (url) => {
      if (url) Linking.openURL(url).catch(e => console.error(e));
  };

  const Badge = ({ count, style }) => {
      if (!count || count <= 0) return null;
      return (
          <View style={[styles.badgeContainer, style]}>
              <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
          </View>
      );
  };

  const handleMenuPress = (item) => {
    if (item.screen === 'GovtJobsMenu') {
        navigation.navigate('GovtJobsMenu');
    
    
    } else if (item.name === 'Private Jobs') {
        navigation.navigate('PrivateJobs'); // Now goes to the promotion screen
    

    } else if (item.name === 'Citizen Service') {
        navigation.navigate('CitizenServicesMenu'); 

    } else if (item.name === 'Government Schemes') {
        navigation.navigate('GovtSchemesMenu'); 

    } else if (item.name === 'Sewa Wallet') {
        navigation.navigate('Wallet'); 
    
    } else if (item.name === 'Others') {
        navigation.navigate('OtherServicesMenu'); 
    }
};

  const iconMenu = [
    { name: 'Government Jobs', icon: <Briefcase color="#004e92" size={32} />, screen: 'GovtJobsMenu', badge: counts.totalGovtBadge },
    { name: 'Private Jobs', icon: <Building color="#004e92" size={32} />, screen: 'ServiceList' },
    { name: 'Citizen Service', icon: <Users color="#004e92" size={32} />, screen: 'ServiceList' },
    { name: 'Sewa Wallet', icon: <Wallet color="#16a34a" size={32} />, screen: 'Wallet' }, // NEW WALLET MENU
    { name: 'Government Schemes', icon: <Award color="#004e92" size={32} />, screen: 'Schemes' },
    { name: 'Others', icon: <MoreHorizontal color="#004e92" size={32} />, screen: 'Others' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3c72" />
      
      <LinearGradient colors={['#1e3c72', '#2a5298']} style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SewaOne</Text>
          
          {/* HEADER ICONS ROW */}
          <View style={{flexDirection:'row', gap: 15}}>
              {/* WALLET ICON IN HEADER */}
              <TouchableOpacity onPress={() => navigation.navigate('Wallet')}>
                 <Wallet color="#fff" size={24} />
              </TouchableOpacity>

              {/* NOTIFICATION ICON */}
              <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
                 <View>
                     <Bell color="#fff" size={24} />
                     <Badge count={counts.bellCount} style={{top: -5, right: -5}} />
                 </View>
              </TouchableOpacity>
          </View>
        </View>

        <View style={styles.welcomeContainer}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.welcomeSubtext}>Welcome back,</Text>
              <Text style={styles.welcomeUser}>{userName}!</Text>
            </>
          )}
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        
        {/* Banners */}
        <View style={styles.bannerContainer}>
            {banners.length > 0 ? (
                <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{borderRadius: 16}}>
                    {banners.map((banner, index) => (
                        <View key={index} style={styles.slide}>
                            <Image source={{uri: banner.imageUrl}} style={styles.bannerImage} resizeMode="cover"/>
                            {banner.title && <View style={styles.bannerOverlay}><Text style={styles.bannerTitle}>{banner.title}</Text></View>}
                        </View>
                    ))}
                </ScrollView>
            ) : (
                <View style={styles.placeholderBanner}><Text style={styles.bannerText}>Latest Offers & Updates</Text></View>
            )}
        </View>

        {/* Menu Grid */}
        <View style={styles.menuContainer}>
          {iconMenu.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={() => handleMenuPress(item)}>
              <View style={styles.menuIconContainer}>
                {item.icon}
                <Badge count={item.badge} />
              </View>
              <Text style={styles.menuText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* What's New */}
        <View style={styles.taskContainer}>
          <Text style={styles.listTitle}>What's New</Text>
          {whatsNew.length > 0 ? (
              whatsNew.map((item, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={[styles.taskItem, index !== whatsNew.length-1 && {marginBottom: 15}]}
                    onPress={() => openLink(item.link)}
                  >
                    <CheckCircle color="#1e3c72" size={24} />
                    <View style={styles.taskTextContainer}>
                        <Text style={styles.taskTitle}>{item.title}</Text>
                        <Text style={styles.taskDesc} numberOfLines={2}>
                            {item.category} • {new Date(item.postedAt).toLocaleDateString()}
                        </Text>
                    </View>
                  </TouchableOpacity>
              ))
          ) : (
              <View style={styles.taskItem}>
                <CheckCircle color="#1e3c72" size={24} />
                <View style={styles.taskTextContainer}>
                    <Text style={styles.taskTitle}>All Services Available</Text>
                    <Text style={styles.taskDesc}>Apply for jobs, pan card, and more.</Text>
                </View>
              </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
  scroll: { flex: 1 },
  headerContainer: { paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  welcomeContainer: { marginTop: 15 },
  welcomeSubtext: { fontSize: 16, color: '#ddd' },
  welcomeUser: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  bannerContainer: { height: 160, margin: 20, marginTop: 20, borderRadius: 16, elevation: 4, backgroundColor: '#fff', overflow: 'hidden' },
  slide: { width: width - 40, height: 160, position: 'relative' },
  bannerImage: { width: '100%', height: '100%' },
  bannerOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.4)', padding: 8 },
  bannerTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  placeholderBanner: { flex: 1, backgroundColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center' },
  bannerText: { fontSize: 16, color: '#3730a3', fontWeight: '600' },
  menuContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', paddingHorizontal: 10, marginTop: 0 },
  menuItem: { width: '30%', alignItems: 'center', marginBottom: 20 },
  menuIconContainer: { width: 70, height: 70, backgroundColor: '#fff', borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  menuText: { marginTop: 8, fontSize: 12, color: '#333', textAlign: 'center', fontWeight: '500' },
  taskContainer: { margin: 20, backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 3, marginBottom: 40 },
  listTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  taskItem: { flexDirection: 'row', alignItems: 'center' },
  taskTextContainer: { marginLeft: 15, flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  taskDesc: { fontSize: 14, color: '#777', marginTop: 2 },
  badgeContainer: { position: 'absolute', top: -5, right: -5, backgroundColor: '#ef4444', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#fff', zIndex: 10 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 4 }
});