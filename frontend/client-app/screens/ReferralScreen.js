import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Copy, Share2, Gift } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import API_URL from '../config/api';

export default function ReferralScreen({ navigation }) {
  const [myCode, setMyCode] = useState('Loading...');
  const [earnings, setEarnings] = useState(0);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        const res = await fetch(`${API_URL}/auth/me`, { headers: { 'x-auth-token': token } });
        const data = await res.json();
        setMyCode(data.referralCode || 'Generate on First Login');
        
        // Earnings calculate karne ke liye hum wallet history check kar sakte hain
        // Ya user model mein 'totalReferralEarnings' field bana sakte hain
        // Abhi ke liye dummy
    } catch(e) {}
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: `Hey! I use SewaOne for all government forms. It's super easy.\n\nUse my code *${myCode}* to get ₹20 FREE in your wallet!\n\nDownload App: https://sewaone.com/download`, // Yahan baad mein Play Store link aayega
      });
    } catch (error) {
      alert(error.message);
    }
  };

  const copyCode = async () => {
      await Clipboard.setStringAsync(myCode);
      alert("Code Copied!");
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3c72" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft color="#fff" size={24} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Refer & Earn</Text>
      </View>

      <View style={styles.content}>
         {/* Hero Image Area */}
         <View style={styles.heroBox}>
             <Gift size={80} color="#f59e0b" />
             <Text style={styles.heroTitle}>Invite Friends, Get ₹20</Text>
             <Text style={styles.heroDesc}>Share your code with friends. When they register using your code, both of you get ₹20 in Sewa Wallet!</Text>
         </View>

         {/* Code Box */}
         <View style={styles.codeCard}>
             <Text style={styles.codeLabel}>Your Referral Code</Text>
             <TouchableOpacity style={styles.codeBox} onPress={copyCode}>
                 <Text style={styles.codeText}>{myCode}</Text>
                 <Copy size={20} color="#2563eb" />
             </TouchableOpacity>
             <Text style={{fontSize:12, color:'#999', marginTop:5}}>Tap to copy</Text>
         </View>

         {/* Share Button */}
         <TouchableOpacity style={styles.shareBtn} onPress={onShare}>
             <Share2 color="#fff" size={20} />
             <Text style={styles.shareText}>Share with Friends</Text>
         </TouchableOpacity>

         {/* How it works */}
         <View style={styles.stepsBox}>
             <Text style={styles.stepsTitle}>How it works?</Text>
             <Text style={styles.stepItem}>1. Share your code via WhatsApp/SMS.</Text>
             <Text style={styles.stepItem}>2. Friend registers using your code.</Text>
             <Text style={styles.stepItem}>3. You both get ₹20 instantly!</Text>
         </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#1e3c72' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginLeft: 10 },
  content: { padding: 20, alignItems: 'center' },
  heroBox: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  heroTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e3c72', marginTop: 10 },
  heroDesc: { textAlign: 'center', color: '#6b7280', marginTop: 10, lineHeight: 20 },
  
  codeCard: { width: '100%', backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 3, alignItems: 'center', marginBottom: 20 },
  codeLabel: { fontSize: 14, color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', fontWeight: 'bold' },
  codeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, borderStyle: 'dashed', borderWidth: 2, borderColor: '#2563eb', gap: 10 },
  codeText: { fontSize: 24, fontWeight: 'bold', color: '#2563eb', letterSpacing: 2 },
  
  shareBtn: { width: '100%', backgroundColor: '#10b981', padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, elevation: 2 },
  shareText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  stepsBox: { width: '100%', marginTop: 30, padding: 15, backgroundColor: '#fff', borderRadius: 12 },
  stepsTitle: { fontWeight: 'bold', marginBottom: 10, fontSize: 16 },
  stepItem: { color: '#4b5563', marginBottom: 5 }
});