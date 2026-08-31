import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { KioskScreen } from './src/screens/KioskScreen';
import { VoiceIntakeScreen } from './src/screens/VoiceIntakeScreen';
import { TriageScreen } from './src/screens/TriageScreen';
import { DoctorScreen } from './src/screens/DoctorScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState<'kiosk' | 'triage' | 'doctor'>('kiosk');
  const [intakeRouteParams, setIntakeRouteParams] = useState<any | null>(null);

  const mockNavigation = {
    navigate: (screen: string, params?: any) => {
      if (screen === 'VoiceIntake') {
        setIntakeRouteParams(params);
      } else if (screen === 'Done') {
        setIntakeRouteParams(null);
        setActiveTab('kiosk');
      } else if (screen === 'Kiosk') {
        setActiveTab('kiosk');
      }
    },
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Screen Body */}
      <View style={styles.body}>
        {intakeRouteParams ? (
          <VoiceIntakeScreen
            route={{ params: intakeRouteParams }}
            navigation={mockNavigation}
          />
        ) : activeTab === 'kiosk' ? (
          <KioskScreen navigation={mockNavigation} />
        ) : activeTab === 'triage' ? (
          <TriageScreen />
        ) : (
          <DoctorScreen />
        )}
      </View>

      {/* Bottom Navigation Bar */}
      {!intakeRouteParams && (
        <View style={styles.navBar}>
          <TouchableOpacity
            onPress={() => setActiveTab('kiosk')}
            style={[styles.navItem, activeTab === 'kiosk' && styles.navItemActive]}
          >
            <Text style={styles.navIcon}>📱</Text>
            <Text style={[styles.navText, activeTab === 'kiosk' && styles.navTextActive]}>
              Kiosk
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('triage')}
            style={[styles.navItem, activeTab === 'triage' && styles.navItemActive]}
          >
            <Text style={styles.navIcon}>🚨</Text>
            <Text style={[styles.navText, activeTab === 'triage' && styles.navTextActive]}>
              Triage
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('doctor')}
            style={[styles.navItem, activeTab === 'doctor' && styles.navItemActive]}
          >
            <Text style={styles.navIcon}>🩺</Text>
            <Text style={[styles.navText, activeTab === 'doctor' && styles.navTextActive]}>
              Doctor
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  body: { flex: 1 },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  navItem: { alignItems: 'center', gap: 2, paddingHorizontal: 16, paddingVertical: 4 },
  navItemActive: { backgroundColor: '#EFF6FF', borderRadius: 12 },
  navIcon: { fontSize: 20 },
  navText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  navTextActive: { color: '#2563EB', fontWeight: '900' },
});
