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
      // Create Patient
      const patient = await createPatient({
        name: name.trim(),
        date_of_birth: dateOfBirth || undefined,
        gender: gender,
        phone: phone || undefined,
        abha_id: abhaId || undefined,
        preferred_language: 'English',
      });

      setPatientId(patient.id);

      // Create Clinical Session
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
      <div className="w-full flex flex-col items-center gap-6">
        <ProgressStepper
          steps={['Language', 'Register', 'Consent', 'Intake']}
          currentStep={1}
        />

        <div className="text-center space-y-1 mb-2">
          <h2 className="text-3xl font-extrabold text-slate-800">
            Patient Registration
          </h2>
          <p className="text-slate-500 font-medium text-sm">
            Please enter your basic information
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-lg bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col gap-5"
        >
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Full Name */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700">
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              required
              className="p-4 border border-slate-300 rounded-2xl text-lg focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {/* DOB & Gender Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">
                Date of Birth
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="p-4 border border-slate-300 rounded-2xl text-lg focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="p-4 border border-slate-300 rounded-2xl text-lg focus:outline-none focus:ring-4 focus:ring-blue-100 bg-white"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Phone Number */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="p-4 border border-slate-300 rounded-2xl text-lg focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {/* ABHA ID */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700">
              ABHA ID / Ayushman Bharat ID (Optional)
            </label>
            <input
              type="text"
              value={abhaId}
              onChange={(e) => setAbhaId(e.target.value)}
              placeholder="e.g. 12-3456-7890-1234"
              className="p-4 border border-slate-300 rounded-2xl text-lg focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <BigButton
            label="Continue to Consent"
            type="submit"
            loading={loading}
            variant="primary"
            className="w-full mt-4"
          />
        </form>
      </div>
    </KioskWrapper>
  );
}
