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
import { getDoctorQueue } from '../services/api';

export const DoctorScreen = () => {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const data = await getDoctorQueue();
      setQueue(data);
    } catch (err) {
      console.error('Error fetching doctor queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const renderQueueItem = ({ item }: { item: any }) => (
    <SmoothCard variant={item.triage_status === 'CRITICAL' ? 'red' : 'white'}>
      <View style={styles.rowBetween}>
        <Text style={styles.patientName}>{item.patient_name}</Text>
        <Text style={[styles.statusBadge, item.status === 'completed' && styles.statusCompleted]}>
          {item.status.toUpperCase()}
        </Text>
      </View>
      <Text style={styles.subDetail}>
        Session #{item.session_id} • {item.patient_gender || 'N/A'} • {item.triage_status}
      </Text>
    </SmoothCard>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>🩺 Doctor Queue</Text>
          <TouchableOpacity onPress={fetchQueue} style={styles.refreshBtn}>
            <Text style={styles.refreshText}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={queue}
            keyExtractor={(item) => String(item.session_id)}
            renderItem={renderQueueItem}
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
  refreshBtn: { padding: 8, backgroundColor: '#E2E8F0', borderRadius: 12 },
  refreshText: { fontSize: 12, fontWeight: '800', color: '#334155' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  patientName: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  statusBadge: { fontSize: 10, fontWeight: '900', color: '#2563EB', backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusCompleted: { color: '#059669', backgroundColor: '#ECFDF5' },
  subDetail: { fontSize: 13, fontWeight: '600', color: '#64748B', marginTop: 4 },
});
