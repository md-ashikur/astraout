import React from 'react';
import { ShieldCheck, ShieldAlert, Radio, Layers } from 'lucide-react';
import { OutpostResources } from '../../engine/simulation-types';

interface RadiationShieldGaugeProps {
  resources: OutpostResources;
}

export const RadiationShieldGauge: React.FC<RadiationShieldGaugeProps> = ({ resources }) => {
  // Attenuation: 100 * (1 - internal / ambient)
  const attenuationPct =
    resources.ambientRadiation > 0
      ? Math.min(99, Math.max(0, Math.round((1 - resources.internalRadiation / resources.ambientRadiation) * 100)))
      : 80;

  const isHighRadiation = resources.internalRadiation > 0.05;
  const isExtremeAmbient = resources.ambientRadiation > 0.5;

  return (
    <div className="bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 rounded-xl p-3.5 backdrop-blur-md shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-950/80 border border-purple-500/30 text-purple-400">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              Radiation Shielding
            </h3>
            <div className="text-[10px] text-slate-400 font-mono">
              Regolith Sintering & SPE Core
            </div>
          </div>
        </div>

        <div>
          {resources.stormShelterActive ? (
            <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-400/50 px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.4)]">
              <ShieldCheck className="w-3 h-3 text-cyan-400" />
              SHELTER ACTIVE
            </span>
          ) : isHighRadiation ? (
            <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-rose-400 bg-rose-950/60 border border-rose-500/40 px-2 py-0.5 rounded-full animate-pulse">
              <ShieldAlert className="w-3 h-3" />
              HIGH DOSE
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3" />
              PROTECTED
            </span>
          )}
        </div>
      </div>

      {/* Regolith Shielding Bar */}
      <div className="space-y-1.5 mb-3">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            Regolith Layer Depth
          </span>
          <span className="font-bold text-purple-300">
            {resources.shieldingThicknessCm} cm ({attenuationPct}% Deflection)
          </span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full rounded-full bg-linear-to-r from-purple-600 to-indigo-400 shadow-[0_0_8px_rgba(168,85,247,0.5)] transition-all duration-500"
            style={{ width: `${Math.min(100, (resources.shieldingThicknessCm / 50) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          <span>Target: 50 cm sintered rock</span>
          <span>Stored Regolith: {resources.regolithStored} t</span>
        </div>
      </div>

      {/* Radiation Flux Readings */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 font-mono text-center">
        <div className="bg-slate-950/60 rounded-lg p-1.5 border border-slate-800">
          <div className="text-[10px] text-slate-400">Ambient Surface Flux</div>
          <div
            className={`text-xs font-bold ${isExtremeAmbient ? 'text-rose-400 animate-pulse' : 'text-slate-300'
              }`}
          >
            {resources.ambientRadiation} mSv/h
          </div>
          <div className="text-[9px] text-slate-500">External Cosmic/Solar</div>
        </div>

        <div className="bg-slate-950/60 rounded-lg p-1.5 border border-slate-800">
          <div className="text-[10px] text-slate-400">Habitat Internal Dose</div>
          <div
            className={`text-xs font-bold ${isHighRadiation ? 'text-amber-400' : 'text-emerald-400'
              }`}
          >
            {resources.internalRadiation} mSv/h
          </div>
          <div className="text-[9px] text-slate-500">After Shielding</div>
        </div>
      </div>
    </div>
  );
};
