import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle, XCircle, HelpCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from '../config/api';

export default function CheckEligibilityScreen({ route, navigation }) {
  const { job } = route.params;
  const criteriaList = job.eligibilityCriteria || [];

  const [loading, setLoading] = useState(true);
  const [userProfileData, setUserProfileData] = useState({}); 
  const [currentAnswers, setCurrentAnswers] = useState({}); 
  const [result, setResult] = useState(null); 

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const response = await fetch(`${API_URL}/auth/me`, {
          method: 'GET',
          headers: { 'x-auth-token': token },
        });
        const userData = await response.json();
        
        const savedData = userData.userProfileData || {};
        setUserProfileData(savedData);
        
        const initialAnswers = {};
        criteriaList.forEach(crit => {
          if (savedData[crit.key]) {
            initialAnswers[crit.key] = savedData[crit.key];
          }
        });
        setCurrentAnswers(initialAnswers);
        
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchUserData();
  }, []);

  const handleAnswer = (key, value) => {
    setCurrentAnswers({ ...currentAnswers, [key]: value });
  };

  // --- API Helper ---
  const saveToBackend = async (data, force = false) => {
    const token = await AsyncStorage.getItem('userToken');
    const response = await fetch(`${API_URL}/auth/update-profile-data`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-auth-token': token 
      },
      body: JSON.stringify({ newData: data, forceUpdate: force })
    });
    return response;
  };

  // --- MAIN CHECK LOGIC ---
  const checkAndSave = async () => {
    const allAnswered = criteriaList.every(crit => currentAnswers[crit.key]);
    if (!allAnswered) return Alert.alert("Incomplete", "Sabhi sawalon ka jawab dein.");

    setLoading(true);

    try {
      // 1. Pehle Normal Save Try Karein
      let response = await saveToBackend(currentAnswers, false);

      // 2. Agar Conflict (409) aaya
      if (response.status === 409) {
        const resData = await response.json();
        setLoading(false); // Loader roko taaki alert dikhe

        let conflictMsg = "Aapne kuch jawab badal diye hain:\n";
        resData.conflicts.forEach(c => {
          conflictMsg += `\n• ID: ${c.key}\n  Pehle: ${c.oldValue} -> Ab: ${c.newValue}`;
        });
        conflictMsg += "\n\nKya aap inhe update karna chahte hain?";

        Alert.alert(
          "Profile Data Mismatch",
          conflictMsg,
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Update Profile", 
              style: "destructive",
              onPress: async () => {
                setLoading(true);
                await saveToBackend(currentAnswers, true); // Force Save
                calculateResult();
              }
            }
          ]
        );
        return; // Rukk jao
      } 
      
      // 3. Agar sab theek hai (200 OK)
      calculateResult();

    } catch (e) {
      setLoading(false);
      Alert.alert("Error", "Connection failed.");
    }
  };

  const calculateResult = () => {
    let isEligible = true;
    criteriaList.forEach(crit => {
      if (currentAnswers[crit.key] !== crit.expectedValue) isEligible = false;
    });
    setResult(isEligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE');
    setLoading(false);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb"/></View>;

  if (result) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.resultBox}>
          {result === 'ELIGIBLE' ? (
            <>
              <CheckCircle size={80} color="#10b981" />
              <Text style={styles.resultTitle}>You are Eligible!</Text>
              <TouchableOpacity style={styles.btnSuccess} onPress={() => navigation.goBack()}><Text style={styles.btnText}>Go to Apply</Text></TouchableOpacity>
            </>
          ) : (
            <>
              <XCircle size={80} color="#ef4444" />
              <Text style={[styles.resultTitle, {color:'#ef4444'}]}>Not Eligible</Text>
              <TouchableOpacity style={styles.btnFail} onPress={() => navigation.goBack()}><Text style={styles.btnText}>Go Back</Text></TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}><TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft color="#fff" size={24} /></TouchableOpacity><Text style={styles.headerTitle}>Check Eligibility</Text></View>
      <ScrollView style={styles.content}>
        {criteriaList.map((item, index) => {
          const savedAns = userProfileData[item.key];
          const currentAns = currentAnswers[item.key];
          return (
            <View key={index} style={styles.card}>
              <View style={styles.qRow}><HelpCircle size={20} color="#2563eb" /><Text style={styles.question}>{item.question}</Text></View>
              {savedAns && <Text style={styles.autoFilledText}>✓ Saved: {savedAns}</Text>}
              <View style={styles.optionsRow}>
                <TouchableOpacity style={[styles.optionBtn, currentAns === 'Yes' && styles.optionSelectedYes]} onPress={() => handleAnswer(item.key, 'Yes')}><Text style={[styles.optionText, currentAns === 'Yes' && styles.textSelected]}>YES</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.optionBtn, currentAns === 'No' && styles.optionSelectedNo]} onPress={() => handleAnswer(item.key, 'No')}><Text style={[styles.optionText, currentAns === 'No' && styles.textSelected]}>NO</Text></TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
      <View style={styles.footer}><TouchableOpacity style={styles.checkBtn} onPress={checkAndSave}><Text style={styles.checkBtnText}>Check & Save</Text></TouchableOpacity></View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#1e3c72' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginLeft: 16 },
  content: { padding: 16 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, elevation: 2 },
  qRow: { flexDirection: 'row', marginBottom: 12 },
  question: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginLeft: 10, flex: 1 },
  autoFilledText: { fontSize: 12, color: '#10b981', marginBottom: 10, marginLeft: 30, fontStyle: 'italic' },
  optionsRow: { flexDirection: 'row', marginLeft: 30 },
  optionBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: '#d1d5db', marginRight: 12, backgroundColor: '#fff' },
  optionSelectedYes: { backgroundColor: '#10b981', borderColor: '#10b981' },
  optionSelectedNo: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  optionText: { fontWeight: '600', color: '#6b7280' },
  textSelected: { color: '#fff' },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e5e7eb' },
  checkBtn: { backgroundColor: '#2563eb', padding: 15, borderRadius: 8, alignItems: 'center' },
  checkBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  resultBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  resultTitle: { fontSize: 24, fontWeight: 'bold', color: '#10b981', marginTop: 20, marginBottom: 10 },
  btnSuccess: { backgroundColor: '#10b981', paddingHorizontal: 40, paddingVertical: 12, borderRadius: 30 },
  btnFail: { backgroundColor: '#6b7280', paddingHorizontal: 40, paddingVertical: 12, borderRadius: 30 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});