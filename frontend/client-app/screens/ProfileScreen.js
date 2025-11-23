import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StatusBar, Modal, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { User, MapPin, Mail, LogOut, Plus, CheckCircle, Edit3, Upload, X, Settings, Shield, FileText, ChevronRight, Gift } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker'; // PDF Support ke liye
import { Picker } from '@react-native-picker/picker';
import API_URL from '../config/api';

// Cloudinary Config
const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || "dxuurwexl"; 
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_UPLOAD_PRESET || "edusphere_uploads";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`; // 'auto' for PDF/Image

// ✅ Reusable Menu Row (icon + title + subtitle)
const MenuRow = ({ icon, title, subtitle, onPress }) => (
  <TouchableOpacity style={styles.menuRow} onPress={onPress}>
    {icon}
    <View style={{ flex: 1, marginLeft: 15 }}>
      <Text style={styles.menuText}>{title}</Text>
      {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
    </View>
    <ChevronRight size={20} color="#ccc" />
  </TouchableOpacity>
);

export default function ProfileScreen({ navigation, onLogout }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [masterDocs, setMasterDocs] = useState([]);

  // Modals
  const [showDocModal, setShowDocModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Forms
  const [newDocName, setNewDocName] = useState('');
  const [newDocFile, setNewDocFile] = useState(null); // { uri, type, name }
  const [newDataKey, setNewDataKey] = useState('');
  const [newDataValue, setNewDataValue] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', state: '', city: '', pincode: '' });

  useFocusEffect(
    useCallback(() => { fetchData(); }, [])
  );

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userRes = await fetch(`${API_URL}/auth/me`, { method: 'GET', headers: { 'x-auth-token': token } });
      const user = await userRes.json();
      setUserData(user);

      const masterRes = await fetch(`${API_URL}/admin/master-data/document`);
      if(masterRes.ok) setMasterDocs(await masterRes.json());
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  // --- DOCUMENT PICKER (PDF + Image) ---
  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'], // Allow both
        copyToCacheDirectory: true,
      });

      if (result.canceled === false) {
        const asset = result.assets[0];
        setNewDocFile({
            uri: asset.uri,
            name: asset.name,
            mimeType: asset.mimeType
        });
      }
    } catch (err) {
      Alert.alert("Error", "File selection failed");
    }
  };

  const handleUploadDoc = async () => {
    if (!newDocName || !newDocFile) return Alert.alert("Error", "Select document type and file");
    setActionLoading(true);
    try {
      // A. Cloudinary Upload
      const data = new FormData();
      data.append('file', {
          uri: newDocFile.uri,
          name: newDocFile.name || 'upload',
          type: newDocFile.mimeType || 'application/pdf' // Default to pdf if unknown
      });
      data.append('upload_preset', UPLOAD_PRESET);

      const cloudRes = await fetch(CLOUDINARY_URL, { method: 'post', body: data });
      const cloudData = await cloudRes.json();
      
      if (cloudData.error) throw new Error(cloudData.error.message);
      const secureUrl = cloudData.secure_url;

      // B. Save to Backend
      const token = await AsyncStorage.getItem('userToken');
      await fetch(`${API_URL}/auth/save-documents`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ newDocuments: { [newDocName]: secureUrl } })
      });

      Alert.alert("Success", "Document Saved!");
      setShowDocModal(false); setNewDocName(''); setNewDocFile(null); fetchData();
    } catch (e) { Alert.alert("Upload Failed", e.message); } finally { setActionLoading(false); }
  };

  const handleSaveData = async () => {
    if (!newDataKey || !newDataValue) return;
    setActionLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      await fetch(`${API_URL}/auth/update-profile-data`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ newData: { [newDataKey]: newDataValue } })
      });
      setShowDataModal(false); setNewDataKey(''); setNewDataValue(''); fetchData();
    } catch (e) { Alert.alert("Error", "Failed"); } finally { setActionLoading(false); }
  };

  const openEditModal = () => {
    setEditForm({
      firstName: userData?.firstName || '', lastName: userData?.lastName || '',
      email: userData?.email || '', state: userData?.state || '',
      city: userData?.city || '', pincode: userData?.pincode || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateProfile = async () => {
    setActionLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_URL}/auth/update-details`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify(editForm)
      });
      if (res.ok) { Alert.alert("Success", "Profile Updated!"); setShowEditModal(false); fetchData(); }
      else { Alert.alert("Error", "Update failed"); }
    } catch (e) { Alert.alert("Error", "Network error"); } finally { setActionLoading(false); }
  };

  const handleLogoutPress = () => {
    Alert.alert("Logout", "Confirm Logout?", [{ text: "Cancel", style: "cancel" }, { text: "Logout", style: "destructive", onPress: onLogout }]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb"/></View>;

  const savedDocs = userData?.savedDocuments ? Object.entries(userData.savedDocuments) : [];
  const profileData = userData?.userProfileData ? Object.entries(userData.userProfileData) : [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3c72" />
      <LinearGradient colors={['#1e3c72', '#2a5298']} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}><Text style={styles.avatarText}>{userData?.firstName?.charAt(0).toUpperCase() || "U"}</Text></View>
            <View style={styles.profileInfo}>
              <Text style={styles.nameText}>{userData?.firstName} {userData?.lastName}</Text>
              <Text style={styles.headerMobile}>+91 {userData?.mobile}</Text>
              <View style={styles.memberBadge}><User size={12} color="#FFD700" /><Text style={styles.memberText}>SewaOne Member</Text></View>
            </View>
            <TouchableOpacity style={styles.editBtn} onPress={openEditModal}><Settings color="#fff" size={20} /></TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 100}}>
        {/* Docs */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
             <Text style={styles.sectionTitle}>Digital Locker</Text>
             <TouchableOpacity onPress={() => setShowDocModal(true)} style={styles.addBtnSmall}><Plus size={16} color="#2563eb"/><Text style={styles.addBtnText}>Add</Text></TouchableOpacity>
          </View>
          {savedDocs.length === 0 ? (
            <View style={styles.emptyBox}><Text style={{color:'#999'}}>No documents saved.</Text></View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.docScroll}>
               {savedDocs.map(([name, url], index) => {
                 const isPdf = url.toLowerCase().endsWith('.pdf');
                 return (
                   <View key={index} style={styles.docCard}>
                      {isPdf ? (
                          <View style={[styles.docImage, {alignItems:'center', justifyContent:'center'}]}>
                              <FileText size={32} color="#dc2626" />
                              <Text style={{fontSize:10, color:'#666'}}>PDF</Text>
                          </View>
                      ) : (
                          <Image source={{uri: url}} style={styles.docImage} />
                      )}
                      <Text style={styles.docName} numberOfLines={1}>{name}</Text>
                      <View style={styles.docBadge}><CheckCircle size={10} color="#fff"/><Text style={{color:'#fff', fontSize:8, marginLeft:2}}>SAVED</Text></View>
                   </View>
                 );
               })}
            </ScrollView>
          )}
        </View>

        {/* Data */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
             <Text style={styles.sectionTitle}>Profile Data</Text>
             <TouchableOpacity onPress={() => setShowDataModal(true)} style={styles.addBtnSmall}><Edit3 size={16} color="#2563eb"/><Text style={styles.addBtnText}>Edit</Text></TouchableOpacity>
          </View>
          <View style={styles.card}>
             {profileData.length === 0 ? <Text style={{padding:15, color:'#999', textAlign:'center'}}>No data saved.</Text> : profileData.map(([key, value], index) => (
                  <View key={index}>
                    <View style={styles.dataRow}><Text style={styles.dataKey}>{key.replace(/_/g, ' ').toUpperCase()}</Text><Text style={styles.dataValue}>{value}</Text></View>
                    {index < profileData.length - 1 && <View style={styles.divider}/>}
                  </View>
             ))}
          </View>
        </View>

        {/* Personal Info */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}><Mail size={18} color="#6b7280" /><Text style={styles.infoText}>{userData?.email || "No Email"}</Text></View>
            <View style={styles.divider}/>
            <View style={styles.infoRow}><MapPin size={18} color="#6b7280" /><Text style={styles.infoText}>{userData?.city || "City"}, {userData?.state || "State"}</Text></View>
          </View>
        </View>

        {/* ✅ Refer & Earn Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Rewards</Text>
          <View style={styles.card}>
            <MenuRow 
              icon={<Gift color="#f59e0b" size={20} />} 
              title="Refer & Earn" 
              subtitle="Get Free Wallet Cash"
              onPress={() => navigation.navigate('Referral')} 
            />
            {/* Agar future me aur menu add karne ho, yahan divider use kar sakte ho */}
            {/* <View style={styles.divider} /> */}
          </View>
        </View>

        {/* Legal */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('Legal', { type: 'privacy' })}>
              <Shield size={18} color="#6b7280" style={{marginRight:15}} />
              <Text style={styles.menuText}>Privacy Policy</Text>
              <ChevronRight size={20} color="#ccc" />
            </TouchableOpacity>
            <View style={styles.divider}/>
            <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('Legal', { type: 'terms' })}>
              <FileText size={18} color="#6b7280" style={{marginRight:15}} />
              <Text style={styles.menuText}>Terms & Conditions</Text>
              <ChevronRight size={20} color="#ccc" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogoutPress}><LogOut size={18} color="#ef4444" /><Text style={styles.logoutText}>Log Out</Text></TouchableOpacity>
      </ScrollView>

      {/* Upload Modal */}
      <Modal visible={showDocModal} transparent animationType="slide" onRequestClose={()=>setShowDocModal(false)}>
         <View style={styles.modalBg}><View style={styles.modalCard}>
             <Text style={styles.modalTitle}>Upload Document</Text>
             <Text style={styles.label}>Document Type</Text>
             <View style={styles.pickerBox}>
                 <Picker selectedValue={newDocName} onValueChange={(v) => setNewDocName(v)}>
                     <Picker.Item label="-- Select --" value="" />
                     {masterDocs.map((doc) => (
                         <Picker.Item key={doc._id} label={userData?.savedDocuments?.[doc.label] ? `${doc.label} (Replace)` : doc.label} value={doc.label} />
                     ))}
                 </Picker>
             </View>
             <TouchableOpacity style={styles.pickBtn} onPress={pickFile}>
                {newDocFile ? (
                    <View style={{alignItems:'center'}}>
                        {newDocFile.mimeType?.includes('pdf') ? <FileText size={40} color="red"/> : <Image source={{uri:newDocFile.uri}} style={styles.pickImg} resizeMode="cover"/>}
                        <Text style={{fontSize:12, marginTop:5}}>{newDocFile.name}</Text>
                    </View>
                ) : <View style={{alignItems:'center'}}><Upload color="#666" size={30}/><Text style={{color:'#666'}}>Select File (PDF/Image)</Text></View>}
             </TouchableOpacity>
             <View style={styles.modalActions}>
                <TouchableOpacity onPress={()=>setShowDocModal(false)} style={styles.cancelBtn}><Text>Cancel</Text></TouchableOpacity>
                <TouchableOpacity onPress={handleUploadDoc} style={styles.saveBtn}>{actionLoading ? <ActivityIndicator color="#fff"/> : <Text style={styles.saveBtnText}>Upload</Text>}</TouchableOpacity>
             </View>
         </View></View>
      </Modal>

      {/* Data & Edit Modals (Same as before) */}
      <Modal visible={showDataModal} transparent animationType="slide" onRequestClose={()=>setShowDataModal(false)}>
         <View style={styles.modalBg}><View style={styles.modalCard}>
             <Text style={styles.modalTitle}>Add Data</Text>
             <TextInput style={styles.input} placeholder="Key (e.g. Age)" value={newDataKey} onChangeText={setNewDataKey}/>
             <TextInput style={[styles.input, {marginTop:10}]} placeholder="Value (e.g. 25)" value={newDataValue} onChangeText={setNewDataValue}/>
             <View style={styles.modalActions}>
                <TouchableOpacity onPress={()=>setShowDataModal(false)} style={styles.cancelBtn}><Text>Cancel</Text></TouchableOpacity>
                <TouchableOpacity onPress={handleSaveData} style={styles.saveBtn}>{actionLoading ? <ActivityIndicator color="#fff"/> : <Text style={styles.saveBtnText}>Save</Text>}</TouchableOpacity>
             </View>
         </View></View>
      </Modal>

      <Modal visible={showEditModal} animationType="slide" onRequestClose={()=>setShowEditModal(false)}>
         <SafeAreaView style={{flex:1, backgroundColor:'#fff'}}>
            <View style={styles.modalHeaderPlain}><Text style={styles.modalTitle}>Edit Profile</Text><TouchableOpacity onPress={()=>setShowEditModal(false)}><X color="#000" size={24}/></TouchableOpacity></View>
            <ScrollView contentContainerStyle={{padding: 20}}>
                <Text style={styles.label}>First Name</Text><TextInput style={styles.input} value={editForm.firstName} onChangeText={(t)=>setEditForm({...editForm, firstName: t})}/>
                <Text style={styles.label}>Last Name</Text><TextInput style={styles.input} value={editForm.lastName} onChangeText={(t)=>setEditForm({...editForm, lastName: t})}/>
                <Text style={styles.label}>Email</Text><TextInput style={styles.input} value={editForm.email} onChangeText={(t)=>setEditForm({...editForm, email: t})}/>
                <View style={{flexDirection:'row', gap:10}}>
                    <View style={{flex:1}}><Text style={styles.label}>State</Text><TextInput style={styles.input} value={editForm.state} onChangeText={(t)=>setEditForm({...editForm, state: t})}/></View>
                    <View style={{flex:1}}><Text style={styles.label}>City</Text><TextInput style={styles.input} value={editForm.city} onChangeText={(t)=>setEditForm({...editForm, city: t})}/></View>
                </View>
                <Text style={styles.label}>Pincode</Text><TextInput style={styles.input} value={editForm.pincode} onChangeText={(t)=>setEditForm({...editForm, pincode: t})}/>
                <TouchableOpacity style={[styles.saveBtn, {marginTop:30, alignItems:'center'}]} onPress={handleUpdateProfile}>
                    {actionLoading ? <ActivityIndicator color="#fff"/> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                </TouchableOpacity>
            </ScrollView>
         </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingTop: 10 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 20 },
  avatarContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  profileInfo: { flex: 1 },
  nameText: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerMobile: { fontSize: 14, color: '#e0e7ff', marginTop: 2 },
  memberBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginTop: 6, gap: 4 },
  memberText: { color: '#FFD700', fontSize: 10, fontWeight: 'bold' },
  editBtn: { padding: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
  content: { flex: 1, paddingHorizontal: 20, marginTop: 20 },
  sectionContainer: { marginBottom: 25 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  addBtnSmall: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
  addBtnText: { color: '#2563eb', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  docScroll: { marginTop: 5 },
  docCard: { width: 100, marginRight: 12, backgroundColor: '#fff', borderRadius: 10, padding: 8, alignItems: 'center', elevation: 2 },
  docImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#f3f4f6' },
  docName: { fontSize: 12, marginTop: 5, fontWeight: '500', textAlign: 'center' },
  docBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: '#10b981', padding: 3, borderRadius: 4, flexDirection: 'row', alignItems: 'center' },
  emptyBox: { padding: 20, alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc' },
  card: { backgroundColor: '#fff', borderRadius: 16, elevation: 2 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 15 },
  dataKey: { fontSize: 12, color: '#6b7280', fontWeight: 'bold' },
  dataValue: { fontSize: 14, color: '#1f2937', fontWeight: '600' },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 15, gap: 15 },
  infoText: { fontSize: 15, color: '#374151' },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  menuText: { fontSize: 16, color: '#1e293b', fontWeight: '500' },
  menuSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#f3f4f6' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', padding: 15, borderRadius: 12, marginTop: 10, marginBottom: 40 },
  logoutText: { color: '#ef4444', fontWeight: 'bold', marginLeft: 8 },
  // Neeche ke styles tumhare original se hi rehe
  modalBg: { flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'center', alignItems:'center' },
  modalCard: { width:'90%', backgroundColor:'#fff', borderRadius:16, padding:20 },
  modalTitle: { fontSize:18, fontWeight:'bold', marginBottom:10, color:'#111827' },
  label: { fontSize:13, color:'#6b7280', marginBottom:4, marginTop:10 },
  pickerBox: { borderWidth:1, borderColor:'#e5e7eb', borderRadius:10, marginBottom:10 },
  pickBtn: { marginTop:10, padding:15, borderWidth:1, borderColor:'#e5e7eb', borderRadius:12, alignItems:'center', justifyContent:'center' },
  pickImg: { width:80, height:80, borderRadius:10 },
  modalActions: { flexDirection:'row', justifyContent:'flex-end', marginTop:15, gap:10 },
  cancelBtn: { paddingHorizontal:15, paddingVertical:8, borderRadius:8, backgroundColor:'#e5e7eb' },
  saveBtn: { paddingHorizontal:20, paddingVertical:10, borderRadius:8, backgroundColor:'#2563eb' },
  saveBtnText: { color:'#fff', fontWeight:'bold' },
  input: { borderWidth:1, borderColor:'#e5e7eb', borderRadius:10, paddingHorizontal:12, paddingVertical:8, marginTop:4 },
  modalHeaderPlain: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:20, paddingVertical:15, borderBottomWidth:1, borderBottomColor:'#e5e7eb' },
});