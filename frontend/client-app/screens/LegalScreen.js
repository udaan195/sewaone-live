import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

export default function LegalScreen({ route, navigation }) {
  const { type } = route.params; // 'privacy' or 'terms'
  
  const title = type === 'privacy' ? "Privacy Policy" : "Terms & Conditions";
  
  // Dummy Content (Play Store ke liye ise asli text se badal lena)
  const content = type === 'privacy' 
    ? `Privacy Policy for SewaOne\n\nLast updated: November 2025\n\n1. Information We Collect\nWe collect your name, mobile number, and documents solely for the purpose of filling government forms.\n\n2. Document Security\nYour documents are stored securely and are only accessed by our verified agents.\n\n3. Data Sharing\nWe do not share your personal data with any third-party advertisers.`
    : `Terms & Conditions for SewaOne\n\n1. Service Usage\nBy using our app, you agree to provide accurate information for form filling.\n\n2. Payments\nPayments made for form filling are non-refundable once the form is processed.\n\n3. Liability\nSewaOne is an intermediary service. We are not responsible for rejection due to ineligibility.`;

  return (
    <SafeAreaView style={{flex:1, backgroundColor:'#fff'}} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={()=>navigation.goBack()}><ArrowLeft color="#000"/></TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
      </View>
      <ScrollView style={{padding:20}}>
        <Text style={styles.text}>{content}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  title: { fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  text: { fontSize: 16, lineHeight: 24, color: '#333' }
});