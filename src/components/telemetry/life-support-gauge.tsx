import React from 'react';
import { Wind, Activity, Thermometer, AlertCircle, CheckCircle2 } from 'lucide-react';
import { OutpostResources } from '../../engine/simulation-types';

interface LifeSupportGaugeProps {
  resources: OutpostResources;
  eclssOperational: boolean;
}

export const LifeSupportGauge: React.FC<LifeSupportGaugeProps> = ({
  resources,
  eclssOperational,
}) => {
  const o2Percent = Math.min(100, Math.round((resources.o2Reserve / resources.o2Capacity) * 100));
  const isO2Low = resources.o2PartialPressure < 19.0;
  const isCO2High = resources.co2Level > 2000;
  const isCO2Critical = resources.co2Level > 3000;

  return (
    <div className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-3.5 backdrop-blur-md shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              Life Support (ECLSS)
            </h3>
            <div className="text-[10px] text-slate-400 font-mono">
              O₂ / CO₂ Atmosphere Loop
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {eclssOperational ? (
            <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              ONLINE
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded-full animate-pulse">
              <AlertCircle className="w-3 h-3" />
              OFFLINE
            </span>
          )}
        </div>
      </div>

      {/* Main O2 Bar */}
      <div className="space-y-1.5 mb-3">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-slate-400">Oxygen Partial Press.</span>
          <span className={`font-bold ${isO2Low ? 'text-rose-400 animate-pulse' : 'text-cyan-300'}`}>
            {resources.o2PartialPressure} kPa (Target: 21.0)
          </span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isO2Low ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]'
            }`}
            style={{ width: `${(resources.o2PartialPressure / 21.0) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          <span>O₂ Reserve: {resources.o2Reserve} kg</span>
          <span>Cap: {resources.o2Capacity} kg</span>
        </div>
      </div>

      {/* Secondary Metrics: CO2, Pressure, Temp */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 font-mono text-center">
        {/* CO2 ppm */}
        <div className="bg-slate-950/60 rounded-lg p-1.5 border border-slate-800">
          <div className="text-[10px] text-slate-400">CO₂ Level</div>
          <div
            className={`text-xs font-bold ${
              isCO2Critical
                ? 'text-rose-400 animate-pulse'
                : isCO2High
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {resources.co2Level} ppm
          </div>
          <div className="text-[9px] text-slate-500">&lt;1000 safe</div>
        </div>

        {/* Cabin Pressure */}
        <div className="bg-slate-950/60 rounded-lg p-1.5 border border-slate-800">
          <div className="text-[10px] text-slate-400">Cabin Press.</div>
          <div className="text-xs font-bold text-slate-200">
            {resources.cabinPressure} kPa
          </div>
          <div className="text-[9px] text-slate-500">Nominal 101.3</div>
        </div>

        {/* Internal Temp */}
        <div className="bg-slate-950/60 rounded-lg p-1.5 border border-slate-800">
          <div className="text-[10px] text-slate-400">Habitat Temp</div>
          <div className="text-xs font-bold text-cyan-300">
            {resources.internalTemp}°C
          </div>
          <div className="text-[9px] text-slate-500">Nominal 21.5</div>
        </div>
      </div>
    </div>
  );
};
