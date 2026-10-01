import { useState, useEffect, useRef, useCallback } from 'react';
import {
  BrowserSpeechWakeWordProvider,
  WakeWordProvider,
  WakeWordDetectionResult,
} from '../utils/wakeWordDetector';
import { playWakeChime } from '../utils/audioFeedback';
import { VoiceState, VoicePipelineStage } from '../types/chat';

const HANDS_FREE_STORAGE_KEY = 'sarux_ai_hands_free_mode_v1';

export interface UseWakeWordOptions {
  onWakeWordTriggered?: () => void;
  onCommandCaptured?: (command: string) => void;
  isExternalListening?: boolean;
  isExternalThinking?: boolean;
  isExternalSpeaking?: boolean;
}

export interface UseWakeWordReturn {
  isHandsFreeEnabled: boolean;
  isMonitoring: boolean;
  wakeWordDetected: boolean;
  voiceState: VoiceState;
  pipelineStage: VoicePipelineStage;
  error: string | null;
  enableHandsFree: () => void;
  disableHandsFree: () => void;
  toggleHandsFree: () => void;
  startWakeWord: () => void;
  stopWakeWord: () => void;
  clearError: () => void;
  isSupported: boolean;
}

export function useWakeWord({
  onWakeWordTriggered,
  onCommandCaptured,
  isExternalListening = false,
  isExternalThinking = false,
  isExternalSpeaking = false,
}: UseWakeWordOptions = {}): UseWakeWordReturn {
  // Hands-Free Mode setting: default false to avoid unintended microphone usage
  const [isHandsFreeEnabled, setIsHandsFreeEnabledState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(HANDS_FREE_STORAGE_KEY);
      return stored !== null ? stored === 'true' : false;
    } catch {
      return false;
    }
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providerRef = useRef<WakeWordProvider>(new BrowserSpeechWakeWordProvider());
  const detectionTimeoutRef = useRef<number | null>(null);

  const isSupported = providerRef.current.isSupported();

  const setHandsFreePersist = useCallback((enabled: boolean) => {
    setIsHandsFreeEnabledState(enabled);
    try {
      localStorage.setItem(HANDS_FREE_STORAGE_KEY, String(enabled));
    } catch (e) {
      console.warn('Failed to persist hands-free mode setting:', e);
    }
  }, []);

  const stopWakeWord = useCallback(() => {
    providerRef.current.stop();
    setIsMonitoring(false);
  }, []);

  const handleDetected = useCallback(
    (result: WakeWordDetectionResult) => {
      // 1. Mark detected
      setWakeWordDetected(true);
      setIsMonitoring(false);

      // 2. Play futuristic audio chime
      playWakeChime();

      // 3. If user said command in the same breath ("Hey Saru, explain neural nets")
      if (result.command && result.command.trim().length > 0) {
        if (detectionTimeoutRef.current) clearTimeout(detectionTimeoutRef.current);
        detectionTimeoutRef.current = window.setTimeout(() => {
          setWakeWordDetected(false);
          onCommandCaptured?.(result.command!.trim());
        }, 350);
      } else {
        // Just the wake word alone -> transition to active listening
        if (detectionTimeoutRef.current) clearTimeout(detectionTimeoutRef.current);
        detectionTimeoutRef.current = window.setTimeout(() => {
          setWakeWordDetected(false);
          onWakeWordTriggered?.();
        }, 600);
      }
    },
    [onCommandCaptured, onWakeWordTriggered]
  );

  const startWakeWord = useCallback(() => {
    if (!isSupported) {
      setError("Voice input isn't supported in this browser. Try Chrome or Edge.");
      return;
    }

    // Do NOT run wake word if system is busy with listening, thinking, or speaking
    if (isExternalListening || isExternalThinking || isExternalSpeaking) {
      return;
    }

    setError(null);
    try {
      providerRef.current.start(
        (result) => {
          handleDetected(result);
        },
        (err) => {
          setError(err);
          setIsMonitoring(false);
        }
      );
      setIsMonitoring(true);
    } catch (err: any) {
      console.warn('Failed to start wake word provider:', err);
      setError(err?.message || 'Could not start wake word');
      setIsMonitoring(false);
    }
  }, [
    isSupported,
    isExternalListening,
    isExternalThinking,
    isExternalSpeaking,
    handleDetected,
  ]);

  const enableHandsFree = useCallback(() => {
    setHandsFreePersist(true);
  }, [setHandsFreePersist]);

  const disableHandsFree = useCallback(() => {
    setHandsFreePersist(false);
    stopWakeWord();
    setWakeWordDetected(false);
  }, [setHandsFreePersist, stopWakeWord]);

  const toggleHandsFree = useCallback(() => {
    if (isHandsFreeEnabled) {
      disableHandsFree();
    } else {
      enableHandsFree();
    }
  }, [isHandsFreeEnabled, disableHandsFree, enableHandsFree]);

  // Main lifecycle: monitor according to hands-free state and external activity
  useEffect(() => {
    if (!isHandsFreeEnabled) {
      stopWakeWord();
      return;
    }

    // If external actions (speaking, listening, thinking) are occurring, pause wake monitoring
    if (isExternalSpeaking || isExternalListening || isExternalThinking) {
      stopWakeWord();
      return;
    }

    // Otherwise, resume wake word monitoring!
    if (!isMonitoring && !wakeWordDetected) {
      const timer = setTimeout(() => {
        startWakeWord();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [
    isHandsFreeEnabled,
    isExternalSpeaking,
    isExternalListening,
    isExternalThinking,
    isMonitoring,
    wakeWordDetected,
    startWakeWord,
    stopWakeWord,
  ]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopWakeWord();
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }
    };
  }, [stopWakeWord]);

  // Calculate current VoiceState
  let voiceState: VoiceState = 'WAKE_DISABLED';
  if (isExternalSpeaking) {
    voiceState = 'SPEAKING';
  } else if (isExternalThinking) {
    voiceState = 'THINKING';
  } else if (isExternalListening) {
    voiceState = 'LISTENING';
  } else if (wakeWordDetected) {
    voiceState = 'WAKE_DETECTED';
  } else if (isHandsFreeEnabled && isMonitoring) {
    voiceState = 'WAKE_MONITORING';
  } else {
    voiceState = 'WAKE_DISABLED';
  }

  // Calculate pipeline stage
  let pipelineStage: VoicePipelineStage = 'idle';
  if (voiceState === 'WAKE_MONITORING' || voiceState === 'WAKE_DETECTED') {
    pipelineStage = 'wake_word';
  } else if (voiceState === 'LISTENING') {
    pipelineStage = 'speech_recognition';
  } else if (voiceState === 'THINKING') {
    pipelineStage = 'gemini';
  } else if (voiceState === 'SPEAKING') {
    pipelineStage = 'tts';
  }

  return {
    isHandsFreeEnabled,
    isMonitoring,
    wakeWordDetected,
    voiceState,
    pipelineStage,
    error,
    enableHandsFree,
    disableHandsFree,
    toggleHandsFree,
    startWakeWord,
    stopWakeWord,
    clearError: () => setError(null),
    isSupported,
  };
}
