import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageSquare, Search, HelpCircle, ChevronDown, ChevronUp, Clock, CheckCircle, RefreshCw } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from '../config/api';

export default function HelpScreen() {
  const [activeTab, setActiveTab] = useState('FAQ'); // Default Tab: FAQ, Submit, History
  
  // --- Submit Form States ---
  const [trackingId, setTrackingId] = useState('');
  const [category, setCategory] = useState('Status Inquiry');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // --- History States ---
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const categories = ["Status Inquiry", "Payment Issue", "Correction Request", "Other"];

  // --- FAQ Data (Static) ---
  const faqs = [
    { q: "Meri application 'Pending' kyu hai?", a: "Agent verification mein 24-48 ghante lag sakte hain. Kripya dhairya rakhein." },
    { q: "Payment fail ho gaya, paise kat gaye?", a: "Agar paise kat gaye hain, to 30 minute intezaar karein. Agar update na ho to 'Payment Issue' select karke request daalein." },
    { q: "Kya main document baad mein change kar sakta hu?", a: "Sirf tab tak jab tak status 'Processing' mein hai. Ek baar 'Completed' hone par change nahi ho sakta." },
    { q: "Refund policy kya hai?", a: "Agar form nahi bhara gaya to 100% refund 3-5 working days mein milega." },
  ];

  // --- 1. Fetch History ---
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_URL}/help/my-history`, {
        headers: { 'x-auth-token': token }
      });
      const data = await res.json();
      setHistory(data);
    } catch (e) { console.error(e); } 
    finally { setLoadingHistory(false); }
  };

  // Tab change hone par data load karein
  useEffect(() => {
    if (activeTab === 'History') fetchHistory();
  }, [activeTab]);

  // --- 2. Submit Logic ---
  const handleSubmit = async () => {
    if (!trackingId || !description) return Alert.alert("Error", "Details bharein.");
    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_URL}/help/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ trackingId, issueCategory: category, description })
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert("Success", "Request Sent!");
        setTrackingId(''); setDescription('');
        setActiveTab('History'); // Auto-switch to history
      } else {
        Alert.alert("Error", data.msg);
      }
    } catch (e) { Alert.alert("Error", "Network Error"); } 
    finally { setSubmitting(false); }
  };

  // --- RENDER: FAQ Tab ---
  const renderFAQ = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
       {faqs.map((item, i) => (
         <View key={i} style={styles.faqCard}>
            <Text style={styles.faqQ}>Q: {item.q}</Text>
            <Text style={styles.faqA}>{item.a}</Text>
         </View>
       ))}
       <View style={{height:100}}/>
    </ScrollView>
  );

  // --- RENDER: Submit Tab ---
  const renderSubmit = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBox}>
            <HelpCircle color="#2563eb" size={24} style={{marginBottom:5}}/>
            <Text style={{color:'#1e3c72'}}>Tracking ID ka upyog karke Admin se sampark karein.</Text>
        </View>

        <View style={styles.formCard}>
            <Text style={styles.label}>Tracking ID</Text>
            <TextInput style={styles.input} placeholder="Ex: SEWA-12345" value={trackingId} onChangeText={setTrackingId} autoCapitalize="characters"/>

            <Text style={styles.label}>Category</Text>
            <View style={styles.catRow}>
                {categories.map(c => (
                    <TouchableOpacity key={c} style={[styles.catBtn, category === c && styles.catSel]} onPress={() => setCategory(c)}>
                        <Text style={[styles.catText, category === c && {color:'#fff'}]}>{c}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput style={[styles.input, {height: 100, textAlignVertical: 'top'}]} placeholder="Apni samasya likhein..." value={description} onChangeText={setDescription} multiline />

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff"/> : <Text style={styles.btnText}>Submit Request</Text>}
            </TouchableOpacity>
        </View>
    </ScrollView>
  );

  // --- RENDER: History Tab ---
  const renderHistory = () => (
    <View style={styles.tabContent}>
       {loadingHistory ? (
           <ActivityIndicator size="large" color="#2563eb" style={{marginTop:20}}/>
       ) : history.length === 0 ? (
           <Text style={{textAlign:'center', marginTop:20, color:'#666'}}>No history found.</Text>
       ) : (
           <FlatList
             data={history}
             keyExtractor={item => item._id}
             showsVerticalScrollIndicator={false}
             renderItem={({item}) => (
                <View style={styles.historyCard}>
                    <View style={styles.histHeader}>
                        <Text style={{fontWeight:'bold', color:'#2563eb'}}>{item.trackingId}</Text>
                        <View style={[styles.statusBadge, {backgroundColor: item.status==='Resolved'?'#dcfce7':'#fee2e2'}]}>
                            {item.status==='Resolved' ? <CheckCircle size={12} color="green"/> : <Clock size={12} color="#dc2626"/>}
                            <Text style={{fontSize:10, fontWeight:'bold', marginLeft:4, color: item.status==='Resolved'?'green':'#dc2626'}}>{item.status}</Text>
                        </View>
                    </View>
                    <Text style={{fontSize:12, color:'#666', marginTop:5}}>Category: {item.issueCategory}</Text>
                    <Text style={styles.histDesc}>{item.description}</Text>
                    
                    {/* Admin Response */}
                    {item.adminResponse && (
                        <View style={styles.adminReplyBox}>
                            <Text style={{fontWeight:'bold', fontSize:12, color:'#166534'}}>Admin Reply:</Text>
                            <Text style={{fontSize:13, color:'#333'}}>{item.adminResponse}</Text>
                        </View>
                    )}
                    
                    <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleString()}</Text>
                </View>
             )}
           />
       )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Help Center</Text>
      </View>

      {/* --- TABS --- */}
      <View style={styles.tabBar}>
         <TouchableOpacity onPress={()=>setActiveTab('FAQ')} style={[styles.tabItem, activeTab==='FAQ' && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab==='FAQ' && styles.textActive]}>FAQ</Text>
         </TouchableOpacity>
         <TouchableOpacity onPress={()=>setActiveTab('Submit')} style={[styles.tabItem, activeTab==='Submit' && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab==='Submit' && styles.textActive]}>New Request</Text>
         </TouchableOpacity>
         <TouchableOpacity onPress={()=>setActiveTab('History')} style={[styles.tabItem, activeTab==='History' && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab==='History' && styles.textActive]}>My History</Text>
         </TouchableOpacity>
      </View>

      <View style={{flex:1, backgroundColor:'#f3f4f6'}}>
         {activeTab === 'FAQ' && renderFAQ()}
         {activeTab === 'Submit' && renderSubmit()}
         {activeTab === 'History' && renderHistory()}
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937' },
  
  // Tabs
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  tabItem: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderColor: '#2563eb' },
  tabText: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  textActive: { color: '#2563eb' },
  tabContent: { padding: 16, flex: 1 },

  // FAQ
  faqCard: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 1 },
  faqQ: { fontSize: 15, fontWeight: 'bold', color: '#374151', marginBottom: 5 },
  faqA: { fontSize: 14, color: '#6b7280', lineHeight: 20 },

  // Form
  infoBox: { padding: 15, backgroundColor: '#eff6ff', borderRadius: 8, marginBottom: 20 },
  formCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12, elevation: 2 },
  label: { fontWeight: 'bold', marginBottom: 8, color: '#374151', marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#f9fafb' },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  catBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: '#d1d5db' },
  catSel: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  catText: { color: '#6b7280', fontSize: 12 },
  submitBtn: { backgroundColor: '#10b981', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // History
  historyCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 12, elevation: 1 },
  histHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  histDesc: { fontSize: 14, color: '#374151', marginTop: 5, fontStyle: 'italic' },
  adminReplyBox: { marginTop: 10, backgroundColor: '#f0fdf4', padding: 10, borderRadius: 6, borderLeftWidth: 3, borderLeftColor: '#166534' },
  dateText: { fontSize: 10, color: '#9ca3af', marginTop: 10, textAlign: 'right' }
});