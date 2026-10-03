'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '@/lib/language-context';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// BCP-47 locale map for Web Speech API
const SPEECH_LANG_MAP: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  bn: 'bn-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  ml: 'ml-IN',
  pa: 'pa-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  kn: 'kn-IN',
};

// Language display names for the voice indicator
const LANG_NAMES: Record<string, string> = {
  en: 'English', hi: 'हिन्दी', bn: 'বাংলা',
  ta: 'தமிழ்', te: 'తెలుగు', ml: 'മലയാളം',
  pa: 'ਪੰਜਾਬੀ', mr: 'मराठी', gu: 'ગુજરાતી', kn: 'ಕನ್ನಡ',
};

const LANG_PLACEHOLDERS: Record<string, string> = {
  en: 'Ask me about your health...',
  hi: 'अपनी सेहत के बारे में पूछें...',
  bn: 'আপনার স্বাস্থ্য সম্পর্কে জিজ্ঞাসা করুন...',
  ta: 'உங்கள் உடல்நலம் பற்றி கேளுங்கள்...',
  te: 'మీ ఆరోగ్యం గురించి అడగండి...',
  ml: 'നിങ്ങളുടെ ആരോഗ്യത്തെക്കുറിച്ച് ചോദിക്കൂ...',
  pa: 'ਆਪਣੀ ਸਿਹਤ ਬਾਰੇ ਪੁੱਛੋ...',
  mr: 'तुमच्या आरोग्याबद्दल विचारा...',
  gu: 'તમારા સ્વાસ્થ્ય વિશે પૂછો...',
  kn: 'ನಿಮ್ಮ ಆರೋಗ್ಯದ ಬಗ್ಗೆ ಕೇಳಿ...',
};

const VOICE_LISTENING_TEXT: Record<string, string> = {
  en: 'Listening...', hi: 'सुन रहा हूँ...', bn: 'শুনছি...',
  ta: 'கேட்கிறேன்...', te: 'వింటున్నాను...', ml: 'കേൾക്കുന്നു...',
  pa: 'ਸੁਣ ਰਿਹਾ ਹਾਂ...', mr: 'ऐकत आहे...', gu: 'સાંભળી રહ્યો છું...', kn: 'ಕೇಳುತ್ತಿದ್ದೇನೆ...',
};

