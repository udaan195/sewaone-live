import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, Info, CheckCircle, AlertTriangle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from '../config/api';

export default function NotificationScreen({ navigation }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
        await fetchNotifications();
        await markAsRead();
    };
    init();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) { setLoading(false); return; }

      const res = await fetch(`${API_URL}/auth/my-notifications`, {
        headers: { 'x-auth-token': token }
      });

      if (res.ok) {
        setList(await res.json());
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // --- Mark Bell Notifications as Read ---
  const markAsRead = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        await fetch(`${API_URL}/auth/mark-read`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
            body: JSON.stringify({ category: 'notifications' })
        });
      } catch(e){}
  };

  const getIcon = (type) => {
      switch(type) {
          case 'alert': return <AlertTriangle size={24} color="#ef4444" />;
          case 'success': return <CheckCircle size={24} color="#10b981" />;
          default: return <Info size={24} color="#3b82f6" />;
      }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, item.isRead ? styles.readCard : styles.unreadCard]}>
        <View style={styles.iconBox}>{getIcon(item.type)}</View>
        <View style={{flex:1}}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
        </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft color="#1f2937" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color="#2563eb"/></View>
      ) : (
          <FlatList
            data={list}
            keyExtractor={item => item._id}
            contentContainerStyle={{padding: 16}}
            renderItem={renderItem}
            ListEmptyComponent={
                <View style={styles.center}>
                    <Bell size={48} color="#e5e7eb" />
                    <Text style={styles.emptyText}>No notifications yet.</Text>
                </View>
            }
          />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  card: { flexDirection: 'row', padding: 16, borderRadius: 12, marginBottom: 12, backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  unreadCard: { borderLeftWidth: 4, borderLeftColor: '#2563eb' },
  readCard: { opacity: 0.7 },
  iconBox: { marginRight: 15, justifyContent: 'flex-start', marginTop: 2 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  message: { fontSize: 14, color: '#4b5563', lineHeight: 20 },
  date: { fontSize: 11, color: '#9ca3af', marginTop: 8, textAlign: 'right' },
  emptyText: { color: '#374151', marginTop: 15, fontSize: 18, fontWeight: 'bold' }
});