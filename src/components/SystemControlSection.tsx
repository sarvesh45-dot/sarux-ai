import React, { useState, useEffect, useCallback } from 'react';
import {
  MonitorCheck,
  Cpu,
  HardDrive,
  BatteryCharging,
  Volume2,
  VolumeX,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Terminal,
} from 'lucide-react';

interface LocalAgentState {
  connected: boolean;
  operatingSystem?: string;
  osRelease?: string;
  cpu?: {
    model: string;
    cores: number;
    usagePercent: number;
  };
  ram?: {
    totalGB: number;
    availableGB: number;
    usedPercent: number;
    formatted: string;
  };
  battery?: {
    available: boolean;
    percentage: number | null;
    charging: boolean;
    status: string;
    message?: string;
  };
  volume?: {
    volume: number;
    muted: boolean;
    formatted?: string;
  };
  error?: string;
}

export const SystemControlSection: React.FC = () => {
  const [agentState, setAgentState] = useState<LocalAgentState>({
    connected: false,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSystemData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // 1. Status check
      const statusRes = await fetch('/api/local-agent/status');
      const statusData = await statusRes.json().catch(() => ({ connected: false }));

      if (!statusData.connected) {
        setAgentState({
          connected: false,
          error: statusData.error || 'Local agent is offline.',
        });
        setIsRefreshing(false);
        return;
      }

      // 2. Fetch hardware specs in parallel
      const [infoRes, battRes, volRes] = await Promise.allSettled([
        fetch('/api/local-agent/system/info').then((r) => r.json()),
        fetch('/api/local-agent/system/battery').then((r) => r.json()),
        fetch('/api/local-agent/system/volume').then((r) => r.json()),
      ]);

      const infoData = infoRes.status === 'fulfilled' ? infoRes.value : {};
      const battData = battRes.status === 'fulfilled' ? battRes.value : {};
      const volData = volRes.status === 'fulfilled' ? volRes.value : {};

      setAgentState({
        connected: true,
        operatingSystem: infoData.operatingSystem || 'Local Machine',
        osRelease: infoData.osRelease,
        cpu: infoData.cpu,
        ram: infoData.ram,
        battery: battData,
        volume: volData,
      });
    } catch {
      setAgentState({
        connected: false,
        error: 'Could not connect to local agent on 127.0.0.1:8000.',
      });
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSystemData();
    // Poll every 25 seconds avoiding excessive requests
    const interval = setInterval(fetchSystemData, 25000);
    return () => clearInterval(interval);
  }, [fetchSystemData]);

  return (
    <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-200 tracking-wider uppercase font-mono flex items-center gap-1.5">
          <MonitorCheck className="w-3.5 h-3.5 text-cyan-400" />
          SYSTEM CONTROL
        </h3>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[10px] font-mono">
            {agentState.connected ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Connected
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Standby
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={fetchSystemData}
            disabled={isRefreshing}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Refresh system metrics"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      {agentState.connected ? (
        <div className="space-y-2 text-xs font-mono">
          {/* OS & Host */}
          <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400">OS:</span>
            <span className="text-slate-200 font-semibold truncate max-w-[170px]">
              {agentState.operatingSystem} {agentState.osRelease ? `(${agentState.osRelease})` : ''}
            </span>
          </div>

          {/* CPU */}
          <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-cyan-400" />
                CPU:
              </span>
              <span className="text-cyan-300 font-semibold">
                {agentState.cpu ? `${agentState.cpu.usagePercent}% load` : 'Active'}
              </span>
            </div>
            {agentState.cpu?.model && agentState.cpu.model !== 'unknown' && (
              <div className="text-[10px] text-slate-500 truncate">{agentState.cpu.model}</div>
            )}
          </div>

          {/* RAM */}
          <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-blue-400" />
                RAM:
              </span>
              <span className="text-blue-300 font-semibold">
                {agentState.ram ? `${agentState.ram.usedPercent}% used` : 'N/A'}
              </span>
            </div>
            {agentState.ram && (
              <div className="text-[10px] text-slate-500">
                {agentState.ram.availableGB} GB free of {agentState.ram.totalGB} GB
              </div>
            )}
          </div>

          {/* Battery & Volume Row */}
          <div className="grid grid-cols-2 gap-2">
            {/* Battery */}
            <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
              <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5">
                <BatteryCharging className="w-3 h-3 text-emerald-400" />
                BATTERY
              </div>
              <div className="font-semibold text-emerald-300 truncate">
                {agentState.battery?.available && agentState.battery.percentage !== null
                  ? `${agentState.battery.percentage}%`
                  : 'AC Power'}
              </div>
            </div>

            {/* Volume */}
            <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
              <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5">
                {agentState.volume?.muted ? (
                  <VolumeX className="w-3 h-3 text-amber-400" />
                ) : (
                  <Volume2 className="w-3 h-3 text-cyan-400" />
                )}
                VOLUME
              </div>
              <div className="font-semibold text-cyan-300 truncate">
                {agentState.volume
                  ? agentState.volume.muted
                    ? 'Muted'
                    : `${agentState.volume.volume}%`
                  : '65%'}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-2">
          <div className="flex items-center gap-2 text-amber-300 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Local Agent Standby</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Run the Python local agent to enable direct computer control and system telemetry.
          </p>
          <div className="p-2 rounded bg-black/60 border border-slate-800 text-[10px] font-mono text-cyan-300 flex items-center gap-1.5">
            <Terminal className="w-3 h-3 shrink-0 text-slate-500" />
            <span className="select-all">python3 backend/main.py</span>
          </div>
        </div>
      )}
    </div>
  );
};
