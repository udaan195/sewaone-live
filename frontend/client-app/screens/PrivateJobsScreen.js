import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Briefcase, Clock } from 'lucide-react-native';

export default function PrivateJobsScreen({ navigation }) {
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3c72" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Private Jobs</Text>
      </View>

      <View style={styles.scrollContent}>
        
        <View style={styles.comingSoonCard}>
            <Clock color="#1e3c72" size={60} />
            <Text style={styles.mainTitle}>Coming Soon</Text>
            <Text style={styles.subText}>
               Hamara naya app **JobSaathi** jald hi aayega!
            </Text>
            <Text style={styles.detailText}>
                Is module mein aapko advanced Resume Maker aur Private Job alerts milenge.
            </Text>
            <TouchableOpacity 
                style={styles.notifyBtn} 
                onPress={() => alert('Notifications feature is ready to be implemented after APK build!')}
            >
                <Text style={styles.notifyText}>Notify Me When Ready</Text>
            </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#1e3c72' },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  scrollContent: { padding: 20, flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  comingSoonCard: {
      width: '100%',
      backgroundColor: '#fff',
      padding: 40,
      borderRadius: 16,
      alignItems: 'center',
      elevation: 5,
      borderWidth: 2,
      borderColor: '#1e3c72',
      borderStyle: 'dashed'
  },
  mainTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#1e3c72',
      marginTop: 20,
      marginBottom: 10
  },
  subText: {
      fontSize: 18,
      color: '#000',
      textAlign: 'center',
      marginBottom: 20
  },
  detailText: {
      fontSize: 14,
      color: '#6b7280',
      textAlign: 'center',
      marginBottom: 30
  },
  notifyBtn: {
      backgroundColor: '#f59e0b',
      padding: 12,
      borderRadius: 8,
  },
  notifyText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
  }
});