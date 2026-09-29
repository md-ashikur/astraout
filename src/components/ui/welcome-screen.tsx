'use client';

import React, { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Rocket, ChevronRight, Star, Globe } from 'lucide-react';
import { OutpostLocation } from '../../engine/simulation-types';

const PlanetScene = dynamic(
  () => import('../game-3d/planet-scene').then(m => ({ default: m.PlanetScene })),
  { ssr: false }
);

interface WelcomeScreenProps {
  onStart: (location: OutpostLocation) => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const [hoveredPlanet, setHoveredPlanet] = useState<OutpostLocation | null>(null);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 overflow-hidden flex flex-col items-center justify-center">
      {/* 3D Background */}
      <div className="absolute inset-0 opacity-50">
        <Suspense fallback={null}>
          <PlanetScene location={hoveredPlanet || 'moon'} minimal />
        </Suspense>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-slate-950/60 to-slate-950/90" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-blue-950/80 border border-blue-400/40 rounded-full px-4 py-1.5 text-xs font-mono font-bold text-blue-300 mb-6 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
          <Star className="w-3.5 h-3.5 text-blue-400" />
          NASA Space Apps Challenge 2026
          <Star className="w-3.5 h-3.5 text-blue-400" />
        </div>

        {/* Title */}
        <h1 className="text-5xl sm:text-7xl font-black text-white font-mono tracking-tight mb-3 drop-shadow-2xl">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
            JUNIOR
          </span>
          <br />
          <span className="text-white">ASTRONAUT</span>
        </h1>
        <div className="text-xl sm:text-2xl font-black text-cyan-400 font-mono tracking-widest uppercase mb-4">
          Mission Trainer
        </div>

        <p className="text-slate-300 font-sans text-sm sm:text-base max-w-md mx-auto mb-10 leading-relaxed">
          Command a lunar or Martian outpost! Keep your crew alive by managing
          <span className="text-cyan-400 font-bold"> power</span>,
          <span className="text-blue-400 font-bold"> air</span>,
          <span className="text-purple-400 font-bold"> radiation</span>, and
          <span className="text-emerald-400 font-bold"> food</span> — just like real NASA engineers!
        </p>

        {/* Planet Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* Moon */}
          <button
            onMouseEnter={() => setHoveredPlanet('moon')}
            onMouseLeave={() => setHoveredPlanet(null)}
            onClick={() => onStart('moon')}
            className="group relative flex flex-col items-center gap-3 p-6 rounded-3xl border-2 border-slate-600 hover:border-cyan-400 bg-slate-900/60 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(6,182,212,0.4)] cursor-pointer"
          >
            <div className="text-7xl group-hover:animate-bounce">🌕</div>
            <div>
              <div className="text-xl font-black text-white font-mono">THE MOON</div>
              <div className="text-xs text-slate-400 font-mono">Artemis Base Alpha</div>
              <div className="text-xs text-slate-500 mt-1">Shackleton Crater, South Pole</div>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center mt-1">
              {['14-day Night 🌑', 'Ice Mining 🧊', 'Nuclear Power ⚛️'].map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-[10px] font-mono text-slate-400">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-xs font-black mt-2 group-hover:gap-3 transition-all">
              <span>Launch Mission</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* Mars */}
          <button
            onMouseEnter={() => setHoveredPlanet('mars')}
            onMouseLeave={() => setHoveredPlanet(null)}
            onClick={() => onStart('mars')}
            className="group relative flex flex-col items-center gap-3 p-6 rounded-3xl border-2 border-slate-600 hover:border-orange-400 bg-slate-900/60 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(251,146,60,0.4)] cursor-pointer"
          >
            <div className="text-7xl group-hover:animate-bounce">🔴</div>
            <div>
              <div className="text-xl font-black text-white font-mono">MARS</div>
              <div className="text-xs text-slate-400 font-mono">Ares Outpost Prime</div>
              <div className="text-xs text-slate-500 mt-1">Jezero Crater Basin</div>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center mt-1">
              {['Dust Storms 🌪️', 'Thin Air 💨', 'MOXIE O₂ 🏭'].map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-[10px] font-mono text-slate-400">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-orange-400 font-mono text-xs font-black mt-2 group-hover:gap-3 transition-all">
              <span>Launch Mission</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* Bottom hint */}
        <p className="text-[11px] text-slate-500 font-mono">
          🎮 Use the control panels to keep all systems balanced · ⚡ Power → 💨 Air → 🛡️ Radiation → 🌱 Food
        </p>
      </div>

      {/* Floating star particles decoration */}
      <div className="absolute top-8 left-8 text-4xl opacity-20 animate-pulse">✦</div>
      <div className="absolute top-20 right-12 text-2xl opacity-30 animate-bounce">✦</div>
      <div className="absolute bottom-24 left-16 text-3xl opacity-20 animate-pulse delay-300">✦</div>
      <div className="absolute bottom-12 right-20 text-xl opacity-25 animate-bounce delay-150">✦</div>
    </div>
  );
}
