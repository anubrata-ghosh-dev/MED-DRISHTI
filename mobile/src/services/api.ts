import axios from 'axios';
import { Platform } from 'react-native';

// For Android emulator, localhost is 10.0.2.2. For physical device, use host IP.
const API_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

export const mobileApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const getHealth = async () => {
  const { data } = await mobileApi.get('/api/v1/health');
  return data;
};

export const registerPatient = async (patientData: {
  name: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  abha_id?: string;
}) => {
  const { data } = await mobileApi.post('/api/v1/patients', patientData);
  return data;
};

export const createSession = async (patientId: number) => {
  const { data } = await mobileApi.post('/api/v1/sessions', null, {
    params: { patient_id: patientId },
  });
  return data;
};

export const getNextQuestion = async (
  sessionId: number,
  lastAnswer?: string,
  currentQuestionId?: string
) => {
  const { data } = await mobileApi.post('/api/v1/voice/next-question', {
    session_id: sessionId,
    last_answer: lastAnswer,
    current_question_id: currentQuestionId,
  });
  return data;
};

export const getTriageAlerts = async () => {
  const { data } = await mobileApi.get('/api/v1/triage/alerts');
  return data;
};

export const getDoctorQueue = async () => {
  const { data } = await mobileApi.get('/api/v1/doctor/queue');
  return data;
};

export const verifySession = async (sessionId: number, verifyData: any) => {
  const { data } = await mobileApi.put(`/api/v1/sessions/${sessionId}/verify`, verifyData);
  return data;
};
