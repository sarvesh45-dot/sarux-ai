import React from 'react';
import {
  ShieldAlert,
  Check,
  X,
  AppWindow,
  Volume1,
  VolumeX,
  ExternalLink,
  Globe,
  Sliders,
} from 'lucide-react';

interface ToolConfirmationModalProps {
  isOpen: boolean;
  toolName: string;
  args?: Record<string, any>;
  url?: string;
  formattedCall?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ToolConfirmationModal: React.FC<ToolConfirmationModalProps> = ({
  isOpen,
  toolName,
  args,
  url,
  formattedCall,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  // Determine tool-specific details
  const renderToolDetails = () => {
    if (toolName === 'open_application') {
      const appName = args?.application || formattedCall || 'Application';
      return {
        title: 'SaruX Permission Request',
        subtitle: 'Desktop Application Launch',
        actionLabel: 'SaruX wants to open:',
        itemContent: (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/90 border border-emerald-500/30 font-medium text-emerald-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <AppWindow className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-sm font-semibold tracking-wide capitalize select-text text-white">
              {appName}
            </span>
          </div>
        ),
        explanation: 'This action will launch an approved application on your computer.',
        icon: <AppWindow className="w-5 h-5 text-emerald-400" />,
        badgeColor: 'border-emerald-500/40 bg-emerald-950/50',
      };
    }

    if (toolName === 'set_volume') {
      const level = args?.level !== undefined ? args.level : 50;
      return {
        title: 'SaruX Audio Permission',
        subtitle: 'System Volume Adjustment',
        actionLabel: 'SaruX wants to change system volume:',
        itemContent: (
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/90 border border-cyan-500/30 font-mono text-cyan-300">
            <div className="flex items-center gap-2.5">
              <Volume1 className="w-5 h-5 text-cyan-400 shrink-0" />
              <span className="text-sm font-semibold text-white">Volume Target:</span>
            </div>
            <span className="text-base font-bold text-cyan-400 px-2.5 py-0.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40">
              {level}%
            </span>
          </div>
        ),
        explanation: `This will adjust your computer's audio output level to ${level}%.`,
        icon: <Sliders className="w-5 h-5 text-cyan-400" />,
        badgeColor: 'border-cyan-500/40 bg-cyan-950/50',
      };
    }

    if (toolName === 'mute_volume') {
      const isMuted = args?.muted !== false;
      return {
        title: 'SaruX Audio Permission',
        subtitle: 'Mute State Toggle',
        actionLabel: `SaruX wants to ${isMuted ? 'mute' : 'unmute'} system volume:`,
        itemContent: (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/90 border border-amber-500/30 text-amber-300">
            <VolumeX className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="text-sm font-semibold text-white">
              {isMuted ? 'Mute computer audio output' : 'Unmute computer audio output'}
            </span>
          </div>
        ),
        explanation: 'This action will toggle your computer system speaker mute state.',
        icon: <VolumeX className="w-5 h-5 text-amber-400" />,
        badgeColor: 'border-amber-500/40 bg-amber-950/50',
      };
    }

    // Default: open_website or open_url
    const targetUrl = url || args?.url || formattedCall || 'https://...';
    return {
      title: 'SaruX Permission Request',
      subtitle: 'External Browser Navigation',
      actionLabel: 'SaruX wants to open:',
      itemContent: (
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-cyan-300 break-all flex items-center gap-2.5">
          <ExternalLink className="w-4 h-4 shrink-0 text-cyan-400" />
          <span className="text-xs select-text font-medium">{targetUrl}</span>
        </div>
      ),
      explanation: 'This will open a new tab in your browser. SaruX verifies URL safety before opening.',
      icon: <Globe className="w-5 h-5 text-cyan-400" />,
      badgeColor: 'border-cyan-500/40 bg-cyan-950/50',
    };
  };

  const details = renderToolDetails();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl glass-panel-elevated p-6 border border-cyan-500/30 shadow-2xl shadow-cyan-500/10 space-y-4">
        {/* Header with security icon */}
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${details.badgeColor}`}>
            {details.icon}
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-['Syne']">
              {details.title}
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              {details.subtitle}
            </p>
          </div>
        </div>

        {/* Action description */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5 text-xs">
          <div className="text-slate-300 font-medium">
            {details.actionLabel}
          </div>

          {details.itemContent}

          <p className="text-[11px] text-slate-400 leading-normal">
            {details.explanation}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            Allow
          </button>
        </div>
      </div>
    </div>
  );
};
