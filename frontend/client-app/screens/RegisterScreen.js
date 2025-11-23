import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, User, Mail, MapPin, Hash, Phone, Lock, Gift } from 'lucide-react-native';
import API_URL from '../config/api'; // API URL Import

const logoImg = require('../assets/icon.png'); 

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
      firstName: '', lastName: '', mobile: '', email: '', 
      state: '', city: '', pincode: '', password: '',
      referralCode: '' // NEW FIELD
  });
  
  const [loading, setLoading] = useState(false);

  // --- 1. HANDLE CHANGE FUNCTION (Error Fix) ---
  const handleChange = (key, value) => {
      setFormData({...formData, [key]: value});
  };

  const handleRegister = async () => {
    if (formData.mobile.length !== 10) {
      return Alert.alert('Error', 'Mobile number 10 digit ka hona chahiye.');
    }
    if (!formData.firstName || !formData.password || !formData.state) {
        return Alert.alert('Error', 'Please fill required fields.');
    }

    setLoading(true);
    try {
        // 2. API CALL TO BACKEND
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            Alert.alert('Success', 'Account created! Login now.');
            navigation.goBack();
        } else {
            Alert.alert('Registration Failed', data.msg || 'Error occurred');
        }
    } catch (e) {
        Alert.alert('Error', 'Network error. Check internet.');
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#000428', '#004e92']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft color="#fff" size={24} />
            </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          <View style={styles.logoContainer}>
            <Image source={logoImg} style={styles.logo} resizeMode="contain" />
          </View>
          
          <Text style={styles.title}>Create Account</Text>

          <InputBox icon={<User color="#fff" size={20} />} placeholder="First Name *" onChangeText={(t)=>handleChange('firstName', t)} />
          <InputBox icon={<User color="#fff" size={20} />} placeholder="Last Name" onChangeText={(t)=>handleChange('lastName', t)} />
          <InputBox icon={<Phone color="#fff" size={20} />} placeholder="Mobile Number *" onChangeText={(t)=>handleChange('mobile', t)} keyboardType="phone-pad" maxLength={10} />
          <InputBox icon={<Mail color="#fff" size={20} />} placeholder="Email (Optional)" onChangeText={(t)=>handleChange('email', t)} keyboardType="email-address" />
          <InputBox icon={<Lock color="#fff" size={20} />} placeholder="Password *" onChangeText={(t)=>handleChange('password', t)} secureTextEntry />
          
          <View style={{flexDirection:'row', gap: 10}}>
             <View style={{flex:1}}><InputBox icon={<MapPin color="#fff" size={20} />} placeholder="State *" onChangeText={(t)=>handleChange('state', t)} /></View>
             <View style={{flex:1}}><InputBox icon={<MapPin color="#fff" size={20} />} placeholder="City *" onChangeText={(t)=>handleChange('city', t)} /></View>
          </View>
          
          <InputBox icon={<Hash color="#fff" size={20} />} placeholder="Pincode" onChangeText={(t)=>handleChange('pincode', t)} keyboardType="number-pad" maxLength={6} />
          
          {/* --- REFERRAL CODE INPUT --- */}
          <InputBox 
             icon={<Gift color="#f59e0b" size={20} />} 
             placeholder="Referral Code (Optional)" 
             onChangeText={(t)=>handleChange('referralCode', t)} 
             autoCapitalize="characters"
          />

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.registerButtonText}>Register Now</Text>}
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const InputBox = ({ icon, placeholder, onChangeText, keyboardType, maxLength, secureTextEntry, autoCapitalize }) => (
  <View style={styles.inputContainer}>
    {icon}
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="#ccc"
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      maxLength={maxLength}
      secureTextEntry={secureTextEntry}
      autoCapitalize={autoCapitalize}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 10 },
  backButton: { padding: 5 },
  scrollContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  logoContainer: { alignItems: 'center', marginVertical: 10, height: 80 },
  logo: { width: 200, height: '100%' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20, textAlign: 'center' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 12, paddingHorizontal: 15, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  input: { flex: 1, height: 50, color: '#fff', fontSize: 16, marginLeft: 10 },
  registerButton: { width: '100%', backgroundColor: '#fbc531', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  registerButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
});