'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

interface User {
  email: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  patientId: string | null;
  patientName: string | null;
  sessionId: string | null;
  login: (email: string, password: string) => Promise<string>;
  logout: () => void;
  registerUser: (email: string, password: string, fullName: string) => Promise<string>;
  setPatientId: (id: string | number) => void;
  setPatientName: (name: string) => void;
  setSessionId: (id: string | number) => void;
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [patientId, setPatientIdState] = useState<string | null>(null);
  const [patientName, setPatientNameState] = useState<string | null>(null);
  const [sessionId, setSessionIdState] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('md_token');
    const storedEmail = localStorage.getItem('md_email');
    const storedPatientId = localStorage.getItem('md_patient_id');
    const storedPatientName = localStorage.getItem('md_patient_name');
    const storedSessionId = localStorage.getItem('md_session_id');

    if (storedToken && storedEmail) {
      setToken(storedToken);
      setUser({ email: storedEmail });
    }
    if (storedPatientId) setPatientIdState(storedPatientId);
    if (storedPatientName) setPatientNameState(storedPatientName);
    if (storedSessionId) setSessionIdState(storedSessionId);
  }, []);

  const persistToken = (t: string, email: string) => {
    setToken(t);
    setUser({ email });
    localStorage.setItem('md_token', t);
    localStorage.setItem('md_email', email);
  };

  const login = useCallback(async (email: string, password: string): Promise<string> => {
    const { loginUser } = await import('./api');
    const data = await loginUser(email, password);
    persistToken(data.access_token, email);
    return data.access_token;
  }, []);

  const registerUser = useCallback(
    async (email: string, password: string, fullName: string): Promise<string> => {
      const { registerUser: apiRegister } = await import('./api');
      const data = await apiRegister(email, password, fullName);
      persistToken(data.access_token, email);
      return data.access_token;
    },
    []
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setPatientIdState(null);
    setPatientNameState(null);
    setSessionIdState(null);
    localStorage.removeItem('md_token');
    localStorage.removeItem('md_email');
    localStorage.removeItem('md_patient_id');
    localStorage.removeItem('md_patient_name');
    localStorage.removeItem('md_session_id');
  }, []);

  const setPatientId = useCallback((id: string | number) => {
    const normalizedId = String(id);
    setPatientIdState(normalizedId);
    localStorage.setItem('md_patient_id', normalizedId);
  }, []);

  const setPatientName = useCallback((name: string) => {
    setPatientNameState(name);
    localStorage.setItem('md_patient_name', name);
  }, []);

  const setSessionId = useCallback((id: string | number) => {
    const normalizedId = String(id);
    setSessionIdState(normalizedId);
    localStorage.setItem('md_session_id', normalizedId);
  }, []);

  const clearSession = useCallback(() => {
    logout();
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        patientId,
        patientName,
        sessionId,
        login,
        logout,
        registerUser,
        setPatientId,
        setPatientName,
        setSessionId,
        clearSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
