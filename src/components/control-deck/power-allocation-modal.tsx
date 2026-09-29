import React from 'react';
import { Zap, Power, AlertTriangle, ShieldCheck, Sun } from 'lucide-react';
import { OutpostModule, OutpostResources } from '../../engine/simulation-types';
import { soundFx } from '../../audio/sound-synthesizer';

interface PowerAllocationModalProps {
  isOpen: boolean;
  modules: OutpostModule[];
  resources: OutpostResources;
  onToggleActive: (id: string) => void;
  onClose: () => void;
}

export const PowerAllocationModal: React.FC<PowerAllocationModalProps> = ({
  isOpen,
  modules,
  resources,
  onToggleActive,
  onClose,
}) => {
  if (!isOpen) return null;

  const netPower = Math.round((resources.powerGeneration - resources.powerDemand) * 10) / 10;
  const isDeficit = netPower < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-2xl w-full p-6 shadow-2xl text-slate-100 font-mono max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-950 border border-amber-500/40 text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Microgrid Power Distribution Switchboard</h3>
              <p className="text-xs text-slate-400 font-sans">
                Manage load-shedding to prevent total outpost blackout during darkness or dust storms.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs"
          >
            ✕ Close
          </button>
        </div>

        {/* Real-time Grid Status Banner */}
        <div
          className={`p-3.5 rounded-xl border mb-4 flex items-center justify-between text-xs ${
            isDeficit
              ? 'bg-amber-950/60 border-amber-500/50 text-amber-200'
              : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
          }`}
        >
          <div>
            <div className="font-bold flex items-center gap-1.5">
              {isDeficit ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>GRID DEFICIT: Drawing from battery reserves</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>GRID SURPLUS: Batteries charging</span>
                </>
              )}
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5">
              Generation: <span className="font-bold">{resources.powerGeneration} kW</span> | Total Load:{' '}
              <span className="font-bold">{resources.powerDemand} kW</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm font-bold">
              {isDeficit ? `${netPower} kW` : `+${netPower} kW`}
            </div>
            <div className="text-[10px] text-slate-400">
              Battery: {resources.batteryStored} / {resources.batteryCapacity} kWh
            </div>
          </div>
        </div>

        {/* Modules Power Toggle List */}
        <div className="space-y-2">
          {modules.map((mod) => {
            const isGenerator = mod.powerConsumption < 0;
            const absKw = Math.abs(mod.powerConsumption);
            const isCritical = mod.category === 'life-support' || mod.category === 'habitat';

            return (
              <div
                key={mod.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-1.5 rounded-lg border ${
                      isGenerator
                        ? 'bg-amber-950/80 border-amber-500/40 text-amber-400'
                        : isCritical
                        ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-400'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    {isGenerator ? (
                      <Sun className="w-4 h-4" />
                    ) : (
                      <Power className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{mod.name}</span>
                      {isCritical && (
                        <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                          Critical Life Support
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Category: {mod.category} | Health: {Math.round(mod.health)}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`font-bold ${
                      isGenerator ? 'text-emerald-400' : 'text-amber-300'
                    }`}
                  >
                    {isGenerator ? `+${absKw} kW` : `${absKw} kW`}
                  </span>

                  <button
                    onClick={() => {
                      soundFx.playClick();
                      onToggleActive(mod.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                      mod.isActive
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    {mod.isActive ? 'ONLINE' : 'SHED LOAD'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
