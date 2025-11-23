import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, X, Layers, FileText, Calendar, Clock, CreditCard, UserCheck, ChevronRight } from 'lucide-react-native';
import API_URL from '../config/api';

export default function ServiceListScreen({ route, navigation }) {
  const category = route.params?.category || "Government Job";
  const subCategory = route.params?.subCategory;

  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]); 
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [isModuleReady, setIsModuleReady] = useState(true); 

  const getIcon = (title) => {
      const t = title.toLowerCase();
      if (t.includes('pan') || t.includes('aadhar')) return <CreditCard color="#fff" size={24} />;
      if (t.includes('passport') || t.includes('license')) return <UserCheck color="#fff" size={24} />;
      if (t.includes('scheme') || t.includes('yojna')) return <Layers color="#fff" size={24} />;
      return <FileText color="#fff" size={24} />;
  };

  const fetchServices = async () => {
    try {
      let endpoint = '';
      const isJobType = category === 'Private Job' || category === 'Government Job';
      
      const statusRes = await fetch(`${API_URL}/services/status/${encodeURIComponent(category)}`);
      if(statusRes.ok) {
          const statusData = await statusRes.json();
          setIsModuleReady(statusData.isReady);
      }

      endpoint = isJobType 
        ? `${API_URL}/jobs/category/${encodeURIComponent(category)}` 
        : `${API_URL}/services/category/${encodeURIComponent(category)}`;
      
      const response = await fetch(endpoint);
      if(response.ok) {
          let data = await response.json();
          
          if (subCategory && subCategory !== 'View All') {
              data = data.filter(item => item.subCategory === subCategory);
          }

          setItems(data);
          setFilteredItems(data);
      }
    } catch (error) { console.error("Error fetching services:", error); } 
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchServices(); }, [category, subCategory]);

  const handleSearch = (text) => {
    setSearchText(text);
    if (text) {
      const newData = items.filter(item => item.title.toUpperCase().includes(text.toUpperCase()));
      setFilteredItems(newData);
    } else {
      setFilteredItems(items);
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchServices(); };
  
  const navigateToDetails = (item) => {
      if (item.category === 'Citizen Service' || item.category === 'Government Scheme' || item.category === 'Other') {
          navigation.navigate('ServiceDetails', { service: item });
      } else {
          navigation.navigate('JobDetails', { job: item });
      }
  };

  const renderItem = ({ item }) => {
    const totalFee = (item.officialFee || 0) + (item.serviceCharge || 50);

    return (
      <View style={styles.card}>
        {/* TOP SECTION (INFO) - CLICKABLE FOR DETAILS */}
        <TouchableOpacity 
             style={styles.cardHeader} 
             activeOpacity={0.8}
             onPress={() => navigateToDetails(item)}
        >
          <View style={[styles.iconBox, { backgroundColor: '#2563eb' }]}>
            {getIcon(item.title)}
          </View>
          
          <View style={styles.cardContent}>
            <Text style={styles.serviceTitle} numberOfLines={2}>
                {item.title || "Service Title Missing"}
            </Text>
            <Text style={styles.orgName}>
                {item.organization || "SewaOne Service"}
            </Text>
          </View>
        </TouchableOpacity>
        
        {/* FOOTER SECTION (ACTION TEXT & FEE) */}
        <View style={styles.cardFooter}>
          {/* Left Side (Date & Fee) */}
          <View style={styles.footerLeft}>
              <Calendar color="#6b7280" size={14} />
              <Text style={styles.dateText}>
                Posted: {new Date(item.createdAt || item.postedAt).toLocaleDateString()}
              </Text>
              
              <View style={styles.priceBadge}>
                  <Text style={styles.priceText}>Fees: ₹{totalFee}</Text>
              </View>
          </View>
          
          {/* Right Side (Apply Text Clickable) */}
          <TouchableOpacity 
             style={styles.applyLinkContainer}
             onPress={() => navigateToDetails(item)}
          >
             <Text style={styles.applyLink}>Apply Now</Text>
             <ChevronRight size={16} color="#2563eb" />
          </TouchableOpacity>
          
        </View>
      </View>
    );
  };
  
  if (!isModuleReady && !loading) {
       return (
           <View style={styles.centerFull}>
               <Clock size={60} color="#f59e0b" />
               <Text style={styles.emptyTitle}>Coming Soon</Text>
               <Text style={styles.emptySub}>This section is under setup and will be available soon.</Text>
           </View>
       );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color="#1f2937" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{subCategory || category}</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search...`}
            value={searchText}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />
      ) : (
          <FlatList
            data={filteredItems}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
                <View style={styles.centerEmpty}>
                    <Layers size={40} color="#ccc"/>
                    <Text style={styles.emptyText}>No services found.</Text>
                    <Text style={styles.emptySub}>Admin will add services soon.</Text>
                </View>
            }
          />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centerFull: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f293b' },
  searchContainer: { padding: 16, backgroundColor: '#fff', paddingBottom: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 12, height: 50 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#334155' },
  listContainer: { padding: 16 },
  centerEmpty: { alignItems: 'center', marginTop: 80, padding: 20 },
  
  // Card Styles
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#ececec',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  cardContent: { flex: 1 },

  serviceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },

  orgName: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },

  
  // FOOTER SECTION
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },

  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },

  dateText: {
    fontSize: 11,
    color: '#6b7280',
  },

  priceBadge: {
    backgroundColor: '#e0fbea',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  priceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803d',
  },

  // Old button styles (agar kahin aur use karna ho to)
  applyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#2563eb',
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderRadius: 8,
      elevation: 2
  },
  applyBtnText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 13,
      marginRight: 5
  },

  // New Apply text link
  applyLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  applyLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
    marginRight: 3,
  },


  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e3c72', marginTop: 15 },
  emptySub: { fontSize: 14, color: '#6b7280', marginTop: 5, textAlign: 'center' },
  emptyText: { fontSize: 16, color: '#6b7280', marginTop: 10 },
});