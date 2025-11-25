import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Linking, 
  Modal, 
  Switch, 
  Alert, 
  StatusBar, 
  ActivityIndicator,
  Share        // ⬅️ NEW
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  ExternalLink, 
  Download, 
  Send, 
  X, 
  FileText, 
  HelpCircle, 
  CheckCircle,
  Share2       // ⬅️ NEW
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from '../config/api';

export default function JobDetailsScreen({ route, navigation }) {
  const { job } = route.params;
  
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [isHindi, setIsHindi] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // 🔗 Yahan apna app download link daalo
  const APP_LINK = "https://sewaone.vercel.app/download";

  // 📤 SHARE FUNCTION (pehle wale code se liya gaya)
  const handleShare = async () => {
    try {
      const message = `
🔥 *New Government Job Alert!*

👮‍♂️ *${job.title}*
🏢 Org: ${job.organization || 'Govt of India'}
📅 Last Date: ${
        job.lastDate 
          ? new Date(job.lastDate).toDateString() 
          : (job.importantDates?.[0]?.value || 'See notification')
      }

📝 *Apply Fast & Easy using SewaOne App!*
👇 *Download Now:*
${APP_LINK}
      `;

      await Share.share({
        message,
        title: `Job Alert: ${job.title}`,
      });
    } catch (error) {
      Alert.alert(error.message);
    }
  };

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) { setCheckingStatus(false); return; }
        
        const res = await fetch(`${API_URL}/applications/my-history`, { 
          method: 'GET', 
          headers: { 'x-auth-token': token } 
        });
        
        if (res.ok) {
          const myApps = await res.json();
          
          const found = myApps.find(app => 
            app.jobId && (app.jobId._id === job._id || app.jobId === job._id)
          );

          if (found) setHasApplied(true);
        }
      } catch (err) { 
        console.error(err); 
      } finally { 
        setCheckingStatus(false); 
      }
    };
    checkStatus();
  }, [job._id]);

  const openLink = (url) => { 
    if(url) Linking.openURL(url).catch(e => console.error(e)); 
  };

  const handleSelfApply = () => { 
    setShowApplyModal(false); 
    openLink(job.applyLink); 
  };

  const handleSewaApply = () => { 
    setShowApplyModal(false); 
    setShowConsentModal(true); 
  };

  const handleConsentYes = async () => {
    setShowConsentModal(false);
    setCheckingEligibility(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_URL}/auth/me`, { 
        method: 'GET', 
        headers: { 'x-auth-token': token } 
      });
      const userData = await response.json();
      const userAnswers = userData.userProfileData || {}; 
      const criteriaList = job.eligibilityCriteria || [];

      for (let crit of criteriaList) {
        if (!userAnswers[crit.key]) {
          setCheckingEligibility(false);
          return Alert.alert(
            "Check Required", 
            "Eligibility check required.", 
            [
              { 
                text: "Check Now", 
                onPress: () => navigation.navigate('CheckEligibility', { job }) 
              }, 
              { text:"Cancel" }
            ]
          );
        }
        if (userAnswers[crit.key] !== crit.expectedValue) {
          setCheckingEligibility(false);
          return Alert.alert("Not Eligible", `Criteria failed: ${crit.question}`);
        }
      }
      setCheckingEligibility(false);
      navigation.navigate('ApplicationWizard', { job });
    } catch (error) { 
      setCheckingEligibility(false); 
      Alert.alert("Error", "Network error"); 
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3c72" />
      {checkingEligibility && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{color:'#fff', marginTop:10}}>Checking...</Text>
        </View>
      )}

      {/* 🔻 HEADER UPDATED: Share button add kiya */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {job.organization}
        </Text>

        <TouchableOpacity 
          onPress={handleShare} 
          style={styles.shareButton}
        >
          <Share2 color="#fff" size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionCard}>
          <Text style={styles.mainTitle}>{job.title}</Text>
          {job.shortDescription ? (
            <Text style={styles.shortDesc}>{job.shortDescription}</Text>
          ) : null}
        </View>

        {job.importantDates?.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Important Dates</Text>
            {job.importantDates.map((item, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.label}>{item.label}</Text>
                <Text style={styles.value}>{item.value}</Text>
              </View>
            ))}
          </View>
        )}

        {job.applicationFee?.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Application Fee</Text>
            {job.applicationFee.map((item, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.label}>{item.category}</Text>
                <Text style={styles.value}>{item.amount}</Text>
              </View>
            ))}
          </View>
        )}

        {job.ageLimit?.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Age Limit</Text>
            {job.ageLimit.map((item, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{item.detail}</Text>
              </View>
            ))}
          </View>
        )}

        {job.eligibilityDetails?.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Eligibility Details</Text>
            {job.eligibilityDetails.map((item, index) => (
              <View key={index} style={styles.bulletRow}>
                <Text style={styles.bullet}>✅</Text>
                <Text style={styles.bulletText}>{item.detail}</Text>
              </View>
            ))}
          </View>
        )}

        {job.vacancyDetails?.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Vacancy Details</Text>
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
              <Text style={[styles.tableCell, styles.flex2, styles.headerText]}>
                Post Name
              </Text>
              <Text style={[styles.tableCell, styles.flex1, styles.headerText]}>
                Total
              </Text>
              <Text style={[styles.tableCell, styles.flex2, styles.headerText]}>
                Elig
              </Text>
            </View>
            {job.vacancyDetails.map((item, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.flex2]}>{item.postName}</Text>
                <Text style={[styles.tableCell, styles.flex1]}>{item.totalPost}</Text>
                <Text style={[styles.tableCell, styles.flex2]}>{item.eligibility}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Important Links</Text>

          {checkingStatus ? (
            <ActivityIndicator size="small" color="#2563eb"/>
          ) : hasApplied ? (
            <TouchableOpacity 
              style={[
                styles.linkButton, 
                {backgroundColor: '#dcfce7', borderColor: '#16a34a'}
              ]} 
              disabled
            >
              <Text style={[styles.linkText, {color: '#16a34a'}]}>
                Applied ✅
              </Text>
              <CheckCircle color="#16a34a" size={20}/>
            </TouchableOpacity>
          ) : job.applyLink ? (
            <TouchableOpacity 
              style={[styles.linkButton, styles.applyButton]} 
              onPress={() => setShowApplyModal(true)}
            >
              <Text style={[styles.linkText, styles.applyText]}>
                Apply Now
              </Text>
              <Send color="#fff" size={20}/>
            </TouchableOpacity>
          ) : null}

          {job.notificationLink ? (
            <TouchableOpacity 
              style={styles.linkButton} 
              onPress={() => openLink(job.notificationLink)}
            >
              <Text style={styles.linkText}>Download Notification</Text>
              <Download color="#2563eb" size={20}/>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity 
            style={[
              styles.linkButton, 
              {backgroundColor: '#fef3c7', borderColor: '#f59e0b'}
            ]} 
            onPress={() => navigation.navigate('CheckEligibility', { job })}
          >
            <Text style={{color: '#b45309', fontWeight: 'bold'}}>
              Check Eligibility (Smart)
            </Text>
            <HelpCircle color="#b45309" size={20}/>
          </TouchableOpacity>

          {job.importantLinks?.map((item, index) => {
            if (item.isShow === false) return null;
            return (
              <TouchableOpacity 
                key={index} 
                style={styles.linkButton} 
                onPress={() => openLink(item.url)}
              >
                <Text style={styles.linkText}>{item.label}</Text>
                <ExternalLink color="#2563eb" size={20}/>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Apply Modal */}
      <Modal 
        visible={showApplyModal} 
        transparent 
        animationType="fade" 
        onRequestClose={() => setShowApplyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Method</Text>
              <TouchableOpacity onPress={() => setShowApplyModal(false)}>
                <X color="#000" size={24}/>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.optionCard} 
              onPress={handleSelfApply}
            >
              <Text style={styles.optionTitle}>Self Apply</Text>
              <Text style={styles.optionDesc}>Official Website</Text>
              <ExternalLink color="#666" size={20} style={styles.optionIcon}/>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionCard, styles.sewaOption]} 
              onPress={handleSewaApply}
            >
              <Text style={[styles.optionTitle, {color:'#1e3c72'}]}>
                Apply via SewaOne
              </Text>
              <Text style={styles.optionDesc}>We fill it for you</Text>
              <Send color="#1e3c72" size={20} style={styles.optionIcon}/>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Consent Modal */}
      <Modal 
        visible={showConsentModal} 
        animationType="slide" 
        onRequestClose={() => setShowConsentModal(false)}
      >
        <SafeAreaView style={styles.fullScreenContainer}>
          <View style={styles.fsHeader}>
            <Text style={styles.fsTitle}>Authorization</Text>
            <TouchableOpacity onPress={() => setShowConsentModal(false)}>
              <X color="#333" size={24}/>
            </TouchableOpacity>
          </View>

          <View style={styles.langBar}>
            <Text>Read in:</Text>
            <Switch value={isHindi} onValueChange={setIsHindi}/>
            <Text>{isHindi ? "Hindi" : "English"}</Text>
          </View>

          <ScrollView style={styles.fsContent}>
            <View style={styles.paper}>
              <Text style={styles.consentBody}>
                {isHindi ? job.consentTextHi : job.consentTextEn}
              </Text>
            </View>
          </ScrollView>

          <View style={styles.fsFooter}>
            <TouchableOpacity 
              style={[styles.consentBtn, styles.noBtn]} 
              onPress={()=>setShowConsentModal(false)}
            >
              <Text style={styles.noText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.consentBtn, styles.yesBtn]} 
              onPress={handleConsentYes}
            >
              <Text style={styles.yesText}>I Agree</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  loadingOverlay: { 
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
    backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', 
    alignItems: 'center', zIndex: 999 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    backgroundColor: '#1e3c72' 
  },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', flex: 1 },
  shareButton: { marginLeft: 16 }, // ⬅️ NEW
  scrollContent: { padding: 16 },
  sectionCard: { 
    backgroundColor: '#fff', borderRadius: 12, padding: 16, 
    marginBottom: 16, elevation: 2 
  },
  mainTitle: { 
    fontSize: 20, fontWeight: 'bold', color: '#dc2626', 
    marginBottom: 8, textAlign: 'center' 
  },
  shortDesc: { fontSize: 14, color: '#4b5563', lineHeight: 20, textAlign: 'center' },
  sectionHeader: { 
    fontSize: 18, fontWeight: 'bold', color: '#10b981', 
    marginBottom: 12, textAlign: 'center', textDecorationLine: 'underline' 
  },
  row: { 
    flexDirection: 'row', justifyContent: 'space-between', 
    marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', 
    paddingBottom: 4 
  },
  label: { fontWeight: '600', color: '#374151', flex: 1 },
  value: { color: '#111827', flex: 1, textAlign: 'right' },
  bulletRow: { flexDirection: 'row', marginBottom: 6 },
  bullet: { marginRight: 8, fontSize: 16, color: '#374151' },
  bulletText: { flex: 1, color: '#374151', fontSize: 14 },
  tableRow: { 
    flexDirection: 'row', borderBottomWidth: 1, 
    borderBottomColor: '#e5e7eb', paddingVertical: 8 
  },
  tableHeaderRow: { backgroundColor: '#f9fafb', borderBottomWidth: 2 },
  tableCell: { fontSize: 12, color: '#374151', paddingHorizontal: 4 },
  headerText: { fontWeight: 'bold', color: '#111827' },
  flex1: { flex: 1 }, 
  flex2: { flex: 2 },
  linkButton: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    padding: 14, backgroundColor: '#eff6ff', borderRadius: 8, 
    marginBottom: 10, borderWidth: 1, borderColor: '#bfdbfe' 
  },
  linkText: { fontWeight: '600', color: '#2563eb', fontSize: 14 },
  applyButton: { backgroundColor: '#2563eb', borderColor: '#1d4ed8' },
  applyText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { 
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' 
  },
  modalContent: { 
    backgroundColor: '#fff', borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, padding: 20, minHeight: 200 
  },
  modalHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', 
    alignItems: 'center', marginBottom: 20 
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  optionCard: { 
    padding: 16, borderRadius: 12, backgroundColor: '#f9fafb', 
    marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb', position: 'relative' 
  },
  sewaOption: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  optionTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 4 },
  optionDesc: { fontSize: 12, color: '#6b7280' },
  optionIcon: { position: 'absolute', right: 16, top: 20 },
  fullScreenContainer: { flex: 1, backgroundColor: '#fff' },
  fsHeader: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, 
    borderBottomColor: '#e5e7eb', backgroundColor: '#fff' 
  },
  fsTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  langBar: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', 
    paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#f9fafb' 
  },
  fsContent: { flex: 1, padding: 20, backgroundColor: '#f3f4f6' },
  paper: { 
    backgroundColor: '#fff', padding: 20, borderRadius: 10, 
    elevation: 1, marginBottom: 20 
  },
  consentBody: { fontSize: 16, lineHeight: 24, color: '#374151', marginBottom: 20 },
  fsFooter: { 
    flexDirection: 'row', padding: 16, borderTopWidth: 1, 
    borderTopColor: '#e5e7eb', backgroundColor: '#fff' 
  },
  consentBtn: { 
    flex: 1, padding: 14, borderRadius: 8, alignItems: 'center', 
    justifyContent: 'center' 
  },
  noBtn: { 
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#dc2626', 
    marginRight: 10 
  },
  yesBtn: { backgroundColor: '#10b981', marginLeft: 10, elevation: 2 },
  noText: { color: '#dc2626', fontWeight: 'bold', fontSize: 16 },
  yesText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});