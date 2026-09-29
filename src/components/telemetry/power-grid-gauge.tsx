import React from 'react';
import { Zap, BatteryCharging, BatteryWarning, Battery, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { OutpostResources } from '../../engine/simulation-types';

interface PowerGridGaugeProps {
  resources: OutpostResources;
}

export const PowerGridGauge: React.FC<PowerGridGaugeProps> = ({ resources }) => {
  const netKw = Math.round((resources.powerGeneration - resources.powerDemand) * 10) / 10;
  const isSurplus = netKw >= 0;
  const batteryPct = Math.min(
    100,
    Math.max(0, Math.round((resources.batteryStored / resources.batteryCapacity) * 100))
  );
  const isLowBattery = batteryPct < 25;
  const isCriticalBattery = batteryPct < 10;

  return (
    <div className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 rounded-xl p-3.5 backdrop-blur-md shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-950/80 border border-amber-500/30 text-amber-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              Power Grid (Microgrid)
            </h3>
            <div className="text-[10px] text-slate-400 font-mono">
              Solar + Fission vs Base Load
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isSurplus ? (
            <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              +{netKw} kW
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
              <ArrowDownRight className="w-3 h-3" />
              {netKw} kW
            </span>
          )}
        </div>
      </div>

      {/* Battery Gauge Bar */}
      <div className="space-y-1.5 mb-3">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1">
            {isSurplus ? (
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
            ) : isLowBattery ? (
              <BatteryWarning className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            ) : (
              <Battery className="w-3.5 h-3.5 text-amber-400" />
            )}
            Energy Storage
          </span>
          <span
            className={`font-bold ${
              isCriticalBattery
                ? 'text-rose-400 animate-pulse'
                : isLowBattery
                ? 'text-amber-400'
                : 'text-amber-300'
            }`}
          >
            {batteryPct}% ({resources.batteryStored} kWh)
          </span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCriticalBattery
                ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]'
                : isLowBattery
                ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
            }`}
            style={{ width: `${batteryPct}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          <span>{isSurplus ? 'Charging battery bank' : 'Discharging into grid'}</span>
          <span>Max: {resources.batteryCapacity} kWh</span>
        </div>
      </div>

      {/* Power Breakdown */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 font-mono text-center">
        <div className="bg-slate-950/60 rounded-lg p-1.5 border border-slate-800">
          <div className="text-[10px] text-slate-400">Total Generation</div>
          <div className="text-xs font-bold text-amber-300">
            {resources.powerGeneration} kW
          </div>
          <div className="text-[9px] text-slate-500">Solar + Nuclear</div>
        </div>

        <div className="bg-slate-950/60 rounded-lg p-1.5 border border-slate-800">
          <div className="text-[10px] text-slate-400">Total Demand</div>
          <div className="text-xs font-bold text-slate-200">
            {resources.powerDemand} kW
          </div>
          <div className="text-[9px] text-slate-500">Active Subsystems</div>
        </div>
      </div>
    </div>
  );
};
