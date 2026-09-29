import React from 'react';
import { Power, Wrench, ArrowUpCircle, Info, Zap, Shield, HeartPulse } from 'lucide-react';
import { OutpostModule } from '../../engine/simulation-types';
import { soundFx } from '../../audio/sound-synthesizer';

interface ModuleNodeCardProps {
  module: OutpostModule | null;
  storedRegolith: number;
  onToggleActive: (id: string) => void;
  onRepair: (id: string) => void;
  onUpgrade: (id: string) => void;
  onClose: () => void;
}

export const ModuleNodeCard: React.FC<ModuleNodeCardProps> = ({
  module,
  storedRegolith,
  onToggleActive,
  onRepair,
  onUpgrade,
  onClose,
}) => {
  if (!module) return null;

  const isGenerator = module.powerConsumption < 0;
  const absPower = Math.abs(module.powerConsumption);
  const canAffordUpgrade =
    storedRegolith >= module.buildCost.regolith && module.level < module.maxLevel;

  return (
    <div className="bg-slate-900/95 border border-cyan-500/40 rounded-xl p-4 shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl max-w-sm w-full font-mono text-slate-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5 mb-3">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 uppercase tracking-wider font-bold">
            <span>{module.category}</span>
            <span>•</span>
            <span>Tier {module.level}/{module.maxLevel}</span>
          </div>
          <h4 className="text-sm font-bold text-white mt-0.5">{module.name}</h4>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700"
        >
          ✕
        </button>
      </div>

      {/* Description & NASA Tech Fact */}
      <p className="text-xs text-slate-300 font-sans mb-2.5">
        {module.description}
      </p>

      <div className="bg-cyan-950/40 border border-cyan-500/20 rounded-lg p-2.5 mb-3 text-[11px] text-cyan-200 flex items-start gap-2">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-cyan-300 block">NASA Engineering Fact:</span>
          <span className="text-slate-300 font-sans">{module.techFact}</span>
        </div>
      </div>

      {/* Metrics: Power draw & Health */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            {isGenerator ? 'Power Output' : 'Power Draw'}
          </div>
          <div className={`font-bold text-sm ${isGenerator ? 'text-emerald-400' : 'text-amber-300'}`}>
            {isGenerator ? `+${absPower} kW` : `${absPower} kW`}
          </div>
        </div>

        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <HeartPulse className="w-3 h-3 text-rose-400" />
            Integrity
          </div>
          <div className={`font-bold text-sm ${module.health > 70 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {Math.round(module.health)}%
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
        {/* Toggle Power */}
        <button
          onClick={() => {
            soundFx.playClick();
            onToggleActive(module.id);
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            module.isActive
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          {module.isActive ? 'Active' : 'Standby'}
        </button>

        {/* Repair */}
        {module.health < 100 && (
          <button
            onClick={() => {
              soundFx.playClick();
              onRepair(module.id);
            }}
            className="flex-1 py-1.5 px-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
          >
            <Wrench className="w-3.5 h-3.5" />
            Repair EVA
          </button>
        )}

        {/* Upgrade */}
        {module.level < module.maxLevel && (
          <button
            disabled={!canAffordUpgrade}
            onClick={() => {
              soundFx.playSuccess();
              onUpgrade(module.id);
            }}
            title={
              canAffordUpgrade
                ? `Upgrade module to Tier ${module.level + 1}`
                : `Requires ${module.buildCost.regolith}t regolith`
            }
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              canAffordUpgrade
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <ArrowUpCircle className="w-3.5 h-3.5" />
            Upgrade ({module.buildCost.regolith}t)
          </button>
        )}
      </div>
    </div>
  );
};
