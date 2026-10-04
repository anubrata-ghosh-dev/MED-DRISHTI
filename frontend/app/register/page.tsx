'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KioskWrapper } from '@/components/layout/KioskWrapper';
import { ProgressStepper } from '@/components/ui/ProgressStepper';
import { BigButton } from '@/components/ui/BigButton';
import { VirtualKeyboard } from '@/components/ui/VirtualKeyboard';
import { useAuth } from '@/lib/auth-context';
import { useLanguage, LANGUAGES } from '@/lib/language-context';
import { getTranslation } from '@/lib/translations';
import { createPatient, createSession } from '@/lib/api';

const formatErrorMessage = (detail: any): string => {
  if (!detail) return 'Failed to register. Please try again.';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => (typeof item === 'object' && item.msg ? item.msg : JSON.stringify(item))).join(', ');
  }
  if (typeof detail === 'object') {
    return detail.msg || JSON.stringify(detail);
  }
  return String(detail);
};

export default function RegisterPage() {
  const router = useRouter();
  const { login, setPatientId, setPatientName, setSessionId } = useAuth();
  const { language } = useLanguage();
  const t = getTranslation(language);

  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('male');
  const [phone, setPhone] = useState('');
  const [abhaId, setAbhaId] = useState('');
  const [activeField, setActiveField] = useState<'name' | 'phone' | 'abha' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedLangObj = LANGUAGES.find((l) => l.code === language);
  const preferredLanguageName = selectedLangObj ? selectedLangObj.name : 'English';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t.nameLabel + ' is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const kioskEmail = process.env.NEXT_PUBLIC_KIOSK_EMAIL;
      const kioskPassword = process.env.NEXT_PUBLIC_KIOSK_PASSWORD;
      if (!kioskEmail || !kioskPassword) {
        throw new Error('Kiosk authentication is not configured.');
      }
      await login(kioskEmail, kioskPassword);

      const patient = await createPatient({
        name: name.trim(),
        date_of_birth: dateOfBirth.trim() || undefined,
        gender: gender,
        phone: phone.trim() || undefined,
        abha_id: abhaId.trim() || undefined,
        preferred_language: preferredLanguageName,
      });

      setPatientId(patient.id);
      setPatientName(patient.name);

      const session = await createSession(patient.id, 'intake');
      setSessionId(session.id);

      router.push('/consent');
    } catch (err: any) {
      console.error('Registration error:', err);
      const detail =
        err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        err.message;
      setError(formatErrorMessage(detail));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (char: string) => {
    if (activeField === 'name') setName((prev) => prev + char);
    else if (activeField === 'phone') setPhone((prev) => prev + char);
    else if (activeField === 'abha') setAbhaId((prev) => prev + char);
  };

  const handleBackspace = () => {
    if (activeField === 'name') setName((prev) => prev.slice(0, -1));
    else if (activeField === 'phone') setPhone((prev) => prev.slice(0, -1));
    else if (activeField === 'abha') setAbhaId((prev) => prev.slice(0, -1));
  };

  const handleSpace = () => {
    if (activeField === 'name') setName((prev) => prev + ' ');
    else if (activeField === 'phone') setPhone((prev) => prev + ' ');
    else if (activeField === 'abha') setAbhaId((prev) => prev + ' ');
  };

  const handleClear = () => {
    if (activeField === 'name') setName('');
    else if (activeField === 'phone') setPhone('');
    else if (activeField === 'abha') setAbhaId('');
  };

  return (
    <KioskWrapper>
      <div className="w-full max-w-3xl">
        <ProgressStepper
          steps={[t.stepLanguage, t.stepRegister, t.stepConsent, t.stepIntake, 'Records']}
          currentStep={1}
        />

        <div className="clinical-card rounded-[2rem] p-5 md:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                {t.regPageTag}
              </p>
              <h2 className="mt-2 text-3xl text-[var(--chart-ink)] md:text-4xl font-extrabold">
                {t.regPageTitle}
              </h2>
            </div>
            <div className="rounded-full border border-[var(--line)] bg-white/80 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
              {t.regPageSub}: {selectedLangObj?.nativeName || 'English'}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  {t.nameLabel}
                </label>
                <button
                  type="button"
                  onClick={() => setActiveField(activeField === 'name' ? null : 'name')}
                  className="text-xs font-bold text-[var(--pulse-teal)] hover:underline"
                >
                  {activeField === 'name' ? t.keyboardToggleHide : t.keyboardToggleShow}
                </button>
              </div>
              <input
                type="text"
                value={name}
                onFocus={() => setActiveField('name')}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.namePlaceholder}
                required
                className="clinical-input"
              />
            </div>

            {/* Visual Gender Selection for Illiterate Patients */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                {t.genderLabel}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'male', label: t.maleOpt, icon: '👨' },
                  { value: 'female', label: t.femaleOpt, icon: '👩' },
                  { value: 'other', label: t.otherOpt, icon: '🧑' },
                ].map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGender(g.value)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                      gender === g.value
                        ? 'border-[var(--pulse-teal)] bg-[rgba(31,111,99,0.08)] ring-2 ring-[rgba(31,111,99,0.2)]'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-3xl mb-1">{g.icon}</span>
                    <span className="text-xs font-bold text-slate-700">{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  {t.dobLabel}
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="clinical-input"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    {t.phoneLabel}
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveField(activeField === 'phone' ? null : 'phone')}
                    className="text-xs font-bold text-[var(--pulse-teal)] hover:underline"
                  >
                    {activeField === 'phone' ? t.keyboardToggleHide : t.keyboardToggleShow}
                  </button>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onFocus={() => setActiveField('phone')}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.phonePlaceholder}
                  className="clinical-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  {t.abhaLabel}
                </label>
                <button
                  type="button"
                  onClick={() => setActiveField(activeField === 'abha' ? null : 'abha')}
                  className="text-xs font-bold text-[var(--pulse-teal)] hover:underline"
                >
                  {activeField === 'abha' ? t.keyboardToggleHide : t.keyboardToggleShow}
                </button>
              </div>
              <input
                type="text"
                value={abhaId}
                onFocus={() => setActiveField('abha')}
                onChange={(e) => setAbhaId(e.target.value)}
                placeholder="Optional ID"
                className="clinical-input"
              />
            </div>

            {/* Virtual On-Screen Keyboard */}
            {activeField && (
              <VirtualKeyboard
                language={language}
                onKeyPress={handleKeyPress}
                onBackspace={handleBackspace}
                onSpace={handleSpace}
                onClear={handleClear}
                onClose={() => setActiveField(null)}
              />
            )}

            <BigButton
              label={t.regSubmitBtn}
              type="submit"
              loading={loading}
              variant="primary"
              className="mt-4 w-full rounded-[1.5rem] text-lg md:text-xl font-bold"
            />
          </form>
        </div>
      </div>
    </KioskWrapper>
  );
}
