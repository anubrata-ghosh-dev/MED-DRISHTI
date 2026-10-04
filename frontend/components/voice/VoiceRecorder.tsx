'use client';

import React, { useState, useRef } from 'react';
import { BigButton } from '../ui/BigButton';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  language?: string;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscription,
  language = 'en',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechRecognitionRef = useRef<any>(null);

  const getRecognitionLocale = () => {
    switch (language) {
      case 'hi': return 'hi-IN';
      case 'bn': return 'bn-IN';
      case 'ta': return 'ta-IN';
      case 'ml': return 'ml-IN';
      case 'te': return 'te-IN';
      case 'pa': return 'pa-IN';
      default: return 'en-IN';
    }
  };

  const startRecording = async () => {
    setError(null);
    setTranscriptionText(null);
    audioChunksRef.current = [];

    // 1. Try Browser Native SpeechRecognition first if available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = getRecognitionLocale();
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          const resultText = event.results[0][0].transcript;
          if (resultText) {
            setTranscriptionText(resultText);
          }
          setIsRecording(false);
        };

        recognition.onerror = (err: any) => {
          console.warn('SpeechRecognition error, falling back to audio recorder:', err);
          fallbackAudioRecord();
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        speechRecognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
        return;
      } catch (e) {
        console.warn('SpeechRecognition init error:', e);
      }
    }

    // 2. Fallback to MediaRecorder audio stream
    await fallbackAudioRecord();
  };

  const fallbackAudioRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        await processAudio(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setError('Could not access microphone. Please check permissions or type your answer.');
    }
  };

  const stopRecording = () => {
    if (speechRecognitionRef.current && isRecording) {
      speechRecognitionRef.current.stop();
      setIsRecording(false);
    } else if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');
      formData.append('language', language);

      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/v1/voice/transcribe`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }

      const data = await response.json();
      setTranscriptionText(data.text);
    } catch (err: any) {
      console.error('Transcription error:', err);
      setError('Voice transcription unavailable. Please type your response.');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmTranscription = () => {
    if (transcriptionText) {
      onTranscription(transcriptionText);
      setTranscriptionText(null);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-6">
      {error && (
        <div className="w-full p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium text-center">
          {error}
        </div>
      )}

      {/* Recording State Controls */}
      {!isRecording && !isProcessing && !transcriptionText && (
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={startRecording}
            className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--pulse-teal)] text-4xl text-white shadow-xl shadow-[rgba(31,111,99,0.22)] transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[rgba(31,111,99,0.18)]"
            aria-label="Start Recording"
          >
            🎙️
          </button>
          <span className="text-sm font-semibold text-[var(--text-secondary)]">
            Tap to Speak ({getRecognitionLocale()})
          </span>
        </div>
      )}

      {isRecording && (
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-red-600 text-white flex items-center justify-center text-4xl animate-pulse shadow-xl shadow-red-500/30">
              🎙️
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
            </span>
          </div>
          <span className="text-base font-bold text-red-600 animate-pulse">
            Listening in {getRecognitionLocale()}... Tap done when finished
          </span>
          <BigButton
            label="Done Speaking"
            onClick={stopRecording}
            variant="danger"
          />
        </div>
      )}

      {isProcessing && (
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="animate-spin text-4xl">⏳</div>
          <span className="text-base font-semibold text-[var(--text-secondary)]">
            Transcribing audio...
          </span>
        </div>
      )}

      {transcriptionText && !isProcessing && (
        <div className="w-full max-w-lg bg-[var(--glass-bg)] p-6 rounded-2xl border border-[var(--line)] shadow-md flex flex-col gap-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Heard Response:
          </div>
          <p className="text-lg font-medium text-[var(--text-primary)] bg-[var(--glass-bg-strong)] p-4 rounded-xl border border-[var(--glass-border)] italic">
            &quot;{transcriptionText}&quot;
          </p>
          <div className="flex gap-3">
            <BigButton
              label="Re-record"
              onClick={startRecording}
              variant="secondary"
              className="flex-1 text-base min-h-[48px]"
            />
            <BigButton
              label="Confirm"
              onClick={confirmTranscription}
              variant="primary"
              className="flex-1 text-base min-h-[48px]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