const GREETING_MESSAGES: Record<string, string> = {
  en: "👋 Hello! I'm Drishti Sahayak, your health assistant. I can help you understand your visit, explain recommendations, or answer general health questions. How can I help you today?",
  hi: "👋 नमस्ते! मैं दृष्टि सहायक हूँ, आपका स्वास्थ्य सहायक। मैं आपकी विज़िट को समझने, सिफारिशें समझाने या सामान्य स्वास्थ्य प्रश्नों का उत्तर देने में मदद कर सकता हूँ।",
  bn: "👋 নমস্কার! আমি দৃষ্টি সহায়ক, আপনার স্বাস্থ্য সহকারী। আমি আপনার ভিজিট বুঝতে, সুপারিশ ব্যাখ্যা করতে সাহায্য করতে পারি।",
  ta: "👋 வணக்கம்! நான் திருஷ்டி சஹாயக், உங்கள் சுகாதார உதவியாளர். உங்கள் வருகையை புரிந்துகொள்ள, பரிந்துரைகளை விளக்க உதவலாம்.",
  te: "👋 నమస్కారం! నేను దృష్టి సహాయక్, మీ ఆరోగ్య సహాయకుడు. మీ సందర్శనను అర్థం చేసుకోవడంలో సహాయం చేయగలను.",
  ml: "👋 നമസ്കാരം! ഞാൻ ദൃഷ്ടി സഹായക്, നിങ്ങളുടെ ആരോഗ്യ സഹായി. നിങ്ങളുടെ ആരോഗ്യത്തെക്കുറിച്ച് ചോദ്യങ്ങൾക്ക് ഉത്തരം നൽകാം.",
  pa: "👋 ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਦ੍ਰਿਸ਼ਟੀ ਸਹਾਇਕ ਹਾਂ, ਤੁਹਾਡਾ ਸਿਹਤ ਸਹਾਇਕ। ਮੈਂ ਤੁਹਾਡੀ ਸਿਹਤ ਬਾਰੇ ਸਵਾਲਾਂ ਦਾ ਜਵਾਬ ਦੇ ਸਕਦਾ ਹਾਂ।",
  mr: "👋 नमस्कार! मी दृष्टी सहायक आहे, तुमचा आरोग्य सहाय्यक. मी तुमच्या भेटीबद्दल, शिफारशी समजावून सांगण्यास मदत करू शकतो.",
  gu: "👋 નમસ્તે! હું દૃષ્ટિ સહાયક છું, તમારો આરોગ્ય સહાયક. હું તમારી મુલાકાત સમજવામાં અને ભલામણો સ્પષ્ટ કરવામાં મદદ કરી શકું છું.",
  kn: "👋 ನಮಸ್ಕಾರ! ನಾನು ದೃಷ್ಟಿ ಸಹಾಯಕ, ನಿಮ್ಮ ಆರೋಗ್ಯ ಸಹಾಯಕ. ನಿಮ್ಮ ಆರೋಗ್ಯ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಲು ಸಹಾಯ ಮಾಡಬಲ್ಲೆ.",
};

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export function ChatBot() {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Greet once when panel opens
  useEffect(() => {
    if (isOpen && !hasGreeted) {
      const greeting = GREETING_MESSAGES[language] || GREETING_MESSAGES['en'];
      setMessages([{
        id: generateId(),
        role: 'assistant',
        content: greeting,
        timestamp: new Date(),
      }]);
      setHasGreeted(true);
    }
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, hasGreeted, language]);

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  // ─── Voice Input ───────────────────────────────────────────────
  const startVoiceInput = useCallback(() => {
    setVoiceError(null);

    const SpeechRecognitionAPI: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setVoiceError('Voice input not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      setInterimText('');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;

    recognition.lang = SPEECH_LANG_MAP[language] || 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
      setInterimText('');
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      if (interim) setInterimText(interim);
      if (final) {
        setInputValue((prev) => (prev ? prev + ' ' + final : final).trim());
        setInterimText('');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('[Voice] Error:', event.error);
      if (event.error === 'not-allowed') {
        setVoiceError('Microphone access denied. Please allow microphone in your browser settings.');
      } else if (event.error === 'no-speech') {
        setVoiceError('No speech detected. Please try again.');
      } else {
        setVoiceError('Voice recognition failed. Please type your message.');
      }
      setIsRecording(false);
      setInterimText('');
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterimText('');
    };

    recognition.start();
  }, [isRecording, language]);

  // ─── Send Message ─────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    // Stop any active recording
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setVoiceError(null);
    setIsLoading(true);

    try {
      const history = [...messages, userMessage]
        .filter(m => m.role === 'user' || (m.role === 'assistant' && messages.indexOf(m) > 0))
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, language }),
      });

      const data = await res.json();

      setMessages((prev) => [...prev, {
        id: generateId(),
        role: 'assistant',
        content: data.reply || 'Sorry, I could not get a response. Please try again.',
        timestamp: new Date(),
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: generateId(),
        role: 'assistant',
        content: '⚠️ Connection error. Please check that the backend server is running.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, isRecording, messages, language]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const placeholder = isRecording
    ? (VOICE_LISTENING_TEXT[language] || 'Listening...')
    : (LANG_PLACEHOLDERS[language] || LANG_PLACEHOLDERS['en']);

  const displayValue = isRecording && interimText ? interimText : inputValue;

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Open health assistant chatbot"
        style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999,
          width: '3.75rem', height: '3.75rem', borderRadius: '50%',
          background: 'linear-gradient(135deg, #1f6f63 0%, #2ea89a 100%)',
          border: 'none', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem',
          boxShadow: '0 8px 32px rgba(31,111,99,0.38), 0 2px 8px rgba(0,0,0,0.15)',
          transition: 'transform 0.2s ease', outline: 'none',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '6rem', right: '1.5rem', zIndex: 9998,
          width: 'min(420px, calc(100vw - 2rem))',
          height: 'min(580px, calc(100vh - 8rem))',
          borderRadius: '1.5rem',
          background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(24px)',
          boxShadow: '0 24px 64px rgba(31,111,99,0.18), 0 4px 16px rgba(0,0,0,0.10)',
          border: '1px solid rgba(31,111,99,0.15)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'chatbot-slide-up 0.28s cubic-bezier(0.34,1.56,0.64,1)',
        }}>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #1f6f63 0%, #2ea89a 100%)',
            padding: '1rem 1.25rem', display: 'flex', alignItems: 'center',
            gap: '0.75rem', flexShrink: 0,
          }}>
            <div style={{
              width: '2.5rem', height: '2.5rem', borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0,
            }}>🩺</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
                Drishti Sahayak
              </p>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.78)', fontSize: '0.72rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                AI Health Assistant
              </p>
            </div>
            {/* Language badge */}
            <div style={{
              background: 'rgba(255,255,255,0.18)', borderRadius: '1rem',
              padding: '0.2rem 0.6rem', fontSize: '0.7rem', color: '#fff',
              fontWeight: 600, letterSpacing: '0.03em', flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: '0.3rem',
            }}>
              🌐 {LANG_NAMES[language] || 'English'}
            </div>
            <div style={{
              width: '0.6rem', height: '0.6rem', borderRadius: '50%',
              background: '#4ade80', boxShadow: '0 0 0 3px rgba(74,222,128,0.3)', flexShrink: 0,
            }} />
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '1rem',
            display: 'flex', flexDirection: 'column', gap: '0.75rem',
          }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end', gap: '0.5rem',
              }}>
                {msg.role === 'assistant' && (
                  <div style={{
                    width: '1.75rem', height: '1.75rem', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1f6f63, #2ea89a)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', flexShrink: 0,
                  }}>🩺</div>
                )}
                <div style={{
                  maxWidth: '80%', padding: '0.65rem 0.9rem',
                  borderRadius: msg.role === 'user'
                    ? '1.2rem 1.2rem 0.25rem 1.2rem'
                    : '1.2rem 1.2rem 1.2rem 0.25rem',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #1f6f63, #2ea89a)'
                    : 'rgba(241,245,249,0.9)',
                  color: msg.role === 'user' ? '#fff' : '#1e293b',
                  fontSize: '0.875rem', lineHeight: 1.55,
                  boxShadow: msg.role === 'user'
                    ? '0 2px 12px rgba(31,111,99,0.22)'
                    : '0 1px 4px rgba(0,0,0,0.06)',
                  border: msg.role === 'assistant' ? '1px solid rgba(31,111,99,0.1)' : 'none',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                <div style={{
                  width: '1.75rem', height: '1.75rem', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1f6f63, #2ea89a)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', flexShrink: 0,
                }}>🩺</div>
                <div style={{
                  padding: '0.75rem 1rem', borderRadius: '1.2rem 1.2rem 1.2rem 0.25rem',
                  background: 'rgba(241,245,249,0.9)', border: '1px solid rgba(31,111,99,0.1)',
                  display: 'flex', gap: '0.3rem', alignItems: 'center',
                }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{
                      width: '0.45rem', height: '0.45rem', borderRadius: '50%',
                      background: '#2ea89a',
                      animation: `chatbot-dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice recording banner */}
          {isRecording && (
            <div style={{
              margin: '0 0.75rem', padding: '0.55rem 0.9rem',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem',
              fontSize: '0.8rem', color: '#dc2626', flexShrink: 0,
            }}>
              <div style={{
                width: '0.55rem', height: '0.55rem', borderRadius: '50%',
                background: '#ef4444', animation: 'chatbot-pulse 1s ease-in-out infinite',
                flexShrink: 0,
              }} />
              <span style={{ fontWeight: 600 }}>
                {VOICE_LISTENING_TEXT[language] || 'Listening...'}
              </span>
              <span style={{ color: '#94a3b8', fontSize: '0.72rem', marginLeft: 'auto' }}>
                {LANG_NAMES[language] || 'English'} · Tap 🎤 to stop
              </span>
            </div>
          )}

          {/* Voice error banner */}
          {voiceError && !isRecording && (
            <div style={{
              margin: '0 0.75rem', padding: '0.5rem 0.9rem',
              background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)',
              borderRadius: '0.75rem', fontSize: '0.75rem', color: '#92400e',
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <span>⚠️</span>
              <span>{voiceError}</span>
              <button
                onClick={() => setVoiceError(null)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#92400e' }}
              >✕</button>
            </div>
          )}

          {/* Input Bar */}
          <div style={{
            padding: '0.75rem 1rem',
            borderTop: '1px solid rgba(31,111,99,0.1)',
            background: 'rgba(248,250,252,0.9)',
            display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0,
          }}>
            {/* Mic Button */}
            <button
              onClick={startVoiceInput}
              disabled={isLoading}
              aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
              title={isRecording ? 'Click to stop recording' : `Speak in ${LANG_NAMES[language] || 'English'}`}
              style={{
                width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem',
                background: isRecording
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                  : 'rgba(31,111,99,0.1)',
                border: isRecording
                  ? '2px solid rgba(239,68,68,0.4)'
                  : '2px solid rgba(31,111,99,0.15)',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', transition: 'all 0.18s',
                flexShrink: 0,
                animation: isRecording ? 'chatbot-pulse 1.5s ease-in-out infinite' : 'none',
                opacity: isLoading ? 0.5 : 1,
              }}
              onMouseEnter={e => {
                if (!isLoading && !isRecording) {
                  e.currentTarget.style.background = 'rgba(31,111,99,0.18)';
                }
              }}
              onMouseLeave={e => {
                if (!isRecording) e.currentTarget.style.background = 'rgba(31,111,99,0.1)';
              }}
            >
              {isRecording ? '⏹' : '🎤'}
            </button>

            {/* Text Input */}
            <input
              ref={inputRef}
              type="text"
              value={displayValue}
              onChange={(e) => {
                if (!isRecording) setInputValue(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              readOnly={isRecording}
              style={{
                flex: 1, border: '1.5px solid rgba(31,111,99,0.2)',
                borderRadius: '0.875rem', padding: '0.6rem 0.9rem',
                fontSize: '0.875rem', outline: 'none', background: isRecording ? 'rgba(239,68,68,0.04)' : '#fff',
                color: isRecording ? '#dc2626' : '#1e293b',
                transition: 'border-color 0.18s, background 0.18s',
                fontStyle: isRecording && interimText ? 'italic' : 'normal',
              }}
              onFocus={e => !isRecording && (e.target.style.borderColor = '#1f6f63')}
              onBlur={e => !isRecording && (e.target.style.borderColor = 'rgba(31,111,99,0.2)')}
            />

            {/* Send Button */}
            <button
              onClick={sendMessage}
              disabled={isLoading || (!inputValue.trim() && !interimText)}
              aria-label="Send message"
              style={{
                width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem',
                background: (inputValue.trim() || interimText) && !isLoading
                  ? 'linear-gradient(135deg, #1f6f63 0%, #2ea89a 100%)'
                  : 'rgba(203,213,225,1)',
                border: 'none',
                cursor: (inputValue.trim() || interimText) && !isLoading ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', transition: 'background 0.18s, transform 0.15s',
                flexShrink: 0, color: '#fff',
              }}
              onMouseEnter={e => {
                if (inputValue.trim() && !isLoading) e.currentTarget.style.transform = 'scale(1.08)';
              }}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              ➤
            </button>
          </div>

          {/* Disclaimer */}
          <div style={{
            padding: '0.4rem 1rem 0.6rem', textAlign: 'center',
            fontSize: '0.65rem', color: '#94a3b8',
            background: 'rgba(248,250,252,0.9)',
            borderTop: '1px solid rgba(241,245,249,1)', lineHeight: 1.4,
          }}>
            For emergencies, call 108. AI advice is not a substitute for professional medical care.
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatbot-slide-up {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chatbot-dot-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40%            { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes chatbot-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.55; }
        }
      `}</style>
    </>
  );
}
