import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Phone, Lock, Eye, EyeOff } from 'lucide-react-native';
import API_URL from '../config/api'; // हमारी API config

// यह 'onLogin' फंक्शन हम App.js से लेंगे
export default function LoginScreen({ navigation, onLogin }) {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false); // लोडिंग स्टेट

  const handleLogin = async () => {
    if (mobile.length !== 10) {
      Alert.alert('Error', 'Mobile number 10 digit ka hona chahiye.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password kam se kam 6 character ka hona chahiye.');
      return;
    }

    setLoading(true); // लोडिंग स्टार्ट

    try {
      // 1. API को कॉल करें
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile, password }),
      });

      const data = await response.json();
      setLoading(false); // लोडिंग स्टॉप

      if (response.ok) {
        // 2. अगर लॉगिन सफल (HTTP 200)
        // हमें data.token मिल गया है
        onLogin(data.token); // हम यह टोकन App.js को भेज रहे हैं
      } else {
        // 3. अगर एरर (HTTP 400)
        Alert.alert('Login Failed', data.msg || 'Koi error hui hai');
      }
    } catch (err) {
      setLoading(false);
      console.error(err);
      Alert.alert('Error', 'Server se connect nahi ho pa raha hai.');
    }
  };

  return (
    <LinearGradient
      colors={['#000428', '#004e92']} // Blue-Black Gradient
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.title}>SewaOne</Text>
        <Text style={styles.subtitle}>Aapki Sewa, Hamaari Zimmedari</Text>

        <View style={styles.inputContainer}>
          <Phone color="#fff" size={20} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Mobile Number (10 digits)"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            maxLength={10}
            value={mobile}
            onChangeText={setMobile}
          />
        </View>

        <View style={styles.inputContainer}>
          <Lock color="#fff" size={20} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry={!showPass}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeIcon}>
            {showPass ? <EyeOff color="#fff" size={20} /> : <Eye color="#fff" size={20} />}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={loading}>
          <Text style={styles.registerText}>
            Naye user hain? <Text style={{ fontWeight: 'bold' }}>Register Now</Text>
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 48, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#ccc', marginBottom: 40 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  icon: { marginRight: 10 },
  input: {
    flex: 1,
    height: 50,
    color: '#fff',
    fontSize: 16,
  },
  eyeIcon: { padding: 5 },
  loginButton: {
    width: '100%',
    backgroundColor: '#fbc531', // Yellow
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    minHeight: 50,
    justifyContent: 'center',
  },
  loginButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  registerText: { color: '#fff', fontSize: 16 },
});