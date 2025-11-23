import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput, Alert, ActivityIndicator, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreditCard, Plus, ArrowUpRight, ArrowDownLeft, Lock, Copy, RefreshCw, Wallet, Clock } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import API_URL from '../config/api';

const ADMIN_UPI_ID = "sewaone@upi"; // Real ID

export default function WalletScreen({ navigation }) {
  const [balance, setBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0); // NEW STATE
  const [history, setHistory] = useState([]);
  const [isPinSet, setIsPinSet] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  
  const [amountInput, setAmountInput] = useState('');
  const [utrInput, setUtrInput] = useState('');
  const [payMethod, setPayMethod] = useState('UPI');
  const [pinInput, setPinInput] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchWallet();
    }, [])
  );

  const fetchWallet = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_URL}/wallet/details`, { headers: { 'x-auth-token': token } });
      const data = await res.json();
      setBalance(data.balance);
      setPendingBalance(data.pendingAmount || 0); // Set Pending
      setHistory(data.history);
      setIsPinSet(data.isPinSet);
    } catch (e) {} finally { setLoading(false); }
  };

  const handleAddMoneyRequest = async () => {
      if (!amountInput || isNaN(amountInput) || !utrInput || utrInput.length < 4) {
          return Alert.alert("Invalid Input", "Please enter Amount and valid UTR.");
      }
      try {
          const token = await AsyncStorage.getItem('userToken');
          await fetch(`${API_URL}/wallet/add-money-request`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
              body: JSON.stringify({ amount: amountInput, utr: utrInput })
          });
          Alert.alert("Request Sent", "We have received your request. Balance will update shortly.");
          setAmountInput(''); setUtrInput(''); setShowAddModal(false); fetchWallet();
      } catch(e) { Alert.alert("Error", "Request failed."); }
  };

  const handleSetPin = async () => {
      if (pinInput.length !== 4) return Alert.alert("Invalid PIN", "Enter 4 digits");
      try {
          const token = await AsyncStorage.getItem('userToken');
          await fetch(`${API_URL}/wallet/setup-pin`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
              body: JSON.stringify({ pin: pinInput })
          });
          Alert.alert("Success", "Wallet PIN Set!");
          setPinInput(''); setShowPinModal(false); fetchWallet();
      } catch(e) { Alert.alert("Error"); }
  };
  
  const copyUPI = async () => { await Clipboard.setStringAsync(ADMIN_UPI_ID); Alert.alert("Copied!", `UPI ID: ${ADMIN_UPI_ID}`); };
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${ADMIN_UPI_ID}&am=${amountInput || 0}`;

  const renderItem = ({ item }) => (
      <View style={styles.txnCard}>
          <View style={[styles.iconBox, {backgroundColor: item.type==='CREDIT'?'#dcfce7':'#fee2e2'}]}>
              {item.type==='CREDIT' ? <ArrowDownLeft size={20} color="#166534"/> : <ArrowUpRight size={20} color="#dc2626"/>}
          </View>
          <View style={{flex:1}}>
              <Text style={styles.txnTitle}>{item.description}</Text>
              <Text style={styles.txnDate}>{new Date(item.date).toLocaleString()}</Text>
              {item.status === 'Pending' && <Text style={{color:'#f59e0b', fontSize:10, fontWeight:'bold'}}>⏳ Waiting for Approval</Text>}
              {item.status === 'Rejected' && <Text style={{color:'#ef4444', fontSize:10, fontWeight:'bold'}}>❌ Rejected (Check UTR)</Text>}
          </View>
          <Text style={[styles.txnAmount, {color: item.type==='CREDIT'?(item.status==='Success'?'#166534':'#aaa'):'#dc2626'}]}>
              {item.type==='CREDIT' ? '+' : '-'} ₹{item.amount}
          </Text>
      </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3c72"/>
      <View style={styles.header}>
          <Wallet color="#fff" size={24} style={{marginRight: 10}} />
          <Text style={styles.headerTitle}>Sewa Wallet</Text>
      </View>
      
      <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceText}>₹ {balance}</Text>
          
          {/* --- PENDING BALANCE INDICATOR --- */}
          {pendingBalance > 0 && (
              <View style={styles.pendingBox}>
                  <Clock size={14} color="#f59e0b" />
                  <Text style={styles.pendingText}>+ ₹{pendingBalance} is verifying...</Text>
              </View>
          )}

          <View style={styles.btnRow}>
              <TouchableOpacity style={styles.addBtn} onPress={()=>setShowAddModal(true)}>
                  <Plus color="#1e3c72" size={20} />
                  <Text style={styles.addBtnText}>Add Money</Text>
              </TouchableOpacity>
              {!isPinSet && (
                  <TouchableOpacity style={styles.pinBtn} onPress={()=>setShowPinModal(true)}>
                      <Lock color="#fff" size={16} />
                      <Text style={styles.pinBtnText}>Set PIN</Text>
                  </TouchableOpacity>
              )}
          </View>
      </View>

      <View style={{flexDirection:'row', justifyContent:'space-between', paddingHorizontal:20, alignItems:'center', marginTop:10}}>
         <Text style={styles.sectionTitle}>Transactions</Text>
         <TouchableOpacity onPress={fetchWallet}><RefreshCw size={18} color="#666"/></TouchableOpacity>
      </View>
      
      <FlatList 
        data={history} 
        renderItem={renderItem} 
        keyExtractor={i=>i._id} 
        contentContainerStyle={{padding:16}} 
        ListEmptyComponent={<Text style={{textAlign:'center', color:'#999'}}>No transactions yet.</Text>} 
      />

      {/* ADD MONEY MODAL */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={()=>setShowAddModal(false)}>
          <View style={styles.modalBg}><View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Add Money</Text>
              
              <View style={styles.payTabs}>
                  <TouchableOpacity onPress={()=>setPayMethod('UPI')} style={[styles.payTab, payMethod==='UPI' && styles.payTabActive]}><Text style={[styles.payTabText, payMethod==='UPI' && {color:'#2563eb'}]}>UPI ID</Text></TouchableOpacity>
                  <TouchableOpacity onPress={()=>setPayMethod('QR')} style={[styles.payTab, payMethod==='QR' && styles.payTabActive]}><Text style={[styles.payTabText, payMethod==='QR' && {color:'#2563eb'}]}>QR Code</Text></TouchableOpacity>
              </View>

              <Text style={styles.label}>Amount (₹)</Text>
              <TextInput style={styles.input} placeholder="500" keyboardType="numeric" value={amountInput} onChangeText={setAmountInput}/>

              {payMethod === 'UPI' ? (
                  <View style={styles.infoBox}>
                      <Text style={{fontSize:12, color:'#666'}}>Pay to:</Text>
                      <TouchableOpacity onPress={copyUPI} style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:5}}>
                          <Text style={{fontSize:16, fontWeight:'bold', color:'#1e3c72'}}>{ADMIN_UPI_ID}</Text>
                          <Copy size={16} color="blue"/>
                      </TouchableOpacity>
                  </View>
              ) : (
                  <View style={styles.infoBox}>
                      <View style={{alignItems:'center'}}>
                          <Image source={{ uri: qrCodeUrl }} style={{width:150, height:150}} />
                      </View>
                  </View>
              )}
              
              <Text style={styles.label}>UTR / Transaction ID</Text>
              <TextInput style={styles.input} placeholder="Ex: 3214xxxxxx" keyboardType="numeric" value={utrInput} onChangeText={setUtrInput} maxLength={12}/>
              
              <TouchableOpacity style={styles.mainBtn} onPress={handleAddMoneyRequest}><Text style={styles.btnText}>Submit Request</Text></TouchableOpacity>
              <TouchableOpacity onPress={()=>setShowAddModal(false)} style={{marginTop:15}}><Text style={{color:'#666'}}>Cancel</Text></TouchableOpacity>
          </View></View>
      </Modal>

      <Modal visible={showPinModal} transparent animationType="slide" onRequestClose={()=>setShowPinModal(false)}>
          <View style={styles.modalBg}><View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Setup Wallet PIN</Text>
              <TextInput style={styles.input} placeholder="Enter 4-digit PIN" keyboardType="numeric" maxLength={4} secureTextEntry value={pinInput} onChangeText={setPinInput}/>
              <TouchableOpacity style={styles.mainBtn} onPress={handleSetPin}><Text style={styles.btnText}>Save PIN</Text></TouchableOpacity>
          </View></View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { padding: 20, backgroundColor: '#1e3c72', flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  balanceCard: { margin: 20, padding: 20, backgroundColor: '#1e3c72', borderRadius: 16, marginTop: -10, elevation: 5 },
  balanceLabel: { color: '#93c5fd', fontSize: 14 },
  balanceText: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginVertical: 10 },
  
  // NEW PENDING BOX
  pendingBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245, 158, 11, 0.2)', padding: 8, borderRadius: 8, marginBottom: 15, alignSelf: 'flex-start' },
  pendingText: { color: '#fcd34d', fontWeight: 'bold', marginLeft: 6, fontSize: 12 },

  btnRow: { flexDirection: 'row', gap: 10 },
  addBtn: { flexDirection: 'row', backgroundColor: '#fff', padding: 10, borderRadius: 8, alignItems: 'center', flex:1, justifyContent:'center' },
  addBtnText: { color: '#1e3c72', fontWeight: 'bold', marginLeft: 5 },
  pinBtn: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 8, alignItems: 'center' },
  pinBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 5, fontSize: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  txnCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, alignItems: 'center', elevation: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  txnTitle: { fontWeight: 'bold', color: '#333', fontSize:13, marginBottom: 2 },
  txnDate: { fontSize: 11, color: '#999' },
  txnAmount: { fontWeight: 'bold', fontSize: 16 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 5, alignItems:'center', width:'100%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e3c72', marginBottom: 15, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, fontSize: 16, width:'100%', marginBottom: 15 },
  mainBtn: { backgroundColor: '#2563eb', padding: 15, borderRadius: 8, alignItems: 'center', width:'100%' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  label: {alignSelf:'flex-start', fontWeight:'bold', marginBottom:5, color:'#555', marginTop: 10},
  payTabs: { flexDirection: 'row', marginBottom: 15, borderBottomWidth: 1, borderColor: '#e5e7eb', width: '100%' },
  payTab: { flex: 1, padding: 10, alignItems: 'center' },
  payTabActive: { borderBottomWidth: 3, borderColor: '#2563eb' },
  payTabText: { fontWeight: 'bold', color: '#6b7280' },
  infoBox: { backgroundColor: '#eff6ff', padding: 15, borderRadius: 8, marginBottom: 10, width: '100%' },
});