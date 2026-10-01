import React from 'react';
import {
  Menu,
  Settings,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  Radio,
} from 'lucide-react';
import { ServerStatusResponse } from '../types/chat';

interface HeaderProps {
  serverStatus: ServerStatusResponse | null;
  onOpenSettings: () => void;
  onToggleSidebar: () => void;
  onToggleAIStatus: () => void;
  isAIStatusOpen: boolean;
  autoVoiceResponse: boolean;
  onToggleVoiceResponse: () => void;
  isSpeaking?: boolean;
  isHandsFreeEnabled?: boolean;
  onToggleHandsFree?: () => void;
  isMonitoring?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  serverStatus,
  onOpenSettings,
  onToggleSidebar,
  onToggleAIStatus,
  isAIStatusOpen,
  autoVoiceResponse,
  onToggleVoiceResponse,
  isSpeaking = false,
  isHandsFreeEnabled = false,
  onToggleHandsFree,
  isMonitoring = false,
}) => {
  const isOnline = serverStatus?.status === 'online';
  const isMissingKey = serverStatus?.status === 'unconfigured';

  return (
    <header className="h-14 sm:h-16 px-3 sm:px-6 border-b border-slate-800/80 bg-[#0A0D15]/80 backdrop-blur-md flex items-center justify-between z-20 shrink-0">
      {/* Left: Mobile Menu Toggle & Brand Title + Tagline */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors md:hidden cursor-pointer"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-500/30 text-cyan-400 font-bold shadow-md shadow-cyan-500/10">
            <span className="font-['Syne'] text-sm tracking-tighter">SX</span>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping opacity-75" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-bold font-['Syne'] tracking-tight text-white">
                SaruX AI
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-medium">
                Step 4
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium hidden sm:block">
              Your Personal AI Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Right: Engine Indicator, Voice Controls & Panel Toggles */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Gemini Engine Badge */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300">
          <Zap
            className={`w-3.5 h-3.5 ${
              isOnline ? 'text-cyan-400 fill-cyan-400/20' : 'text-slate-500'
            }`}
          />
          <span className="hidden md:inline font-medium">gemini-3.8-flash</span>
          <span className="md:hidden font-medium">Gemini</span>
          <span className="text-[10px] text-slate-400">·</span>
          <span className="text-[11px] font-medium">
            {isOnline ? 'Online' : isMissingKey ? 'Setup' : 'Offline'}
          </span>
        </div>

        {/* STEP 4: Hands-Free "Hey Saru" Wake Word Toggle */}
        {onToggleHandsFree && (
          <button
            type="button"
            onClick={onToggleHandsFree}
            className={`p-1.5 sm:p-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-xs font-mono ${
              isHandsFreeEnabled
                ? isMonitoring
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/40'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'
            }`}
            title={
              isHandsFreeEnabled
                ? 'Hands-Free Mode: ON (Say "Hey Saru" to wake SaruX)'
                : 'Hands-Free Mode: OFF (Click to enable "Hey Saru" wake word)'
            }
          >
            <Radio
              className={`w-4 h-4 ${
                isHandsFreeEnabled && isMonitoring ? 'text-emerald-400 animate-pulse' : ''
              }`}
            />
            <span className="hidden xl:inline text-[11px]">
              {isHandsFreeEnabled
                ? isMonitoring
                  ? 'Hey Saru: Listening'
                  : 'Hey Saru: ON'
                : 'Hands-Free: OFF'}
            </span>
          </button>
        )}

        {/* Voice Response TTS Toggle */}
        <button
          type="button"
          onClick={onToggleVoiceResponse}
          className={`p-1.5 sm:p-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-xs font-mono ${
            autoVoiceResponse
              ? isSpeaking
                ? 'bg-red-950/60 text-red-300 border border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.3)] animate-pulse'
                : 'text-cyan-400 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/40'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'
          }`}
          title={
            autoVoiceResponse
              ? isSpeaking
                ? 'SaruX is speaking... Click to toggle voice response'
                : 'Voice Response: ON (Auto-speak responses)'
              : 'Voice Response: OFF (Text-only)'
          }
        >
          {autoVoiceResponse ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
          <span className="hidden lg:inline text-[11px]">
            {autoVoiceResponse ? (isSpeaking ? 'Speaking' : 'Voice ON') : 'Voice OFF'}
          </span>
        </button>

        {/* AI Status Toggle (Desktop) */}
        <button
          onClick={onToggleAIStatus}
          className={`p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors hidden sm:flex items-center cursor-pointer ${
            isAIStatusOpen ? 'text-cyan-400 bg-slate-800/40' : ''
          }`}
          title={isAIStatusOpen ? 'Hide AI Status Panel' : 'Show AI Status Panel'}
        >
          {isAIStatusOpen ? (
            <PanelRightClose className="w-4 h-4" />
          ) : (
            <PanelRightOpen className="w-4 h-4" />
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors cursor-pointer"
          title="Open Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
