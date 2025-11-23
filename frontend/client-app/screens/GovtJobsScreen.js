import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Briefcase, Calendar, Search, X } from 'lucide-react-native';
import API_URL from '../config/api';

export default function GovtJobsScreen({ navigation }) {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]); // Search result ke liye
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = async () => {
    try {
      const response = await fetch(`${API_URL}/jobs/all`);
      const data = await response.json();
      setJobs(data);
      setFilteredJobs(data); // Shuru mein sab dikhao
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // --- SEARCH LOGIC ---
  const handleSearch = (text) => {
    setSearchText(text);
    if (text) {
      const newData = jobs.filter(item => {
        const itemData = `${item.title.toUpperCase()} ${item.organization.toUpperCase()}`;
        const textData = text.toUpperCase();
        return itemData.indexOf(textData) > -1;
      });
      setFilteredJobs(newData);
    } else {
      setFilteredJobs(jobs);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('JobDetails', { job: item })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <Briefcase color="#2563eb" size={20} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.orgName}>{item.organization}</Text>
          <Text style={styles.jobTitle} numberOfLines={2}>{item.title}</Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Calendar color="#6b7280" size={14} />
        <Text style={styles.dateText}>
          Posted: {new Date(item.postedAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color="#1f2937" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Government Jobs</Text>
      </View>

      {/* --- SEARCH BAR --- */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
            <Search size={20} color="#9ca3af" />
            <TextInput 
                style={styles.searchInput}
                placeholder="Search by Title or Department..."
                value={searchText}
                onChangeText={handleSearch}
            />
            {searchText ? (
                <TouchableOpacity onPress={() => handleSearch('')}>
                    <X size={20} color="#9ca3af" />
                </TouchableOpacity>
            ) : null}
        </View>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredJobs}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.centerEmpty}>
                <Text style={styles.emptyText}>No jobs found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  
  // Search Styles
  searchContainer: { padding: 16, backgroundColor: '#fff', paddingBottom: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 12, height: 45 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#374151' },

  listContainer: { padding: 16 },
  centerEmpty: { alignItems: 'center', marginTop: 50 },
  
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', marginBottom: 12 },
  iconBox: { width: 40, height: 40, backgroundColor: '#eff6ff', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardContent: { flex: 1 },
  orgName: { fontSize: 12, color: '#6b7280', fontWeight: '600', marginBottom: 2 },
  jobTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  
  cardFooter: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 8 },
  dateText: { fontSize: 12, color: '#6b7280', marginLeft: 6 },
  emptyText: { color: '#6b7280', fontSize: 16 }
});