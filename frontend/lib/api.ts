import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = apiClient;

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
      // Do not wipe patient kiosk session state (md_patient_id, md_session_id)
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
  field?: string | null;
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
  const cleanStr = (val?: string) => (val && val.trim() ? val.trim() : undefined);

  const payload = {
    name: patientData.name ?? patientData.full_name ?? 'Patient',
    date_of_birth: cleanStr(patientData.date_of_birth),
    gender: patientData.gender,
    phone: cleanStr(patientData.phone),
    preferred_language: patientData.preferred_language ?? 'English',
    abha_id: cleanStr(patientData.abha_id),
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
    `/api/v1/sessions/${sessionId}/history`,
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
    chief_complaints?: Array<Record<string, unknown>>;
    hpi?: Array<Record<string, unknown>>;
    medication_histories?: Array<Record<string, unknown>>;
    allergy_histories?: Array<Record<string, unknown>>;
    past_medical_histories?: Array<Record<string, unknown>>;
    past_surgical_histories?: Array<Record<string, unknown>>;
    family_histories?: Array<Record<string, unknown>>;
    personal_histories?: Array<Record<string, unknown>>;
    review_of_systems?: Array<Record<string, unknown>>;
    ayush_histories?: Array<Record<string, unknown>>;
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

// ── Medical Record API functions ─────────────────────────────────────────────
export interface MedicalRecordResponse {
  id: number;
  patient_id: number;
  session_id?: number;
  record_type: string;
  title?: string;
  description?: string;
  file_name?: string;
  file_type?: string;
  ocr_text?: string;
  uploaded_at: string;
}

export async function uploadMedicalRecord(
  patientId: number | string,
  file: File,
  title: string,
  description: string,
  recordType: string = 'other',
  sessionId?: number | string
): Promise<MedicalRecordResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);
  formData.append('description', description);
  formData.append('record_type', recordType);
  if (sessionId) formData.append('session_id', String(sessionId));
  const { data } = await apiClient.post<MedicalRecordResponse>(
    `/api/v1/patients/${patientId}/medical-records`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return data;
}

export async function getPatientMedicalRecords(
  patientId: number | string
): Promise<MedicalRecordResponse[]> {
  const { data } = await apiClient.get<MedicalRecordResponse[]>(
    `/api/v1/patients/${patientId}/medical-records`
  );
  return data;
}

export function getMedicalRecordFileUrl(recordId: number | string): string {
  const token = localStorage.getItem('access_token');
  return `${API_BASE_URL}/api/v1/medical-records/${recordId}/file?token=${token || ''}`;
}

export async function deleteMedicalRecord(
  recordId: number | string
): Promise<any> {
  const { data } = await apiClient.delete(
    `/api/v1/medical-records/${recordId}`
  );
  return data;
}

// Get timeline-ready patient records with date sorting
export async function getPatientTimeline(
  patientId: number | string
): Promise<MedicalRecordResponse[]> {
  const res = await apiClient.get<MedicalRecordResponse[]>(
    `/api/v1/patients/${patientId}/medical-records`
  );
  return res.data.sort(
    (a: MedicalRecordResponse, b: MedicalRecordResponse) =>
      new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
  );
}

// Save AYUSH history
export async function createAyushHistory(
  sessionId: number | string,
  data: Record<string, any>
): Promise<any> {
  const res = await apiClient.post(
    `/api/v1/sessions/${sessionId}/ayush-history`,
    data
  );
  return res.data;
}

// Get AYUSH history for session
export async function getAyushHistory(
  sessionId: number | string
): Promise<any> {
  const res = await apiClient.get(
    `/api/v1/sessions/${sessionId}/ayush-history`
  );
  return res.data;
}
