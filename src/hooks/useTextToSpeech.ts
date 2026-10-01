import { useState, useEffect, useRef, useCallback } from 'react';
import { cleanSpeechText } from '../utils/cleanSpeechText';

const VOICE_RESPONSE_STORAGE_KEY = 'sarux_ai_voice_response_enabled_v1';
const PREFERRED_VOICE_STORAGE_KEY = 'sarux_ai_preferred_voice_v1';

export interface UseTextToSpeechReturn {
  speak: (text: string, messageId?: string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  availableVoices: SpeechSynthesisVoice[];
  currentMessageId: string | null;
  autoVoiceResponse: boolean;
  setAutoVoiceResponse: (enabled: boolean) => void;
  selectedVoiceURI: string;
  setSelectedVoiceURI: (uri: string) => void;
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Global "Voice Response" setting (Default: ON)
  const [autoVoiceResponse, setAutoVoiceResponseState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(VOICE_RESPONSE_STORAGE_KEY);
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });

  const [selectedVoiceURI, setSelectedVoiceURIState] = useState<string>(() => {
    try {
      return localStorage.getItem(PREFERRED_VOICE_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const resumeIntervalRef = useRef<number | null>(null);

  const setAutoVoiceResponse = useCallback((enabled: boolean) => {
    setAutoVoiceResponseState(enabled);
    try {
      localStorage.setItem(VOICE_RESPONSE_STORAGE_KEY, String(enabled));
    } catch (e) {
      console.warn('Failed to persist voice response preference:', e);
    }
  }, []);

  const setSelectedVoiceURI = useCallback((uri: string) => {
    setSelectedVoiceURIState(uri);
    try {
      localStorage.setItem(PREFERRED_VOICE_STORAGE_KEY, uri);
    } catch (e) {
      console.warn('Failed to persist preferred voice URI:', e);
    }
  }, []);

  // Load and cache voices
  const updateVoices = useCallback(() => {
    if (!isSupported) return;
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      setAvailableVoices(voices);
    }
  }, [isSupported]);

  useEffect(() => {
    if (!isSupported) return;

    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (resumeIntervalRef.current) {
        clearInterval(resumeIntervalRef.current);
      }
    };
  }, [isSupported, updateVoices]);

  // Chrome long-utterance keep-alive workaround
  const startKeepAlive = () => {
    if (resumeIntervalRef.current) clearInterval(resumeIntervalRef.current);
    resumeIntervalRef.current = window.setInterval(() => {
      if (window.speechSynthesis && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 12000);
  };

  const stopKeepAlive = () => {
    if (resumeIntervalRef.current) {
      clearInterval(resumeIntervalRef.current);
      resumeIntervalRef.current = null;
    }
  };

  const stop = useCallback(() => {
    if (!isSupported) return;
    stopKeepAlive();
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn('Speech cancellation error:', e);
    }
    currentUtteranceRef.current = null;
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentMessageId(null);
  }, [isSupported]);

  const pause = useCallback(() => {
    if (!isSupported) return;
    try {
      window.speechSynthesis.pause();
      setIsPaused(true);
    } catch (e) {
      console.warn('Speech pause error:', e);
    }
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported) return;
    try {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } catch (e) {
      console.warn('Speech resume error:', e);
    }
  }, [isSupported]);

  const speak = useCallback(
    (rawText: string, messageId?: string) => {
      if (!isSupported) return;

      // Always stop any existing speech before starting a new one
      stop();

      const cleanedText = cleanSpeechText(rawText);
      if (!cleanedText) return;

      try {
        const utterance = new SpeechSynthesisUtterance(cleanedText);

        // Pick voice if selected or find a preferred high quality natural voice
        if (availableVoices.length > 0) {
          let chosenVoice: SpeechSynthesisVoice | undefined;

          if (selectedVoiceURI) {
            chosenVoice = availableVoices.find((v) => v.voiceURI === selectedVoiceURI);
          }

          if (!chosenVoice) {
            // Find preferred smooth English voices
            chosenVoice =
              availableVoices.find(
                (v) =>
                  v.lang.startsWith('en') &&
                  (v.name.includes('Google') ||
                    v.name.includes('Natural') ||
                    v.name.includes('Samantha') ||
                    v.name.includes('Alex') ||
                    v.name.includes('Daniel'))
              ) ||
              availableVoices.find((v) => v.lang.startsWith('en')) ||
              availableVoices[0];
          }

          if (chosenVoice) {
            utterance.voice = chosenVoice;
            utterance.lang = chosenVoice.lang;
          }
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => {
          setIsSpeaking(true);
          setIsPaused(false);
          if (messageId) {
            setCurrentMessageId(messageId);
          }
          startKeepAlive();
        };

        utterance.onend = () => {
          stopKeepAlive();
          setIsSpeaking(false);
          setIsPaused(false);
          setCurrentMessageId(null);
          currentUtteranceRef.current = null;
        };

        utterance.onerror = (e) => {
          // Interrupted error is normal when canceled
          if (e.error !== 'interrupted' && e.error !== 'canceled') {
            console.warn('Speech synthesis error:', e.error);
          }
          stopKeepAlive();
          setIsSpeaking(false);
          setIsPaused(false);
          setCurrentMessageId(null);
          currentUtteranceRef.current = null;
        };

        currentUtteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('Failed to execute speak:', err);
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentMessageId(null);
      }
    },
    [isSupported, stop, availableVoices, selectedVoiceURI]
  );

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported,
    availableVoices,
    currentMessageId,
    autoVoiceResponse,
    setAutoVoiceResponse,
    selectedVoiceURI,
    setSelectedVoiceURI,
  };
}
