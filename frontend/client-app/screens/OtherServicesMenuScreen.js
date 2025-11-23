import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Landmark, Briefcase, Calculator, FileBadge, ShieldCheck, MoreHorizontal } from 'lucide-react-native';

export default function OtherServicesMenuScreen({ navigation }) {

  const menuItems = [
    { name: 'PF / EPFO Services', icon: <Landmark color="#e11d48" size={32} />, category: 'PF Service', color: '#ffe4e6' },
    { name: 'Income Tax (ITR)', icon: <Calculator color="#16a34a" size={32} />, category: 'Tax Service', color: '#dcfce7' },
    { name: 'GST & Business', icon: <Briefcase color="#2563eb" size={32} />, category: 'Business Service', color: '#dbeafe' },
    { name: 'Licenses (Food/Shop)', icon: <FileBadge color="#d97706" size={32} />, category: 'Business Service', color: '#fef3c7' }, // Same category
    { name: 'Insurance', icon: <ShieldCheck color="#9333ea" size={32} />, category: 'Other', color: '#f3e8ff' },
    { name: 'More Services', icon: <MoreHorizontal color="#6b7280" size={32} />, category: 'Other', color: '#f3f4f6' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color="#1f2937" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>More Services</Text>
      </View>

      <ScrollView contentContainerStyle={styles.gridContainer}>
        <Text style={styles.subTitle}>Select a service category</Text>
        
        <View style={styles.grid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.card} 
              onPress={() => navigation.navigate('ServiceList', { category: item.category })}
            >
              <View style={[styles.iconBox, { backgroundColor: item.color }]}>
                {item.icon}
              </View>
              <Text style={styles.cardText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  gridContainer: { padding: 20 },
  subTitle: { fontSize: 16, color: '#6b7280', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 15 },
  card: { width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 15, elevation: 3 },
  iconBox: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardText: { fontSize: 13, fontWeight: '600', color: '#374151', textAlign: 'center' },
});