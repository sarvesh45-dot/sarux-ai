import React from 'react';
import { AIOrb } from './AIOrb';
import { Sparkles, Terminal, BookOpen, Code2, Radio } from 'lucide-react';
import { VoiceState } from '../types/chat';

interface EmptyStateProps {
  onSelectPrompt: (promptText: string) => void;
  isThinking?: boolean;
  isSpeaking?: boolean;
  voiceState?: VoiceState;
  wakeWordDetected?: boolean;
}

const EXAMPLE_PROMPTS = [
  {
    title: 'Explain RAG in simple terms',
    subtitle: 'Learn Retrieval-Augmented Generation with real-world examples',
    icon: Sparkles,
    prompt: 'Explain Retrieval-Augmented Generation (RAG) in simple terms with a clear analogy and how it combines search with LLMs.',
  },
  {
    title: 'Help me build a Python project',
    subtitle: 'Architecture outline for an AI automation agent',
    icon: Terminal,
    prompt: 'Help me design and structure a clean Python project for an AI assistant backend with modular tool calling and logging.',
  },
  {
    title: 'Create a study plan',
    subtitle: 'Master modern Generative AI & Deep Learning',
    icon: BookOpen,
    prompt: 'Create a comprehensive 4-week study plan to master Modern Generative AI, LLM architectures, and prompt engineering.',
  },
  {
    title: 'Explain this code',
    subtitle: 'Break down complex algorithms and patterns',
    icon: Code2,
    prompt: 'Can you explain how async Server-Sent Events (SSE) streaming works between a Node.js Express server and a React client?',
  },
];

export const EmptyState: React.FC<EmptyStateProps> = ({
  onSelectPrompt,
  isThinking = false,
  isSpeaking = false,
  voiceState = 'WAKE_DISABLED',
  wakeWordDetected = false,
}) => {
  const isWakeListening = voiceState === 'WAKE_MONITORING';

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-4xl mx-auto w-full select-none">
      {/* Orb Hero */}
      <div className="mb-6 sm:mb-8 transition-transform duration-500 hover:scale-105">
        <AIOrb
          size="lg"
          isThinking={isThinking}
          isSpeaking={isSpeaking}
          isWakeListening={isWakeListening}
          wakeWordDetected={wakeWordDetected}
        />
      </div>

      {/* Typography */}
      <div className="text-center max-w-xl mb-8 space-y-2">
        {wakeWordDetected ? (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/60 text-amber-200 text-xs font-semibold tracking-wide animate-bounce">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            "Hey Saru" Detected · I'm listening...
          </div>
        ) : isWakeListening ? (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 text-xs font-medium tracking-wide">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            Hands-Free Active · Say "Hey Saru"
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 text-xs font-medium tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            Neural Core Active · Gemini 3.8 Flash
          </div>
        )}

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-['Syne']">
          Hello, I'm{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
            SaruX
          </span>
        </h1>

        <p className="text-sm sm:text-base font-medium text-slate-300">
          Your personal AI assistant
        </p>

        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed pt-1">
          Ask questions, explain concepts, write code, analyze ideas, or activate voice mode to talk hands-free.
        </p>
      </div>

      {/* 4 Interactive Starter Prompt Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
        {EXAMPLE_PROMPTS.map((card, idx) => {
          const Icon = card.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectPrompt(card.prompt)}
              className="group p-3.5 sm:p-4 rounded-xl glass-panel text-left hover:border-cyan-500/50 hover:bg-slate-900/60 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-cyan-500/10 active:scale-[0.98]"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-800/80 text-cyan-400 group-hover:bg-cyan-500/20 group-hover:text-cyan-300 transition-colors shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-white truncate">
                    {card.title}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-1 mt-0.5">
                    {card.subtitle}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
