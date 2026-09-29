import React from 'react';
import { OutpostLocation } from '../../engine/simulation-types';

interface PlanetarySkyboxProps {
  location: OutpostLocation;
  isDaytime: boolean;
  solProgress: number;
}

export const PlanetarySkybox: React.FC<PlanetarySkyboxProps> = ({
  location,
  isDaytime,
  solProgress,
}) => {
  const isMoon = location === 'moon';

  // Compute sun position across horizon arc (10% to 90% across width)
  const sunX = Math.round(15 + solProgress * 70);
  const sunY = isDaytime
    ? Math.round(20 + Math.sin(Math.PI * (solProgress % 0.5) / 0.5) * -15)
    : 85;

  return (
    <div className="relative w-full h-24 overflow-hidden rounded-t-2xl border-t border-x border-slate-800 bg-slate-950 select-none">
      {/* Sky Background Gradient */}
      <div
        className={`absolute inset-0 transition-colors duration-1000 ${isMoon
            ? isDaytime
              ? 'bg-linear-to-b from-slate-950 via-slate-900 to-slate-800'
              : 'bg-linear-to-b from-black via-slate-950 to-slate-900'
            : isDaytime
              ? 'bg-linear-to-b from-amber-950/60 via-stone-900 to-orange-950/80'
              : 'bg-linear-to-b from-slate-950 via-red-950/50 to-black'
          }`}
      />

      {/* Distant Celestial Bodies: Earth (from Moon) or Deimos/Phobos (from Mars) */}
      {isMoon ? (
        <div
          title="The Blue Marble: Earth viewed from Shackleton Crater"
          className="absolute top-3 left-10 w-9 h-9 rounded-full bg-linear-to-tr from-blue-600 via-cyan-400 to-emerald-300 shadow-[0_0_20px_rgba(56,189,248,0.7)] border border-cyan-200/40 opacity-90 animate-pulse"
        >
          <div className="absolute inset-1 rounded-full border-t border-white/40" />
        </div>
      ) : (
        <div
          title="Phobos: Mars moon orbiting overhead"
          className="absolute top-4 left-14 w-4 h-4 rounded-full bg-stone-400/80 shadow-[0_0_10px_rgba(214,211,209,0.4)] border border-stone-300/30"
        />
      )}

      {/* Sun / Star */}
      {isDaytime && (
        <div
          style={{ left: `${sunX}%`, top: `${sunY}%` }}
          className={`absolute w-7 h-7 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300 ${isMoon
              ? 'bg-white shadow-[0_0_35px_#ffffff,0_0_60px_#38bdf8]'
              : 'bg-amber-100 shadow-[0_0_25px_#fde047,0_0_45px_#f97316]'
            }`}
        />
      )}

      {/* Horizon Terrain Silhouette */}
      <div className="absolute bottom-0 inset-x-0 h-9">
        <svg
          viewBox="0 0 1000 120"
          preserveAspectRatio="none"
          className={`w-full h-full fill-current transition-colors duration-1000 ${isMoon ? 'text-slate-800' : 'text-stone-800'
            }`}
        >
          <path d="M0,80 Q120,40 250,75 T500,60 T750,85 T1000,50 L1000,120 L0,120 Z" />
        </svg>
      </div>

      {/* Foreground Crater Rim */}
      <div className="absolute bottom-0 inset-x-0 h-5">
        <svg
          viewBox="0 0 1000 80"
          preserveAspectRatio="none"
          className={`w-full h-full fill-current transition-colors duration-1000 ${isMoon ? 'text-slate-900' : 'text-stone-900'
            }`}
        >
          <path d="M0,40 Q200,20 400,45 T800,30 T1000,50 L1000,80 L0,80 Z" />
        </svg>
      </div>

      {/* Environment Label Tag */}
      <div className="absolute top-2 right-4 flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-400">
        <span>Target:</span>
        <span className="font-bold text-slate-200">
          {isMoon ? 'Lunar South Pole (Shackleton)' : 'Martian Jezero Crater Basin'}
        </span>
      </div>
    </div>
  );
};
