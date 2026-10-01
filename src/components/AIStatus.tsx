import React from 'react';
import {
  Cpu,
  Activity,
  Layers,
  HardDrive,
  Wrench,
  Mic,
  Volume2,
  Radio,
  MonitorCheck,
  Globe,
  FileText,
  Sparkles,
  CheckCircle2,
  Circle,
  HelpCircle,
} from 'lucide-react';
import { ServerStatusResponse, VoiceState, VoicePipelineStage } from '../types/chat';
import { ToolActivitySection } from './ToolActivitySection';
import { SystemControlSection } from './SystemControlSection';
import { ToolActivityItem } from '../hooks/useTools';

interface AIStatusProps {
  serverStatus: ServerStatusResponse | null;
  messageCount: number;
  isOpen?: boolean;
  onClose?: () => void;
  voiceState?: VoiceState;
  pipelineStage?: VoicePipelineStage;
  isHandsFreeEnabled?: boolean;
  onToggleHandsFree?: () => void;
  wakeWordError?: string | null;
  toolActivities?: ToolActivityItem[];
  onClearToolActivities?: () => void;
}

export const AIStatus: React.FC<AIStatusProps> = ({
  serverStatus,
  messageCount,
  isOpen = true,
  onClose,
  voiceState = 'WAKE_DISABLED',
  pipelineStage = 'idle',
  isHandsFreeEnabled = false,
  onToggleHandsFree,
  wakeWordError,
  toolActivities = [],
  onClearToolActivities,
}) => {
  const isOnline = serverStatus?.status === 'online';
  const isMissingKey = serverStatus?.status === 'unconfigured';

  const comingNextSteps = [
    {
      title: 'Voice Input (STT)',
      step: 'Step 2',
      description: 'Microphone & Web Speech recognition',
      icon: Mic,
      status: 'Active',
    },
    {
      title: 'Voice Output (TTS)',
      step: 'Step 3',
      description: 'Text-to-Speech audio voice synthesis',
      icon: Volume2,
      status: 'Active',
    },
    {
      title: 'Wake Word ("Hey Saru")',
      step: 'Step 4',
      description: 'Hands-free acoustic detection & pipeline',
      icon: Radio,
      status: 'Active',
    },
    {
      title: 'Gemini Function Calling',
      step: 'Step 5',
      description: 'Dynamic schema tools & API execution',
      icon: Wrench,
      status: 'Active',
    },
    {
      title: 'Local System Control',
      step: 'Step 6',
      description: 'Safe native OS & hardware control agent',
      icon: MonitorCheck,
      status: 'Active',
    },
    {
      title: 'Browser Automation',
      step: 'Step 7',
      description: 'Headless browser automation & navigation',
      icon: Globe,
      status: 'Next',
    },

    {
      title: 'Document Generation',
      step: 'Step 8',
      description: 'PDF, Markdown & Report file generation',
      icon: FileText,
      status: 'Planned',
    },
  ];

  // 7-Stage Pipeline definition
  const pipelineSteps = [
    { id: 'wake_word', label: 'Wake Word', sub: 'Hey Saru' },
    { id: 'speech_recognition', label: 'Speech Recognition', sub: 'STT' },
    { id: 'gemini', label: 'Gemini', sub: 'Reasoning' },
    { id: 'tool_selection', label: 'Tool Selection', sub: 'Function Call' },
    { id: 'tool_execution', label: 'Tool Execution', sub: 'Safe Sandbox' },
    { id: 'gemini_response', label: 'Gemini Response', sub: 'Final Answer' },
    { id: 'tts', label: 'Text-to-Speech', sub: 'Voice' },
  ];

  // Helper to determine status icon and style for each pipeline stage
  const getPipelineStepState = (stepId: string) => {
    const order = [
      'wake_word',
      'speech_recognition',
      'gemini',
      'tool_selection',
      'tool_execution',
      'gemini_response',
      'tts',
    ];
    const activeIdx = order.indexOf(pipelineStage);
    const stepIdx = order.indexOf(stepId);

    if (pipelineStage === 'idle') {
      return { status: 'idle', icon: '○', color: 'text-slate-500' };
    }

    if (stepIdx < activeIdx) {
      return { status: 'completed', icon: '✓', color: 'text-emerald-400' };
    }
    if (stepIdx === activeIdx) {
      return { status: 'active', icon: '●', color: 'text-cyan-300 font-bold' };
    }
    return { status: 'upcoming', icon: '○', color: 'text-slate-600' };
  };

  return (
    <aside
      className={`w-72 lg:w-80 shrink-0 border-l border-slate-800/80 bg-[#0A0D15]/90 backdrop-blur-md flex flex-col h-full overflow-y-auto scrollbar-thin transition-all duration-300 ${
        isOpen ? 'block' : 'hidden'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-semibold tracking-wider text-slate-200 uppercase font-mono">
            AI Status
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline
                ? 'bg-emerald-400 animate-pulse'
                : isMissingKey
                ? 'bg-amber-400 animate-ping'
                : 'bg-red-400'
            }`}
          />
          <span className="text-[11px] font-mono text-slate-400">
            {isOnline ? 'Active' : isMissingKey ? 'Config Required' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Metric Cards Grid */}
        <div className="space-y-2.5">
          {/* AI ENGINE */}
          <div className="p-3 rounded-xl glass-panel-subtle border border-slate-800/60">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                AI ENGINE
              </span>
              <span className="text-cyan-300 text-[10px]">Gemini 3.8</span>
            </div>
            <div className="text-sm font-semibold text-slate-100 flex items-center justify-between">
              <span>Gemini</span>
              <span className="text-[11px] font-mono text-slate-400">flash</span>
            </div>
          </div>

          {/* STATUS */}
          <div className="p-3 rounded-xl glass-panel-subtle border border-slate-800/60">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                STATUS
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">200 OK</span>
            </div>
            <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  isOnline ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span>{isOnline ? 'Online' : isMissingKey ? 'Key Not Set' : 'Standby'}</span>
            </div>
          </div>

          {/* MODE */}
          <div className="p-3 rounded-xl glass-panel-subtle border border-slate-800/60">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-violet-400" />
                MODE
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Step 6 Active</span>
            </div>
            <div className="text-sm font-semibold text-slate-100">Local System Control</div>
          </div>

          {/* MEMORY */}
          <div className="p-3 rounded-xl glass-panel-subtle border border-slate-800/60">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                MEMORY
              </span>
              <span className="text-[10px] text-blue-300 font-mono tabular-nums">
                {messageCount} msg
              </span>
            </div>
            <div className="text-sm font-semibold text-slate-100">Session</div>
          </div>
        </div>

        {/* STEP 6: SYSTEM CONTROL SECTION */}
        <SystemControlSection />

        {/* TOOL ACTIVITY SECTION */}
        <ToolActivitySection
          activities={toolActivities}
          onClearActivities={onClearToolActivities}
        />


        {/* STEP 4: VOICE STATUS SECTION */}
        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-200 tracking-wider uppercase font-mono flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              VOICE STATUS
            </h3>
            {onToggleHandsFree && (
              <button
                type="button"
                onClick={onToggleHandsFree}
                className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                  isHandsFreeEnabled
                    ? 'bg-emerald-950/50 text-emerald-300 border-emerald-600/60'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {isHandsFreeEnabled ? 'Hands-Free ON' : 'Hands-Free OFF'}
              </button>
            )}
          </div>

          {/* Wake Word State Display */}
          <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Wake Word:</span>
              <span className="font-mono text-cyan-300 font-semibold">"Hey Saru"</span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
              <span className="text-slate-400">Status:</span>
              <span className="flex items-center gap-1.5 font-medium">
                {voiceState === 'WAKE_DETECTED' ? (
                  <span className="text-amber-300 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    Hey Saru detected!
                  </span>
                ) : voiceState === 'LISTENING' ? (
                  <span className="text-cyan-300 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Listening...
                  </span>
                ) : voiceState === 'THINKING' ? (
                  <span className="text-violet-300 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" />
                    Thinking...
                  </span>
                ) : voiceState === 'SPEAKING' ? (
                  <span className="text-emerald-300 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Speaking...
                  </span>
                ) : voiceState === 'WAKE_MONITORING' ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Monitoring
                  </span>
                ) : (
                  <span className="text-slate-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-600" />
                    Disabled
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="text-[10px] text-slate-500 leading-tight">
            Hands-Free Mode uses your microphone while enabled. Local browser processing only.
          </div>
        </div>

        {/* STEP 5: UPDATED VOICE PIPELINE VISUALIZATION (7 STAGES) */}
        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-200 tracking-wider uppercase font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              VOICE PIPELINE
            </h3>
            <span className="text-[10px] font-mono text-cyan-400">
              {pipelineStage.toUpperCase()}
            </span>
          </div>

          {/* Step Pipeline Flow */}
          <div className="space-y-1 font-mono text-xs">
            {pipelineSteps.map((step) => {
              const info = getPipelineStepState(step.id);
              const isCurrent = info.status === 'active';
              return (
                <div
                  key={step.id}
                  className={`p-1.5 px-2 rounded-lg flex items-center justify-between border transition-all ${
                    isCurrent
                      ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.25)] text-cyan-200'
                      : info.status === 'completed'
                      ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300'
                      : 'bg-slate-950/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 text-center ${info.color}`}>
                      {info.icon}
                    </span>
                    <span className={isCurrent ? 'font-semibold text-white' : ''}>
                      {step.label}
                    </span>
                  </div>
                  <span className="text-[10px] opacity-75">{step.sub}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ROADMAP SECTION */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-slate-300 tracking-wider uppercase font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Coming Next
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Roadmap</span>
          </div>

          <div className="space-y-2">
            {comingNextSteps.map((stepItem, idx) => {
              const Icon = stepItem.icon;
              const isActive = stepItem.status === 'Active';
              const isNext = stepItem.status === 'Next';
              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border transition-all ${
                    isActive
                      ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                      : isNext
                      ? 'bg-cyan-950/20 border-cyan-800/50 shadow-sm'
                      : 'bg-slate-900/40 border-slate-800/60 opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1 rounded ${
                          isActive
                            ? 'bg-emerald-900/50 text-emerald-300'
                            : isNext
                            ? 'bg-cyan-900/50 text-cyan-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-medium text-slate-200">
                        {stepItem.title}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-500/30'
                          : isNext
                          ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isActive ? `${stepItem.step} Active` : stepItem.step}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1 pl-6 leading-tight">
                    {stepItem.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};
