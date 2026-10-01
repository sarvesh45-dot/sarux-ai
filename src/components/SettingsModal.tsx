import React, { useState } from 'react';
import {
  X,
  Cpu,
  ShieldCheck,
  Download,
  Trash2,
  RefreshCw,
  Terminal,
  ExternalLink,
  Check,
  Sparkles,
  Volume2,
  Radio,
} from 'lucide-react';
import { ServerStatusResponse, Conversation } from '../types/chat';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverStatus: ServerStatusResponse | null;
  onRefreshStatus: () => void;
  isCheckingStatus: boolean;
  conversations: Conversation[];
  onClearAllChats: () => void;
  autoVoiceResponse: boolean;
  onToggleVoiceResponse: (enabled: boolean) => void;
  availableVoices?: SpeechSynthesisVoice[];
  selectedVoiceURI?: string;
  onSelectVoice?: (uri: string) => void;
  onTestVoice?: () => void;
  isHandsFreeEnabled?: boolean;
  onToggleHandsFree?: (enabled: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  serverStatus,
  onRefreshStatus,
  isCheckingStatus,
  conversations,
  onClearAllChats,
  autoVoiceResponse,
  onToggleVoiceResponse,
  availableVoices = [],
  selectedVoiceURI = '',
  onSelectVoice,
  onTestVoice,
  isHandsFreeEnabled = false,
  onToggleHandsFree,
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  if (!isOpen) return null;

  const isOnline = serverStatus?.status === 'online';

  const systemPromptText =
    "You are SaruX, a personal AI assistant created as an AI/ML engineering project. You are helpful, concise, technically capable, and friendly. You explain difficult concepts clearly. You assist with programming, AI/ML, projects, research, productivity, and general questions. Never claim to have performed an action that you did not actually perform. At this stage you are a text-based assistant; system control, voice control, and external actions will be added in future versions.";

  const handleExportChats = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(conversations, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `sarux_ai_chats_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopySystemPrompt = () => {
    navigator.clipboard.writeText(systemPromptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-xl glass-panel-elevated rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center text-white font-mono text-xs font-bold">
              SX
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white font-['Syne']">
                SaruX Intelligence Settings
              </h2>
              <p className="text-[11px] text-slate-400">Step 1 Environment & Engine Config</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 scrollbar-thin">
          {/* Section 1: AI Engine & Connectivity */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              AI Engine & Model
            </h3>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  <span>Google Gemini</span>
                  <span className="text-[11px] font-mono text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
                    gemini-3.8-flash
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Server-side proxied SDK execution. API Key is kept strictly confidential.
                </p>
              </div>

              <button
                onClick={onRefreshStatus}
                disabled={isCheckingStatus}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer shrink-0"
                title="Refresh Status"
              >
                <RefreshCw className={`w-4 h-4 ${isCheckingStatus ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Server Status Callout */}
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                isOnline
                  ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                  : 'bg-amber-950/30 border-amber-800/50 text-amber-300'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">
                  {isOnline ? 'Connection Active & Ready' : 'GEMINI_API_KEY Not Detected'}
                </div>
                <div className="text-[11px] opacity-90 mt-0.5">
                  {isOnline
                    ? 'All requests are routed securely via Node.js Express server to Gemini 3.8 Flash.'
                    : 'Set GEMINI_API_KEY in the AI Studio Secrets panel or .env file to enable live responses.'}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Voice & Audio Output (STEP 3) */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              Voice Response & Audio (Step 3)
            </h3>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              {/* Voice Response Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">Voice Response</div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Automatically speak Gemini responses aloud using Web Speech API
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleVoiceResponse(!autoVoiceResponse)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autoVoiceResponse ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'bg-slate-700'
                  }`}
                  role="switch"
                  aria-checked={autoVoiceResponse}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      autoVoiceResponse ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Voice Selection & Test */}
              {availableVoices.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
                  <div className="w-full sm:w-auto flex-1">
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      System TTS Voice
                    </label>
                    <select
                      value={selectedVoiceURI}
                      onChange={(e) => onSelectVoice?.(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
                    >
                      <option value="">Default Recommended Voice</option>
                      {availableVoices.map((voice) => (
                        <option key={voice.voiceURI} value={voice.voiceURI}>
                          {voice.name} ({voice.lang})
                        </option>
                      ))}
                    </select>
                  </div>

                  {onTestVoice && (
                    <button
                      type="button"
                      onClick={onTestVoice}
                      className="mt-2 sm:mt-4 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono border border-slate-700 transition-colors shrink-0 cursor-pointer"
                    >
                      Test Voice
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Hands-Free Mode & Wake Word (STEP 4) */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              Hands-Free Mode & Wake Word (Step 4)
            </h3>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              {/* Hands-Free Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    <span>Hands-Free Mode</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-700/60 text-emerald-300">
                      "Hey Saru"
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Activate SaruX automatically by saying "Hey Saru" (or "Hi Saru", "Hey Sarah")
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleHandsFree?.(!isHandsFreeEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isHandsFreeEnabled
                      ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                      : 'bg-slate-700'
                  }`}
                  role="switch"
                  aria-checked={isHandsFreeEnabled}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isHandsFreeEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Privacy and Architecture Notice */}
              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <p className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <strong>Privacy First:</strong> Hands-Free Mode uses your microphone while enabled.
                </p>
                <p className="text-slate-500 text-[10px] leading-relaxed">
                  Audio is processed locally by your browser's Web Speech API. No audio recordings are saved or uploaded to external servers. Upgrade-ready for offline WASM models (Vosk/Porcupine).
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: System Persona Prompt */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-violet-400" />
                Active System Prompt
              </h3>
              <button
                onClick={handleCopySystemPrompt}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <span>Copy Prompt</span>
                )}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed max-h-32 overflow-y-auto scrollbar-thin">
              {systemPromptText}
            </div>
          </div>

          {/* Section 3: Local Storage & Session Data */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Data & Conversations
            </h3>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleExportChats}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700/60"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export Sessions ({conversations.length})</span>
              </button>

              <button
                onClick={() => {
                  if (confirm('Clear all conversation history? This cannot be undone.')) {
                    onClearAllChats();
                    onClose();
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/50 text-red-300 text-xs font-medium transition-colors border border-red-800/50"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Clear All Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>SaruX AI · Step 1 Implementation</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
