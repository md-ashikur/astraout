import React from 'react';
import {
  Layers,
  Zap,
  Hammer,
  Users,
  ShieldAlert,
  ShieldCheck,
  CheckSquare,
} from 'lucide-react';
import { soundFx } from '../../audio/sound-synthesizer';

interface ActionDockProps {
  storedRegolith: number;
  stormShelterActive: boolean;
  onOpenBuildModal: () => void;
  onOpenPowerGridModal: () => void;
  onOpenCrewModal: () => void;
  onToggleStormShelter: () => void;
  onSinterShield: () => void;
  onOpenObjectivesModal: () => void;
}

export const ActionDock: React.FC<ActionDockProps> = ({
  storedRegolith,
  stormShelterActive,
  onOpenBuildModal,
  onOpenPowerGridModal,
  onOpenCrewModal,
  onToggleStormShelter,
  onSinterShield,
  onOpenObjectivesModal,
}) => {
  const canSinter = storedRegolith >= 5;

  return (
    <div className="w-full bg-slate-950/90 border border-cyan-500/30 rounded-2xl p-2.5 backdrop-blur-xl shadow-2xl flex flex-wrap items-center justify-between gap-2">
      {/* Primary Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Build / Add Modules */}
        <button
          onClick={() => {
            soundFx.playClick();
            onOpenBuildModal();
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all hover:scale-105 active:scale-95"
        >
          <Hammer className="w-4 h-4 text-cyan-200" />
          <span>Expand Outpost</span>
        </button>

        {/* Microgrid Power Priority */}
        <button
          onClick={() => {
            soundFx.playClick();
            onOpenPowerGridModal();
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 font-mono text-xs font-bold transition-all hover:scale-105 active:scale-95"
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Power Switchboard</span>
        </button>

        {/* Sinter 5cm Regolith Shielding */}
        <button
          disabled={!canSinter}
          onClick={() => {
            soundFx.playSuccess();
            onSinterShield();
          }}
          title={
            canSinter
              ? 'Sinter 5 cm of planetary rock shell over habitat modules (Costs 5t regolith)'
              : 'Requires 5t mined regolith to sinter'
          }
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all ${canSinter
              ? 'bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.3)] hover:scale-105 active:scale-95'
              : 'bg-slate-900/50 text-slate-500 border border-slate-800 cursor-not-allowed'
            }`}
        >
          <Layers className="w-4 h-4 text-purple-400" />
          <span>Sinter Shield (+5cm)</span>
          <span className="text-[10px] text-purple-300">({storedRegolith}t / 5t)</span>
        </button>

        {/* Crew Roster & Roles */}
        <button
          onClick={() => {
            soundFx.playClick();
            onOpenCrewModal();
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-mono text-xs font-bold transition-all hover:scale-105 active:scale-95"
        >
          <Users className="w-4 h-4 text-cyan-400" />
          <span>Crew Bios</span>
        </button>

        {/* Mission Objectives */}
        <button
          onClick={() => {
            soundFx.playClick();
            onOpenObjectivesModal();
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/40 font-mono text-xs font-bold transition-all hover:scale-105 active:scale-95"
        >
          <CheckSquare className="w-4 h-4 text-emerald-400" />
          <span>Objectives</span>
        </button>
      </div>

      {/* Emergency Storm Shelter Toggle Button */}
      <div>
        <button
          onClick={() => {
            if (stormShelterActive) {
              soundFx.playClick();
            } else {
              soundFx.playAlarm();
            }
            onToggleStormShelter();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all ${stormShelterActive
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-pulse'
              : 'bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
            }`}
        >
          {stormShelterActive ? (
            <>
              <ShieldCheck className="w-4 h-4 text-cyan-200" />
              <span>SHELTER ACTIVE (ORDER ALL CLEAR)</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>ORDER CREW TO STORM SHELTER</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
