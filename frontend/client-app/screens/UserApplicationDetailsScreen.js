import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Linking, KeyboardAvoidingView, Platform, StatusBar, Alert, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// --- FIX: Added 'Copy' and 'Lock' to imports ---
import { ArrowLeft, Send, Download, CheckCircle, AlertCircle, User, Bell, ExternalLink, FileText, CreditCard, Clipboard, Upload, X, Wallet, Lock, Copy } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as ClipboardAPI from 'expo-clipboard';
import API_URL from '../config/api';

// --- ADMIN PAYMENT DETAILS ---
const ADMIN_UPI_ID = "sewaone@upi"; 
const ADMIN_NAME = "SewaOne Services";

// Cloudinary Config
const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || "dka87xxxx"; 
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_UPLOAD_PRESET || "sewaone_preset";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export default function UserApplicationDetailsScreen({ route, navigation }) {
  const { applicationId } = route.params; 
  
  const [appData, setAppData] = useState(null);
  const [jobUpdates, setJobUpdates] = useState([]); 
  const [messages, setMessages] = useState([]);
const [newMessage, setNewMessage] = useState('');
const [sending, setSending] = useState(false); // NEW: sending state
  const [loading, setLoading] = useState(true);
  
  // Payment States
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState('UPI'); // 'UPI' | 'QR' | 'WALLET'
  const [utrNumber, setUtrNumber] = useState('');
  const [payScreenshot, setPayScreenshot] = useState(null);
  const [paying, setPaying] = useState(false);
  
  // Wallet States
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletPin, setWalletPin] = useState('');
  const [hasPin, setHasPin] = useState(false);

  // Coupon States
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const scrollViewRef = useRef();

  useEffect(() => {
  fetchDetails();
  fetchChat(); // first load
  const interval = setInterval(fetchChat, 5000); // 5 sec like first file
  return () => clearInterval(interval);
}, [applicationId]);

