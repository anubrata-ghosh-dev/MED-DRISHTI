'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { KioskWrapper } from '@/components/layout/KioskWrapper';
import { ProgressStepper } from '@/components/ui/ProgressStepper';
import { QuestionCard } from '@/components/voice/QuestionCard';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { getNextQuestion, createClinicalHistory } from '@/lib/api';

export default function IntakePage() {
  const router = useRouter();
  const { sessionId } = useAuth();
  const { language } = useLanguage();

  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState<string>('Loading question...');
  const [collectedAnswers, setCollectedAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial or next question
  const fetchQuestion = async (lastAnswer?: string, qId?: string | null) => {
    setLoading(true);
    setError(null);

    // Fallback dummy session id if not created
    const activeSessionId = sessionId || 1;

    try {
      const res = await getNextQuestion(
        activeSessionId,
        lastAnswer,
        qId !== undefined ? qId : currentQuestionId,
        language
      );

      if (res.done) {
        // Dialogue flow complete! Save ClinicalHistory
        await saveHistory();
        router.push('/done');
        return;
      }

      setCurrentQuestionId(res.question_id);
      setQuestionText(res.question_text || 'Please answer the question.');
    } catch (err: any) {
      console.error('Error fetching next question:', err);
      // Fallback first question if backend dialogue engine offline
      if (!currentQuestionId) {
        setCurrentQuestionId('chief_complaint');
        setQuestionText('What brings you in today? Please describe your chief complaint.');
      } else {
        setError('Connection issue with dialogue server. You can finish or retry.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestion(undefined, null);
  }, []);

  const handleAnswer = async (answerText: string) => {
    if (currentQuestionId) {
      const updated = { ...collectedAnswers, [currentQuestionId]: answerText };
      setCollectedAnswers(updated);
      await fetchQuestion(answerText, currentQuestionId);
    }
  };

  const saveHistory = async () => {
    const activeSessionId = sessionId || 1;
    try {
      await createClinicalHistory(activeSessionId, {
        chief_complaint: collectedAnswers['chief_complaint'] || 'Not provided',
        history_of_present_illness: `Duration: ${collectedAnswers['duration'] || 'N/A'}; Severity: ${collectedAnswers['severity'] || 'N/A'}; Location: ${collectedAnswers['location'] || 'N/A'}`,
        medications: collectedAnswers['medications'] || 'None reported',
        allergies: collectedAnswers['allergies'] || 'None reported',
      });
    } catch (err) {
      console.error('Failed to save history:', err);
    }
  };

  return (
    <KioskWrapper>
      <div className="w-full flex flex-col items-center gap-6">
        <ProgressStepper
          steps={['Language', 'Register', 'Consent', 'Intake']}
          currentStep={3}
        />

        {loading && !currentQuestionId ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="animate-spin text-5xl text-primary">🏥</div>
            <p className="text-slate-600 font-semibold">Starting Clinical Intake...</p>
          </div>
        ) : (
          <QuestionCard
            question={questionText}
            questionId={currentQuestionId || 'chief_complaint'}
            onAnswer={handleAnswer}
            language={language}
          />
        )}
      </div>
    </KioskWrapper>
  );
}
