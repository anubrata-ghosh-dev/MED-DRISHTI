'use client';

import React, { useState, useEffect } from 'react';
import { VoiceRecorder } from './VoiceRecorder';
import { BigButton } from '../ui/BigButton';
import { VirtualKeyboard } from '../ui/VirtualKeyboard';

interface QuestionCardProps {
  question: string;
  questionId: string;
  field?: string;
  onAnswer: (answer: string) => void;
  language?: string;
}

interface AssistiveOption {
  icon: string;
  label: string;
  value: string;
  speechText?: Record<string, string>;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionId,
  field,
  onAnswer,
  language = 'en',
}) => {
  const [isTyping, setIsTyping] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(false);

  useEffect(() => {
    if (question) {
      import('@/lib/speechEngine').then(m => m.speakText(question, language));
    }
  }, [question, language]);

  const speakQuestionAgain = () => {
    if (question) {
      import('@/lib/speechEngine').then(m => m.speakText(question, language));
    }
  };

  const speakOptionText = (opt: AssistiveOption) => {
    const spoken = opt.speechText?.[language] || opt.speechText?.['en'] || opt.label.split('/')[0].trim();
    import('@/lib/speechEngine').then(m => m.speakText(spoken, language, true));
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typedAnswer.trim()) {
      onAnswer(typedAnswer.trim());
      setTypedAnswer('');
      setIsTyping(false);
      setShowVirtualKeyboard(false);
    }
  };

  const getAssistiveOptions = (): AssistiveOption[] => {
    const f = field?.toLowerCase() || '';

    if (f.includes('complaint') && (f.includes('complaint') || f.includes('problem'))) {
      return [
        { icon: '🤒', label: 'Fever / बुखार / জ্বর', value: 'High fever and feeling unwell', speechText: { bn: 'জ্বর', hi: 'बुखार', ta: 'காய்ச்சல்', ml: 'പനി', te: 'జ్వరం', pa: 'ਬੁਖਾਰ', en: 'Fever' } },
        { icon: '🗣️', label: 'Cough / खांसी / কাশি', value: 'Persistent cough and cold', speechText: { bn: 'কাশি', hi: 'खांसी', ta: 'இருமல்', ml: 'ചുമ', te: 'దగ్గు', pa: 'ਖੰਘ', en: 'Cough' } },
        { icon: '🫀', label: 'Chest Pain / छाती में दर्द', value: 'Chest pain and tightness', speechText: { bn: 'বুকে ব্যথা', hi: 'छाती में दर्द', ta: 'நெஞ்சு வலி', ml: 'നെഞ്ചുവേദന', te: 'ఛాతీ నొప్పి', pa: 'ਛਾਤੀ ਵਿੱਚ ਦਰਦ', en: 'Chest Pain' } },
        { icon: '🤢', label: 'Stomach Pain / पेट दर्द', value: 'Severe stomachache and nausea', speechText: { bn: 'পেটে ব্যথা', hi: 'पेट दर्द', ta: 'வயிறு வலி', ml: 'വയറുവേദന', te: 'కడుపు నొప్పి', pa: 'ਪੇਟ ਦਰਦ', en: 'Stomach Pain' } },
        { icon: '🩹', label: 'Injury / चोट / காயம்', value: 'Physical injury or wound', speechText: { bn: 'আঘাত বা ক্ষত', hi: 'चोट', ta: 'காயம்', ml: 'പരുക്ക്', te: 'గాయం', pa: 'ਸੱਟ', en: 'Injury' } },
        { icon: '💫', label: 'Dizziness / चक्कर / தலைச்சுற்றல்', value: 'Dizziness and headache', speechText: { bn: 'মাথা ঘোরা', hi: 'चक्कर आना', ta: 'தலைச்சுற்றல்', ml: 'തലകറക്കം', te: 'తలతిరగడం', pa: 'ਚੱਕਰ ਆਉਣਾ', en: 'Dizziness' } },
      ];
    }

    if (f.includes('duration') || f.includes('long') || f.includes('when')) {
      return [
        { icon: '☀️', label: '1 Day / आज ही', value: '1 day', speechText: { bn: '১ দিন ধরে', hi: '१ दिन से', ta: '1 நாள்', ml: '1 ദിവസം', te: '1 రోజు', pa: '1 ਦਿਨ', en: '1 day' } },
        { icon: '🗓️', label: '2-3 Days / 2-3 दिन', value: '3 days', speechText: { bn: '২ থেকে ৩ দিন ধরে', hi: '२ से ३ दिन से', ta: '2-3 நாட்கள்', ml: '2-3 ദിവസങ്ങൾ', te: '2-3 రోజులు', pa: '2-3 ਦਿਨ', en: '2 to 3 days' } },
        { icon: '📅', label: '1 Week / 1 हफ्ता', value: '1 week', speechText: { bn: '১ সপ্তাহ ধরে', hi: '१ हफ्ते से', ta: '1 வாரம்', ml: '1 ആഴ്ച', te: '1 வారం', pa: '1 ਹਫ਼ਤਾ', en: '1 week' } },
        { icon: '⌛', label: '> 1 Month / 1 महीने से', value: 'More than a month', speechText: { bn: '১ মাসের বেশি ধরে', hi: '१ महीने से ज्यादा', ta: '1 மாதத்திற்கு மேலாக', ml: '1 മാസത്തിൽ കൂടുതൽ', te: '1 నెలకు పైగా', pa: '1 ਮਹੀने ਤੋਂ ਵੱਧ', en: 'More than a month' } },
      ];
    }

    if (f.includes('severity') || f.includes('pain') || f.includes('scale')) {
      return [
        { icon: '😀', label: 'Mild (1-3) / हल्का', value: 'Mild pain (3/10)', speechText: { bn: 'হালকা ব্যথা', hi: 'हल्का दर्द', ta: 'லேசான வலி', ml: 'സാരമില്ലാത്ത വേദന', te: 'తేలికపాటి నొప్పి', pa: 'ਹਲਕਾ ਦਰദ', en: 'Mild pain' } },
        { icon: '😐', label: 'Moderate (4-6) / मध्यम', value: 'Moderate pain (6/10)', speechText: { bn: 'মাঝারি ব্যথা', hi: 'मध्यम दर्द', ta: 'மிதமான வலி', ml: 'മിതമായ വേദന', te: 'మధ్యస్థ నొప్పి', pa: 'ਮੱਧਮ ਦਰਦ', en: 'Moderate pain' } },
        { icon: '😣', label: 'Severe (7-8) / तेज दर्द', value: 'Severe pain (8/10)', speechText: { bn: 'তীব্র ব্যথা', hi: 'तेज दर्द', ta: 'கடுமையான வலி', ml: 'കഠിനമായ വേദന', te: 'తీव्रమైన నొప్పి', pa: 'ਤੇਜ਼ ਦਰਦ', en: 'Severe pain' } },
        { icon: '😫', label: 'Extreme (9-10) / असहनीय', value: 'Extreme pain (10/10)', speechText: { bn: 'অসহনীয় ব্যথা', hi: 'असहनीय दर्द', ta: 'தாங்க முடியாத வலி', ml: 'സഹിക്കാനാവാത്ത വേദന', te: 'తట్టుకోలేని నొప్పి', pa: 'ਅਸਹਿ ਦਰਦ', en: 'Extreme unbearable pain' } },
      ];
    }

    if (f.includes('medication') || f.includes('medicine') || f.includes('taking')) {
      return [
        { icon: '💊', label: 'Taking Medicines / दवाइयाँ ले रहे हैं', value: 'Taking daily prescription medications', speechText: { bn: 'ওষুধ খাচ্ছি', hi: 'दवाइयाँ ले रहे हैं', ta: 'மருந்துகள் உட்கொள்கிறேன்', ml: 'മരുന്നുകൾ കഴിക്കുന്നു', te: 'మందులు వాడుతున్నాను', pa: 'ਦਵਾਈਆਂ ਲੈ ਰਹੇ ਹਾਂ', en: 'Taking medications' } },
        { icon: '❌', label: 'No Medicines / कोई दवा नहीं', value: 'Not taking any medications currently', speechText: { bn: 'কোনো ওষুধ খাচ্ছি না', hi: 'कोई दवा नहीं ले रहे', ta: 'மருந்துகள் எதுவும் இல்லை', ml: 'മരുന്നുകൾ ഒന്നും ഇല്ല', te: 'ఏ మందులు వాడట్లేదు', pa: 'ਕੋਈ ਦਵਾਈ ਨਹੀਂ', en: 'No medications currently' } },
      ];
    }

    return [];
  };

  const assistiveOptions = getAssistiveOptions();

  return (
    <div className="w-full max-w-3xl glass-card rounded-[2rem] p-8 md:p-12 flex flex-col gap-8 mx-auto">
      <div className="flex flex-col gap-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="rounded-full bg-[rgba(31,111,99,0.12)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--pulse-teal)]">
            Clinical Intake Question
          </span>
          <button
            type="button"
            onClick={speakQuestionAgain}
            className="p-2 bg-[var(--glass-bg-strong)] hover:bg-[var(--glass-bg-strong)] rounded-full text-[var(--text-primary)] transition-transform active:scale-95 text-lg"
            title="Read question aloud"
          >
            🔊 Listen
          </button>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] leading-snug">
          {question}
        </h2>
      </div>

      {assistiveOptions.length > 0 && !isTyping && (
        <div className="flex flex-col gap-2 pt-2 border-t border-[var(--glass-border)]">
          <span className="text-xs font-black uppercase text-[var(--text-muted)] text-center tracking-wider">
            👉 Hover or Tap an Icon to Hear (आइकन पर कर्सर लाएं तो आवाज आएगी):
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {assistiveOptions.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onMouseEnter={() => speakOptionText(opt)}
                onFocus={() => speakOptionText(opt)}
                onClick={() => {
                  speakOptionText(opt);
                  onAnswer(opt.value);
                }}
                className="flex flex-col items-center justify-center p-4 rounded-2xl border border-[var(--glass-border)] bg-transparent hover:bg-[rgba(31,111,99,0.08)] hover:border-[var(--pulse-teal)] transition-all active:scale-95 shadow-sm group cursor-pointer"
              >
                <span className="text-4xl mb-1 group-hover:scale-110 transition-transform">
                  {opt.icon}
                </span>
                <span className="text-xs font-bold text-[var(--text-primary)] text-center leading-tight">
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!isTyping ? (
        <div className="flex flex-col items-center gap-6 pt-2 border-t border-[var(--glass-border)]">
          <VoiceRecorder
            onTranscription={onAnswer}
            language={language}
          />
          <button
            type="button"
            onClick={() => setIsTyping(true)}
            className="text-sm font-semibold text-[var(--text-muted)] underline underline-offset-4 transition-colors hover:text-[var(--pulse-teal)]"
          >
            ⌨️ Prefer typing or native keyboard? Click here
          </button>
        </div>
      ) : (
        <form onSubmit={handleTextSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <textarea
              value={typedAnswer}
              onChange={(e) => setTypedAnswer(e.target.value)}
              placeholder="Type your response here..."
              className="min-h-[110px] w-full rounded-2xl border border-[var(--line)] bg-transparent p-4 text-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--pulse-teal)] focus:outline-none focus:ring-4 focus:ring-[rgba(31,111,99,0.12)]"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowVirtualKeyboard(!showVirtualKeyboard)}
              className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-[var(--glass-bg-strong)] hover:bg-slate-300 text-xs font-black text-[var(--text-primary)] flex items-center gap-1 shadow-sm"
            >
              ⌨️ {showVirtualKeyboard ? 'Hide Keyboard' : 'On-Screen Keyboard'}
            </button>
          </div>

          {showVirtualKeyboard && (
            <VirtualKeyboard
              language={language}
              onKeyPress={(char) => setTypedAnswer((prev) => prev + char)}
              onBackspace={() => setTypedAnswer((prev) => prev.slice(0, -1))}
              onSpace={() => setTypedAnswer((prev) => prev + ' ')}
              onClear={() => setTypedAnswer('')}
              onClose={() => setShowVirtualKeyboard(false)}
            />
          )}

          <div className="flex gap-3">
            <BigButton
              label="🎙️ Use Voice"
              onClick={() => setIsTyping(false)}
              variant="secondary"
              className="flex-1 text-base min-h-[48px]"
            />
            <BigButton
              label="✓ Submit Answer"
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
