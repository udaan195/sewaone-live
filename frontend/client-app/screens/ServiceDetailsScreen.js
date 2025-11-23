import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle, FileText, Briefcase, DollarSign } from 'lucide-react-native';

export default function ServiceDetailsScreen({ route, navigation }) {
  // Route se data lete waqt check karenge ki ye 'service' hai ya 'job'
  const item = route.params.service || route.params.job || route.params.item;

  // Calculate Fees
  const officialFee = item.officialFee || 0;
  const serviceCharge = item.serviceCharge || 50;
  const totalFee = officialFee + serviceCharge;

  // --- MAIN LOGIC FIX ---
  // Jab Apply karein, to 'ServiceWizard' par bhejein
  // Backend apne aap category detect karke sahi agent ko de dega
  const handleApply = () => {
    navigation.navigate('ServiceWizard', { service: item });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* 1. HEADER (Old Style) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color="#333" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* 2. TOP CARD (Title & Basic Info) */}
        <View style={styles.card}>
            <View style={styles.iconRow}>
                <View style={styles.iconBox}>
                    <Briefcase size={24} color="#2563eb" />
                </View>
                <View style={{flex:1}}>
                    <Text style={styles.categoryTag}>{item.category} {item.subCategory ? `• ${item.subCategory}` : ''}</Text>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.orgName}>{item.organization || "SewaOne Service"}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.feeRow}>
                <View>
                    <Text style={styles.feeLabel}>Govt Fee</Text>
                    <Text style={styles.feeValue}>₹{officialFee}</Text>
                </View>
                <View>
                    <Text style={styles.feeLabel}>Service Charge</Text>
                    <Text style={styles.feeValue}>₹{serviceCharge}</Text>
                </View>
                <View>
                    <Text style={[styles.feeLabel, {color:'green'}]}>Total</Text>
                    <Text style={[styles.feeValue, {color:'green'}]}>₹{totalFee}</Text>
                </View>
            </View>
        </View>

        {/* 3. DESCRIPTION */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descText}>{item.description || "No description provided."}</Text>
        </View>

        {/* 4. INSTRUCTIONS */}
        {item.instructions && (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Instructions</Text>
                <View style={styles.instructionBox}>
                    <Text style={styles.instructionText}>{item.instructions}</Text>
                </View>
            </View>
        )}

        {/* 5. REQUIRED DOCUMENTS */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Required Documents</Text>
            {item.requiredDocuments && item.requiredDocuments.length > 0 ? (
                item.requiredDocuments.map((doc, index) => (
                    <View key={index} style={styles.docItem}>
                        <CheckCircle size={18} color="#2563eb" />
                        <Text style={styles.docText}>{doc}</Text>
                    </View>
                ))
            ) : (
                <Text style={{color:'#999', fontStyle:'italic'}}>No specific documents required.</Text>
            )}
        </View>

      </ScrollView>

      {/* 6. BOTTOM ACTION BAR */}
      <View style={styles.bottomBar}>
          <View>
              <Text style={{color:'#666', fontSize:12}}>Total Payable</Text>
              <Text style={{fontSize:22, fontWeight:'bold', color:'#333'}}>₹{totalFee}</Text>
          </View>
          <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
              <Text style={styles.applyBtnText}>Apply Now</Text>
          </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', elevation: 2 },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  
  content: { padding: 20, paddingBottom: 100 },

  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, elevation: 3 },
  iconRow: { flexDirection: 'row', gap: 15 },
  iconBox: { width: 50, height: 50, backgroundColor: '#e0e7ff', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  categoryTag: { fontSize: 12, color: '#2563eb', fontWeight: 'bold', marginBottom: 4, textTransform: 'uppercase' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  orgName: { fontSize: 14, color: '#666' },
  
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  
  feeRow: { flexDirection: 'row', justifycontent: 'space-between' },
  feeLabel: { fontSize: 12, color: '#888', marginBottom: 2 },
  feeValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },

  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  descText: { fontSize: 14, color: '#555', lineHeight: 22 },
  
  instructionBox: { backgroundColor: '#fff3cd', padding: 15, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#ffc107' },
  instructionText: { color: '#856404', fontSize: 13, lineHeight: 18 },

  docItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, backgroundColor: '#fff', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#eee' },
  docText: { fontSize: 14, color: '#555' },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: '#eee', elevation: 10 },
  applyBtn: { backgroundColor: '#2563eb', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 8 },
  applyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});