import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Paperclip,
  Trash2,
  ArrowUp,
  Mic,
  MicOff,
  AlertCircle,
  X,
  Globe,
  Radio,
  Sparkles,
} from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { VoiceState } from '../types/chat';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onClearChat: () => void;
  onStopGeneration?: () => void;
  isLoading: boolean;
  disabled?: boolean;
  onSpeechListeningChange?: (isListening: boolean) => void;
  wakeTriggerSignal?: number;
  injectedCommand?: string | null;
  voiceState?: VoiceState;
  isHandsFreeEnabled?: boolean;
  onToggleHandsFree?: () => void;
}

// Language options easily extendable for future updates (e.g. Urdu, Spanish, etc.)
const SUPPORTED_LANGUAGES = [
  { code: 'en-US', label: 'English', short: 'EN' },
  { code: 'hi-IN', label: 'Hindi (हिंदी)', short: 'HI' },
];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onClearChat,
  onStopGeneration,
  isLoading,
  disabled = false,
  onSpeechListeningChange,
  wakeTriggerSignal,
  injectedCommand,
  voiceState = 'WAKE_DISABLED',
  isHandsFreeEnabled = false,
  onToggleHandsFree,
}) => {
  const [text, setText] = useState('');
  const [showAttachmentTooltip, setShowAttachmentTooltip] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const baseTextRef = useRef<string>('');

  const {
    isListening,
    isSupported,
    error: speechError,
    language,
    setLanguage,
    startListening,
    stopListening,
    clearError,
  } = useSpeechRecognition({
    defaultLanguage: 'en-US',
    onTranscriptUpdate: (finalText, interimText) => {
      const activeSpeech = (finalText ? finalText + ' ' : '') + interimText;
      const base = baseTextRef.current;

      if (!activeSpeech.trim()) return;

      const combined = base
        ? base.endsWith(' ')
          ? base + activeSpeech.trim()
          : base + ' ' + activeSpeech.trim()
        : activeSpeech.trim();

      setText(combined);
    },
  });

  // Notify parent of listening state
  useEffect(() => {
    onSpeechListeningChange?.(isListening);
  }, [isListening, onSpeechListeningChange]);

  // Handle external wake word trigger ("Hey Saru" spoken without a command)
  useEffect(() => {
    if (wakeTriggerSignal && wakeTriggerSignal > 0) {
      baseTextRef.current = text;
      startListening();
    }
  }, [wakeTriggerSignal]);

  // Handle injected command from single-breath wake word ("Hey Saru, explain RAG")
  useEffect(() => {
    if (injectedCommand) {
      setText(injectedCommand);
      baseTextRef.current = injectedCommand;
    }
  }, [injectedCommand]);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!text.trim() || isLoading || disabled) return;
    if (isListening) {
      stopListening();
    }
    onSendMessage(text);
    setText('');
    baseTextRef.current = '';
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleToggleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      // Save current text as base so recognized speech appends to existing text
      baseTextRef.current = text;
      startListening();
    }
  };

  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  const isWakeDetected = voiceState === 'WAKE_DETECTED';

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 pb-4 sm:pb-6">
      {/* Speech Error Banner (Dismissible, allows typed input) */}
      {speechError && (
        <div className="mb-2 p-2.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-center justify-between shadow-lg backdrop-blur-md animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{speechError}</span>
          </div>
          <button
            onClick={clearError}
            className="p-1 rounded text-red-400 hover:text-white hover:bg-red-900/40 transition-colors cursor-pointer"
            title="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Wake Word Detected Banner (Step 4 Visual Feedback) */}
      {isWakeDetected && (
        <div className="mb-2 px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-500/60 text-amber-200 text-xs flex items-center justify-between backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-pulse">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin-slow" />
            <span className="font-semibold tracking-wide">"Hey Saru" detected!</span>
            <span className="text-amber-300/80">I'm listening for your command...</span>
          </div>
          <span className="text-[10px] font-mono bg-amber-900/50 px-2 py-0.5 rounded text-amber-300 border border-amber-700/50">
            Hands-Free Active
          </span>
        </div>
      )}

      {/* Voice Listening Active Indicator Bar */}
      {isListening && (
        <div className="mb-2 px-3 py-1.5 rounded-xl bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 text-xs flex items-center justify-between backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.2)]">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <span className="font-medium text-slate-200">Listening...</span>
            <div className="flex items-center gap-0.5">
              <span className="w-1 h-3 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-4 bg-cyan-300 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-2 bg-cyan-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              <span className="w-1 h-5 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
              <span className="w-1 h-3 bg-cyan-300 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
            </div>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-900/40 px-2 py-0.5 rounded border border-cyan-700/50">
            {currentLangObj.label}
          </span>
        </div>
      )}

      {/* Main Glassmorphism Input Container */}
      <div
        className={`relative glass-panel rounded-2xl p-2 sm:p-2.5 transition-all duration-300 shadow-xl ${
          isWakeDetected
            ? 'border-amber-400/80 shadow-[0_0_35px_rgba(245,158,11,0.35)]'
            : isListening
            ? 'border-cyan-400/70 shadow-[0_0_30px_rgba(6,182,212,0.25)]'
            : 'focus-within:border-cyan-500/40 focus-within:shadow-[0_0_25px_rgba(6,182,212,0.15)]'
        }`}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            baseTextRef.current = e.target.value;
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            isWakeDetected
              ? "Hey Saru detected! Speak your command..."
              : isListening
              ? `Listening in ${currentLangObj.label}... Speak clearly`
              : isHandsFreeEnabled
              ? 'Message SaruX, click mic, or say "Hey Saru" hands-free...'
              : 'Message SaruX or click the microphone to speak... (Shift + Enter for new line)'
          }
          rows={1}
          disabled={disabled}
          className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm sm:text-base px-3 py-1.5 focus:outline-none resize-none max-h-48 leading-relaxed scrollbar-thin"
        />

        {/* Action Row */}
        <div className="flex items-center justify-between pt-1.5 px-1 border-t border-slate-800/40 mt-1">
          {/* Left Actions: Attachments, Clear, Language Selector, Hands-Free, Microphone */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            {/* Attachment Button (Step 8) */}
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowAttachmentTooltip(true)}
                onMouseLeave={() => setShowAttachmentTooltip(false)}
                onClick={() => {
                  setShowAttachmentTooltip(true);
                  setTimeout(() => setShowAttachmentTooltip(false), 2400);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors cursor-pointer"
                title="Attach Document"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {showAttachmentTooltip && (
                <div className="absolute left-0 bottom-full mb-2 z-50 whitespace-nowrap px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-[11px] text-cyan-300 shadow-xl pointer-events-none">
                  Document ingestion coming in Step 8 (Multimodal RAG)
                </div>
              )}
            </div>

            {/* Clear Conversation Button */}
            <button
              type="button"
              onClick={onClearChat}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
              title="Clear current conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLangMenu((prev) => !prev)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800 transition-colors cursor-pointer"
                title="Select Speech Recognition Language"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>{currentLangObj.short}</span>
              </button>

              {showLangMenu && (
                <div className="absolute left-0 bottom-full mb-2 z-50 py-1 w-36 rounded-xl glass-panel-elevated shadow-2xl border border-slate-700 text-xs">
                  <div className="px-2.5 py-1 text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800">
                    Voice Language
                  </div>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        language === lang.code
                          ? 'text-cyan-300 bg-cyan-950/40 font-medium'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <span>{lang.label}</span>
                      <span className="text-[10px] font-mono opacity-60">{lang.short}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* STEP 4: Hands-Free Mode Toggle Button */}
            {onToggleHandsFree && (
              <button
                type="button"
                onClick={onToggleHandsFree}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-mono border transition-all cursor-pointer ${
                  isHandsFreeEnabled
                    ? 'text-emerald-300 bg-emerald-950/40 border-emerald-600/50 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border-slate-800'
                }`}
                title={
                  isHandsFreeEnabled
                    ? 'Hands-Free Mode: ON (Say "Hey Saru" to wake SaruX)'
                    : 'Hands-Free Mode: OFF (Click to enable "Hey Saru" wake word)'
                }
              >
                <Radio
                  className={`w-3.5 h-3.5 ${
                    isHandsFreeEnabled ? 'text-emerald-400 animate-pulse' : 'text-slate-500'
                  }`}
                />
                <span className="hidden sm:inline">Hands-Free</span>
                <span
                  className={`text-[10px] ${
                    isHandsFreeEnabled ? 'text-emerald-400 font-bold' : 'text-slate-500'
                  }`}
                >
                  {isHandsFreeEnabled ? 'ON' : 'OFF'}
                </span>
              </button>
            )}

            {/* STEP 2: MICROPHONE BUTTON */}
            <div className="relative">
              <button
                type="button"
                onClick={handleToggleVoiceInput}
                aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                className={`relative p-2 rounded-xl transition-all duration-300 flex items-center justify-center cursor-pointer active:scale-95 ${
                  isListening
                    ? 'bg-red-500/20 text-red-400 border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.35)] animate-pulse'
                    : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/90 border border-transparent hover:border-cyan-500/30'
                }`}
                title={
                  !isSupported
                    ? "Voice input isn't supported in this browser"
                    : isListening
                    ? 'Stop voice input'
                    : 'Start voice input'
                }
              >
                {/* Listening animated wave ring */}
                {isListening && (
                  <span className="absolute inset-0 rounded-xl bg-red-400/20 animate-ping pointer-events-none" />
                )}

                {isListening ? (
                  <MicOff className="w-4 h-4 text-red-400 fill-current" />
                ) : (
                  <Mic className="w-4 h-4 text-cyan-400" />
                )}
              </button>
            </div>
          </div>

          {/* Right Status + Send Button */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[11px] text-slate-500 font-mono">
              {text.length > 0 ? `${text.length} chars` : 'Enter to send'}
            </span>

            {isLoading ? (
              <button
                type="button"
                onClick={onStopGeneration}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-500 text-white text-xs font-medium transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!text.trim() || disabled}
                className={`flex items-center justify-center p-2 rounded-xl transition-all shadow-md ${
                  text.trim() && !disabled
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25 active:scale-95 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
                title="Send message"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subtle Bottom Disclaimer */}
      <div className="text-center text-[10px] sm:text-[11px] text-slate-500 mt-2 font-mono flex items-center justify-center gap-2">
        <span>SaruX AI · Step 4 Hands-Free ("Hey Saru") · Powered by Google Gemini</span>
        {isHandsFreeEnabled && (
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Wake Word Active
          </span>
        )}
      </div>
    </div>
  );
};
