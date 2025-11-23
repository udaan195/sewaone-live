import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Briefcase, FileText, Award, Key, UserPlus, MoreHorizontal } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import API_URL from '../config/api';

export default function GovtJobsMenuScreen({ navigation }) {
  const [counts, setCounts] = useState({});

  useFocusEffect(
    useCallback(() => {
      const fetchCounts = async () => {
        try {
          const token = await AsyncStorage.getItem('userToken');
          const res = await fetch(`${API_URL}/auth/notifications`, { headers: { 'x-auth-token': token } });
          if(res.ok) setCounts(await res.json());
        } catch(e){}
      };
      fetchCounts();
    }, [])
  );

  const handleNavigation = async (item) => {
    if (item.target) {
      // 1. Navigate
      if (item.target === 'UpdatesList') {
         navigation.navigate('UpdatesList', { category: item.name });
      } else {
         navigation.navigate(item.target); // For 'Latest Jobs' -> GovtJobsScreen
      }

      // 2. Mark Read & Clear Badge Locally
      if (item.key) {
          setCounts(prev => ({ ...prev, [item.key + 'Count']: 0 })); // Optimistic UI update
          try {
            const token = await AsyncStorage.getItem('userToken');
            await fetch(`${API_URL}/auth/mark-read`, {
                method: 'PUT', 
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ category: item.key }) // e.g. 'jobs', 'admitCard'
            });
          } catch(e){}
      }
    } else {
      alert(`${item.name} section coming soon!`);
    }
  };

  const Badge = ({ count }) => {
      if (!count || count <= 0) return null;
      return (
          <View style={styles.badgeContainer}><Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text></View>
      );
  };

  // key must match backend keys (jobCount, admitCardCount etc.)
  const menuItems = [
    { name: 'Latest Jobs', icon: <Briefcase color="#2563eb" size={32} />, target: 'GovtJobs', color: '#eff6ff', key: 'jobs' }, 
    { name: 'Admit Card', icon: <FileText color="#db2777" size={32} />, target: 'UpdatesList', color: '#fdf2f8', key: 'admitCard' },
    { name: 'Results', icon: <Award color="#16a34a" size={32} />, target: 'UpdatesList', color: '#f0fdf4', key: 'results' },
    { name: 'Answer Key', icon: <Key color="#f59e0b" size={32} />, target: 'UpdatesList', color: '#fffbeb', key: 'answerKey' },
    { name: 'Admission', icon: <UserPlus color="#9333ea" size={32} />, target: 'UpdatesList', color: '#faf5ff', key: 'admission' },
    { name: 'Others', icon: <MoreHorizontal color="#6b7280" size={32} />, target: 'UpdatesList', color: '#f3f4f6', key: 'others' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}><ArrowLeft color="#1f2937" size={24} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Government Services</Text>
      </View>
      <ScrollView contentContainerStyle={styles.gridContainer}>
        <Text style={styles.subTitle}>Select a category</Text>
        <View style={styles.grid}>
          {menuItems.map((item, index) => {
             // Count key example: jobsCount, admitCardCount
             const countKey = item.key === 'jobs' ? 'jobCount' : item.key + 'Count';
             return (
                <TouchableOpacity key={index} style={styles.card} onPress={() => handleNavigation(item)}>
                <View style={[styles.iconBox, { backgroundColor: item.color }]}>
                    {item.icon}
                    <Badge count={counts[countKey]} />
                </View>
                <Text style={styles.cardText}>{item.name}</Text>
                </TouchableOpacity>
             );
          })}
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
  card: { width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  iconBox: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardText: { fontSize: 14, fontWeight: '600', color: '#374151', textAlign: 'center' },
  badgeContainer: { position: 'absolute', top: -2, right: -2, backgroundColor: '#ef4444', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#fff', zIndex: 10 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 4 }
});