import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, Calendar, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import API_URL from '../config/api';

export default function ApplicationScreen({ navigation }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Screen focus hone par refresh karein
  useFocusEffect(
    useCallback(() => {
      fetchApplications();
    }, [])
  );

  const fetchApplications = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_URL}/applications/my-history`, {
        method: 'GET',
        headers: { 'x-auth-token': token }
      });
      const data = await response.json();
      setApps(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchApplications();
  };

  // Status ke hisaab se color aur icon
  const getStatusUI = (status) => {
    switch(status) {
      case 'Completed': return { color: '#10b981', icon: <CheckCircle size={14} color="#fff"/>, bg: '#10b981' };
      case 'Rejected': return { color: '#ef4444', icon: <XCircle size={14} color="#fff"/>, bg: '#ef4444' };
      case 'Processing': return { color: '#f59e0b', icon: <Clock size={14} color="#fff"/>, bg: '#f59e0b' };
      default: return { color: '#6b7280', icon: <AlertCircle size={14} color="#fff"/>, bg: '#9ca3af' };
    }
  };

  const renderItem = ({ item }) => {
    const statusUI = getStatusUI(item.status);
    
    return (
      
        <TouchableOpacity 
  style={styles.card}
  onPress={() => navigation.navigate('UserAppDetails', { applicationId: item._id })} // Yahan change kiya
>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orgName}>
        {item.jobId?.organization || "Citizen Service"}
    </Text>
    <Text style={styles.jobTitle}>
        {item.jobId?.title || "Unknown Service"}
    </Text>
  </View>
          <View style={[styles.statusBadge, { backgroundColor: statusUI.bg }]}>
            {statusUI.icon}
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View style={styles.metaRow}>
            <FileText size={14} color="#6b7280" />
            <Text style={styles.metaText}>ID: {item.trackingId}</Text>
          </View>
          <View style={styles.metaRow}>
            <Calendar size={14} color="#6b7280" />
            <Text style={styles.metaText}>Applied: {new Date(item.appliedAt).toLocaleDateString()}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Applications</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>
      ) : (
        <FlatList
          data={apps}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <FileText size={48} color="#ccc" />
              <Text style={styles.emptyText}>No applications found.</Text>
              <TouchableOpacity style={styles.findBtn} onPress={() => navigation.navigate('Home')}>
                <Text style={styles.findBtnText}>Find Jobs</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937' },
  list: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orgName: { fontSize: 12, color: '#6b7280', fontWeight: '600', marginBottom: 4 },
  jobTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', width: 200 },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 4 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  
  divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 12 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: '#6b7280' },

  emptyText: { marginTop: 10, fontSize: 16, color: '#6b7280' },
  findBtn: { marginTop: 20, backgroundColor: '#2563eb', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  findBtnText: { color: '#fff', fontWeight: 'bold' }
});