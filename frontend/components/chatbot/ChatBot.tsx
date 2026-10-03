'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '@/lib/language-context';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SPEECH_LANG_MAP: Record<string, string> = {
  en: 'en-IN', hi: 'hi-IN', bn: 'bn-IN', ta: 'ta-IN', te: 'te-IN', 
  ml: 'ml-IN', pa: 'pa-IN', mr: 'mr-IN', gu: 'gu-IN', kn: 'kn-IN',
};

const LANG_NAMES: Record<string, string> = {
  en: 'English', hi: 'हिन्दी', bn: 'বাংলা', ta: 'தமிழ்', te: 'తెలుగు', 
  ml: 'മലയാളം', pa: 'ਪੰਜਾਬੀ', mr: 'मराठी', gu: 'ગુજરાતી', kn: 'ಕನ್ನಡ',
};

const LANG_PLACEHOLDERS: Record<string, string> = {
  en: 'Ask me about your health...', hi: 'अपनी सेहत के बारे में पूछें...',
  bn: 'আপনার স্বাস্থ্য সম্পর্কে জিজ্ঞাসা করুন...', ta: 'உங்கள் உடல்நலம் பற்றி கேளுங்கள்...',
  te: 'మీ ఆరోగ్యం గురించి అడగండి...', ml: 'നിങ്ങളുടെ ആരോഗ്യത്തെക്കുറിച്ച് ചോദിക്കൂ...',
  pa: 'ਆਪਣੀ ਸਿਹਤ ਬਾਰੇ ਪੁੱਛੋ...', mr: 'तुमच्या आरोग्याबद्दल विचारा...',
  gu: 'તમારા સ્વાસ્થ્ય વિશે પૂછો...', kn: 'ನಿಮ್ಮ ಆರೋಗ್ಯದ ಬಗ್ಗೆ ಕೇಳಿ...',
};

const VOICE_LISTENING_TEXT: Record<string, string> = {
  en: 'Listening...', hi: 'सुन रहा हूँ...', bn: 'শুনছি...',
  ta: 'கேட்கிறேன்...', te: 'వింటున్నాను...', ml: 'കേൾക്കുന്നു...',
  pa: 'ਸੁਣ ਰਿਹਾ ਹਾਂ...', mr: 'ऐकत आहे...', gu: 'સાંભળી રહ્યો છું...', kn: 'ಕೇಳುತ್ತಿದ್ದೇನೆ...',
};

