/**
 * Wake Word Detection Engine & Abstraction Layer
 * Architecture supports switching between browser-based Speech Recognition prototype
 * and future offline wake-word engines (e.g., Vosk, Porcupine, ONNX).
 */

export interface WakeWordDetectionResult {
  detected: boolean;
  wakePhrase?: string;
  command?: string;
  rawText: string;
}

export interface WakeWordProvider {
  name: string;
  isSupported(): boolean;
  start(
    onDetected: (result: WakeWordDetectionResult) => void,
    onError?: (err: string) => void
  ): void;
  stop(): void;
  isListening(): boolean;
}

// Acceptable wake word variations for "Hey Saru"
const WAKE_WORD_PATTERNS = [
  'hey saru',
  'hey sarah',
  'hey saroo',
  'hi saru',
  'hi sarah',
  'hey saro',
  'hey sorrow',
  'ok saru',
  'okay saru',
];

/**
 * Normalizes input text for resilient wake-word matching
 */
export function normalizeSpeechText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?'"“”]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Robustly inspects text for "Hey Saru" and extracts trailing command text if spoken in the same breath.
 * e.g. "Hey Saru what is RAG" -> detected: true, command: "what is RAG"
 */
export function detectWakeWord(rawText: string): WakeWordDetectionResult {
  const normalized = normalizeSpeechText(rawText);

  for (const pattern of WAKE_WORD_PATTERNS) {
    const idx = normalized.indexOf(pattern);
    if (idx !== -1) {
      // Find where the wake pattern ends in the normalized text
      const afterWake = normalized.slice(idx + pattern.length).trim();

      // Also attempt to slice from raw text if trailing command exists
      let command = afterWake;

      // Clean up common leading connectives like "can you", "please", etc. if desired, but keep command natural
      if (command.startsWith('please ')) {
        command = command.slice(7).trim();
      }

      return {
        detected: true,
        wakePhrase: pattern,
        command: command.length > 0 ? command : undefined,
        rawText,
      };
    }
  }

  return {
    detected: false,
    rawText,
  };
}

/**
 * Browser-based Speech Recognition Provider (Step 4 Prototype)
 * Implements WakeWordProvider interface using window.SpeechRecognition / webkitSpeechRecognition.
 */
export class BrowserSpeechWakeWordProvider implements WakeWordProvider {
  name = 'BrowserSpeechWakeWordProvider (Web Speech API)';
  private recognition: any = null;
  private running = false;
  private cooldownUntil = 0;

  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      Boolean(
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      )
    );
  }

  start(
    onDetected: (result: WakeWordDetectionResult) => void,
    onError?: (err: string) => void
  ): void {
    if (!this.isSupported()) {
      onError?.("Voice input isn't supported in this browser. Try Chrome or Edge.");
      return;
    }

    this.stop();

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        this.running = true;
      };

      rec.onresult = (event: any) => {
        const now = Date.now();
        if (now < this.cooldownUntil) {
          return;
        }

        let fullTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const chunk = event.results[i][0]?.transcript || '';
          fullTranscript += chunk + ' ';
        }

        const match = detectWakeWord(fullTranscript);
        if (match.detected) {
          // Set cooldown to prevent double triggers in a single phrase
          this.cooldownUntil = now + 2500;
          this.stop();
          onDetected(match);
        }
      };

      rec.onerror = (e: any) => {
        if (e.error === 'no-speech') {
          // Silent interval, ignore
          return;
        }
        if (e.error === 'not-allowed' || e.error === 'permission-denied') {
          onError?.('Microphone access is required for hands-free mode.');
          this.running = false;
          return;
        }
        // Non-fatal abort/network errors
        if (e.error !== 'aborted') {
          console.warn('Wake word recognizer event:', e.error);
        }
      };

      rec.onend = () => {
        // Automatically restart monitoring if still marked as running
        if (this.running) {
          try {
            rec.start();
          } catch {
            this.running = false;
          }
        }
      };

      this.recognition = rec;
      this.running = true;
      rec.start();
    } catch (err: any) {
      this.running = false;
      onError?.(err?.message || 'Failed to initialize wake-word monitoring');
    }
  }

  stop(): void {
    this.running = false;
    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.abort();
      } catch {
        // ignore
      }
      this.recognition = null;
    }
  }

  isListening(): boolean {
    return this.running;
  }
}

/**
 * Future Provider: OfflineWakeWordProvider (Stub)
 * Reserved for offline local model integration (e.g. Vosk WASM, Porcupine, OpenWakeWord).
 */
export class OfflineWakeWordProvider implements WakeWordProvider {
  name = 'OfflineWakeWordProvider (Reserved for future offline WASM engine)';

  isSupported(): boolean {
    return false; // To be implemented in future offline release
  }

  start(): void {
    throw new Error('OfflineWakeWordProvider not yet implemented.');
  }

  stop(): void {}

  isListening(): boolean {
    return false;
  }
}
