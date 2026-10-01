import React from 'react';
import {
  Clock,
  Calendar,
  Calculator,
  Globe,
  Search,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Loader2,
  AppWindow,
  Cpu,
  BatteryCharging,
  Volume2,
  Volume1,
  VolumeX,
} from 'lucide-react';
import { MessageToolCall } from '../types/chat';

interface ToolCallBadgeProps {
  toolCall: MessageToolCall;
}

export const ToolCallBadge: React.FC<ToolCallBadgeProps> = ({ toolCall }) => {
  const getToolIcon = () => {
    switch (toolCall.toolName) {
      case 'calculator':
        return <Calculator className="w-3.5 h-3.5 text-cyan-400" />;
      case 'get_current_time':
        return <Clock className="w-3.5 h-3.5 text-blue-400" />;
      case 'get_current_date':
        return <Calendar className="w-3.5 h-3.5 text-violet-400" />;
      case 'open_website':
      case 'open_url':
        return <Globe className="w-3.5 h-3.5 text-amber-400" />;
      case 'web_search':
        return <Search className="w-3.5 h-3.5 text-emerald-400" />;
      case 'open_application':
        return <AppWindow className="w-3.5 h-3.5 text-emerald-400" />;
      case 'get_system_information':
        return <Cpu className="w-3.5 h-3.5 text-blue-400" />;
      case 'get_battery_status':
        return <BatteryCharging className="w-3.5 h-3.5 text-green-400" />;
      case 'get_volume':
      case 'set_volume':
        return <Volume2 className="w-3.5 h-3.5 text-cyan-400" />;
      case 'mute_volume':
        return <VolumeX className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Wrench className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  const isExecuting = toolCall.status === 'executing';
  const isCompleted = toolCall.status === 'completed';
  const isWaiting = toolCall.status === 'waiting_approval';
  const isFailed = toolCall.status === 'failed' || toolCall.status === 'cancelled';

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all my-1.5 select-none ${
        isExecuting
          ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.25)] animate-pulse'
          : isWaiting
          ? 'bg-amber-950/40 border-amber-500/50 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.2)] animate-pulse'
          : isCompleted
          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
          : 'bg-red-950/30 border-red-500/40 text-red-300'
      }`}
    >
      <div className="flex items-center gap-1.5">
        {getToolIcon()}
        {isExecuting ? (
          <span className="font-medium text-slate-300">
            SaruX is using: <strong className="text-cyan-300 font-semibold">{toolCall.displayName}</strong>
          </span>
        ) : isWaiting ? (
          <span className="font-medium text-amber-300">
            Waiting for approval: <strong className="font-semibold">{toolCall.displayName}</strong>
          </span>
        ) : isCompleted ? (
          <span className="font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
            <span>
              {toolCall.displayName} completed
              {toolCall.formattedResult ? (
                <span className="text-slate-400 font-normal ml-1">({toolCall.formattedResult})</span>
              ) : null}
            </span>
          </span>
        ) : (
          <span className="font-medium flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 inline" />
            <span>
              {toolCall.displayName} {toolCall.status === 'cancelled' ? 'cancelled' : 'failed'}
            </span>
          </span>
        )}
      </div>

      {(isExecuting || isWaiting) && <Loader2 className="w-3 h-3 text-cyan-400 animate-spin ml-1" />}
    </div>
  );
};
