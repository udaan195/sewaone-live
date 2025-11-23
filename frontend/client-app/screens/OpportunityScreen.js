import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, Briefcase, CheckCircle, AlertTriangle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import API_URL from '../config/api';

export default function OpportunityScreen({ navigation }) {
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchOpportunities();
    }, [])
  );

  const fetchOpportunities = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      // Jobs
      const jobsRes = await fetch(`${API_URL}/jobs/all`);
      const allJobs = await jobsRes.json();

      // User Profile
      const profileRes = await fetch(`${API_URL}/auth/me`, { headers: { 'x-auth-token': token } });
      const userData = await profileRes.json();
      const userAnswers = userData.userProfileData || {};

      // Applications
      const appsRes = await fetch(`${API_URL}/applications/my-history`, { headers: { 'x-auth-token': token } });
      const myApps = await appsRes.json();
      
      // --- FIX: Handle null jobId ---
      const appliedJobIds = new Set(
        myApps
        .filter(app => app.jobId) // Filter out bad apps
        .map(app => app.jobId._id || app.jobId)
      );

      const validJobs = allJobs.map(job => {
          const criteria = job.eligibilityCriteria || [];
          let isEligible = true;
          if (criteria.length > 0) {
              for (let crit of criteria) {
                  if (userAnswers[crit.key] !== crit.expectedValue) {
                      isEligible = false; break; 
                  }
              }
          }
          const isApplied = appliedJobIds.has(job._id);
          return { ...job, isEligible, isApplied };
      }).filter(job => job.isEligible);

      setMatchedJobs(validJobs);

    } catch (error) { console.error(error); } finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = () => { setRefreshing(true); fetchOpportunities(); };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={[styles.card, item.isApplied && styles.cardApplied]} onPress={() => navigation.navigate('JobDetails', { job: item })}>
      <View style={styles.cardHeader}>
        <View style={styles.matchBadge}><Sparkles size={12} color="#fff" /><Text style={styles.matchText}>Profile Matched</Text></View>
        {item.isApplied && <View style={styles.appliedBadge}><Text style={styles.appliedText}>ALREADY APPLIED</Text></View>}
      </View>
      <View style={styles.contentRow}><View style={styles.iconBox}><Briefcase size={20} color="#2563eb" /></View><View style={{flex: 1}}><Text style={styles.orgName}>{item.organization}</Text><Text style={styles.jobTitle}>{item.title}</Text></View></View>
      <View style={styles.footer}>{item.isApplied ? <Text style={{color: '#ef4444', fontSize: 12, fontWeight: 'bold'}}>Application Submitted</Text> : <Text style={{color: '#10b981', fontSize: 12, fontWeight: 'bold'}}>You are eligible! Apply now.</Text>}</View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}><Text style={styles.headerTitle}>My Opportunities</Text><Text style={styles.subTitle}>Jobs matching your profile</Text></View>
      {loading ? <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View> : <FlatList data={matchedJobs} renderItem={renderItem} keyExtractor={item => item._id} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} ListEmptyComponent={<View style={styles.center}><AlertTriangle size={48} color="#ccc" /><Text style={styles.emptyText}>No matching jobs found.</Text></View>} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937' },
  subTitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  list: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, borderWidth: 1, borderColor: 'transparent' },
  cardApplied: { borderColor: '#fca5a5', backgroundColor: '#fef2f2' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  matchBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#8b5cf6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  matchText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  appliedBadge: { backgroundColor: '#ef4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  appliedText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  contentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 40, height: 40, backgroundColor: '#eff6ff', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  orgName: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  jobTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  footer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  emptyText: { marginTop: 10, fontSize: 16, color: '#6b7280' },
});