'use client';

import React, { useState, useEffect } from 'react';
import { VoiceRecorder } from './VoiceRecorder';
import { BigButton } from '../ui/BigButton';

interface QuestionCardProps {
  question: string;
  questionId: string;
  onAnswer: (answer: string) => void;
  language?: string;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionId,
  onAnswer,
  language = 'en',
}) => {
  const [isTyping, setIsTyping] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState('');

  // Speech synthesis (TTS) for accessibility
  useEffect(() => {
    if ('speechSynthesis' in window && question) {
      window.speechSynthesis.cancel(); // stop prior speech
      const utterance = new SpeechSynthesisUtterance(question);
      if (language === 'hi') utterance.lang = 'hi-IN';
      else if (language === 'bn') utterance.lang = 'bn-IN';
      else if (language === 'ta') utterance.lang = 'ta-IN';
      else if (language === 'te') utterance.lang = 'te-IN';
      else if (language === 'pa') utterance.lang = 'pa-IN';
      else utterance.lang = 'en-US';

      window.speechSynthesis.speak(utterance);
    }
  }, [question, language]);

  const speakQuestionAgain = () => {
    if ('speechSynthesis' in window && question) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(question);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typedAnswer.trim()) {
      onAnswer(typedAnswer.trim());
      setTypedAnswer('');
      setIsTyping(false);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-white rounded-3xl p-8 shadow-xl border border-slate-100 flex flex-col gap-8">
      {/* Question Header */}
      <div className="flex flex-col gap-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="px-3 py-1 bg-blue-50 text-primary font-bold text-xs rounded-full uppercase tracking-wider">
            Clinical Intake Question
          </span>
          <button
            type="button"
            onClick={speakQuestionAgain}
            className="p-2 text-slate-400 hover:text-primary transition-colors text-lg"
            title="Read question aloud"
          >
            🔊
          </button>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 leading-snug">
          {question}
        </h2>
      </div>

      {/* Answer Area */}
      {!isTyping ? (
        <div className="flex flex-col items-center gap-6">
          <VoiceRecorder
            onTranscription={onAnswer}
            language={language}
          />
          <button
            type="button"
            onClick={() => setIsTyping(true)}
            className="text-sm font-semibold text-slate-500 hover:text-primary underline underline-offset-4"
          >
            Prefer typing? Click here to type your answer
          </button>
        </div>
      ) : (
        <form onSubmit={handleTextSubmit} className="flex flex-col gap-4">
          <textarea
            value={typedAnswer}
            onChange={(e) => setTypedAnswer(e.target.value)}
            placeholder="Type your response here..."
            className="w-full p-4 border border-slate-300 rounded-2xl text-lg focus:outline-none focus:ring-4 focus:ring-blue-100 min-h-[120px]"
            autoFocus
          />
          <div className="flex gap-3">
            <BigButton
              label="Use Voice"
              onClick={() => setIsTyping(false)}
              variant="secondary"
              className="flex-1 text-base min-h-[48px]"
            />
            <BigButton
              label="Submit Answer"
              type="submit"
              variant="primary"
              disabled={!typedAnswer.trim()}
              className="flex-1 text-base min-h-[48px]"
            />
          </div>
        </form>
      )}
    </div>
  );
};