// NEW: messages change hone pe auto scroll
useEffect(() => {
  if (scrollViewRef.current) {
    scrollViewRef.current.scrollToEnd({ animated: true });
  }
}, [messages]);

  // Fetch Wallet Balance when Modal Opens
  useEffect(() => {
      if(showPayModal) {
          fetchWalletInfo();
          // Reset payment values
          setFinalAmount(appData?.paymentDetails?.totalAmount || 0);
          setDiscount(0);
          setCouponCode('');
          setAppliedCoupon(null);
      }
  }, [showPayModal]);

  const fetchWalletInfo = async () => {
      try {
          const token = await AsyncStorage.getItem('userToken');
          const res = await fetch(`${API_URL}/wallet/details`, { headers: { 'x-auth-token': token } });
          const data = await res.json();
          setWalletBalance(data.balance);
          setHasPin(data.isPinSet);
      } catch(e){}
  };

  const fetchDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_URL}/applications/my-history`, {
         headers: { 'x-auth-token': token }
      });
      const allApps = await res.json();
      const currentApp = allApps.find(a => a._id === applicationId);
      setAppData(currentApp);

      if (currentApp && currentApp.jobId) {
          const updateRes = await fetch(`${API_URL}/updates/job/${currentApp.jobId._id || currentApp.jobId}`);
          if (updateRes.ok) setJobUpdates(await updateRes.json());
      }
      setLoading(false);
    } catch (e) { console.error(e); }
  };

  const fetchChat = async () => {
  try {
    const res = await fetch(`${API_URL}/chat/${applicationId}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
    }
  } catch (e) {
    console.log("Chat Load Error", e);
  }
};

  const handleSend = async () => {
  if (!newMessage.trim()) return;

  setSending(true);
  try {
    const token = await AsyncStorage.getItem('userToken');

    const res = await fetch(`${API_URL}/chat/send`, {  // SAME AS FIRST FILE
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify({
        applicationId: applicationId,
        message: newMessage,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setNewMessage('');  // clear input
      fetchChat();        // refresh messages
    } else {
      Alert.alert('Error', data.msg || 'Message not sent');
    }
  } catch (e) {
    console.error(e);
    Alert.alert('Error', 'Network connection failed');
  } finally {
    setSending(false);
  }
};

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    try {
        const token = await AsyncStorage.getItem('userToken');
        
        // --- SAFETY FIX: Values check karein ---
        // Agar appData load nahi hua hai to 0
        const offFee = appData?.paymentDetails?.officialFee ? Number(appData.paymentDetails.officialFee) : 0;
        const srvFee = appData?.paymentDetails?.serviceFee ? Number(appData.paymentDetails.serviceFee) : 50;

        console.log("Sending Coupon Request:", { code: couponCode, offFee, srvFee }); // Debug

        const res = await fetch(`${API_URL}/coupons/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
            body: JSON.stringify({ 
                code: couponCode, 
                officialFee: offFee, 
                serviceFee: srvFee   
            })
        });
        const data = await res.json();
        
        if (res.ok) {
            // --- NULL CHECK ---
            // Agar backend se null aaya to 0 set karo
            const safeDiscount = data.discountAmount || 0;
            const safeFinal = data.finalAmount || (offFee + srvFee);

            setDiscount(safeDiscount);
            setFinalAmount(safeFinal);
            setAppliedCoupon(data.code);
            
            Alert.alert("Success", `Coupon Applied! Saved ₹${safeDiscount}`);
        } else {
            Alert.alert("Invalid", data.msg || "Coupon failed");
            // Reset values
            setDiscount(0);
            setFinalAmount(appData.paymentDetails.totalAmount);
            setAppliedCoupon(null);
        }
    } catch (e) { 
        console.error(e);
        Alert.alert("Error", "Could not verify coupon"); 
    }
  };

  const copyToClipboard = async () => {
    await ClipboardAPI.setStringAsync(ADMIN_UPI_ID);
    Alert.alert("Copied!", `UPI ID: ${ADMIN_UPI_ID}`);
  };

  const pickScreenshot = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled) {
      setPayScreenshot(result.assets[0]);
    }
  };

  const handlePaymentSubmit = async () => {
    setPaying(true);
    try {
        const token = await AsyncStorage.getItem('userToken');

        // --- WALLET PAYMENT ---
        if (payMethod === 'WALLET') {
            if (!hasPin) { Alert.alert("Setup PIN", "Please set a wallet PIN first in Wallet Screen."); setPaying(false); return; }
            if (walletPin.length !== 4) { Alert.alert("Invalid PIN", "Enter 4-digit PIN."); setPaying(false); return; }
            
            const res = await fetch(`${API_URL}/wallet/pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ 
                    applicationId, 
                    amount: finalAmount, 
                    pin: walletPin,
                    couponCode: appliedCoupon
                    
                })
            });
            const data = await res.json();
            
            if (res.ok) {
                Alert.alert("Success", "Payment Successful!");
                setShowPayModal(false); fetchDetails();
            } else {
                Alert.alert("Failed", data.msg || "Payment failed");
            }
        } 
        // --- UPI / MANUAL PAYMENT ---
        else {
            if (!utrNumber || utrNumber.length < 4) { Alert.alert("Required", "Enter valid UTR"); setPaying(false); return; }
            
            let screenshotUrl = "";
            if (payScreenshot) {
                const data = new FormData();
                data.append('file', { uri: payScreenshot.uri, name: 'pay.jpg', type: 'image/jpeg' });
                data.append('upload_preset', UPLOAD_PRESET);
                const cloudRes = await fetch(CLOUDINARY_URL, { method: 'post', body: data });
                const cloudData = await cloudRes.json();
                screenshotUrl = cloudData.secure_url;
            }

            await fetch(`${API_URL}/applications/confirm-payment/${applicationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ 
                    transactionId: utrNumber,
                    paymentScreenshotUrl: screenshotUrl,
                    couponCode: appliedCoupon,
                    finalAmount: finalAmount
                })
            });

            Alert.alert("Submitted", "Payment sent for verification.");
            setShowPayModal(false); fetchDetails();
        }
    } catch(e) { Alert.alert("Error", "Submission failed."); }
    finally { setPaying(false); }
  };

  const amount = appData?.paymentDetails?.totalAmount || 0;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${ADMIN_UPI_ID}&pn=${encodeURIComponent(ADMIN_NAME)}&am=${finalAmount}`;

  const openLink = (url) => {
    if (!url) return;
    if (url.startsWith('http')) Linking.openURL(url).catch(err => {});
    else Alert.alert("Info", url);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb"/></View>;

  const isCompleted = appData?.status === 'Completed';
  const isChatActive = appData?.status !== 'Completed' && appData?.status !== 'Rejected';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3c72"/>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft color="#fff" size={24}/></TouchableOpacity>
        <View style={{marginLeft: 15}}>
            <Text style={styles.headerTitle} numberOfLines={1}>{appData?.jobId?.organization}</Text>
            <Text style={styles.headerSub}>ID: {appData?.trackingId}</Text>
        </View>
      </View>

      <ScrollView style={{flex: 1}} contentContainerStyle={{paddingBottom: 20}} keyboardShouldPersistTaps="handled" ref={scrollViewRef} onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}>

      <View style={styles.statusCard}>
         <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
            <Text style={styles.statusLabel}>Status:</Text>
            <View style={[styles.badge, {backgroundColor: isCompleted ? '#dcfce7' : '#fef3c7'}]}>
                <Text style={{color: isCompleted ? '#166534' : '#b45309', fontWeight:'bold', fontSize:12}}>
                    {appData?.status?.toUpperCase()}
                </Text>
            </View>
         </View>

         {isCompleted && (
             <TouchableOpacity style={styles.downloadBtn} onPress={() => openLink(appData.finalResult?.pdfUrl)}>
                 <Download color="#fff" size={20} />
                 <Text style={styles.downloadText}>Download Final PDF</Text>
             </TouchableOpacity>
         )}
         
         {appData?.status === 'Payment Pending' && !appData?.paymentDetails?.isPaid && (
             <View style={styles.paymentReqBox}>
                 <Text style={{fontWeight:'bold', color:'#c2410c', fontSize:16}}>Action Required: Payment</Text>
                 <Text style={{color:'#666', fontSize:12, marginVertical:5}}>Please pay fees to proceed.</Text>
                 <View style={styles.feeRow}><Text>Official Fee:</Text><Text>₹{appData.paymentDetails.officialFee}</Text></View>
                 <View style={styles.feeRow}><Text>Service Fee:</Text><Text>₹{appData.paymentDetails.serviceFee}</Text></View>
                 <View style={{height:1, background:'#ccc', marginVertical:5}}/>
                 <View style={styles.feeRow}><Text style={{fontWeight:'bold'}}>Total:</Text><Text style={{fontWeight:'bold', fontSize:18}}>₹{appData.paymentDetails.totalAmount}</Text></View>
                 <TouchableOpacity style={styles.payNowBtn} onPress={() => setShowPayModal(true)}>
                    <CreditCard color="#fff" size={18} />
                    <Text style={{color:'#fff', fontWeight:'bold', marginLeft:8}}>Pay Now</Text>
                 </TouchableOpacity>
             </View>
         )}

         {appData?.status === 'Payment Verification Pending' && (
             <View style={{marginTop:10, padding:10, backgroundColor:'#eff6ff', borderRadius:8, flexDirection:'row', alignItems:'center'}}>
                 <CheckCircle size={16} color="#1e3c72" />
                 <Text style={{color:'#1e3c72', fontSize:12, marginLeft:6}}>Payment submitted. Verification pending.</Text>
             </View>
         )}
      </View>

      {jobUpdates.length > 0 && (
          <View style={styles.updatesCard}>
              <View style={{flexDirection:'row', alignItems:'center', marginBottom: 10}}>
                  <Bell color="#2563eb" size={20} />
                  <Text style={styles.updateHeader}>Latest Updates</Text>
              </View>
              {jobUpdates.map((update, index) => (
                  <View key={index} style={styles.updateItem}>
                      <View style={{flex: 1}}>
                          <Text style={styles.updateTitle}>{update.title}</Text>
                          <Text style={styles.updateType}>{update.category}</Text>
                          {update.customFields && update.customFields.map((f, i) => (<Text key={i} style={{fontSize:11, color:'#4b5563', marginTop:2}}>{f.label}: <Text style={{fontWeight:'bold'}}>{f.value}</Text></Text>))}
                      </View>
                      <View>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => openLink(update.link)}><ExternalLink size={16} color="#2563eb" /><Text style={styles.actionText}>View</Text></TouchableOpacity>
                      </View>
                  </View>
              ))}
          </View>
      )}

      <View style={styles.chatCard}>
         <View style={styles.chatHeader}>
             <Text style={{fontWeight:'bold', color:'#374151'}}>💬 Talk to Agent</Text>
             {!isChatActive && <Text style={{fontSize:10, color:'red'}}>Chat Closed</Text>}
         </View>
         <View style={styles.chatBox}>
             {messages.length === 0 && <Text style={{textAlign:'center', color:'#9ca3af', padding:20, fontSize:12}}>No messages yet.</Text>}
             {messages.map((msg, i) => {
                 const isMe = msg.sender === 'User';
                 return (
                    <View key={i} style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowAgent]}>
                        {!isMe && <View style={styles.avatar}><User size={14} color="#fff"/></View>}
                        <View style={[styles.msgBubble, isMe ? styles.bubbleMe : styles.bubbleAgent]}>
                            <Text style={[styles.msgText, isMe ? {color:'#fff'} : {color:'#374151'}]}>{msg.message}</Text>
                        </View>
                    </View>
                 );
             })}
         </View>
         {isChatActive ? (
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
                <View style={styles.inputArea}>
  <TextInput
    style={styles.input}
    placeholder="Type..."
    value={newMessage}
    onChangeText={setNewMessage}
  />
  <TouchableOpacity
    style={[styles.sendBtn, sending && { opacity: 0.5 }]}
    onPress={handleSend}
    disabled={sending}
  >
    {sending ? (
      <ActivityIndicator color="#fff" size="small" />
    ) : (
      <Send color="#fff" size={20} />
    )}
  </TouchableOpacity>
</View>
            </KeyboardAvoidingView>
         ) : <View style={styles.closedBar}><Text style={{color:'#6b7280'}}>Chat disabled.</Text></View>}
      </View>

      </ScrollView>

      <Modal visible={showPayModal} transparent animationType="slide" onRequestClose={()=>setShowPayModal(false)}>
          <View style={styles.modalBg}>
              <View style={styles.modalCard}>
                  <Text style={styles.modalTitle}>Pay ₹{finalAmount}</Text>
                  
                  <View style={styles.payTabs}>
                      <TouchableOpacity onPress={()=>setPayMethod('UPI')} style={[styles.payTab, payMethod==='UPI' && styles.payTabActive]}><Text style={[styles.payTabText, payMethod==='UPI' && {color:'#2563eb'}]}>UPI ID</Text></TouchableOpacity>
                      <TouchableOpacity onPress={()=>setPayMethod('QR')} style={[styles.payTab, payMethod==='QR' && styles.payTabActive]}><Text style={[styles.payTabText, payMethod==='QR' && {color:'#2563eb'}]}>QR Code</Text></TouchableOpacity>
                      <TouchableOpacity onPress={()=>setPayMethod('WALLET')} style={[styles.payTab, payMethod==='WALLET' && styles.payTabActive]}><Text style={[styles.payTabText, payMethod==='WALLET' && {color:'#2563eb'}]}>Wallet</Text></TouchableOpacity>
                  </View>

                  {payMethod === 'WALLET' ? (
                      <View style={styles.payInfoBox}>
                          <View style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:15}}>
                              <Text style={{color:'#666'}}>Balance:</Text>
                              <Text style={{fontSize:18, fontWeight:'bold', color: walletBalance >= finalAmount ? '#166534' : '#dc2626'}}>₹ {walletBalance}</Text>
                          </View>
                          {walletBalance < finalAmount ? (
                              <View><Text style={{color:'red', fontSize:12, marginBottom:10}}>Insufficient Balance.</Text><TouchableOpacity onPress={()=>{setShowPayModal(false); navigation.navigate('Wallet');}} style={{padding:10, backgroundColor:'#e5e7eb', borderRadius:6, alignItems:'center'}}><Text>Go to Wallet</Text></TouchableOpacity></View>
                          ) : (
                              <View><Text style={styles.label}>Enter 4-Digit PIN</Text><TextInput style={styles.modalInput} placeholder="****" keyboardType="numeric" maxLength={4} secureTextEntry value={walletPin} onChangeText={setWalletPin} /></View>
                          )}
                      </View>
                  ) : payMethod === 'UPI' ? (
                      <View style={styles.payInfoBox}>
                        <Text style={{fontSize:12, color:'#666'}}>Pay to UPI ID:</Text>
                        <TouchableOpacity onPress={copyToClipboard} style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:5}}><Text style={{fontSize:18, fontWeight:'bold', color:'#1e3c72'}}>{ADMIN_UPI_ID}</Text><Clipboard color="blue" size={16}/></TouchableOpacity>
                      </View>
                  ) : (
                      <View style={styles.payInfoBox}>
                        <Text style={{fontSize:12, color:'#666', marginBottom:10, textAlign:'center'}}>Scan to Pay</Text>
                        <View style={{alignItems:'center'}}><Image source={{ uri: qrCodeUrl }} style={{width:150, height:150}} /></View>
                      </View>
                  )}

                  {payMethod !== 'WALLET' && (
                      <>
                        <Text style={styles.label}>Transaction ID / UTR</Text>
                        <TextInput style={styles.modalInput} placeholder="Ex: 3245xxxxxxxx" value={utrNumber} onChangeText={setUtrNumber} keyboardType="numeric" maxLength={12}/>
                        <Text style={styles.label}>Upload Screenshot (Optional)</Text>
                        <TouchableOpacity onPress={pickScreenshot} style={{flexDirection:'row', alignItems:'center', padding:10, borderWidth:1, borderColor:'#ccc', borderRadius:8, marginTop:5, marginBottom:20}}><Upload size={20} color="#666" /><Text style={{marginLeft:10, color:'#333'}}>{payScreenshot ? "Screenshot Selected ✅" : "Tap to Upload Proof"}</Text></TouchableOpacity>
                      </>
                  )}
                  
                   {/* COUPON SECTION */}
                  <View style={{flexDirection:'row', gap:10, marginBottom:15, width:'100%'}}>
                      <TextInput style={[styles.modalInput, {flex:1, marginBottom:0, textTransform:'uppercase'}]} placeholder="COUPON CODE" value={couponCode} onChangeText={setCouponCode} autoCapitalize="characters"/>
                      <TouchableOpacity onPress={handleApplyCoupon} style={{backgroundColor:'#3b82f6', padding:10, borderRadius:8, justifyContent:'center'}}><Text style={{color:'#fff', fontWeight:'bold'}}>Apply</Text></TouchableOpacity>
                  </View>
                  
                     <View style={{marginBottom:15, alignItems:'center'}}>
      <Text style={{fontSize:14, color:'#666'}}>Payable Amount</Text>
      
      // Agar finalAmount 0 ya undefined hai, to original dikhao
      <Text style={{fontSize:24, fontWeight:'bold', color:'#1e3c72'}}>
          ₹ {finalAmount || appData?.paymentDetails?.totalAmount || 0}
      </Text>

      {discount > 0 && (
          <Text style={{color:'green', fontSize:12}}>
              You saved ₹{discount}!
          </Text>
      )}
  </View>

                  <TouchableOpacity style={styles.paySubmitBtn} onPress={handlePaymentSubmit}>
                      {paying ? <ActivityIndicator color="#fff"/> : <Text style={styles.btnText}>{payMethod==='WALLET' ? 'Pay Securely' : 'Submit Payment Details'}</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={()=>setShowPayModal(false)} style={{marginTop:15, alignItems:'center'}}><Text style={{color:'#666'}}>Cancel</Text></TouchableOpacity>
              </View>
          </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#1e3c72' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 12, color: '#cbd5e1' },
  statusCard: { margin: 15, padding: 15, backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  statusLabel: { fontSize: 14, color: '#374151', fontWeight: '600' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  downloadBtn: { flexDirection: 'row', backgroundColor: '#10b981', padding: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 15 },
  downloadText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  paymentReqBox: { marginTop: 15, backgroundColor: '#fff7ed', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#ffedd5' },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  payNowBtn: { backgroundColor: '#ea580c', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 8, marginTop: 15 },
  updatesCard: { marginHorizontal: 15, marginBottom: 15, padding: 15, backgroundColor: '#eff6ff', borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe' },
  updateHeader: { fontSize: 16, fontWeight: 'bold', color: '#1e3c72', marginLeft: 8 },
  updateItem: { marginTop: 10, padding: 10, backgroundColor: '#fff', borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  updateTitle: { fontSize: 14, fontWeight: 'bold', color: '#374151' },
  updateType: { fontSize: 11, color: '#10b981', fontWeight: '600', marginBottom: 2 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 6, backgroundColor: '#f0f9ff', borderRadius: 6, borderWidth: 1, borderColor: '#bae6fd', minWidth: 70, justifyContent: 'center' },
  actionText: { fontSize: 11, color: '#0284c7', fontWeight: 'bold', marginLeft: 4 },
  chatCard: { flex: 1, backgroundColor: '#fff', margin: 15, marginTop: 0, borderRadius: 12, elevation: 2, overflow: 'hidden', minHeight: 300 },
  chatHeader: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexDirection:'row', justifyContent:'space-between', backgroundColor: '#fafafa' },
  chatBox: { height: 250, padding: 15 },
  msgRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  msgRowMe: { justifyContent: 'flex-end' },
  msgRowAgent: { justifyContent: 'flex-start' },
  avatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#f59e0b', alignItems:'center', justifyContent:'center', marginRight: 8 },
  msgBubble: { padding: 10, borderRadius: 12, maxWidth: '75%' },
  bubbleMe: { backgroundColor: '#2563eb', borderBottomRightRadius: 0 },
  bubbleAgent: { backgroundColor: '#f3f4f6', borderBottomLeftRadius: 0 },
  msgText: { fontSize: 14, lineHeight: 20 },
  inputArea: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#f9fafb', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, borderWidth: 1, borderColor: '#e5e7eb', marginRight: 10 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e3c72', alignItems: 'center', justifyContent: 'center' },
  closedBar: { padding: 15, alignItems: 'center', backgroundColor: '#f9fafb', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 5, width:'100%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e3c72', marginBottom: 15, textAlign: 'center' },
  label: { fontWeight: 'bold', marginBottom: 5, marginTop: 10, color:'#333' },
  modalInput: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, fontSize: 16, color:'#333' },
  paySubmitBtn: { backgroundColor: '#10b981', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  payTabs: { flexDirection: 'row', marginBottom: 15, borderBottomWidth: 1, borderColor: '#e5e7eb', width: '100%' },
  payTab: { flex: 1, padding: 10, alignItems: 'center' },
  payTabActive: { borderBottomWidth: 3, borderColor: '#2563eb' },
  payTabText: { fontWeight: 'bold', color: '#6b7280' },
  payInfoBox: { backgroundColor: '#eff6ff', padding: 15, borderRadius: 8, marginBottom: 20, width: '100%' },
  warningBox: { flexDirection: 'row', alignItems: 'center', marginTop: 10, padding: 8, backgroundColor: '#fffbeb', borderRadius: 6 },
});