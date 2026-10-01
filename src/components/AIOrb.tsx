import React from 'react';

interface AIOrbProps {
  size?: 'sm' | 'md' | 'lg';
  isThinking?: boolean;
  isSpeaking?: boolean;
  isWakeListening?: boolean;
  wakeWordDetected?: boolean;
  className?: string;
}

export const AIOrb: React.FC<AIOrbProps> = ({
  size = 'lg',
  isThinking = false,
  isSpeaking = false,
  isWakeListening = false,
  wakeWordDetected = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-24 h-24',
    lg: 'w-44 h-44 sm:w-52 sm:h-52',
  }[size];

  return (
    <div className={`relative flex items-center justify-center select-none ${sizeClasses} ${className}`}>
      {/* Outer ambient glow */}
      <div
        className={`absolute inset-0 rounded-full blur-2xl transition-all duration-700 pointer-events-none ${
          wakeWordDetected
            ? 'bg-gradient-to-tr from-amber-400/60 via-cyan-400/70 to-emerald-400/60 scale-130 animate-pulse'
            : isThinking
            ? 'bg-gradient-to-tr from-cyan-500/40 via-violet-500/50 to-blue-500/40 scale-125 animate-pulse'
            : isSpeaking
            ? 'bg-gradient-to-tr from-emerald-500/40 via-cyan-500/50 to-indigo-500/40 scale-120 animate-pulse'
            : isWakeListening
            ? 'bg-gradient-to-tr from-emerald-500/30 via-cyan-500/35 to-blue-500/25 scale-110 animate-pulse-slow'
            : 'bg-gradient-to-tr from-cyan-500/25 via-blue-500/20 to-purple-500/30'
        }`}
      />

      {/* Orbit Ring 1 - Outer Cyber Track */}
      <div
        className={`absolute inset-0 rounded-full border border-dashed transition-all duration-300 animate-spin-slow ${
          wakeWordDetected
            ? 'border-amber-400/80 scale-120 animate-spin'
            : isThinking || isSpeaking
            ? 'border-cyan-400/50 scale-110'
            : isWakeListening
            ? 'border-emerald-400/40 scale-105'
            : 'border-cyan-500/20'
        }`}
      />

      {/* Orbit Ring 2 - Reverse Axis */}
      <div
        className={`absolute inset-2 sm:inset-3 rounded-full border transition-all duration-300 animate-spin-reverse-slow ${
          wakeWordDetected
            ? 'border-cyan-300 scale-115'
            : isThinking
            ? 'border-violet-400/70 border-t-cyan-300'
            : isSpeaking
            ? 'border-emerald-400/70 border-t-cyan-300'
            : isWakeListening
            ? 'border-emerald-500/40 border-t-cyan-400/70'
            : 'border-violet-500/30 border-t-cyan-400/60'
        }`}
      />

      {/* Orbit Ring 3 - Tilted ring */}
      <div
        className={`absolute inset-5 rounded-full border transition-all duration-300 ${
          wakeWordDetected ? 'border-amber-300/60 scale-110' : 'border-blue-400/20 animate-pulse-slow'
        }`}
        style={{ transform: 'rotateX(55deg) rotateY(20deg)' }}
      />

      {/* Inner Glowing Core */}
      <div
        className={`relative z-10 w-3/5 h-3/5 rounded-full transition-all duration-500 flex items-center justify-center overflow-hidden shadow-2xl ${
          wakeWordDetected
            ? 'bg-gradient-to-br from-amber-300 via-cyan-400 to-emerald-500 scale-115 shadow-cyan-400/70'
            : isThinking
            ? 'bg-gradient-to-br from-cyan-400 via-indigo-500 to-violet-600 scale-105 shadow-cyan-500/50'
            : isSpeaking
            ? 'bg-gradient-to-br from-emerald-400 via-cyan-500 to-indigo-600 scale-105 shadow-emerald-500/40'
            : isWakeListening
            ? 'bg-gradient-to-br from-emerald-500/80 via-cyan-600/80 to-blue-700/80 shadow-emerald-500/30'
            : 'bg-gradient-to-br from-cyan-500/90 via-blue-600/80 to-violet-700/90 shadow-cyan-500/30'
        }`}
      >
        {/* Core highlight reflection */}
        <div className="absolute top-1 left-2 w-1/2 h-1/3 bg-white/30 rounded-full blur-[2px] transform -rotate-12" />

        {/* Dynamic Wave Ribbons */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.4)_0,transparent_70%)] animate-pulse" />

        {/* Center SaruX emblem icon */}
        <div className="relative text-white font-bold tracking-tighter text-xs sm:text-sm drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
          {wakeWordDetected ? (
            <span className="font-mono text-white text-xs font-extrabold uppercase animate-pulse">
              HEY SARU
            </span>
          ) : isThinking ? (
            <div className="flex space-x-1 items-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : isSpeaking ? (
            <div className="flex space-x-1 items-center h-4">
              <span className="w-1 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-2.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              <span className="w-1 h-3.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
            </div>
          ) : isWakeListening ? (
            <div className="flex space-x-0.5 items-center">
              <span className="w-1 h-2 bg-emerald-200 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-3 bg-emerald-100 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
              <span className="w-1 h-2 bg-emerald-200 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
            </div>
          ) : (
            <span className="font-mono text-cyan-200 text-sm sm:text-base font-semibold">SX</span>
          )}
        </div>
      </div>
    </div>
  );
};
