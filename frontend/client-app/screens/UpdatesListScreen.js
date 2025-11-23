import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, ActivityIndicator, StatusBar, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ExternalLink, Bell, FileText, Search, X } from 'lucide-react-native';
import API_URL from '../config/api';

export default function UpdatesListScreen({ route, navigation }) {
  const { category } = route.params; 
  
  const [list, setList] = useState([]);
  const [filteredList, setFilteredList] = useState([]); // Search ke liye alag state
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const res = await fetch(`${API_URL}/updates/get/${category}`);
        const data = await res.json();
        setList(data);
        setFilteredList(data); // Shuru mein sab dikhao
      } catch (e) { 
        console.error("Error fetching updates:", e); 
      } finally { 
        setLoading(false); 
      }
    };

    fetchUpdates();
  }, [category]);

  // --- SEARCH LOGIC ---
  const handleSearch = (text) => {
    setSearchText(text);
    if (text) {
      const newData = list.filter(item => {
        const itemData = item.title.toUpperCase();
        const textData = text.toUpperCase();
        return itemData.indexOf(textData) > -1;
      });
      setFilteredList(newData);
    } else {
      setFilteredList(list);
    }
  };

  const openLink = (url) => {
    if (url) {
        Linking.openURL(url).catch(e => console.error("Link Error:", e));
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openLink(item.link)}>
       <View style={styles.iconBox}>
           <FileText color="#2563eb" size={24} />
       </View>
       
       <View style={styles.contentBox}>
           <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
           <Text style={styles.date}>Posted: {new Date(item.postedAt).toLocaleDateString()}</Text>
           
           {item.customFields && item.customFields.length > 0 && (
               <View style={styles.metaTags}>
                   {item.customFields.map((f, i) => (
                       <Text key={i} style={styles.tag}>{f.label}: {f.value}</Text>
                   ))}
               </View>
           )}
       </View>
       
       <ExternalLink color="#9ca3af" size={20} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
           <ArrowLeft color="#1f2937" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category}</Text>
      </View>

      {/* --- SEARCH BAR --- */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
            <Search size={20} color="#9ca3af" />
            <TextInput 
                style={styles.searchInput}
                placeholder={`Search ${category}...`}
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

      {/* Content */}
      {loading ? (
          <View style={styles.center}>
              <ActivityIndicator size="large" color="#2563eb"/>
              <Text style={{marginTop: 10, color: '#666'}}>Loading updates...</Text>
          </View>
      ) : (
          <FlatList
            data={filteredList} // Filtered list use karein
            renderItem={renderItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
                <View style={styles.center}>
                    <Bell size={48} color="#e5e7eb" />
                    <Text style={styles.emptyTitle}>No Results Found</Text>
                    <Text style={styles.emptyDesc}>
                        {searchText ? `No updates matching "${searchText}"` : `Currently no active updates in ${category}.`}
                    </Text>
                </View>
            }
          />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  
  header: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      padding: 16, 
      backgroundColor: '#fff', 
      borderBottomWidth: 1, 
      borderBottomColor: '#e5e7eb' 
  },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },

  // Search Styles (Added)
  searchContainer: { padding: 16, backgroundColor: '#fff', paddingBottom: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 12, height: 45 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#374151' },
  
  listContainer: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  
  card: {
      backgroundColor: '#fff', 
      padding: 16, 
      borderRadius: 12, 
      marginBottom: 12,
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      borderWidth: 1,
      borderColor: '#f3f4f6'
  },
  iconBox: {
      width: 45,
      height: 45,
      backgroundColor: '#eff6ff',
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 15
  },
  contentBox: { flex: 1, marginRight: 10 },
  title: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  date: { fontSize: 12, color: '#6b7280' },
  
  metaTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 6 },
  tag: { 
      fontSize: 10, 
      color: '#4b5563', 
      backgroundColor: '#f3f4f6', 
      paddingHorizontal: 6, 
      paddingVertical: 2, 
      borderRadius: 4 
  },

  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginTop: 15 },
  emptyDesc: { fontSize: 14, color: '#9ca3af', marginTop: 5, textAlign: 'center', paddingHorizontal: 40 }
});