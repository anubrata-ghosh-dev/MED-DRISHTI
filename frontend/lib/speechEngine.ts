/**
 * Multilingual Speech Synthesis Engine
 * Bulletproof client-side & backend TTS across Bengali, Tamil, Malayalam,
 * Telugu, Punjabi, Hindi, and English.
 */

let currentAudio: HTMLAudioElement | null = null;
let lastSpokenText: string = '';
let lastSpokenTime: number = 0;

export function stopSpeech() {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch (e) {
      // ignore
    }
    currentAudio = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // ignore
    }
  }
}

export function speakText(text: string, language: string = 'en', force: boolean = false) {
  if (!text || typeof window === 'undefined') return;

  const now = Date.now();
  const cleanText = text.trim();

  // Prevent rapid double-triggering glitch for same text within 500ms
  if (!force && cleanText === lastSpokenText && now - lastSpokenTime < 500) {
    return;
  }

  lastSpokenText = cleanText;
  lastSpokenTime = now;

  // Stop any currently playing audio or speech first
  stopSpeech();

  const bcpMap: Record<string, string> = {
    bn: 'bn-IN',
    hi: 'hi-IN',
    ta: 'ta-IN',
    ml: 'ml-IN',
    te: 'te-IN',
    pa: 'pa-IN',
    en: 'en-IN',
  };

  const targetBcp = bcpMap[language] || 'en-IN';

  // Sarvam Bulbul is the primary voice for consistent Indian-language playback.
  // The browser voice remains a resilient offline fallback.
  playBackendAudioStream(cleanText, language, () => speakWithBrowser(cleanText, language, targetBcp));
}

function speakWithBrowser(text: string, language: string, targetBcp: string) {
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = targetBcp;
      utterance.rate = 0.95; // Slightly slower for clear medical intake comprehension
      utterance.pitch = 1.0;

      // Try finding explicit matching voice if available
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const matchedVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().replace('_', '-') === targetBcp.toLowerCase() ||
            v.lang.toLowerCase().startsWith(language) ||
            v.name.toLowerCase().includes(language)
        );
        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('[SpeechEngine] Web Speech API error:', e);
    }
  }
}

function playBackendAudioStream(text: string, language: string, onError: () => void) {
  let fallbackUsed = false;
  const triggerFallback = () => {
    if (!fallbackUsed) {
      fallbackUsed = true;
      onError();
    }
  };

  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    const audioUrl = `${API_BASE}/api/v1/voice/tts?text=${encodeURIComponent(text)}&lang=${language}`;

    const audio = new Audio(audioUrl);
    currentAudio = audio;

    audio.onended = () => {
      currentAudio = null;
    };

    audio.onerror = () => {
      currentAudio = null;
      triggerFallback();
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('[SpeechEngine] Audio playback error:', err);
        currentAudio = null;
        triggerFallback();
      });
    }
  } catch (err) {
    console.warn('[SpeechEngine] Audio exception:', err);
    triggerFallback();
  }
}
