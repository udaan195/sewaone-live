import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Heart, Home, GraduationCap, Sprout, Coins, MoreHorizontal } from 'lucide-react-native';

export default function GovtSchemesMenu({ navigation }) {
  const menuItems = [
    { name: 'Farmers', icon: <Sprout color="#16a34a" size={32} />, desc: 'Kisan Samman Nidhi', color: '#dcfce7', subCat: 'Farmers' },
    { name: 'Housing', icon: <Home color="#ea580c" size={32} />, desc: 'PM Awas Yojana', color: '#ffedd5', subCat: 'Housing' },
    { name: 'Health', icon: <Heart color="#dc2626" size={32} />, desc: 'Ayushman Bharat', color: '#fee2e2', subCat: 'Health' },
    { name: 'Students', icon: <GraduationCap color="#2563eb" size={32} />, desc: 'Scholarships', color: '#eff6ff', subCat: 'Students/Youth' },
    { name: 'Pension', icon: <Coins color="#9333ea" size={32} />, desc: 'Old Age / Widow', color: '#f3e8ff', subCat: 'Pension' },
    { name: 'Women', icon: <Heart color="#db2777" size={32} />, desc: 'Ladli Behna / Others', color: '#fdf2f8', subCat: 'Women' },
    { name: 'All Schemes', icon: <MoreHorizontal color="#6b7280" size={32} />, desc: 'View All', color: '#f3f4f6', subCat: null },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}><ArrowLeft color="#1f2937" size={24} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Government Schemes</Text>
      </View>
      <ScrollView contentContainerStyle={styles.gridContainer}>
        <View style={styles.grid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.card} onPress={() => navigation.navigate('ServiceList', { category: 'Government Scheme', subCategory: item.subCat })}>
              <View style={[styles.iconBox, { backgroundColor: item.color }]}>{item.icon}</View>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardDesc}>{item.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  gridContainer: { padding: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 15, alignItems: 'center', marginBottom: 15, elevation: 2 },
  iconBox: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  cardDesc: { fontSize: 11, color: '#666', textAlign: 'center', marginTop: 2 }
});