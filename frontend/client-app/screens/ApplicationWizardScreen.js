import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, ActivityIndicator, Modal, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle, Upload, Clock, Search, UserCheck, Calendar, FileText, Edit2 } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import API_URL from '../config/api';

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || "dka87xxxx"; 
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_UPLOAD_PRESET || "sewaone_preset";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

export default function ApplicationWizardScreen({ route, navigation }) {
  const { job } = route.params;

  // --- SAFETY VARIABLES ---
  const formSchema = job.formSchema || [];
  const feeStructure = job.feeStructure || [];
  const requiredDocuments = job.requiredDocuments || [];
  const timeSlots = job.timeSlots || [];
  
  // Service Fee
  const serviceFeeFixed = job.serviceCharge ? parseInt(job.serviceCharge) : 50;

  // Steps: 0=Instr, 1=Form, 2=Docs, 3=Search, 4=Success
  const [currentStep, setCurrentStep] = useState(0);
  
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [savedDocsFromProfile, setSavedDocsFromProfile] = useState({}); 
  const [trackingId, setTrackingId] = useState(null);
  const [assignedAgent, setAssignedAgent] = useState(null);
  
  const [formData, setFormData] = useState({}); 
  const [calculatedOfficialFee, setCalculatedOfficialFee] = useState(0);
  
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotLoading, setSlotLoading] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // ✅ FIX: LOCK TO PREVENT DOUBLE SUBMISSION
  const isSubmitting = useRef(false);

  // 1. LOAD PROFILE
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const response = await fetch(`${API_URL}/auth/me`, { method: 'GET', headers: { 'x-auth-token': token } });
        const userData = await response.json();
        if (userData.savedDocuments) {
          setSavedDocsFromProfile(userData.savedDocuments);
          const initialDocs = {};
          requiredDocuments.forEach(docName => {
            if (userData.savedDocuments[docName]) {
              initialDocs[docName] = { uri: userData.savedDocuments[docName], name: docName, type: 'saved' };
            }
          });
          setUploadedDocs(initialDocs);
        }
      } catch (e) { console.error(e); }
    };
    loadProfile();
  }, []);

  // 2. ANIMATION & SUBMIT TRIGGER
  useEffect(() => {
    if (currentStep === 3) {
      // ✅ LOCK CHECK: Agar pehle se submit ho raha hai to ruk jao
      if (isSubmitting.current) return;
      isSubmitting.current = true; // Lock lagao

      Animated.loop(Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
      ])).start();
      
      performLiveSearch();
    }
  }, [currentStep]);

  // 3. FEE CALCULATION
  useEffect(() => { calculateFee(); }, [formData]);

  const calculateFee = () => {
      if (feeStructure.length === 0) {
          setCalculatedOfficialFee(0);
          return;
      }
      
      const catKey = Object.keys(formData).find(k => k.toLowerCase().trim() === 'category');
      const genKey = Object.keys(formData).find(k => k.toLowerCase().trim() === 'gender');

      const userCategory = catKey ? formData[catKey] : null; 
      const userGender = genKey ? formData[genKey] : null;

      if (!userCategory) { setCalculatedOfficialFee(0); return; }

      let rule = feeStructure.find(r => r.category === userCategory && r.gender === userGender);
      if (!rule) rule = feeStructure.find(r => r.category === userCategory && r.gender === 'Any');
      if (!rule) rule = feeStructure.find(r => r.category === 'Any' && r.gender === userGender);
      if (!rule) rule = feeStructure.find(r => r.category === 'Any' && r.gender === 'Any');

      setCalculatedOfficialFee(rule ? parseInt(rule.amount) : 0);
  };

  const pickFile = async (docName) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true });
      if (!result.canceled) {
        setUploadedDocs({...uploadedDocs, [docName]: { uri: result.assets[0].uri, name: result.assets[0].name, mimeType: result.assets[0].mimeType }});
      }
    } catch (err) {}
  };

  const uploadToCloudinary = async (fileObj) => {
    if (fileObj.type === 'saved' || fileObj.uri.startsWith('http')) return fileObj.uri;
    const data = new FormData();
    data.append('file', { uri: fileObj.uri, name: fileObj.name || 'up', type: fileObj.mimeType || 'application/pdf' });
    data.append('upload_preset', UPLOAD_PRESET);
    try {
      const response = await fetch(CLOUDINARY_URL, { method: 'post', body: data });
      const result = await response.json();
      return result.secure_url;
    } catch (err) { return null; }
  };

  // --- SUBMIT LOGIC (Live Search) ---
  const performLiveSearch = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      const finalDocLinks = {};
      for (const docName of Object.keys(uploadedDocs)) {
          const url = await uploadToCloudinary(uploadedDocs[docName]);
          if (url) finalDocLinks[docName] = url;
      }
      const formattedDocs = Object.keys(finalDocLinks).map(key => ({ docName: key, url: finalDocLinks[key] }));
      
      const totalFee = parseInt(calculatedOfficialFee) + parseInt(serviceFeeFixed);

      const payload = { 
          jobId: job._id, 
          uploadedDocuments: formattedDocs,
          applicationData: formData, 
          paymentDetails: { 
              officialFee: parseInt(calculatedOfficialFee), 
              serviceFee: parseInt(serviceFeeFixed), 
              totalAmount: totalFee, 
              isPaid: false 
          },
          isService: false // ✅ Important: Backend ko batane ke liye ki ye Job hai
      };

      // Wait thoda sa animation ke liye
      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
          const response = await fetch(`${API_URL}/applications/submit-live`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
              body: JSON.stringify(payload)
          });
          const resData = await response.json();
          
          if (response.ok) {
              // ✅ Backend ne jo agent name bheja hai wo use karo
              if (resData.status === 'ASSIGNED') {
                  setAssignedAgent(resData.agentName);
                  setTrackingId(resData.trackingId);
                  setCurrentStep(4); 
              } else {
                  // No Agent Found -> Show Slot Modal
                  setShowSlotModal(true);
              }
          } else {
              Alert.alert("Error", resData.msg || "Failed");
              isSubmitting.current = false; // Lock kholo retry ke liye
              setCurrentStep(2);
          }
      } catch (e) { 
          setShowSlotModal(true); 
          isSubmitting.current = false; // Lock kholo
      }
    } catch (error) { 
        setCurrentStep(2); 
        isSubmitting.current = false; // Lock kholo
        Alert.alert("Upload Error"); 
    }
  };

  // --- SUBMIT LOGIC (Slot Fallback) ---
  const handleSlotSubmit = async () => {
      if (!selectedDate) return Alert.alert("Required", "Enter Date");
      setSlotLoading(true);
      try {
          const token = await AsyncStorage.getItem('userToken');
          // Docs are already likely uploaded or local URIs if live failed before upload finished
          // Re-using uploadedDocs logic simply here
          const formattedDocs = Object.keys(uploadedDocs).map(key => ({ docName: key, url: uploadedDocs[key].uri.startsWith('http') ? uploadedDocs[key].uri : 'pending_upload_retry' })); 
          
          const totalFee = parseInt(calculatedOfficialFee) + parseInt(serviceFeeFixed);

          const payload = { 
              jobId: job._id, 
              uploadedDocuments: formattedDocs,
              applicationData: formData,
              selectedSlot: { date: selectedDate, time: selectedSlot || "Any Time" },
              paymentDetails: { 
                  officialFee: parseInt(calculatedOfficialFee), 
                  serviceFee: parseInt(serviceFeeFixed), 
                  totalAmount: totalFee, 
                  isPaid: false 
              },
              isService: false
          };

          const response = await fetch(`${API_URL}/applications/submit-slot`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
               body: JSON.stringify(payload)
           });
           const resData = await response.json();
           if(response.ok) {
               setTrackingId(resData.trackingId);
               setShowSlotModal(false);
               setCurrentStep(4);
           } else {
               Alert.alert("Error", resData.msg);
           } 
      } catch(e) { Alert.alert("Error"); } finally { setSlotLoading(false); }
  };

  // --- RENDERERS ---

  const renderInstructions = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Step 1: Instructions</Text>
      <View style={styles.infoBox}><FileText color="#2563eb" size={24} /><Text style={styles.infoText}>{job.processInstructions || "Follow steps."}</Text></View>
      <Text style={styles.subTitle}>Required Documents:</Text>
      {requiredDocuments.map((doc, i) => <Text key={i} style={styles.bullet}>• {doc}</Text>)}
      <TouchableOpacity style={styles.mainBtn} onPress={()=> {
          if(formSchema.length > 0) setCurrentStep(1);
          else setCurrentStep(2);
      }}><Text style={styles.btnText}>Start Application &rarr;</Text></TouchableOpacity>
    </View>
  );

  const renderDynamicForm = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Step 2: Fill Details</Text>
      {feeStructure.length > 0 && (
          <View style={styles.rateCard}><Text style={{fontWeight:'bold',color:'#15803d'}}>Fee Rates:</Text>{feeStructure.map((r,i)=><Text key={i} style={{fontSize:12}}>• {r.category} ({r.gender}): ₹{r.amount}</Text>)}</View>
      )}
      {formSchema.length > 0 ? formSchema.map((field, index) => (
          <View key={index} style={{marginBottom: 15}}>
              <Text style={styles.label}>{field.label} {field.isRequired && "*"}</Text>
              {field.type === 'dropdown' ? (
                  <View style={styles.pickerBox}><Picker selectedValue={formData[field.label]} onValueChange={(v) => {setFormData({...formData, [field.label]: v}); }}><Picker.Item label="-- Select --" value="" />{field.options.map((opt, i) => (<Picker.Item key={i} label={opt.label} value={opt.label} />))}</Picker></View>
              ) : (
                  <TextInput style={styles.input} placeholder={field.label} value={formData[field.label]} onChangeText={(t) => setFormData({...formData, [field.label]: t})} keyboardType={field.type==='number'?'numeric':'default'}/>
              )}
          </View>
      )) : <Text style={{color:'#666', marginBottom:20}}>No extra details required.</Text>}

      <View style={styles.feeBox}>
          <View style={styles.feeRow}><Text>Official Fee:</Text><Text>₹ {calculatedOfficialFee}</Text></View>
          <View style={styles.feeRow}><Text>Service Fee:</Text><Text>₹ {serviceFeeFixed}</Text></View>
          <View style={{height:1, backgroundColor:'#ccc', marginVertical:5}}/>
          <View style={styles.feeRow}><Text style={{fontWeight:'bold', color:'#2563eb'}}>Total:</Text><Text style={{fontWeight:'bold', fontSize:18, color:'#2563eb'}}>₹ {calculatedOfficialFee + serviceFeeFixed}</Text></View>
      </View>
      <TouchableOpacity style={styles.mainBtn} onPress={() => {
          const missing = formSchema.filter(f => f.isRequired && !formData[f.label]);
          if(missing.length > 0) return Alert.alert("Required", `Please fill: ${missing.map(m=>m.label).join(', ')}`);
          setCurrentStep(2); 
      }}><Text style={styles.btnText}>Next: Upload Docs &rarr;</Text></TouchableOpacity>
    </ScrollView>
  );

  const renderDocUpload = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Step 3: Upload Docs</Text>
      {requiredDocuments.map((doc, i) => {
        const fileObj = uploadedDocs[doc];
        const isSaved = fileObj?.type === 'saved';
        return (
            <View key={i} style={styles.docRow}>
                <Text style={styles.docLabel}>{doc}</Text>
                <TouchableOpacity onPress={() => pickFile(doc)} style={[styles.uploadBtn, fileObj && styles.uploadedBtn]}>{isSaved ? <CheckCircle color="green" size={20}/> : fileObj ? <CheckCircle color="#2563eb" size={20}/> : <Upload color="#fff" size={20}/>}</TouchableOpacity>
            </View>
        );
      })}
      
      {/* ✅ FIX: Disable button if submitting */}
      <TouchableOpacity 
        style={[styles.mainBtn, isSubmitting.current && {opacity:0.7}]} 
        disabled={isSubmitting.current}
        onPress={() => {
          const missing = requiredDocuments.filter(d => !uploadedDocs[d]);
          if(missing.length > 0) return Alert.alert("Missing", `Upload: ${missing.join(', ')}`);
          
          Alert.alert("Submit?", `Total Fee: ₹${calculatedOfficialFee + serviceFeeFixed}`, [
              { text:"Yes", onPress:()=> {
                  if(!isSubmitting.current) setCurrentStep(3);
              }}, 
              { text:"Cancel" }
          ]);
      }}>
          <Text style={styles.btnText}>{isSubmitting.current ? "Processing..." : "Find Expert & Submit"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderSearching = () => (
    <View style={styles.centerContainer}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}><View style={styles.searchCircle}><Search size={50} color="#fff" /></View></Animated.View>
      <Text style={styles.searchTitle}>Finding Expert...</Text>
      <Text style={{color:'#666'}}>Matching job profile...</Text>
      <ActivityIndicator size="large" color="#2563eb" style={{marginTop: 20}}/>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.centerContainer}>
      <CheckCircle size={80} color="#10b981" />
      <Text style={styles.successTitle}>Submitted!</Text>
      <View style={styles.agentBox}>
          {assignedAgent ? <><UserCheck size={24} color="#1e3c72"/><Text style={{marginLeft:10}}>Assigned: {assignedAgent}</Text></> : <><Calendar size={24} color="#f59e0b"/><Text style={{marginLeft:10}}>Slot Booked</Text></>}
      </View>
      <Text style={styles.trackId}>ID: {trackingId}</Text>
      <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('MainApp', { screen: 'Home' })}><Text style={{color:'#2563eb'}}>Go Home</Text></TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{flex:1, backgroundColor:'#f3f4f6'}}>
      <View style={styles.header}><TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft color="#fff" /></TouchableOpacity><Text style={styles.headerText}>Wizard</Text></View>
      <View style={{flex: 1, padding: 20}}>
        {currentStep === 0 && renderInstructions()}
        {currentStep === 1 && renderDynamicForm()}
        {currentStep === 2 && renderDocUpload()}
        {currentStep === 3 && renderSearching()}
        {currentStep === 4 && renderSuccess()}
      </View>
      <Modal visible={showSlotModal} animationType="slide" transparent={true} onRequestClose={() => setShowSlotModal(false)}>
          <View style={styles.modalBg}>
              <View style={styles.modalCard}>
                  <Text style={styles.modalTitle}>All Experts Busy ⚠️</Text>
                  <Text style={styles.label}>Date:</Text><TextInput style={styles.input} placeholder="DD/MM/YYYY" value={selectedDate} onChangeText={setSelectedDate}/>
                   <View style={{flexDirection:'row', flexWrap:'wrap', gap:5, marginVertical:10}}>
                      {timeSlots.map(s=><TouchableOpacity key={s} onPress={()=>setSelectedSlot(s)} style={[styles.slotPill, selectedSlot===s && styles.slotSel]}><Text style={{color:selectedSlot===s?'#fff':'#333', fontSize:10}}>{s}</Text></TouchableOpacity>)}
                  </View>
                  <TouchableOpacity style={styles.mainBtn} onPress={handleSlotSubmit}>{slotLoading ? <ActivityIndicator color="#fff"/> : <Text style={styles.btnText}>Submit</Text>}</TouchableOpacity>
              </View>
          </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, backgroundColor: '#1e3c72', flexDirection: 'row', alignItems: 'center' },
  headerText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  stepContainer: { flex: 1 },
  stepTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937', marginBottom: 15 },
  infoBox: { backgroundColor: '#eff6ff', padding: 16, borderRadius: 12, marginBottom: 20 },
  infoText: { fontSize: 16, color: '#1e3c72', lineHeight: 24 },
  subTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  bullet: { fontSize: 16, color: '#374151', marginBottom: 6, marginLeft: 10 },
  docRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, backgroundColor: '#fff', padding: 12, borderRadius: 8 },
  docLabel: { fontSize: 16, fontWeight: '500', color: '#374151' },
  uploadBtn: { minWidth: 40, height: 40, backgroundColor: '#9ca3af', borderRadius: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  uploadedBtn: { backgroundColor: '#fff', borderWidth:1, borderColor:'green' },
  previewImg: { width: 40, height: 40, borderRadius: 5, marginRight: 10 },
  mainBtn: { backgroundColor: '#2563eb', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20, width: '100%' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  searchCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  searchTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e3c72', marginBottom: 10 },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: '#10b981', marginTop: 20 },
  agentBox: { marginTop: 30, backgroundColor: '#eff6ff', padding: 15, borderRadius: 10, flexDirection: 'row', alignItems: 'center', width: '100%', elevation: 2 },
  agentText: { fontSize: 16, color: '#1e3c72' },
  trackId: { marginTop: 20, fontSize: 18, fontWeight: 'bold' },
  homeBtn: { marginTop: 40, padding: 10, borderWidth: 1, borderColor: '#2563eb', borderRadius: 8, width: 120, alignItems: 'center' },
  rateCard: { backgroundColor:'#f0fdf4', padding:10, borderRadius:8, marginBottom:15, borderWidth:1, borderColor:'#bbf7d0' },
  pickerBox: { borderWidth:1, borderColor:'#ddd', borderRadius:8, marginBottom:15, backgroundColor:'#fff' },
  feeBox: { backgroundColor:'#fff7ed', padding:15, borderRadius:8, borderWidth:1, borderColor:'#fed7aa', marginTop:10 },
  feeRow: { flexDirection:'row', justifyContent:'space-between', marginBottom:5 },
  label: { fontWeight: 'bold', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, fontSize: 16 },
  slotPill: { padding:8, borderWidth:1, borderColor:'#ccc', borderRadius:20 },
  slotSel: { backgroundColor:'#2563eb', borderColor:'#2563eb' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#dc2626', marginBottom: 10 },
});