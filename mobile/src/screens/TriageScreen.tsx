import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SmoothCard } from '../components/SmoothCard';
import { getTriageAlerts } from '../services/api';

export const TriageScreen = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await getTriageAlerts();
      setAlerts(data);
    } catch (err) {
      console.error('Error fetching triage alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const renderAlertItem = ({ item }: { item: any }) => {
    const isCritical = item.severity?.toLowerCase() === 'critical';
    return (
      <SmoothCard variant={isCritical ? 'red' : 'amber'}>
        <View style={styles.cardHeader}>
          <Text style={[styles.sevBadge, isCritical ? styles.critBadge : styles.highBadge]}>
            {item.severity?.toUpperCase()}
          </Text>
          <Text style={styles.sessionText}>Session #{item.session_id}</Text>
        </View>

        <Text style={styles.description}>{item.description}</Text>

        <Text style={styles.timeText}>
          {new Date(item.triggered_at).toLocaleTimeString()}
        </Text>
      </SmoothCard>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>🚨 Nurse Triage Feed</Text>
          <TouchableOpacity onPress={fetchAlerts} style={styles.refreshBtn}>
            <Text style={styles.refreshText}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
        ) : alerts.length === 0 ? (
          <Text style={styles.emptyText}>No active red flag alerts found.</Text>
        ) : (
          <FlatList
            data={alerts}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderAlertItem}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1, padding: 20 },
  headerRow: { flexDirection: 'row', justify: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
  refreshBtn: { padding: 8, backgroundColor: '#E2E8F0', borderRadius: 12 },
  refreshText: { fontSize: 12, fontWeight: '800', color: '#334155' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sevBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, fontSize: 10, fontWeight: '900', color: '#FFF' },
  critBadge: { backgroundColor: '#DC2626' },
  highBadge: { backgroundColor: '#F59E0B' },
  sessionText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  description: { fontSize: 15, fontWeight: '800', color: '#0F172A', lineHeight: 22 },
  timeText: { fontSize: 11, color: '#94A3B8', marginTop: 8 },
  emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 40, fontSize: 16 },
});
