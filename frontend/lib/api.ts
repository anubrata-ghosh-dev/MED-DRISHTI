import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach Bearer token ─────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('md_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ── Response interceptor: handle 401 ────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('md_token');
      localStorage.removeItem('md_email');
      localStorage.removeItem('md_patient_id');
      localStorage.removeItem('md_patient_name');
      localStorage.removeItem('md_session_id');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ── Response types ────────────────────────────────────────────────────────────
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface PatientResponse {
  id: number;
  name: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  preferred_language?: string;
  abha_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ConsentResponse {
  id: string;
  patient_id: string;
  consent_type: string;
  granted: boolean;
  granted_at: string;
}

export interface SessionResponse {
  id: string;
  patient_id: string;
  status: string;
  created_at: string;
}

export interface HistoryResponse {
  id: string;
  session_id: string;
  question_id?: string;
  question_text: string;
  answer_text: string;
  created_at: string;
}

export interface TranscribeResponse {
  text: string;
  language_detected: string;
  confidence: number;
}

export interface NextQuestionResponse {
  question_id: string;
  question_text: string;
  is_final: boolean;
  done?: boolean;
  options?: string[];
}

// ── API functions ─────────────────────────────────────────────────────────────
export async function registerUser(
  email: string,
  password: string,
  fullName: string
): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>(
    '/api/v1/auth/register',
    { email, password, full_name: fullName }
  );
  return data;
}

export async function loginUser(
  email: string,
  password: string
): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>('/api/v1/auth/login', {
    email,
    password,
  });
  return data;
}

export interface CreatePatientData {
  full_name?: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  abha_id?: string;
  preferred_language?: string;
  name?: string;
}

export async function createPatient(
  patientData: CreatePatientData
): Promise<PatientResponse> {
  const payload = {
    name: patientData.name ?? patientData.full_name ?? 'Patient',
    date_of_birth: patientData.date_of_birth,
    gender: patientData.gender,
    phone: patientData.phone,
    preferred_language: patientData.preferred_language ?? 'English',
    abha_id: patientData.abha_id,
  };

  const { data } = await apiClient.post<PatientResponse>(
    '/api/v1/patients',
    payload
  );
  return data;
}

export async function getPatient(patientId: string): Promise<PatientResponse> {
  const { data } = await apiClient.get<PatientResponse>(
    `/api/v1/patients/${patientId}`
  );
  return data;
}

export async function createConsent(
  patientId: string,
  consentType: string
): Promise<ConsentResponse> {
  const { data } = await apiClient.post<ConsentResponse>(
    `/api/v1/patients/${patientId}/consents`,
    { consent_type: consentType, granted: true }
  );
  return data;
}

export async function createSession(
  patientId: string | number,
  sessionType: string = 'intake'
): Promise<SessionResponse> {
  const { data } = await apiClient.post<SessionResponse>('/api/v1/sessions', {
    patient_id: patientId,
    session_type: sessionType,
  });
  return data;
}

export async function createHistory(
  sessionId: string,
  historyData: { question_text: string; answer_text: string; question_id?: string }
): Promise<HistoryResponse> {
  const { data } = await apiClient.post<HistoryResponse>(
    `/api/v1/sessions/${sessionId}/history`,
    historyData
  );
  return data;
}

export async function createClinicalHistory(
  sessionId: number | string,
  historyData: {
    chief_complaint?: string;
    history_of_present_illness?: string;
    medications?: string;
    allergies?: string;
    [key: string]: any;
  }
): Promise<any> {
  const { data } = await apiClient.post(
    `/api/v1/sessions/${sessionId}/clinical-history`,
    historyData
  );
  return data;
}

export async function transcribeVoice(
  audioBlob: Blob,
  language: string
): Promise<TranscribeResponse> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('language', language);
  const { data } = await apiClient.post<TranscribeResponse>(
    '/api/v1/voice/transcribe',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return data;
}

export async function getNextQuestion(
  sessionId: string | number,
  lastAnswer?: string,
  currentQuestionId?: string | null,
  language?: string
): Promise<NextQuestionResponse> {
  const { data } = await apiClient.post<NextQuestionResponse>(
    '/api/v1/voice/next-question',
    {
      session_id: sessionId,
      last_answer: lastAnswer,
      current_question_id: currentQuestionId,
      language,
    }
  );
  return data;
}

export async function uploadDocument(
  sessionId: number | string,
  file: File
): Promise<any> {
  const formData = new FormData();
  formData.append('session_id', String(sessionId));
  formData.append('file', file);
  const { data } = await apiClient.post('/api/v1/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function getSessionSummary(
  sessionId: number | string
): Promise<any> {
  const { data } = await apiClient.get(`/api/v1/sessions/${sessionId}/summary`);
  return data;
}

export async function getTriageAlerts(): Promise<any[]> {
  const { data } = await apiClient.get<any[]>('/api/v1/triage/alerts');
  return data;
}

export async function reviewTriageAlert(
  alertId: number,
  reviewed: boolean = true
): Promise<any> {
  const { data } = await apiClient.put(`/api/v1/triage/alerts/${alertId}/review`, {
    reviewed,
  });
  return data;
}

export async function getDoctorQueue(): Promise<any[]> {
  const { data } = await apiClient.get<any[]>('/api/v1/doctor/queue');
  return data;
}

export async function verifySession(
  sessionId: number | string,
  verifyData: {
    chief_complaint?: string;
    history_of_present_illness?: string;
    medications?: string;
    allergies?: string;
    physician_notes?: string;
  }
): Promise<any> {
  const { data } = await apiClient.put(
    `/api/v1/sessions/${sessionId}/verify`,
    verifyData
  );
  return data;
}

export async function getSessionAuditLogs(
  sessionId: number | string
): Promise<any[]> {
  const { data } = await apiClient.get<any[]>(
    `/api/v1/sessions/${sessionId}/audit-logs`
  );
  return data;
}


