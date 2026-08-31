import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { SmoothCard } from '../components/SmoothCard';
import { registerPatient, createSession } from '../services/api';

interface KioskScreenProps {
  navigation: any;
}

const LANGUAGES = [
  { code: 'en', native: 'English', english: 'English' },
  { code: 'hi', native: 'हिन्दी', english: 'Hindi' },
  { code: 'bn', native: 'বাংলা', english: 'Bengali' },
  { code: 'ta', native: 'தமிழ்', english: 'Tamil' },
  { code: 'te', native: 'తెలుగు', english: 'Telugu' },
  { code: 'pa', native: 'ਪੰਜਾਬੀ', english: 'Punjabi' },
];

export const KioskScreen: React.FC<KioskScreenProps> = ({ navigation }) => {
  const [selectedLang, setSelectedLang] = useState('en');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('male');
  const [loading, setLoading] = useState(false);

  const handleStartIntake = async () => {
    if (!name.trim()) return;

    setLoading(true);
    try {
      const patient = await registerPatient({
        name: name.trim(),
        phone: phone || undefined,
        gender: gender,
      });

      const session = await createSession(patient.id);
      navigation.navigate('VoiceIntake', {
        sessionId: session.id,
        patientName: patient.name,
        language: selectedLang,
      });
    } catch (err) {
      console.error('Kiosk registration error:', err);
      // Fallback navigation for demo
      navigation.navigate('VoiceIntake', {
        sessionId: 1,
        patientName: name || 'Demo Patient',
        language: selectedLang,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logoEmoji}>🏥</Text>
          <Text style={styles.title}>Med-Drishti Mobile</Text>
          <Text style={styles.subtitle}>Patient Check-in & Voice Intake</Text>
        </View>

        {/* Language Selector Grid */}
        <SmoothCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>1. Choose Language / भाषा चुनें</Text>
          <View style={styles.langGrid}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                onPress={() => setSelectedLang(lang.code)}
                style={[
                  styles.langBtn,
                  selectedLang === lang.code && styles.langBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.langText,
                    selectedLang === lang.code && styles.langTextActive,
                  ]}
                >
                  {lang.native}
                </Text>
                <Text style={styles.langSub}>{lang.english}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </SmoothCard>

        {/* Registration Form */}
        <SmoothCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>2. Basic Information</Text>

          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Rahul Sharma"
            style={styles.input}
          />

          <Text style={styles.label}>Phone Number (Optional)</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. 9876543210"
            keyboardType="phone-pad"
            style={styles.input}
          />

          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderRow}>
            {['male', 'female', 'other'].map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => setGender(g)}
                style={[
                  styles.genderBtn,
                  gender === g && styles.genderBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.genderText,
                    gender === g && styles.genderTextActive,
                  ]}
                >
                  {g.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SmoothCard>

        {/* Action Button */}
        <TouchableOpacity
          onPress={handleStartIntake}
          disabled={!name.trim() || loading}
          style={[styles.startBtn, (!name.trim() || loading) && styles.btnDisabled]}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.startBtnText}>Start Voice Intake 🎙️</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 20, gap: 16 },
  header: { alignItems: 'center', marginBottom: 8 },
  logoEmoji: { fontSize: 48 },
  title: { fontSize: 28, fontWeight: '900', color: '#0F172A' },
  subtitle: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  sectionCard: { gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  langBtn: {
    width: '48%',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  langBtnActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  langText: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  langTextActive: { color: '#2563EB' },
  langSub: { fontSize: 11, color: '#94A3B8' },
  label: { fontSize: 13, fontWeight: '700', color: '#475569', marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#FFF',
  },
  genderRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  genderBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  genderBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  genderText: { fontSize: 12, fontWeight: '800', color: '#475569' },
  genderTextActive: { color: '#FFF' },
  startBtn: {
    backgroundColor: '#2563EB',
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  btnDisabled: { opacity: 0.5 },
  startBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
});
