import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ScrollView,
} from 'react-native';
import { SmoothCard } from '../components/SmoothCard';
import { AudioWaveform } from '../components/AudioWaveform';
import { getNextQuestion } from '../services/api';

interface VoiceIntakeScreenProps {
  route: any;
  navigation: any;
}

export const VoiceIntakeScreen: React.FC<VoiceIntakeScreenProps> = ({
  route,
  navigation,
}) => {
  const { sessionId, patientName, language } = route.params || {};

  const [questionId, setQuestionId] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState('Loading intake question...');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const loadQuestion = async (lastAns?: string, currentQId?: string) => {
    try {
      const data = await getNextQuestion(sessionId || 1, lastAns, currentQId);
      if (data.done) {
        navigation.navigate('Done');
        return;
      }
      setQuestionId(data.question_id);
      setQuestionText(data.question_text || 'Please state your answer.');
    } catch (err) {
      console.error('Error fetching question:', err);
      if (!questionId) {
        setQuestionId('chief_complaint');
        setQuestionText('What brings you in today? Please describe your problem.');
      }
    }
  };

  useEffect(() => {
    loadQuestion(undefined, undefined);
  }, []);

  const handleConfirmAnswer = (ansText: string) => {
    if (questionId) {
      setAnswers((prev) => ({ ...prev, [questionId]: ansText }));
      loadQuestion(ansText, questionId);
      setTypedAnswer('');
      setIsTyping(false);
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      handleConfirmAnswer('Voice response recorded');
    } else {
      setIsRecording(true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Patient Bar */}
        <View style={styles.patientBar}>
          <Text style={styles.patientText}>Patient: {patientName || 'Intake'}</Text>
          <Text style={styles.sessionBadge}>Session #{sessionId || 1}</Text>
        </View>

        {/* Question Card */}
        <SmoothCard variant="blue" style={styles.questionCard}>
          <Text style={styles.qTag}>CLINICAL INTAKE QUESTION</Text>
          <Text style={styles.qText}>{questionText}</Text>
        </SmoothCard>

        {/* Voice Recording / Typing Box */}
        <SmoothCard style={styles.actionCard}>
          {!isTyping ? (
            <View style={styles.voiceCol}>
              <AudioWaveform isRecording={isRecording} />

              <TouchableOpacity
                onPress={toggleRecording}
                style={[styles.micBtn, isRecording && styles.micBtnRecording]}
              >
                <Text style={styles.micEmoji}>🎙️</Text>
              </TouchableOpacity>

              <Text style={styles.micLabel}>
                {isRecording ? 'Listening... Tap when done' : 'Tap Microphone to Speak'}
              </Text>

              <TouchableOpacity onPress={() => setIsTyping(true)}>
                <Text style={styles.switchText}>Prefer typing? Click here</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.typeCol}>
              <Text style={styles.typeTitle}>Type Response</Text>
              <TextInput
                value={typedAnswer}
                onChangeText={setTypedAnswer}
                placeholder="Type your response here..."
                multiline
                style={styles.textInput}
              />
              <View style={styles.btnRow}>
                <TouchableOpacity
                  onPress={() => setIsTyping(false)}
                  style={styles.secBtn}
                >
                  <Text style={styles.secBtnText}>Use Voice</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleConfirmAnswer(typedAnswer)}
                  disabled={!typedAnswer.trim()}
                  style={[styles.priBtn, !typedAnswer.trim() && styles.btnDisabled]}
                >
                  <Text style={styles.priBtnText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SmoothCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 20, gap: 16 },
  patientBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  patientText: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  sessionBadge: { fontSize: 12, fontWeight: '700', color: '#2563EB' },
  questionCard: { gap: 8, padding: 24 },
  qTag: { fontSize: 11, fontWeight: '900', color: '#2563EB', letterSpacing: 1 },
  qText: { fontSize: 22, fontWeight: '800', color: '#0F172A', lineHeight: 30 },
  actionCard: { alignItems: 'center', padding: 24 },
  voiceCol: { alignItems: 'center', gap: 16, width: '100%' },
  micBtn: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  micBtnRecording: { backgroundColor: '#DC2626' },
  micEmoji: { fontSize: 36 },
  micLabel: { fontSize: 14, fontWeight: '700', color: '#475569' },
  switchText: { fontSize: 13, fontWeight: '600', color: '#2563EB', textDecorationLine: 'underline' },
  typeCol: { width: '100%', gap: 12 },
  typeTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    padding: 14,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  btnRow: { flexDirection: 'row', gap: 12 },
  secBtn: { flex: 1, padding: 14, borderRadius: 16, backgroundColor: '#E2E8F0', alignItems: 'center' },
  secBtnText: { color: '#334155', fontWeight: '800' },
  priBtn: { flex: 1, padding: 14, borderRadius: 16, backgroundColor: '#2563EB', alignItems: 'center' },
  priBtnText: { color: '#FFF', fontWeight: '800' },
  btnDisabled: { opacity: 0.5 },
});
