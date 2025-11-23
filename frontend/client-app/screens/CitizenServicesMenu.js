import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, UserCheck, FileBadge, Car, Shield, MoreHorizontal } from 'lucide-react-native';

export default function CitizenServicesMenu({ navigation }) {
  
  const menuItems = [
    { name: 'Identity Proof', icon: <UserCheck color="#2563eb" size={32} />, desc: 'PAN, Aadhar, Voter ID', color: '#eff6ff', subCat: 'Identity Proof' },
    { name: 'Certificates', icon: <FileBadge color="#e11d48" size={32} />, desc: 'Birth, Caste, Income', color: '#ffe4e6', subCat: 'Certificates' },
    { name: 'Transport', icon: <Car color="#d97706" size={32} />, desc: 'Driving License, RC', color: '#fef3c7', subCat: 'Transport/Driving' },
    { name: 'Legal & Police', icon: <Shield color="#16a34a" size={32} />, desc: 'Verification, FIR', color: '#dcfce7', subCat: 'Police/Legal' },
    { name: 'Others', icon: <MoreHorizontal color="#6b7280" size={32} />, desc: 'Misc Services', color: '#f3f4f6', subCat: 'Others' },
    { name: 'View All', icon: <MoreHorizontal color="#333" size={32} />, desc: 'All Services', color: '#e5e7eb', subCat: null },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}><ArrowLeft color="#1f2937" size={24} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Citizen Services</Text>
      </View>
      <ScrollView contentContainerStyle={styles.listContainer}>
        <Text style={styles.subTitle}>Select Category</Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity 
            key={index} style={styles.card}
            onPress={() => navigation.navigate('ServiceList', { category: 'Citizen Service', subCategory: item.subCat })}
          >
            <View style={[styles.iconBox, { backgroundColor: item.color }]}>{item.icon}</View>
            <View style={{flex:1}}><Text style={styles.cardTitle}>{item.name}</Text><Text style={styles.cardDesc}>{item.desc}</Text></View>
            <Text style={{color:'#ccc', fontSize:20}}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  listContainer: { padding: 20 },
  subTitle: { fontSize: 16, color: '#6b7280', marginBottom: 15, fontWeight: '600' },
  card: { flexDirection:'row', alignItems:'center', backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 12, elevation: 2 },
  iconBox: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cardDesc: { fontSize: 12, color: '#6b7280', marginTop: 2 }
});