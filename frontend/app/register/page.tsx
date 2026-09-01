'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KioskWrapper } from '@/components/layout/KioskWrapper';
import { ProgressStepper } from '@/components/ui/ProgressStepper';
import { BigButton } from '@/components/ui/BigButton';
import { useAuth } from '@/lib/auth-context';
import { createPatient, createSession } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const { setPatientId, setSessionId } = useAuth();

  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('male');
  const [phone, setPhone] = useState('');
  const [abhaId, setAbhaId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const patient = await createPatient({
        name: name.trim(),
        date_of_birth: dateOfBirth || undefined,
        gender: gender,
        phone: phone || undefined,
        abha_id: abhaId || undefined,
        preferred_language: 'English',
      });

      setPatientId(patient.id);

      const session = await createSession(patient.id, 'intake');
      setSessionId(session.id);

      router.push('/consent');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.detail || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KioskWrapper>
      <div className="w-full max-w-3xl">
        <ProgressStepper
          steps={['Language', 'Register', 'Consent', 'Intake']}
          currentStep={1}
        />

        <div className="clinical-card rounded-[2rem] p-5 md:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Patient registration
              </p>
              <h2 className="mt-2 text-3xl text-[var(--chart-ink)] md:text-4xl">
                Tell us who is visiting today
              </h2>
            </div>
            <div className="rounded-full border border-[var(--line)] bg-white/80 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
              Only essential details
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                required
                className="clinical-input"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Date of birth
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="clinical-input"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="clinical-input"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Phone number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="clinical-input"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  ABHA / ID
                </label>
                <input
                  type="text"
                  value={abhaId}
                  onChange={(e) => setAbhaId(e.target.value)}
                  placeholder="Optional"
                  className="clinical-input"
                />
              </div>
            </div>

            <BigButton
              label="Continue to consent"
              type="submit"
              loading={loading}
              variant="primary"
              className="mt-4 w-full rounded-[1.5rem] text-lg md:text-xl"
            />
          </form>
        </div>
      </div>
    </KioskWrapper>
  );
}
