import React from 'react';
import {
  Wrench,
  Calculator,
  Clock,
  Calendar,
  Globe,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Loader2,
  Trash2,
  AppWindow,
  Cpu,
  BatteryCharging,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ToolActivityItem } from '../hooks/useTools';

interface ToolActivitySectionProps {
  activities: ToolActivityItem[];
  onClearActivities?: () => void;
}

export const ToolActivitySection: React.FC<ToolActivitySectionProps> = ({
  activities,
  onClearActivities,
}) => {
  const getToolIcon = (toolName: string) => {
    switch (toolName) {
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

  return (
    <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-200 tracking-wider uppercase font-mono flex items-center gap-1.5">
          <Wrench className="w-3.5 h-3.5 text-cyan-400" />
          TOOL ACTIVITY
        </h3>

        {activities.length > 0 && onClearActivities && (
          <button
            type="button"
            onClick={onClearActivities}
            className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors p-1 rounded hover:bg-slate-800 cursor-pointer"
            title="Clear tool activity log"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {activities.length === 0 ? (
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/60 text-center text-xs text-slate-500 font-mono">
          No tool calls executed yet. Try: "Open Chrome", "What are my system specs?", or "Calculate 25 * 18".
        </div>
      ) : (
        <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin">
          {activities.map((item) => {
            const isCompleted = item.status === 'completed';
            const isWaiting = item.status === 'waiting_approval';
            const isExecuting = item.status === 'executing';
            const isFailed = item.status === 'failed' || item.status === 'cancelled';

            return (
              <div
                key={item.id}
                className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-1 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-medium text-slate-200">
                    {getToolIcon(item.toolName)}
                    <span>{item.displayName}</span>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] font-mono">
                    {isExecuting ? (
                      <span className="text-cyan-400 flex items-center gap-1">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        Executing
                      </span>
                    ) : isWaiting ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        <Clock3 className="w-2.5 h-2.5 animate-pulse" />
                        Approval needed
                      </span>
                    ) : isCompleted ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Completed
                      </span>
                    ) : (
                      <span className="text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-2.5 h-2.5" />
                        {item.status === 'cancelled' ? 'Cancelled' : 'Failed'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Safe Argument String */}
                <div className="text-[11px] font-mono text-cyan-300/90 truncate">
                  "{item.formattedCall}"
                </div>

                {/* Result or Timestamp */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 border-t border-slate-900">
                  <span className="truncate max-w-[160px] text-slate-300">
                    {item.formattedResult || 'Processing...'}
                  </span>
                  <span className="font-mono text-slate-500 shrink-0 ml-1">{item.timestamp}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
