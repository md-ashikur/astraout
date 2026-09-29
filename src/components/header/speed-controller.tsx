import React from 'react';
import { Pause, Play, FastForward } from 'lucide-react';
import { SimulationSpeed } from '../../engine/simulation-types';
import { soundFx } from '../../audio/sound-synthesizer';

interface SpeedControllerProps {
  speed: SimulationSpeed;
  isPaused: boolean;
  onSetSpeed: (speed: SimulationSpeed) => void;
  onTogglePause: () => void;
}

export const SpeedController: React.FC<SpeedControllerProps> = ({
  speed,
  isPaused,
  onSetSpeed,
  onTogglePause,
}) => {
  const speeds: SimulationSpeed[] = [1, 2, 5, 10];

  const handlePause = () => {
    soundFx.playClick();
    onTogglePause();
  };

  const handleSpeed = (s: SimulationSpeed) => {
    soundFx.playClick();
    onSetSpeed(s);
  };

  return (
    <div className="flex items-center gap-1 bg-slate-900/80 border border-cyan-500/30 rounded-lg p-1 shadow-inner backdrop-blur-md">
      <button
        onClick={handlePause}
        title={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
        className={`px-2.5 py-1.5 rounded flex items-center gap-1 text-xs font-mono font-semibold transition-all ${
          isPaused
            ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
            : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
        }`}
      >
        {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
        <span>{isPaused ? 'PAUSED' : 'PAUSE'}</span>
      </button>

      <div className="w-px h-4 bg-slate-700 mx-1" />

      {speeds.map((s) => {
        const isActive = !isPaused && speed === s;
        return (
          <button
            key={s}
            onClick={() => handleSpeed(s)}
            title={`Run simulation at ${s}x speed`}
            className={`px-2 py-1 rounded text-xs font-mono font-bold transition-all ${
              isActive
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80'
            }`}
          >
            {s === 1 ? '1x' : s === 2 ? '2x' : s === 5 ? '5x' : '10x'}
          </button>
        );
      })}
    </div>
  );
};
