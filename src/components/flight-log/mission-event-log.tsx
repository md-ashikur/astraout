import React, { useState } from 'react';
import { Terminal, AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { MissionLogEntry } from '../../engine/simulation-types';

interface MissionEventLogProps {
  logs: MissionLogEntry[];
}

export const MissionEventLog: React.FC<MissionEventLogProps> = ({ logs }) => {
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'success'>('all');

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    return log.type === filter;
  });

  return (
    <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md font-mono">
      {/* Header & Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-cyan-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Telemetry & Flight Operations Log
            </h3>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 text-[10px]">
          {(['all', 'critical', 'warning', 'success'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-0.5 rounded capitalize transition-all ${
                filter === f
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Log Feed */}
      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs select-text">
        {filteredLogs.length === 0 ? (
          <div className="text-slate-500 text-center py-4 text-xs italic">
            No telemetry entries matching filter.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isCritical = log.type === 'critical';
            const isWarning = log.type === 'warning';
            const isSuccess = log.type === 'success';

            return (
              <div
                key={log.id}
                className={`flex items-start gap-2 p-1.5 rounded-lg transition-colors ${
                  isCritical
                    ? 'bg-red-950/50 text-red-200 border border-red-500/30'
                    : isWarning
                    ? 'bg-amber-950/40 text-amber-200 border border-amber-500/20'
                    : isSuccess
                    ? 'bg-emerald-950/40 text-emerald-200 border border-emerald-500/20'
                    : 'bg-slate-900/40 text-slate-300 hover:bg-slate-900/70'
                }`}
              >
                <span className="shrink-0 mt-0.5">
                  {isCritical && <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
                  {isWarning && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                  {isSuccess && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                  {!isCritical && !isWarning && !isSuccess && (
                    <Info className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                </span>

                <span className="text-[10px] text-slate-500 shrink-0">
                  {log.timeString}
                </span>

                <span className="leading-tight text-[11px] font-sans">
                  {log.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
