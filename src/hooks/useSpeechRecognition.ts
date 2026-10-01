import { useState, useEffect, useRef, useCallback } from 'react';

// Web Speech API Types
interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultItemAlternative {
  0: SpeechRecognitionResultItem;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionEventMap {
  resultIndex: number;
  results: {
    length: number;
    item(index: number): SpeechRecognitionResultItemAlternative;
    [index: number]: SpeechRecognitionResultItemAlternative;
  };
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string; message?: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEventMap) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export interface UseSpeechRecognitionOptions {
  defaultLanguage?: string;
  onTranscriptUpdate?: (finalText: string, interimText: string) => void;
  onError?: (errorMessage: string) => void;
}

export function useSpeechRecognition({
  defaultLanguage = 'en-US',
  onTranscriptUpdate,
  onError,
}: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>(defaultLanguage);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isManuallyStoppedRef = useRef(false);

  // Check Web Speech API availability
  const isSupported =
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  // Update recognition language dynamically
  useEffect(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.lang = language;
    }
  }, [language, isListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore cleanup abort errors
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore already stopped error
      }
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      const unsupportedMsg = "Voice input isn't supported in this browser. Try Chrome or Edge.";
      setError(unsupportedMsg);
      onError?.(unsupportedMsg);
      return;
    }

    setError(null);
    setTranscript('');
    setInterimTranscript('');
    isManuallyStoppedRef.current = false;

    // Abort any existing instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    try {
      const SpeechRecognitionConstructor =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognitionConstructor) return;

      const recognition = new SpeechRecognitionConstructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: SpeechRecognitionEventMap) => {
        let currentFinal = '';
        let currentInterim = '';

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptChunk = result[0]?.transcript || '';

          if (result.isFinal) {
            currentFinal += transcriptChunk + ' ';
          } else {
            currentInterim += transcriptChunk;
          }
        }

        const trimmedFinal = currentFinal.trim();
        const trimmedInterim = currentInterim.trim();

        setTranscript(trimmedFinal);
        setInterimTranscript(trimmedInterim);

        onTranscriptUpdate?.(trimmedFinal, trimmedInterim);
      };

      recognition.onerror = (event: { error: string; message?: string }) => {
        console.warn('Speech recognition event error:', event.error);

        let userFriendlyError = '';
        switch (event.error) {
          case 'not-allowed':
          case 'permission-denied':
            userFriendlyError = 'Microphone permission is required for voice input.';
            break;
          case 'no-speech':
            // Non-fatal: user was silent, continue or ignore
            return;
          case 'network':
            userFriendlyError = 'Network error during speech recognition. Please check your connection.';
            break;
          case 'audio-capture':
            userFriendlyError = 'No microphone was detected on your device.';
            break;
          default:
            userFriendlyError = `Speech recognition error: ${event.error}`;
        }

        setError(userFriendlyError);
        onError?.(userFriendlyError);
        setIsListening(false);
      };

      recognition.onend = () => {
        // If not manually stopped and continuous desired, could restart, but default to clean stop
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: unknown) {
      console.error('Failed to start speech recognition:', err);
      const errMsg = err instanceof Error ? err.message : 'Could not initialize microphone recognition';
      setError(errMsg);
      onError?.(errMsg);
      setIsListening(false);
    }
  }, [isSupported, language, onError, onTranscriptUpdate]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    language,
    setLanguage,
    startListening,
    stopListening,
    clearError,
  };
}
