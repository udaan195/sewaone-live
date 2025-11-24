import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, ActivityIndicator, Modal, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle, Upload, Search, UserCheck, Calendar, FileText, Info, Edit2 } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import API_URL from '../config/api';

// Cloudinary Config
const CLOUD_NAME = "dka87xxxx"; 
const UPLOAD_PRESET = "sewaone_preset";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

export default function ServiceWizardScreen({ route, navigation }) {
  const { service } = route.params; 
  
  const [currentStep, setCurrentStep] = useState(1);
  const [templateSchema, setTemplateSchema] = useState([]);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [formData, setFormData] = useState({}); 

  const [uploadedDocs, setUploadedDocs] = useState({});
  
  const [trackingId, setTrackingId] = useState(null);
  const [assignedAgent, setAssignedAgent] = useState(null);
  
  const baseOfficialFee = service.officialFee || 0;
  const baseServiceFee = service.serviceCharge || 50;
  const totalFee = baseOfficialFee + baseServiceFee;
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isSubmitting = useRef(false); // Double submit lock

  // --- 1. LOAD TEMPLATE ---
  useEffect(() => {
    const fetchTemplate = async () => {
        if (service.linkedFormId) {
            setLoadingTemplate(true);
            try {
                const res = await fetch(`${API_URL}/forms/${service.linkedFormId}`);
                if(res.ok) {
                    const data = await res.json();
                    setTemplateSchema(data.sections || []);
                }
            } catch(e) { console.error(e); } 
            finally { setLoadingTemplate(false); }
        } 
        else if (service.requiredFields && service.requiredFields.length > 0) {
             setTemplateSchema([{
                 heading: "Basic Details", 
                 fields: service.requiredFields.map(f => ({
                    label: f.label,
                    type: f.type,
                    isRequired: f.required,
                    options: [] 
                 }))
             }]);
        }
        else {
             setTemplateSchema([{
                 heading: "Applicant Details", 
                 fields: [
                    { label: "Full Name", type: "text", isRequired: true },
                    { label: "Father Name", type: "text", isRequired: true },
                    { label: "Date of Birth", type: "text", isRequired: true }
                 ]
             }]);
        }
    };
    fetchTemplate();
  }, [service]);

  // Animation Loop
  useEffect(() => { 
      if (currentStep === 4) { 
          if (isSubmitting.current) return;
          isSubmitting.current = true;

          Animated.loop(
              Animated.sequence([
                  Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }), 
                  Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
              ])
          ).start(); 
          performLiveSearch(); 
      } 
  }, [currentStep]);

  const handleInputChange = (label, value) => { setFormData(prev => ({ ...prev, [label]: value })); };
  
  const pickFile = async (docName) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true });
      if (!result.canceled && result.assets) {
          setUploadedDocs({...uploadedDocs, [docName]: { uri: result.assets[0].uri, name: result.assets[0].name, mimeType: result.assets[0].mimeType }});
      }
    } catch (err) {}
  };

  // --- VALIDATION LOGIC (NEW) ---
  
  // Step 2 Validation (Details)
  const validateStep2 = () => {
      let isValid = true;
      let missingField = '';

      // Loop through all sections and fields
      for (const section of templateSchema) {
          for (const field of section.fields) {
              // Check if field is required AND empty
              if (field.isRequired) {
                  const val = formData[field.label];
                  if (!val || val.toString().trim() === '') {
                      isValid = false;
                      missingField = field.label;
                      break; // Stop loop on first error
                  }
              }
          }
          if (!isValid) break;
      }

      if (!isValid) {
          Alert.alert("Missing Detail", `Please fill the required field: ${missingField}`);
      } else {
          setCurrentStep(3); // Go to Next Step
      }
  };

  // Step 3 Validation (Documents)
  const validateStep3 = () => {
      let missingDoc = '';
      let isValid = true;

      if (service.requiredDocuments && service.requiredDocuments.length > 0) {
          for (const doc of service.requiredDocuments) {
              if (!uploadedDocs[doc]) {
                  isValid = false;
                  missingDoc = doc;
                  break;
              }
          }
      }

      if (!isValid) {
          Alert.alert("Missing Document", `Please upload: ${missingDoc}`);
      } else {
          setCurrentStep(4); // Start Submission
      }
  };

  // --- SUBMIT LOGIC ---
  const uploadToCloudinary = async (fileObj) => {
    if (fileObj.type === 'saved' || fileObj.uri.startsWith('http')) return fileObj.uri;
    const data = new FormData();
    data.append('file', { uri: fileObj.uri, name: fileObj.name || 'doc', type: fileObj.mimeType || 'image/jpeg' });
    data.append('upload_preset', UPLOAD_PRESET);
    try {
      const response = await fetch(CLOUDINARY_URL, { method: 'post', body: data });
      const result = await response.json();
      return result.secure_url;
    } catch (err) { return null; }
  };

  const performLiveSearch = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      const finalDocLinks = [];
      for (const docName of Object.keys(uploadedDocs)) {
          const url = await uploadToCloudinary(uploadedDocs[docName]);
          if (url) finalDocLinks.push({ docName: docName, url: url });
      }

      const payload = { 
          jobId: service._id, 
          uploadedDocuments: finalDocLinks,
          applicationData: formData, 
          paymentDetails: { officialFee: baseOfficialFee, serviceFee: baseServiceFee, totalAmount: totalFee, isPaid: false },
          isService: true 
      };

      const response = await fetch(`${API_URL}/applications/apply`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json', 'x-auth-token': token }, 
          body: JSON.stringify(payload) 
      });
      
      const text = await response.text();
      try {
          const resData = JSON.parse(text);
          if (response.ok) {
              setTrackingId(resData.trackingId);
              if (resData.status === 'ASSIGNED') {
                  setAssignedAgent(resData.agentName || resData.assignedAgent || "Agent");
              } else {
                  setAssignedAgent(null);
              }
              setCurrentStep(5);
          } else {
              Alert.alert("Error", resData.msg || "Submission failed");
              setCurrentStep(3);
              isSubmitting.current = false;
          }
      } catch (e) {
          Alert.alert("Server Error", "Backend crashed. Check logs.");
          setCurrentStep(3);
          isSubmitting.current = false;
      }
    } catch (error) { 
        setCurrentStep(3); 
        isSubmitting.current = false;
        Alert.alert("Network Error", "Failed to connect"); 
    }
  };

  // RENDERERS
  const renderStep1 = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Step 1: Overview</Text>
      <View style={styles.infoBox}><Info color="#2563eb" size={24} /><Text style={styles.infoText}>{service.description || "Please follow instructions."}</Text></View>
      <Text style={styles.subTitle}>Required Documents:</Text>
      {(service.requiredDocuments || []).map((doc, i) => <Text key={i} style={styles.bullet}>• {doc}</Text>)}
      <TouchableOpacity style={styles.mainBtn} onPress={()=>setCurrentStep(2)}><Text style={styles.btnText}>Next: Fill Form &rarr;</Text></TouchableOpacity>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Step 2: Details</Text>
      
      {loadingTemplate ? (
          <View style={{padding:20}}><ActivityIndicator size="large" color="#2563eb"/><Text style={{textAlign:'center'}}>Loading Form...</Text></View>
      ) : (
          templateSchema.length > 0 ? (
              templateSchema.map((section, sIndex) => (
                 <View key={sIndex} style={{marginBottom: 20}}>
                     <Text style={{fontWeight:'bold', color:'#166534', marginBottom:10, fontSize:16, textDecorationLine:'underline'}}>{section.heading}</Text>
                     {section.fields.map((field, fIndex) => (
                         <View key={fIndex} style={{marginBottom: 15}}>
                             <Text style={styles.label}>{field.label} {field.isRequired && "*"}</Text>
                             {field.type === 'dropdown' || field.type === 'select' ? (
                                 <View style={styles.pickerBox}>
                                     <Picker selectedValue={formData[field.label]} onValueChange={(v) => handleInputChange(field.label, v)}>
                                         <Picker.Item label="-- Select --" value="" />
                                         {field.options && field.options.map((opt, i) => <Picker.Item key={i} label={opt.label || opt} value={opt.value || opt} />)}
                                     </Picker>
                                 </View>
                             ) : (
                                 <TextInput 
                                     style={styles.input} 
                                     placeholder={`Enter ${field.label}`} 
                                     value={formData[field.label]} 
                                     onChangeText={(t) => handleInputChange(field.label, t)} 
                                     keyboardType={field.type==='number'?'numeric':'default'}
                                 />
                             )}
                         </View>
                     ))}
                 </View>
              ))
          ) : <Text style={{color:'#666', textAlign:'center', marginBottom:20}}>No form details required.</Text>
      )}

      <View style={styles.feeBox}><Text style={{fontWeight:'bold'}}>Total Fee: ₹{totalFee}</Text></View>
      
      {/* ✅ USE VALIDATION FUNCTION HERE */}
      <TouchableOpacity style={styles.mainBtn} onPress={validateStep2}>
          <Text style={styles.btnText}>Next: Upload Docs &rarr;</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Step 3: Documents</Text>
      {(service.requiredDocuments || []).map((doc, i) => {
        const fileObj = uploadedDocs[doc];
        return (
            <View key={i} style={styles.docRow}>
                <Text style={styles.docLabel}>{doc} <Text style={{color:'red'}}>*</Text></Text>
                <TouchableOpacity onPress={() => pickFile(doc)} style={[styles.uploadBtn, fileObj && styles.uploadedBtn]}>
                    {fileObj ? <CheckCircle color="green" size={20}/> : <Upload color="#fff" size={20}/>}
                </TouchableOpacity>
            </View>
        );
      })}
      
      {/* ✅ USE VALIDATION FUNCTION HERE */}
      <TouchableOpacity style={styles.mainBtn} onPress={validateStep3}>
          <Text style={styles.btnText}>Submit & Search Agent</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep4 = () => (<View style={styles.centerContainer}><Animated.View style={{ transform: [{ scale: pulseAnim }] }}><View style={styles.searchCircle}><Search size={50} color="#fff" /></View></Animated.View><Text style={styles.searchTitle}>Connecting...</Text><Text style={{color:'#666'}}>Finding expert for: {service.category}</Text></View>);
  
  const renderStep5 = () => (<View style={styles.centerContainer}><CheckCircle size={80} color="#10b981"/><Text style={styles.successTitle}>Success!</Text><View style={styles.agentBox}>{assignedAgent ? <><UserCheck size={24} color="#1e3c72"/><Text style={{marginLeft:10, fontWeight:'bold'}}>Assigned: {assignedAgent}</Text></> : <Text>Request Queued (Agents Busy)</Text>}</View><Text style={styles.trackId}>ID: {trackingId}</Text><TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('MainApp')}><Text style={{color:'#2563eb'}}>Go Home</Text></TouchableOpacity></View>);

  return (
    <SafeAreaView style={{flex:1, backgroundColor:'#f3f4f6'}}>
      <View style={styles.header}><TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft color="#fff" /></TouchableOpacity><Text style={styles.headerText}>{service.title}</Text></View>
      <View style={{flex: 1, padding: 20}}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, backgroundColor: '#1e3c72', flexDirection: 'row', alignItems: 'center' },
  headerText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  stepContainer: { flex: 1 },
  stepTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 15 },
  infoBox: { backgroundColor: '#eff6ff', padding: 16, borderRadius: 12, marginBottom: 20 },
  infoText: { fontSize: 15, color: '#1e3c72', lineHeight: 22 },
  subTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10, color: '#333' },
  bullet: { fontSize: 15, color: '#555', marginBottom: 6, marginLeft: 10 },
  label: { fontWeight: 'bold', marginBottom: 5, color: '#374151' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, fontSize: 16, backgroundColor: '#fff' },
  docRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, backgroundColor: '#fff', padding: 12, borderRadius: 8 },
  docLabel: { fontSize: 15, fontWeight: '500', color: '#374151' },
  uploadBtn: { width: 40, height: 40, backgroundColor: '#9ca3af', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  uploadedBtn: { backgroundColor: '#fff', borderWidth:1, borderColor:'green' },
  feeBox: { backgroundColor:'#fff7ed', padding:15, borderRadius:8, borderWidth:1, borderColor:'#fed7aa', marginTop:20 },
  mainBtn: { backgroundColor: '#2563eb', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20, width: '100%' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  searchCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  searchTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e3c72', marginBottom: 10 },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: '#10b981', marginTop: 20 },
  agentBox: { marginTop: 30, backgroundColor: '#eff6ff', padding: 15, borderRadius: 10, flexDirection: 'row', alignItems: 'center', width: '100%' },
  trackId: { marginTop: 20, fontSize: 18, fontWeight: 'bold' },
  homeBtn: { marginTop: 40, padding: 10, borderWidth: 1, borderColor: '#2563eb', borderRadius: 8, width: 120, alignItems: 'center' },
  pickerBox: { borderWidth:1, borderColor:'#ddd', borderRadius:8, marginBottom:15, backgroundColor:'#fff' },
});