const GREETING_MESSAGES: Record<string, string> = {
  en: "👋 Hello! I'm Drishti Sahayak, your health assistant. I can help you understand your visit, explain recommendations, or answer general health questions.",
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

  const [isRecording, setIsRecording] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, interimText]);

  useEffect(() => {
    if (isOpen && !hasGreeted) {
      const greeting = GREETING_MESSAGES[language] || GREETING_MESSAGES['en'];
      setMessages([{ id: generateId(), role: 'assistant', content: greeting, timestamp: new Date() }]);
      setHasGreeted(true);
    }
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, hasGreeted, language]);

  useEffect(() => {
    return () => { recognitionRef.current?.abort(); };
  }, []);

  const startVoiceInput = useCallback(() => {
    setVoiceError(null);
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setVoiceError('Voice input not supported in this browser.');
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

    recognition.onstart = () => { setIsRecording(true); setInterimText(''); };
    recognition.onresult = (event: any) => {
      let interim = '', final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      if (interim) setInterimText(interim);
      if (final) {
        setInputValue((prev) => (prev ? prev + ' ' + final : final).trim());
        setInterimText('');
      }
    };
    recognition.onerror = (e: any) => {
      setVoiceError(e.error === 'not-allowed' ? 'Mic access denied.' : 'Voice recognition failed.');
      setIsRecording(false); setInterimText('');
    };
    recognition.onend = () => { setIsRecording(false); setInterimText(''); };
    recognition.start();
  }, [isRecording, language]);

  const sendMessage = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }

    const userMsg: Message = { id: generateId(), role: 'user', content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setVoiceError(null);
    setIsLoading(true);

    try {
      const history = [...messages, userMsg]
        .filter(m => m.role === 'user' || (m.role === 'assistant' && messages.indexOf(m) > 0))
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, language }),
      });

      const data = await res.json();
      setMessages((prev) => [...prev, {
        id: generateId(), role: 'assistant',
        content: data.reply || 'Sorry, I could not get a response.',
        timestamp: new Date(),
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: generateId(), role: 'assistant',
        content: '⚠️ Connection error. Please check your internet or server.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, isRecording, messages, language]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const placeholder = isRecording ? (VOICE_LISTENING_TEXT[language] || 'Listening...') : (LANG_PLACEHOLDERS[language] || LANG_PLACEHOLDERS['en']);
  const displayValue = isRecording && interimText ? interimText : inputValue;

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className={`fixed z-[9999] bottom-6 right-6 w-14 h-14 rounded-full shadow-lg shadow-teal-900/20 dark:shadow-teal-900/40 flex items-center justify-center text-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${isOpen ? 'bg-slate-800 dark:bg-slate-700 text-white' : 'bg-gradient-to-br from-teal-600 to-teal-500 text-white'}`}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Panel - Full width bottom sheet on mobile, floating panel on desktop */}
      <div className={`fixed z-[9998] flex flex-col overflow-hidden transition-all duration-300 ease-out border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl
        ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-[120%] opacity-0 pointer-events-none'}
        bottom-0 left-0 right-0 h-[85dvh] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)]
        md:bottom-24 md:right-6 md:left-auto md:w-[400px] md:h-[600px] md:rounded-2xl md:shadow-2xl`}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-teal-700 to-teal-600 p-4 flex items-center gap-3 shrink-0 rounded-t-3xl md:rounded-t-2xl">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl shrink-0">🩺</div>
          <div className="flex-1 min-w-0">
            <h3 className="m-0 text-white font-semibold text-base">Drishti Sahayak</h3>
            <p className="m-0 text-white/80 text-xs uppercase tracking-wider">AI Health Assistant</p>
          </div>
          <div className="bg-white/20 rounded-full px-2.5 py-1 text-xs text-white font-medium flex items-center gap-1.5 shrink-0">
            🌐 {LANG_NAMES[language] || 'English'}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center text-xs shrink-0 shadow-sm text-white">🩺</div>
              )}
              <div className={`max-w-[85%] px-4 py-2.5 text-[0.9rem] leading-relaxed shadow-sm break-words whitespace-pre-wrap ${
                msg.role === 'user' 
                  ? 'rounded-2xl rounded-br-sm bg-gradient-to-br from-teal-600 to-teal-500 text-white' 
                  : 'rounded-2xl rounded-bl-sm bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-end gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center text-xs shrink-0 text-white">🩺</div>
              <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex gap-1 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Voice Banners */}
        {isRecording && (
          <div className="mx-3 mb-2 p-2 px-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-semibold">{VOICE_LISTENING_TEXT[language] || 'Listening...'}</span>
            <span className="ml-auto opacity-70">Tap 🎤 to stop</span>
          </div>
        )}
        {voiceError && !isRecording && (
          <div className="mx-3 mb-2 p-2 px-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
            <span>⚠️</span>
            <span className="flex-1">{voiceError}</span>
            <button onClick={() => setVoiceError(null)} className="opacity-70 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex gap-2 items-center">
          <button
            onClick={startVoiceInput}
            disabled={isLoading}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all shrink-0 ${
              isRecording 
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse' 
                : 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/50'
            } disabled:opacity-50`}
          >
            {isRecording ? '⏹' : '🎤'}
          </button>

          <input
            ref={inputRef}
            type="text"
            value={displayValue}
            onChange={(e) => !isRecording && setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            readOnly={isRecording}
            className={`flex-1 min-w-0 border rounded-xl px-3 py-2.5 text-sm outline-none transition-all ${
              isRecording 
                ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 italic'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:border-teal-500 dark:focus:border-teal-500'
            } disabled:opacity-50`}
          />

          <button
            onClick={sendMessage}
            disabled={isLoading || (!inputValue.trim() && !interimText)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 text-white ${
              (inputValue.trim() || interimText) && !isLoading
                ? 'bg-gradient-to-br from-teal-600 to-teal-500 hover:scale-105 shadow-md shadow-teal-600/20'
                : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
            }`}
          >
            ➤
          </button>
        </div>

        {/* Disclaimer */}
        <div className="px-4 py-2 text-center text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50">
          For emergencies, call 108. AI advice is not a substitute for professional medical care.
        </div>
      </div>
    </>
  );
}
