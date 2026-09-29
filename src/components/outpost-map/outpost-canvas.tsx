import React, { useState } from 'react';
import {
  Home,
  Sun,
  Zap,
  Flame,
  Wind,
  Droplets,
  Sprout,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { OutpostLocation, OutpostModule, Astronaut } from '../../engine/simulation-types';
import { PlanetarySkybox } from './planetary-skybox';
import { ModuleNodeCard } from './module-node-card';
import { soundFx } from '../../audio/sound-synthesizer';

interface OutpostCanvasProps {
  location: OutpostLocation;
  isDaytime: boolean;
  solProgress: number;
  modules: OutpostModule[];
  crew: Astronaut[];
  storedRegolith: number;
  onToggleActive: (id: string) => void;
  onRepair: (id: string) => void;
  onUpgrade: (id: string) => void;
}

export const OutpostCanvas: React.FC<OutpostCanvasProps> = ({
  location,
  isDaytime,
  solProgress,
  modules,
  crew,
  storedRegolith,
  onToggleActive,
  onRepair,
  onUpgrade,
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>('mod-core-hab');
  const isMoon = location === 'moon';
  const selectedModule = modules.find((m) => m.id === selectedModuleId) || null;

  const getModuleIcon = (category: string, id: string) => {
    if (id.includes('solar')) return <Sun className="w-5 h-5 text-amber-400" />;
    if (id.includes('kilopower')) return <Flame className="w-5 h-5 text-orange-400" />;
    if (id.includes('battery')) return <Zap className="w-5 h-5 text-yellow-300" />;
    if (id.includes('sabatier') || id.includes('cdra')) return <Wind className="w-5 h-5 text-cyan-300" />;
    if (id.includes('water')) return <Droplets className="w-5 h-5 text-blue-400" />;
    if (id.includes('greenhouse')) return <Sprout className="w-5 h-5 text-emerald-400" />;
    if (id.includes('regolith')) return <Layers className="w-5 h-5 text-purple-400" />;
    if (id.includes('shelter')) return <Shield className="w-5 h-5 text-indigo-400" />;
    return <Home className="w-5 h-5 text-cyan-200" />;
  };

  return (
    <div className="w-full flex flex-col rounded-2xl border border-slate-800 bg-slate-950/80 shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Dynamic Planetary Skybox */}
      <PlanetarySkybox
        location={location}
        isDaytime={isDaytime}
        solProgress={solProgress}
      />

      {/* Surface Base Map Area */}
      <div
        className={`relative w-full min-h-[380px] p-6 select-none transition-colors duration-1000 ${
          isMoon
            ? 'bg-gradient-to-b from-slate-900 via-slate-950 to-neutral-950'
            : 'bg-gradient-to-b from-stone-900 via-stone-950 to-red-950/60'
        }`}
      >
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        {/* Base Blueprint Interconnect Conduits (SVG lines connecting modules) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-cyan-500/20 stroke-2 stroke-dasharray-[4,4]">
          <line x1="20%" y1="30%" x2="50%" y2="50%" />
          <line x1="80%" y1="30%" x2="50%" y2="50%" />
          <line x1="30%" y1="75%" x2="50%" y2="50%" />
          <line x1="70%" y1="75%" x2="50%" y2="50%" />
          <line x1="50%" y1="20%" x2="50%" y2="50%" />
        </svg>

        {/* Modules Grid Layout */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 max-w-5xl mx-auto">
          {modules.map((mod) => {
            const isSelected = mod.id === selectedModuleId;
            const isGenerator = mod.powerConsumption < 0;

            return (
              <button
                key={mod.id}
                onClick={() => {
                  soundFx.playClick();
                  setSelectedModuleId(mod.id);
                }}
                className={`relative flex flex-col items-center justify-between p-3 rounded-xl border text-center transition-all duration-200 group ${
                  isSelected
                    ? 'bg-cyan-950/70 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-105 z-20'
                    : mod.isActive
                    ? 'bg-slate-900/80 border-slate-700/80 hover:border-cyan-500/50 hover:bg-slate-800/90'
                    : 'bg-slate-950/60 border-slate-800 opacity-60 hover:opacity-100'
                }`}
              >
                {/* Status Dot */}
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      mod.isActive
                        ? mod.health > 50
                          ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                          : 'bg-amber-400 animate-pulse'
                        : 'bg-slate-600'
                    }`}
                  />
                </div>

                {/* Module Icon Container */}
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110 ${
                    mod.id.includes('greenhouse')
                      ? 'bg-emerald-950/80 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : mod.id.includes('kilopower')
                      ? 'bg-orange-950/80 border border-orange-500/40 shadow-[0_0_12px_rgba(249,115,22,0.3)]'
                      : mod.id.includes('solar')
                      ? 'bg-amber-950/80 border border-amber-500/40'
                      : 'bg-slate-800/90 border border-slate-700'
                  }`}
                >
                  {getModuleIcon(mod.category, mod.id)}
                </div>

                {/* Module Title */}
                <div className="w-full">
                  <span className="block text-[11px] font-mono font-bold text-slate-100 truncate">
                    {mod.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                    {isGenerator
                      ? `+${Math.abs(mod.powerConsumption)} kW`
                      : `${mod.powerConsumption} kW`}
                  </span>
                </div>

                {/* Health & Tier Indicator */}
                <div className="w-full mt-2 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono text-slate-400">
                  <span>T{mod.level}</span>
                  <span
                    className={
                      mod.health > 70 ? 'text-emerald-400' : 'text-rose-400'
                    }
                  >
                    {Math.round(mod.health)}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Astronaut EVA Surface Activity Indicator */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {crew.map((member) => (
            <div
              key={member.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono backdrop-blur-md transition-all ${
                member.status === 'eva-repair'
                  ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse'
                  : member.status === 'sheltered'
                  ? 'bg-indigo-950/80 border-indigo-500/60 text-indigo-300'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300'
              }`}
            >
              <span className="text-sm">{member.avatar}</span>
              <span className="font-semibold">{member.name.split(' ')[0]}</span>
              <span className="text-[10px] text-slate-400 uppercase">
                [{member.status}]
              </span>
            </div>
          ))}
        </div>

        {/* Floating Module Node Inspector Card */}
        {selectedModule && (
          <div className="fixed sm:absolute bottom-4 right-4 z-30">
            <ModuleNodeCard
              module={selectedModule}
              storedRegolith={storedRegolith}
              onToggleActive={onToggleActive}
              onRepair={onRepair}
              onUpgrade={onUpgrade}
              onClose={() => setSelectedModuleId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
