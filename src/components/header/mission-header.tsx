import React from 'react';
import { Sun, Moon, Volume2, VolumeX, BookOpen, Compass, Award, ShieldAlert } from 'lucide-react';
import { OutpostLocation, SimulationSpeed } from '../../engine/simulation-types';
import { SpeedController } from './speed-controller';
import { soundFx } from '../../audio/sound-synthesizer';

interface MissionHeaderProps {
  location: OutpostLocation;
  outpostName: string;
  currentSol: number;
  solProgress: number;
  isDaytime: boolean;
  surfaceTemp: number;
  sustainabilityScore: number;
  speed: SimulationSpeed;
  isPaused: boolean;
  isMuted: boolean;
  onLocationChange: (loc: OutpostLocation) => void;
  onSetSpeed: (speed: SimulationSpeed) => void;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onOpenFieldGuide: () => void;
}

export const MissionHeader: React.FC<MissionHeaderProps> = ({
  location,
  outpostName,
  currentSol,
  solProgress,
  isDaytime,
  surfaceTemp,
  sustainabilityScore,
  speed,
  isPaused,
  isMuted,
  onLocationChange,
  onSetSpeed,
  onTogglePause,
  onToggleMute,
  onOpenFieldGuide,
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40';
    if (score >= 50) return 'text-amber-400 border-amber-500/40 bg-amber-950/40';
    return 'text-rose-400 border-rose-500/40 bg-rose-950/40 animate-pulse';
  };

  return (
    <header className="w-full bg-slate-950/90 border-b border-cyan-500/30 backdrop-blur-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.6)] sticky top-0 z-40">
      {/* Brand & Mission Selector */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 via-blue-700 to-indigo-900 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
          <Compass className="w-6 h-6 text-cyan-200 animate-[spin_20s_linear_infinite]" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
              NASA Mission Trainer
            </span>
            <span className="text-[10px] font-mono text-slate-400">Artemis & Ares Systems</span>
          </div>
          <h1 className="text-sm md:text-base font-bold tracking-tight text-white flex items-center gap-2">
            {outpostName}
          </h1>
        </div>

        {/* Location Switch Buttons */}
        <div className="hidden lg:flex items-center bg-slate-900/90 p-1 rounded-lg border border-slate-700/60 ml-2">
          <button
            onClick={() => {
              soundFx.playClick();
              onLocationChange('moon');
            }}
            className={`px-2.5 py-1 text-xs font-mono rounded transition-all flex items-center gap-1.5 ${
              location === 'moon'
                ? 'bg-slate-700 text-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.3)] font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            Moon (Artemis)
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              onLocationChange('mars');
            }}
            className={`px-2.5 py-1 text-xs font-mono rounded transition-all flex items-center gap-1.5 ${
              location === 'mars'
                ? 'bg-red-950/80 text-orange-300 border border-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.3)] font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-orange-400" />
            Mars (Ares)
          </button>
        </div>
      </div>

      {/* Telemetry Center: Sol, Day/Night, Surface Temp */}
      <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5 backdrop-blur-md">
        {/* Sol Counter */}
        <div className="text-center font-mono">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">
            {location === 'moon' ? 'Lunar Day' : 'Martian Sol'}
          </div>
          <div className="text-base font-black text-cyan-400 tracking-wider">
            SOL {currentSol.toString().padStart(3, '0')}
          </div>
        </div>

        <div className="w-px h-6 bg-slate-800" />

        {/* Diurnal Phase & Surface Temp */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
            {isDaytime ? (
              <Sun className="w-4 h-4 text-amber-400 animate-[spin_12s_linear_infinite]" />
            ) : (
              <Moon className="w-4 h-4 text-cyan-300" />
            )}
          </div>
          <div className="font-mono text-xs">
            <div className="text-slate-300 font-semibold flex items-center gap-1.5">
              <span>{isDaytime ? 'Daylight' : 'Nightfall'}</span>
              <span className="text-[10px] text-slate-500">
                ({Math.round(solProgress * 100)}%)
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Surf: <span className="font-bold text-slate-200">{surfaceTemp > 0 ? `+${surfaceTemp}` : surfaceTemp}°C</span>
            </div>
          </div>
        </div>

        <div className="w-px h-6 bg-slate-800" />

        {/* Sustainability Score */}
        <div
          title="Outpost Sustainability Index: Evaluates balance between life support, power, radiation, and crew morale."
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs font-bold ${getScoreColor(
            sustainabilityScore
          )}`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>{sustainabilityScore}%</span>
        </div>
      </div>

      {/* Right Controls: Speed, Audio, Guide */}
      <div className="flex items-center gap-2">
        <SpeedController
          speed={speed}
          isPaused={isPaused}
          onSetSpeed={onSetSpeed}
          onTogglePause={onTogglePause}
        />

        {/* Sound FX Toggle */}
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Unmute telemetry sound effects' : 'Mute sound effects'}
          className={`p-2 rounded-lg border transition-all ${
            isMuted
              ? 'bg-slate-900 border-slate-800 text-slate-500'
              : 'bg-slate-900/90 border-cyan-500/30 text-cyan-300 hover:bg-slate-800'
          }`}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* NASA STEM Field Guide Button */}
        <button
          onClick={() => {
            soundFx.playClick();
            onOpenFieldGuide();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-mono text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all hover:scale-105 active:scale-95"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">NASA Guide</span>
        </button>
      </div>
    </header>
  );
};
