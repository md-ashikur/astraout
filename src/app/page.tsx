'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import {
  Zap, Wind, Sprout, BookOpen, Play, Pause,
  ChevronRight, Star, CheckCircle2,
  Radio, Droplets,
  Volume2, VolumeX, Rocket, ArrowRight
} from 'lucide-react';
import { OutpostState, OutpostLocation, SimulationSpeed, Astronaut } from '../engine/simulation-types';
import { tickSimulation } from '../engine/simulation-core';
import { getInitialScenario } from '../engine/default-scenarios';
import { soundFx } from '../audio/sound-synthesizer';
import { CrewManagementModal } from '../components/control-deck/crew-management-modal';
import type { PlanetSceneProps } from '../components/game-3d/planet-scene';
import type { PlanetSelectSceneProps } from '../components/game-3d/planet-select-scene';
import type { MiniOutpostSceneProps } from '../components/game-3d/mini-outpost-scene';

// ── Dynamic 3D imports ───────────────────────────────────────
const HomeScene = dynamic(
  () => import('../components/game-3d/home-scene').then(m => ({ default: m.HomeScene })),
  { ssr: false }
);
const PlanetScene = dynamic<PlanetSceneProps>(
  () => import('../components/game-3d/planet-scene').then(m => ({ default: m.PlanetScene })),
  { ssr: false }
);
const PlanetSelectScene = dynamic<PlanetSelectSceneProps>(
  () => import('../components/game-3d/planet-select-scene').then(m => ({ default: m.PlanetSelectScene })),
  { ssr: false }
);
const MiniOutpostScene = dynamic<MiniOutpostSceneProps>(
  () => import('../components/game-3d/mini-outpost-scene').then(m => ({ default: m.MiniOutpostScene })),
  { ssr: false }
);

// ── Screen types ─────────────────────────────────────────────
type Screen = 'home' | 'select' | 'briefing' | 'game';

// ── Fade Wrapper ─────────────────────────────────────────────
function FadeIn({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 50); return () => clearTimeout(t); }, []);
  return (
    <div className={`transition-all duration-700 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${className}`}>
      {children}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// HOME SCREEN
// ════════════════════════════════════════════════════════════
function HomeScreen({ onEnter }: { onEnter: () => void }) {

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') { soundFx.playSuccess(); onEnter(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onEnter]);

  return (
    <div className="fixed inset-0 bg-slate-950 overflow-hidden">
      {/* 3D Background */}
      <div className="absolute inset-0">
        <Suspense fallback={<div className="w-full h-full bg-slate-950" />}>
          <HomeScene />
        </Suspense>
      </div>

      {/* Gradient vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(2,6,23,0.7)_100%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-linear-to-t from-slate-950 to-transparent" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center gap-6">
        <FadeIn>
          {/* NASA badge */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-px w-16 bg-linear-to-r from-transparent to-cyan-500" />
            <span className="text-[11px] font-mono font-black tracking-[0.3em] text-cyan-400 uppercase">NASA Space Apps 2026</span>
            <div className="h-px w-16 bg-linear-to-l from-transparent to-cyan-500" />
          </div>

          {/* Main title */}
          <h1 className="text-center leading-none mb-2">
            <span className="block text-6xl sm:text-8xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-linear-to-br from-cyan-400 via-blue-300 to-purple-400 drop-shadow-2xl">
              JUNIOR
            </span>
            <span className="block text-5xl sm:text-7xl font-black font-mono text-white tracking-tight">
              ASTRONAUT
            </span>
          </h1>

          <p className="text-center text-sm text-slate-400 font-sans mt-3 max-w-xs mx-auto">
            Build and command your own space outpost on the Moon or Mars
          </p>

          {/* Enter button */}
          <div className="mt-10 flex flex-col items-center gap-3">
            <button
              onClick={() => { soundFx.playSuccess(); onEnter(); }}
              className="group relative px-10 py-4 rounded-2xl font-mono font-black text-base uppercase tracking-widest text-white overflow-hidden
                bg-linear-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600
                shadow-[0_0_40px_rgba(6,182,212,0.5)] hover:shadow-[0_0_60px_rgba(6,182,212,0.8)]
                transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <span className="relative z-10 flex items-center gap-3">
                <Rocket className="w-5 h-5" />
                Launch Mission
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <span className="text-[11px] text-slate-500 font-mono">or press SPACE / ENTER</span>
          </div>

          {/* Feature pills */}
          <div className="mt-10 flex flex-wrap gap-2 justify-center max-w-sm mx-auto">
            {['⚡ Power Systems', '💨 Life Support', '🛡️ Radiation Shield', '🌱 Food & Water'].map(f => (
              <span key={f} className="px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] font-mono text-slate-400">
                {f}
              </span>
            ))}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// PLANET SELECT SCREEN
// ════════════════════════════════════════════════════════════
function PlanetSelectScreen({ onSelect, onBack }: { onSelect: (loc: OutpostLocation) => void; onBack: () => void }) {
  const [hovered, setHovered] = useState<OutpostLocation | null>(null);
  const [selected, setSelected] = useState<OutpostLocation | null>(null);

  const handleSelect = (loc: OutpostLocation) => {
    soundFx.playClick();
    setSelected(loc);
    setTimeout(() => { soundFx.playSuccess(); onSelect(loc); }, 600);
  };

  const planets = [
    {
      id: 'moon' as OutpostLocation,
      emoji: '🌕',
      name: 'THE MOON',
      sub: 'Artemis Base Alpha',
      desc: 'Shackleton Crater • Lunar South Pole',
      color: 'cyan',
      border: 'border-cyan-400',
      shadow: 'shadow-[0_0_40px_rgba(6,182,212,0.4)]',
      bg: 'from-slate-900/90 via-slate-900/60 to-slate-950/80',
      facts: ['3 Days Trans-Lunar Flight', '14-Day Cryogenic Nights', 'Permanently Shadowed Ice'],
      telemetry: { gravity: '0.166g', dist: '384k km', sol: '28 Earth Days', hazard: 'Solar Flares' },
      diff: '⭐ Recommended for New Recruits',
    },
    {
      id: 'mars' as OutpostLocation,
      emoji: '🔴',
      name: 'MARS',
      sub: 'Ares Outpost Prime',
      desc: 'Jezero Crater Basin • Ancient Delta',
      color: 'orange',
      border: 'border-orange-400',
      shadow: 'shadow-[0_0_40px_rgba(251,146,60,0.4)]',
      bg: 'from-slate-900/90 via-red-950/60 to-slate-950/80',
      facts: ['9 Months Interplanetary Cruise', 'Global Regolith Dust Storms', 'ISRU CO₂ Atmospheric Extraction'],
      telemetry: { gravity: '0.380g', dist: '225M km', sol: '24h 37m', hazard: 'Dust Storms' },
      diff: '⭐⭐ Advanced Commander Mission',
    },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950 overflow-hidden">
      {/* 3D Background with direct click & hover */}
      <div className="absolute inset-0">
        <Suspense fallback={null}>
          <PlanetSelectScene
            hoveredPlanet={hovered}
            selectedPlanet={selected}
            onSelectPlanet={handleSelect}
            onHoverPlanet={setHovered}
          />
        </Suspense>
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(2,6,23,0.65)_100%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-linear-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-slate-950 to-transparent pointer-events-none" />

      <div className="relative z-10 h-full flex flex-col items-center justify-between py-6 px-6">
        {/* Back button */}
        <button
          onClick={() => { soundFx.playClick(); onBack(); }}
          className="self-start flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 bg-slate-900/80 backdrop-blur-md text-slate-400 hover:text-white hover:border-slate-500 transition-all duration-200 text-xs font-mono font-bold group shadow-lg"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          BACK
        </button>

        {/* Header HUD */}
        <FadeIn className="text-center mt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[10px] font-mono text-cyan-400 tracking-[0.25em] uppercase mb-1.5 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            NASA Trajectory Acquisition • Step 1 of 2
          </div>
          <h2 className="text-3xl sm:text-5xl font-black font-mono text-white tracking-tight drop-shadow-md">
            CHOOSE YOUR WORLD
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-1">
            👆 Click a 3D celestial body directly or select a mission telemetry console
          </p>
        </FadeIn>

        {/* Telemetry Pods */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full mx-auto mb-4">
          {planets.map(p => {
            const isHovered = hovered === p.id;
            const isSelected = selected === p.id;
            const isMoon = p.id === 'moon';

            return (
              <div
                key={p.id}
                onMouseEnter={() => {
                  soundFx.playBeep(isMoon ? 880 : 660, 0.04);
                  setHovered(p.id);
                }}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleSelect(p.id)}
                className={`relative flex flex-col justify-between p-5 rounded-3xl border-2 transition-all duration-300 cursor-pointer
                  bg-linear-to-b ${p.bg} backdrop-blur-xl
                  ${isSelected
                    ? `${p.border} ${p.shadow} scale-[1.03] ring-2 ring-cyan-400/40`
                    : isHovered
                    ? `${p.border} scale-[1.02] shadow-[0_0_25px_rgba(15,23,42,0.8)]`
                    : 'border-slate-800/80 hover:border-slate-600'}
                `}
              >
                {/* Header row */}
                <div className="flex items-center justify-between border-b border-slate-700/40 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl sm:text-4xl">{p.emoji}</span>
                    <div>
                      <div className="text-base sm:text-lg font-black font-mono text-white tracking-wide">{p.name}</div>
                      <div className="text-[10px] font-mono text-cyan-400">{p.sub}</div>
                    </div>
                  </div>
                  {isSelected ? (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400 text-[10px] font-mono font-bold animate-pulse">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      LOCKED
                    </div>
                  ) : (
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border ${
                      isMoon ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300' : 'bg-orange-950/40 border-orange-500/40 text-orange-300'
                    }`}>
                      {p.telemetry.dist}
                    </span>
                  )}
                </div>

                {/* Telemetry Matrix Grid */}
                <div className="grid grid-cols-4 gap-2 py-3 border-b border-slate-700/40 text-center font-mono">
                  <div className="bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
                    <div className="text-[8px] text-slate-400 uppercase">Gravity</div>
                    <div className="text-[11px] font-black text-white">{p.telemetry.gravity}</div>
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
                    <div className="text-[8px] text-slate-400 uppercase">Flight Time</div>
                    <div className="text-[11px] font-black text-cyan-400">{p.facts[0].split(' ')[0]} {p.facts[0].split(' ')[1]}</div>
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
                    <div className="text-[8px] text-slate-400 uppercase">Day Cycle</div>
                    <div className="text-[11px] font-black text-white">{p.telemetry.sol}</div>
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
                    <div className="text-[8px] text-slate-400 uppercase">Hazard</div>
                    <div className="text-[10px] font-bold text-amber-400 truncate">{p.telemetry.hazard}</div>
                  </div>
                </div>

                {/* Facts list */}
                <div className="space-y-1.5 py-3">
                  {p.facts.map(f => (
                    <div key={f} className="flex items-center gap-2 text-[11px] font-mono text-slate-300">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isMoon ? 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]' : 'bg-orange-400 shadow-[0_0_6px_rgba(251,146,60,0.8)]'}`} />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                {/* Action button */}
                <div className="pt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(p.id);
                    }}
                    className={`w-full py-2.5 rounded-2xl font-mono font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${
                      isSelected
                        ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                        : isMoon
                        ? 'bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-cyan-500/25'
                        : 'bg-linear-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-orange-500/25'
                    }`}
                  >
                    <span>{isSelected ? 'TRAJECTORY CONFIRMED' : 'ENGAGE MISSION TRAJECTORY'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <div className={`text-[10px] font-mono text-center mt-1.5 ${isMoon ? 'text-cyan-400' : 'text-orange-400'}`}>
                    {p.diff}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MISSION BRIEFING SCREEN
// ════════════════════════════════════════════════════════════
const BRIEFING_STEPS = [
  {
    icon: '⚡',
    color: 'amber',
    title: 'Power Everything',
    desc: 'Solar panels charge batteries during daylight. Nuclear reactors run at night.',
    tip: 'Balance generation vs. demand!',
  },
  {
    icon: '💨',
    color: 'cyan',
    title: 'Keep Air Clean',
    desc: 'Your ECLSS scrubs CO₂ and makes fresh O₂. If it fails, crew gets sick fast.',
    tip: 'Watch CO₂ levels!',
  },
  {
    icon: '☢️',
    color: 'purple',
    title: 'Block Radiation',
    desc: 'Build regolith shields and shelter crew during solar flares.',
    tip: 'Hit shelter in a storm!',
  },
  {
    icon: '🌱',
    color: 'emerald',
    title: 'Grow Your Food',
    desc: 'Hydroponics grow food in space. Harvest crops to keep the crew fed.',
    tip: 'Water + light = harvest!',
  },
];

function BriefingScreen({ location, onStart }: { location: OutpostLocation; onStart: () => void }) {
  const [step, setStep] = useState(0);
  const isMoon = location === 'moon';

  const advance = useCallback(() => {
    soundFx.playClick();
    if (step < BRIEFING_STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      soundFx.playSuccess();
      onStart();
    }
  }, [step, onStart]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') advance();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [advance]);

  const s = BRIEFING_STEPS[step];
  const colorMap: Record<string, string> = {
    amber: 'from-amber-600/20 to-amber-900/10 border-amber-500/50',
    cyan: 'from-cyan-600/20 to-cyan-900/10 border-cyan-500/50',
    purple: 'from-purple-600/20 to-purple-900/10 border-purple-500/50',
    emerald: 'from-emerald-600/20 to-emerald-900/10 border-emerald-500/50',
  };
  const textColorMap: Record<string, string> = {
    amber: 'text-amber-300', cyan: 'text-cyan-300',
    purple: 'text-purple-300', emerald: 'text-emerald-300',
  };

  return (
    <div className="fixed inset-0 bg-slate-950 overflow-hidden">
      {/* 3D Planet background */}
      <div className="absolute inset-0 opacity-40">
        <Suspense fallback={null}>
          <PlanetScene location={location} minimal />
        </Suspense>
      </div>
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />

      <div className="relative z-10 h-full flex flex-col items-center justify-center gap-6 px-6">
        {/* Progress dots */}
        <div className="flex gap-2 mb-2">
          {BRIEFING_STEPS.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-cyan-400' : i < step ? 'w-2 bg-cyan-600' : 'w-2 bg-slate-700'
              }`} />
          ))}
        </div>

        {/* Card */}
        <div key={step} className={`max-w-sm w-full bg-linear-to-br ${colorMap[s.color]} border rounded-3xl p-8 text-center backdrop-blur-xl
          transition-all duration-500 shadow-2xl`}
          style={{ animation: 'fadeSlideUp 0.4s ease-out' }}>
          <div className="text-7xl mb-5">{s.icon}</div>
          <h3 className={`text-2xl font-black font-mono mb-3 ${textColorMap[s.color]}`}>{s.title}</h3>
          <p className="text-sm text-slate-300 font-sans leading-relaxed mb-4">{s.desc}</p>
          <div className="inline-flex items-center gap-2 bg-slate-900/60 rounded-xl px-3 py-2 text-[11px] font-mono text-slate-300">
            <Star className="w-3 h-3 text-amber-400" />
            {s.tip}
          </div>
        </div>

        {/* Continue button */}
        <button
          onClick={advance}
          className="flex items-center gap-3 px-8 py-3.5 rounded-2xl font-mono font-black text-sm text-white
            bg-linear-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600
            shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_50px_rgba(6,182,212,0.7)]
            transition-all duration-300 hover:scale-105 active:scale-95"
        >
          {step < BRIEFING_STEPS.length - 1 ? (
            <>Next <ChevronRight className="w-4 h-4" /></>
          ) : (
            <>{isMoon ? '🌕' : '🔴'} Begin Mission! <Rocket className="w-4 h-4" /></>
          )}
        </button>
        <span className="text-[11px] text-slate-500 font-mono">SPACE / ENTER to continue</span>
      </div>

      <style>{`@keyframes fadeSlideUp { from { opacity:0; transform: translateY(16px) } to { opacity:1; transform: translateY(0) } }`}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ICON GAUGE — circular progress ring
// ════════════════════════════════════════════════════════════
function IconGauge({
  icon, label, value, max, color, critical, warning
}: {
  icon: React.ReactNode; label: string; value: number; max: number;
  color: string; critical?: number; warning?: number;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const isCrit = critical !== undefined && pct < critical;
  const isWarn = warning !== undefined && pct < warning;

  const r = 22; const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  const strokeColor = isCrit ? '#ef4444' : isWarn ? '#f59e0b' : color;

  return (
    <div className={`flex flex-col items-center gap-1.5 ${isCrit ? 'animate-pulse' : ''}`}>
      <div className="relative w-14 h-14">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r={r} fill="none" stroke="#1e293b" strokeWidth="4" />
          <circle
            cx="28" cy="28" r={r} fill="none"
            stroke={strokeColor}
            strokeWidth="4"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${strokeColor})`, transition: 'stroke-dasharray 0.7s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center" style={{ color: strokeColor }}>
          {icon}
        </div>
      </div>
      <div className={`text-[10px] font-mono font-black tracking-wide ${isCrit ? 'text-red-400' : isWarn ? 'text-amber-400' : 'text-slate-300'}`}>
        {label}
      </div>
      <div className={`text-[11px] font-mono font-black ${isCrit ? 'text-red-400' : 'text-slate-400'}`}>
        {pct.toFixed(0)}%
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// LOG TICKER
// ════════════════════════════════════════════════════════════
function LogTicker({ logs }: { logs: Array<{ id: string; message: string; type: string }> }) {
  const latest = logs[0];
  if (!latest) return null;
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-mono truncate ${latest.type === 'critical' ? 'text-red-300' : latest.type === 'warning' ? 'text-amber-300'
        : latest.type === 'success' ? 'text-emerald-300' : 'text-slate-400'
      }`}>
      <span className="shrink-0">{latest.type === 'critical' ? '🚨' : latest.type === 'success' ? '✅' : latest.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
      <span className="truncate">{latest.message}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// DEBRIEF SCREEN
// ════════════════════════════════════════════════════════════
function DebriefScreen({ state, onRestart }: { state: OutpostState; onRestart: (loc: OutpostLocation) => void }) {
  useEffect(() => {
    if (state.gameWon) {
      soundFx.playSuccess();
      import('canvas-confetti').then(({ default: confetti }) =>
        confetti({ particleCount: 250, spread: 90, origin: { y: 0.5 } })
      );
    } else soundFx.playAlarm();
  }, [state.gameWon]);

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center z-50">
      <div className="text-center max-w-sm w-full px-6">
        <div className="text-8xl mb-6 animate-bounce">{state.gameWon ? '🏆' : '💥'}</div>
        <h1 className={`text-4xl font-black font-mono mb-3 ${state.gameWon ? 'text-emerald-400' : 'text-red-400'}`}>
          {state.gameWon ? 'MISSION COMPLETE!' : 'MISSION FAILED'}
        </h1>
        <p className="text-slate-300 text-sm mb-6 leading-relaxed">{state.endCause}</p>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Sols', val: `${state.currentSol}` },
            { label: 'Score', val: `${state.sustainabilityScore}%` },
            { label: 'Crew', val: `${state.crew.filter(c => c.status !== 'incapacitated').length}/${state.crew.length}` },
          ].map(s => (
            <div key={s.label} className="bg-slate-900/80 border border-slate-700 rounded-2xl p-3 text-center">
              <div className="text-base font-black text-white font-mono">{s.val}</div>
              <div className="text-[10px] text-slate-400 font-mono">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={() => onRestart(state.location)} className="flex-1 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-black font-mono text-sm transition-all hover:scale-105">
            🔄 Try Again
          </button>
          <button onClick={() => onRestart(state.location === 'moon' ? 'mars' : 'moon')} className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-black font-mono text-sm transition-all">
            {state.location === 'moon' ? '🔴 Try Mars' : '🌕 Try Moon'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// LEARN MODAL
// ════════════════════════════════════════════════════════════
const LEARN_TOPICS = [
  { icon: '⚡', label: 'Power', content: 'Mars gets 43% less sunlight than Earth! Solar panels lose power in dust storms. The Kilopower nuclear reactor is NASA\'s solution — it works 24/7, no sun needed. It\'s about the size of a trash can but powers an entire outpost!' },
  { icon: '💨', label: 'Air', content: 'Mars air is 95% CO₂ — deadly to breathe! NASA\'s MOXIE machine converts CO₂ into breathable O₂. The ISS recycles over 90% of astronaut water. If CO₂ rises above 2,500 ppm, crew get headaches and confusion.' },
  { icon: '☢️', label: 'Radiation', content: 'Without Earth\'s magnetic shield, the Moon and Mars are blasted by radiation. 50cm of regolith rock blocks 85% of it! When solar flares hit, everyone runs to the shelter. Water also absorbs radiation — surrounding tanks protect the crew!' },
  { icon: '🌱', label: 'Food', content: 'Every kilogram launched from Earth costs ~$10,000! NASA grows lettuce on the ISS in hydroponic pods (no soil needed!). On Mars you could grow potatoes — just like the movie The Martian. Spirulina algae makes protein AND oxygen at once!' },
];

function LearnModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState(0);
  const t = LEARN_TOPICS[tab];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
      <div className="bg-slate-950 border border-cyan-500/40 rounded-3xl max-w-sm w-full shadow-[0_0_60px_rgba(6,182,212,0.3)] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <span className="text-sm font-black font-mono text-cyan-400">🚀 NASA CADET GUIDE</span>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-lg">✕</button>
        </div>

        <div className="flex gap-1 p-3 border-b border-slate-800">
          {LEARN_TOPICS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} className={`flex-1 py-2 rounded-xl text-xs font-bold font-mono transition-all ${tab === i ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              {t.icon}
            </button>
          ))}
        </div>

        <div className="p-5">
          <div className="text-4xl mb-3 text-center">{t.icon}</div>
          <h3 className="text-base font-black font-mono text-white mb-3 text-center">{t.label}</h3>
          <p className="text-sm text-slate-300 leading-relaxed font-sans">{t.content}</p>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button onClick={onClose} className="w-full py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-black font-mono text-sm transition-all">
            Got it! Back to mission 🚀
          </button>
        </div>
      </div>
    </div>
  );
}


function GameHUD({
  state, setState,
  isMuted, setIsMuted,
  onLearn,
  onExitToMenu,
  onSelectPlanetScreen,
}: {
  state: OutpostState;
  setState: React.Dispatch<React.SetStateAction<OutpostState>>;
  isMuted: boolean;
  setIsMuted: (v: boolean) => void;
  onLearn: () => void;
  onExitToMenu: () => void;
  onSelectPlanetScreen: () => void;
}) {
  const { resources, crew, modules } = state;
  const isMoon = state.location === 'moon';

  const battPct = (resources.batteryStored / resources.batteryCapacity) * 100;
  const co2Bad = resources.co2Level > 2500;
  const netPower = resources.powerGeneration - resources.powerDemand;

  const [cameraMode, setCameraMode] = useState<'orbit' | 'dome' | 'greenhouse' | 'rover' | 'solar' | 'comms' | 'wide' | 'crew' | 'lifesupport' | 'tanks' | 'celestial'>('orbit');
  const [cameraCommand, setCameraCommand] = useState<{ type: string; id: number } | null>(null);
  const triggerCamera = (type: string) => setCameraCommand({ type, id: Date.now() });
  const [roverCommand, setRoverCommand] = useState<{ type: string; id: number } | null>(null);
  const [crewCommand, setCrewCommand] = useState<{ type: string; id: number } | null>(null);
  const [isCinematicFullscreen, setIsCinematicFullscreen] = useState(false);
  const [inspectedObject, setInspectedObject] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [showCrewModal, setShowCrewModal] = useState(false);
  const [selectedCrewId, setSelectedCrewId] = useState<string | null>(null);

  const handleAssignCrew = (id: string, status: Astronaut['status']) => {
    soundFx.playClick();
    setState(prev => ({
      ...prev,
      crew: prev.crew.map(c => c.id === id ? { ...c, status } : c),
    }));
  };

  const isNight = !state.isDaytime;
  const solarModule = modules.find(m => m.id === 'solar-array');
  const fissionModule = modules.find(m => m.id === 'nuclear-fission');
  const sabatierModule = modules.find(m => m.id === 'sabatier-system');
  const hasStorm = state.activeHazards.find(h => h.type === 'dust-storm');
  const hasFlare = state.activeHazards.find(h => h.type === 'solar-flare');

  const dispatchRover = () => {
    soundFx.playRoverHorn();
    setRoverCommand({ type: 'dispatch', id: Date.now() });
    setCameraMode('rover');
    const isWater = (state.currentSol + Math.floor(resources.regolithStored)) % 2 === 0;
    const bonus = isWater ? 8 : 6;
    setState(prev => ({
      ...prev,
      resources: {
        ...prev.resources,
        waterReserve: isWater ? Math.min(prev.resources.waterCapacity, prev.resources.waterReserve + bonus) : prev.resources.waterReserve,
        regolithStored: !isWater ? prev.resources.regolithStored + bonus : prev.resources.regolithStored,
      },
      logs: [{
        id: `rov${Date.now()}`,
        sol: prev.currentSol,
        timeString: `SOL ${prev.currentSol}`,
        message: `🚜 Rover returned from crater survey: +${bonus}${isWater ? 'L water ice' : 't sinterable regolith'} secured!`,
        type: 'success' as const,
      }, ...prev.logs].slice(0, 30),
    }));
  };

  const cycleAirlock = () => {
    soundFx.playAirlockHiss();
    setState(prev => ({
      ...prev,
      logs: [{
        id: `air${Date.now()}`,
        sol: prev.currentSol,
        timeString: `SOL ${prev.currentSol}`,
        message: '💨 Habitat airlock depressurization & seal cycle verified (101.3 kPa nominal).',
        type: 'info' as const,
      }, ...prev.logs].slice(0, 30),
    }));
  };

  const realignSolar = () => {
    soundFx.playScanner();
    setState(prev => ({
      ...prev,
      logs: [{
        id: `sol${Date.now()}`,
        sol: prev.currentSol,
        timeString: `SOL ${prev.currentSol}`,
        message: '⚡ Photovoltaic arrays recalibrated: tracking solar elevation vector at 99.4% efficiency.',
        type: 'info' as const,
      }, ...prev.logs].slice(0, 30),
    }));
  };

  const pingMissionControl = () => {
    soundFx.playTelemetryPing();
    setState(prev => ({
      ...prev,
      logs: [{
        id: `ping${Date.now()}`,
        sol: prev.currentSol,
        timeString: `SOL ${prev.currentSol}`,
        message: isMoon
          ? '📡 Houston Ground Station received packet: Latency 1.28s • Bit Error Rate < 10⁻⁹'
          : '📡 Deep Space Network Canberra received packet: One-way light time 14m 18s.',
        type: 'info' as const,
      }, ...prev.logs].slice(0, 30),
    }));
  };

  const saluteCrew = () => {
    soundFx.playBeep(1100, 0.1);
    setCrewCommand({ type: 'salute', id: Date.now() });
    setCameraMode('crew');
    setState(prev => ({
      ...prev,
      logs: [{
        id: `sal${Date.now()}`,
        sol: prev.currentSol,
        timeString: `SOL ${prev.currentSol}`,
        message: '👨‍🚀 EVA Astronaut returned salute: "Base Alpha operational, Commander!"',
        type: 'success' as const,
      }, ...prev.logs].slice(0, 30),
    }));
  };

  const toggleShelter = () => {
    soundFx.playAlarm();
    setState(prev => {
      const active = !prev.resources.stormShelterActive;
      return {
        ...prev,
        resources: { ...prev.resources, stormShelterActive: active },
        crew: prev.crew.map(c => ({ ...c, status: active ? 'sheltered' as const : 'active' as const })),
        logs: [{
          id: `s${Date.now()}`, sol: prev.currentSol, timeString: `SOL ${prev.currentSol}`,
          message: active ? '🚨 ALL CREW TO STORM SHELTER!' : '✅ Shelter stand-down.', type: active ? 'critical' as const : 'success' as const
        }, ...prev.logs].slice(0, 30),
      };
    });
  };

  const sinterShield = () => {
    if (resources.regolithStored < 5) return;
    soundFx.playShieldHum();
    soundFx.playSuccess();
    setState(prev => ({
      ...prev,
      resources: {
        ...prev.resources,
        shieldingThicknessCm: prev.resources.shieldingThicknessCm + 5,
        regolithStored: prev.resources.regolithStored - 5,
      },
      logs: [{
        id: `sh${Date.now()}`, sol: prev.currentSol, timeString: `SOL ${prev.currentSol}`,
        message: `🪨 Shield +5cm → ${prev.resources.shieldingThicknessCm + 5}cm (Nanite regolith sintered)`, type: 'success' as const
      }, ...prev.logs].slice(0, 30),
    }));
  };

  const harvestFood = () => {
    soundFx.playSuccess();
    setState(prev => ({
      ...prev,
      resources: {
        ...prev.resources,
        foodRations: Math.min(120, prev.resources.foodRations + 15),
      },
      logs: [{
        id: `fd${Date.now()}`,
        sol: prev.currentSol,
        timeString: `SOL ${prev.currentSol}`,
        message: '🌱 Harvested +15 units of fresh dwarf wheat & microgreens from Hydroponic Greenhouse!',
        type: 'success' as const,
      }, ...prev.logs].slice(0, 30),
    }));
  };

  const boostPAR = () => {
    soundFx.playScanner();
    setState(prev => ({
      ...prev,
      logs: [{
        id: `par${Date.now()}`,
        sol: prev.currentSol,
        timeString: `SOL ${prev.currentSol}`,
        message: '💡 Greenhouse LED grow spectrum tuned to 660nm deep-red: Photosynthetic efficiency at 100%.',
        type: 'info' as const,
      }, ...prev.logs].slice(0, 30),
    }));
  };

  const ventCO2 = () => {
    soundFx.playAirlockHiss();
    setState(prev => ({
      ...prev,
      resources: {
        ...prev.resources,
        co2Level: Math.max(350, prev.resources.co2Level - 150),
      },
      logs: [{
        id: `mox${Date.now()}`,
        sol: prev.currentSol,
        timeString: `SOL ${prev.currentSol}`,
        message: '💨 ISRU MOXIE purge valve opened: -150 ppm CO₂ scrubbed & vented.',
        type: 'success' as const,
      }, ...prev.logs].slice(0, 30),
    }));
  };

  const boostISRU = () => {
    soundFx.playSuccess();
    setState(prev => ({
      ...prev,
      resources: {
        ...prev.resources,
        o2PartialPressure: Math.min(22, prev.resources.o2PartialPressure + 0.5),
      },
      logs: [{
        id: `isru${Date.now()}`,
        sol: prev.currentSol,
        timeString: `SOL ${prev.currentSol}`,
        message: '🧪 Catalytic Sabatier loop boosted: O₂ yield increased by +0.5%.',
        type: 'info' as const,
      }, ...prev.logs].slice(0, 30),
    }));
  };

  const ventCryoValve = () => {
    soundFx.playAirlockHiss();
    setState(prev => ({
      ...prev,
      logs: [{
        id: `cryo${Date.now()}`,
        sol: prev.currentSol,
        timeString: `SOL ${prev.currentSol}`,
        message: '💧 Cryogenic storage manifold pressure relief tested (Nominal: 2.4 bar).',
        type: 'info' as const,
      }, ...prev.logs].slice(0, 30),
    }));
  };

  const balanceTanks = () => {
    soundFx.playBeep(720, 0.15);
    setState(prev => ({
      ...prev,
      logs: [{
        id: `bal${Date.now()}`,
        sol: prev.currentSol,
        timeString: `SOL ${prev.currentSol}`,
        message: '⚖️ Cryogenic LOX & H₂O reservoir cross-feed manifolds equalized.',
        type: 'success' as const,
      }, ...prev.logs].slice(0, 30),
    }));
  };

  const analyzeBoulder = () => {
    soundFx.playScanner();
    setState(prev => ({
      ...prev,
      resources: {
        ...prev.resources,
        regolithStored: prev.resources.regolithStored + 2,
      },
      logs: [{
        id: `rock${Date.now()}`,
        sol: prev.currentSol,
        timeString: `SOL ${prev.currentSol}`,
        message: '🪨 Regolith boulder Raman spectra complete: +2t mineral feed secured.',
        type: 'success' as const,
      }, ...prev.logs].slice(0, 30),
    }));
  };

  // ── Smart CAPCOM Advisor Logic ─────────────────────────────
  let capcomAdvice: {
    type: 'critical' | 'warning' | 'info' | 'success';
    badge: string;
    title: string;
    actionLabel?: string;
    action?: () => void;
  } = {
    type: 'success',
    badge: '✅ NOMINAL',
    title: `All systems nominal on Sol ${state.currentSol}. Ready for surface operations.`,
    actionLabel: '🚜 DISPATCH ROVER',
    action: dispatchRover,
  };

  if (hasFlare && !resources.stormShelterActive) {
    capcomAdvice = {
      type: 'critical',
      badge: '🚨 RADIATION EMERGENCY',
      title: 'Solar Flare strike detected! High ionizing radiation outside. Move all crew into Storm Shelter!',
      actionLabel: '🛡️ ALL CREW TO SHELTER',
      action: toggleShelter,
    };
  } else if (hasStorm && !resources.stormShelterActive && !isMoon) {
    capcomAdvice = {
      type: 'warning',
      badge: '🌪️ DUST STORM ACTIVE',
      title: 'Martian dust storm active! Visibility 10%, solar generation degraded. Secure base & enter shelter!',
      actionLabel: '🛡️ ENTER STORM SHELTER',
      action: toggleShelter,
    };
  } else if (isNight && netPower < 0 && fissionModule && !fissionModule.isActive) {
    capcomAdvice = {
      type: 'critical',
      badge: '🌙 NIGHT POWER DEFICIT',
      title: `Night has fallen! Solar arrays are generating 0kW. Battery is draining at ${Math.abs(netPower).toFixed(1)}kW. Turn ON Kilopower Fission Reactor!`,
      actionLabel: '⚡ ACTIVATE KILOPOWER (+10kW)',
      action: () => {
        soundFx.playClick();
        setState(prev => ({
          ...prev,
          modules: prev.modules.map(m => m.id === 'nuclear-fission' ? { ...m, isActive: true } : m)
        }));
      },
    };
  } else if (!isNight && solarModule && !solarModule.isActive) {
    capcomAdvice = {
      type: 'warning',
      badge: '☀️ DAYLIGHT RESTORED',
      title: 'Sunlight is high! Turn ON Ultraflex Solar to generate clean +12kW and recharge battery reserves.',
      actionLabel: '☀️ ACTIVATE SOLAR (+12kW)',
      action: () => {
        soundFx.playClick();
        setState(prev => ({
          ...prev,
          modules: prev.modules.map(m => m.id === 'solar-array' ? { ...m, isActive: true } : m)
        }));
      },
    };
  } else if (resources.co2Level > 1800 && sabatierModule && !sabatierModule.isActive) {
    capcomAdvice = {
      type: 'warning',
      badge: '💨 ELEVATED CO₂',
      title: `CO₂ is reaching ${resources.co2Level} ppm! Turn ON Sabatier O₂ Reactor to scrub atmosphere and generate oxygen.`,
      actionLabel: '💨 ACTIVATE SABATIER O₂',
      action: () => {
        soundFx.playClick();
        setState(prev => ({
          ...prev,
          modules: prev.modules.map(m => m.id === 'sabatier-system' ? { ...m, isActive: true } : m)
        }));
      },
    };
  } else if (resources.regolithStored >= 5 && resources.shieldingThicknessCm < 45) {
    capcomAdvice = {
      type: 'info',
      badge: '🪨 REGOLITH READY',
      title: `${resources.regolithStored.toFixed(0)} tons of regolith available! Sinter shield to strengthen radiation protection.`,
      actionLabel: '🪨 SINTER SHIELD (+5cm)',
      action: sinterShield,
    };
  } else if (resources.foodRations < 35) {
    capcomAdvice = {
      type: 'warning',
      badge: '🌱 HARVEST CROPS',
      title: 'Food rations are low! Visit the Hydroponic Greenhouse to harvest fresh crops and replenish crew food reserves.',
      actionLabel: '🌱 HARVEST FOOD (+15)',
      action: harvestFood,
    };
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden select-none">
      {/* ── TOP BAR WITH BACK, CONTROLS, WEATHER & MENU ── */}
      <header className="shrink-0 flex items-center justify-between px-3 py-2 bg-slate-950/95 border-b border-slate-800/90 backdrop-blur-xl z-30 gap-2">
        {/* Left: Back / Exit & Logo */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { soundFx.playClick(); setShowExitConfirm(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-mono font-bold transition-all shadow-md group"
            title="Open Mission Navigation & Exit Menu"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">◀</span>
            <span>MENU</span>
          </button>

          <button
            onClick={() => { soundFx.playBeep(); setShowHowToPlay(true); }}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-300 text-xs font-mono font-bold transition-all shadow-md"
            title="How to play guide"
          >
            <span>❓</span>
            <span>GUIDE</span>
          </button>

          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-7 h-7 rounded-xl bg-linear-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-sm shadow-[0_0_10px_rgba(6,182,212,0.4)]">🚀</div>
            <div>
              <div className="text-[11px] font-black text-white font-mono leading-tight">Junior Astronaut</div>
              <div className="text-[8px] text-cyan-400 font-mono tracking-widest uppercase">Mission Trainer</div>
            </div>
          </div>
        </div>

        {/* Center: Mission Sol, Location, Score & Weather */}
        <div className="flex items-center gap-2">
          {/* Planet Switcher */}
          <div className="flex bg-slate-900/90 rounded-xl border border-slate-700/60 p-0.5 shadow-sm">
            <button
              onClick={() => { soundFx.playClick(); setState(getInitialScenario('moon')); }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black font-mono transition-all ${isMoon ? 'bg-slate-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
            >
              🌕 Moon
            </button>
            <button
              onClick={() => { soundFx.playClick(); setState(getInitialScenario('mars')); }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black font-mono transition-all ${!isMoon ? 'bg-red-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
            >
              🔴 Mars
            </button>
          </div>

          {/* Sol */}
          <div className="bg-slate-900/90 border border-cyan-500/40 px-2.5 py-1 rounded-xl text-center shadow-sm">
            <div className="text-[7px] text-slate-400 font-mono uppercase leading-tight">Sol</div>
            <div className="text-xs sm:text-sm font-black text-cyan-400 font-mono leading-tight">{String(state.currentSol).padStart(3, '0')}</div>
          </div>

          {/* Sustainability Score */}
          <div className={`px-2.5 py-1 rounded-xl border text-center font-mono shadow-sm bg-slate-900/90 ${
            state.sustainabilityScore >= 70 ? 'border-emerald-500/50 text-emerald-400' : 'border-red-500/50 text-red-400 animate-pulse'
          }`}>
            <div className="text-[7px] uppercase leading-tight">Score</div>
            <div className="text-xs sm:text-sm font-black leading-tight">{state.sustainabilityScore}%</div>
          </div>

          {/* Dynamic Weather & Condition Pill */}
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black font-mono border shadow-sm ${
            hasFlare
              ? 'bg-red-950/80 border-red-500 text-red-300 animate-pulse'
              : hasStorm
              ? 'bg-amber-950/80 border-amber-500 text-amber-300 animate-pulse'
              : isNight
              ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300'
              : 'bg-amber-950/40 border-amber-600/40 text-amber-300'
          }`}>
            <span>
              {hasFlare
                ? '☀️ FLARE (1.4 mSv/h)'
                : hasStorm
                ? '🌪️ DUST STORM'
                : isNight
                ? '🌙 CRYOGENIC NIGHT'
                : '☀️ NOON SUNLIGHT'}
            </span>
          </div>
        </div>

        {/* Right: Simulation Speed, Audio & Cadet Guide */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { soundFx.playClick(); setState(prev => ({ ...prev, isPaused: !prev.isPaused })); }}
            className={`p-1.5 sm:p-2 rounded-xl border text-xs font-black transition-all ${
              state.isPaused ? 'bg-amber-600 border-amber-400 text-white shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title={state.isPaused ? 'Resume Simulation' : 'Pause Simulation'}
          >
            {state.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          {([1, 2, 5] as SimulationSpeed[]).map(s => (
            <button
              key={s}
              onClick={() => { soundFx.playClick(); setState(prev => ({ ...prev, speed: s, isPaused: false })); }}
              className={`px-2 py-1 rounded-xl text-[10px] font-black font-mono border transition-all ${
                state.speed === s && !state.isPaused ? 'bg-cyan-600 border-cyan-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              {s}×
            </button>
          ))}

          <button
            onClick={() => setIsMuted(soundFx.toggleMute())}
            className="p-1.5 sm:p-2 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-400 hover:text-white"
            title="Toggle Audio FX"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onLearn}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-linear-to-r from-blue-600 to-cyan-600 text-white text-[10px] font-black font-mono hover:scale-105 shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all"
          >
            <BookOpen className="w-3 h-3" />
            <span className="hidden sm:inline">LEARN</span>
          </button>
        </div>
      </header>

      {/* ── NASA CAPCOM FLIGHT DIRECTOR ADVISOR BANNER ── */}
      <div className={`shrink-0 px-3 sm:px-4 py-2 border-b flex items-center justify-between gap-3 text-xs font-mono transition-all z-20 ${
        capcomAdvice.type === 'critical'
          ? 'bg-red-950/95 border-red-500/70 text-red-200 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.3)]'
          : capcomAdvice.type === 'warning'
          ? 'bg-amber-950/90 border-amber-500/60 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
          : capcomAdvice.type === 'info'
          ? 'bg-blue-950/90 border-blue-500/60 text-blue-200'
          : 'bg-slate-900/90 border-slate-700/60 text-slate-300'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`px-2 py-0.5 rounded-md font-black text-[9px] uppercase tracking-wider shrink-0 ${
            capcomAdvice.type === 'critical' ? 'bg-red-600 text-white' : capcomAdvice.type === 'warning' ? 'bg-amber-600 text-white' : 'bg-cyan-600 text-white'
          }`}>
            {capcomAdvice.badge}
          </span>
          <span className="truncate font-semibold text-[11px] sm:text-xs">
            {capcomAdvice.title}
          </span>
        </div>

        {capcomAdvice.actionLabel && capcomAdvice.action && (
          <button
            onClick={() => {
              soundFx.playClick();
              capcomAdvice.action?.();
            }}
            className="shrink-0 px-3 py-1 rounded-xl bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black text-[10px] sm:text-[11px] shadow-md transition-all flex items-center gap-1.5"
          >
            <span>{capcomAdvice.actionLabel}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Deep Space Background Atmosphere */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-slate-950 to-black pointer-events-none" />

        {/* ─── LEFT: Gauges & Systems (Collapsible on Cinematic) ─── */}
        {!isCinematicFullscreen && (
          <div className="relative z-10 w-52 shrink-0 flex flex-col gap-2 p-3 bg-slate-950/75 backdrop-blur-xl border-r border-slate-800/80 overflow-y-auto">
            <div className="text-[9px] font-black text-cyan-400 font-mono uppercase tracking-widest mb-1 flex items-center justify-between">
              <span>Systems</span>
              <span className="text-[8px] text-slate-500">{isMoon ? 'LUNAR BASE' : 'MARS BASE'}</span>
            </div>

            {/* Power block */}
            <div className={`p-3 rounded-2xl border backdrop-blur-sm ${
              netPower < 0 ? 'bg-red-950/70 border-red-500/70 animate-pulse' : 'bg-slate-900/60 border-slate-700/60'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px] font-black text-slate-200 font-mono">Power</span>
                </div>
                <span className={`text-[10px] font-black font-mono ${netPower >= 0 ? 'text-emerald-400' : 'text-red-400 font-black'}`}>
                  {netPower >= 0 ? '+' : ''}{netPower.toFixed(1)}kW
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    battPct < 15 ? 'bg-red-500' : battPct < 40 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${battPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[9px] font-mono mt-1">
                <span className={netPower < 0 ? 'text-red-400 font-bold' : 'text-slate-400'}>
                  {netPower < 0 ? '⚠️ Draining' : 'Charging'}
                </span>
                <span className="text-slate-400">{battPct.toFixed(0)}% battery</span>
              </div>
            </div>

            {/* Icon gauges grid */}
            <div className="grid grid-cols-2 gap-2.5 p-2.5 bg-slate-900/60 border border-slate-700/60 rounded-2xl backdrop-blur-sm">
              <IconGauge icon={<Wind className="w-4 h-4" />} label="O₂" value={resources.o2PartialPressure} max={21} color="#22d3ee" critical={85} warning={90} />
              <IconGauge icon={<Droplets className="w-4 h-4" />} label="H₂O" value={resources.waterReserve} max={resources.waterCapacity} color="#38bdf8" critical={15} warning={30} />
              <IconGauge icon={<Sprout className="w-4 h-4" />} label="Food" value={resources.foodRations} max={120} color="#34d399" critical={15} warning={25} />
              <IconGauge icon={<Radio className="w-4 h-4" />} label="Shield" value={resources.shieldingThicknessCm} max={50} color="#a78bfa" warning={50} />
            </div>

            {/* CO2 alert */}
            <div className={`p-2 rounded-xl border flex items-center justify-between ${
              co2Bad ? 'bg-red-950/70 border-red-500 animate-pulse' : 'bg-slate-900/60 border-slate-700/60'
            }`}>
              <span className="text-[10px] font-mono text-slate-300">CO₂ Level</span>
              <span className={`text-[11px] font-black font-mono ${co2Bad ? 'text-red-400' : resources.co2Level > 1800 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {resources.co2Level} ppm
              </span>
            </div>

            {/* Modules power toggles with intuitive night status */}
            <div className="text-[9px] font-black text-amber-400 font-mono uppercase tracking-widest mt-1 mb-0.5">
              Power Modules
            </div>
            <div className="space-y-1">
              {modules.slice(0, 7).map(mod => {
                const isSolar = mod.id === 'solar-array';
                const isFission = mod.id === 'nuclear-fission';
                const needsFission = isNight && isFission && !mod.isActive;

                return (
                  <button
                    key={mod.id}
                    onClick={() => {
                      soundFx.playClick();
                      setState(prev => ({
                        ...prev,
                        modules: prev.modules.map(m => m.id === mod.id ? { ...m, isActive: !m.isActive } : m)
                      }));
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-[10px] font-mono transition-all ${
                      needsFission
                        ? 'bg-amber-950/80 border-amber-400 text-amber-200 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                        : mod.isActive
                        ? 'bg-slate-900/80 border-emerald-500/30 text-slate-200 hover:border-amber-500/50'
                        : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        mod.isActive ? 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]' : 'bg-slate-600'
                      }`} />
                      <span className="truncate">{mod.name.split(' ').slice(0, 2).join(' ')}</span>
                    </div>

                    <span className={`shrink-0 font-black ${
                      isSolar && isNight
                        ? 'text-amber-400'
                        : mod.powerConsumption < 0
                        ? 'text-emerald-400'
                        : 'text-amber-300'
                    }`}>
                      {isSolar && isNight ? '0kW (Night)' : `${mod.powerConsumption > 0 ? '-' : '+'}${Math.abs(mod.powerConsumption)}kW`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── CENTER: Massive Immersive 3D Outpost (Dominant Screen Area) ─── */}
        <div className="flex-1 flex flex-col relative z-10 p-2 sm:p-3 overflow-hidden">
          {/* Top Camera Controls Overlay */}
          <div className="flex items-center justify-between mb-2 z-20 gap-2 flex-wrap sm:flex-nowrap">
            {/* View presets */}
            <div className="flex items-center gap-1 p-1 bg-slate-950/85 backdrop-blur-md rounded-2xl border border-slate-700/60 shadow-lg text-[10px] font-mono">
              <span className="text-[9px] text-cyan-400 font-bold px-1.5 uppercase tracking-wider hidden sm:inline">VIEW:</span>
              {[
                { id: 'orbit', label: '🌐 Orbit' },
                { id: 'dome', label: '🏠 Habitat' },
                { id: 'greenhouse', label: '🌱 Crops' },
                { id: 'rover', label: '🚜 Rover' },
                { id: 'crew', label: '👨‍🚀 Crew' },
                { id: 'solar', label: '⚡ Solar' },
                { id: 'comms', label: '📡 Comms' },
                { id: 'wide', label: '🌌 Wide' },
              ].map((cam) => (
                <button
                  key={cam.id}
                  onClick={() => {
                    soundFx.playClick();
                    setCameraMode(cam.id as typeof cameraMode);
                  }}
                  className={`px-2 py-1 rounded-xl transition-all ${
                    cameraMode === cam.id
                      ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 shadow-[0_0_8px_rgba(6,182,212,0.3)] font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {cam.label}
                </button>
              ))}
            </div>

            {/* Quick 360° Rotate & Zoom Bar + Fullscreen */}
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5 p-1 bg-slate-950/85 backdrop-blur-md rounded-2xl border border-slate-700/60 shadow-lg text-[10px] font-mono">
                <button
                  onClick={() => { soundFx.playClick(); triggerCamera('rotateLeft'); }}
                  className="px-2 py-1 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-bold"
                  title="Rotate Camera Left 45°"
                >
                  ↺ 45°
                </button>
                <button
                  onClick={() => { soundFx.playClick(); triggerCamera('rotateRight'); }}
                  className="px-2 py-1 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-bold"
                  title="Rotate Camera Right 45°"
                >
                  ↻ 45°
                </button>
                <div className="w-px h-3 bg-slate-700 mx-0.5" />
                <button
                  onClick={() => { soundFx.playClick(); triggerCamera('zoomIn'); }}
                  className="px-2 py-1 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-bold"
                  title="Zoom In Closer"
                >
                  ➕ Zoom
                </button>
                <button
                  onClick={() => { soundFx.playClick(); triggerCamera('zoomOut'); }}
                  className="px-2 py-1 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-bold"
                  title="Zoom Out"
                >
                  ➖ Zoom
                </button>
                <button
                  onClick={() => { soundFx.playClick(); setCameraMode('orbit'); triggerCamera('reset'); }}
                  className="px-2 py-1 rounded-xl text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 transition-all font-bold"
                  title="Reset to Orbit View"
                >
                  🎯 Reset
                </button>
              </div>

              {/* HUD Labels Toggle Button */}
              <button
                onClick={() => {
                  soundFx.playClick();
                  setShowLabels(prev => !prev);
                }}
                className={`px-2.5 py-1.5 rounded-2xl border font-mono text-[10px] font-bold shadow-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                  showLabels
                    ? 'bg-amber-500/25 text-amber-300 border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-700'
                }`}
                title="Toggle 3D Floating Popup HUDs (Default: Clean view, popups on hover)"
              >
                <span>{showLabels ? '🏷️ Popups: ALL' : '🏷️ Popups: HOVER'}</span>
              </button>

              {/* Cinematic Fullscreen Toggle Button */}
              <button
                onClick={() => {
                  soundFx.playClick();
                  setIsCinematicFullscreen(prev => !prev);
                }}
                className="px-3 py-1.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-slate-700 font-mono text-[10px] font-bold shadow-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span>{isCinematicFullscreen ? '⊟ Exit Cinema' : '⛶ Fullscreen 3D'}</span>
              </button>
            </div>
          </div>

          {/* Full-size 3D Canvas Viewport */}
          <div className="flex-1 w-full h-full min-h-[360px] sm:min-h-[460px] rounded-3xl overflow-hidden border border-cyan-500/30 bg-slate-950/40 backdrop-blur-sm shadow-[0_0_50px_rgba(6,182,212,0.15)] relative">
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center bg-slate-950">
                  <div className="text-5xl animate-spin">🚀</div>
                </div>
              }
            >
              <MiniOutpostScene
                health={state.sustainabilityScore}
                isMars={!isMoon}
                isDaytime={state.isDaytime}
                activeHazard={state.activeHazards[0]?.type || null}
                shieldActive={resources.stormShelterActive}
                shieldThickness={resources.shieldingThicknessCm}
                foodRations={resources.foodRations}
                cameraMode={cameraMode}
                cameraCommand={cameraCommand}
                roverCommand={roverCommand}
                crewCommand={crewCommand}
                showLabels={showLabels}
                crew={state.crew}
                selectedCrewId={selectedCrewId}
                onSelectCrew={(id) => {
                  setSelectedCrewId(id);
                  setInspectedObject(`crew-${id}`);
                  setCameraMode('crew');
                }}
                onInspect={(obj) => {
                  setInspectedObject(obj);
                  if (obj === 'rover') setCameraMode('rover');
                  else if (obj === 'dome') setCameraMode('dome');
                  else if (obj === 'greenhouse') setCameraMode('greenhouse');
                  else if (obj === 'solar') setCameraMode('solar');
                  else if (obj === 'antenna') setCameraMode('comms');
                  else if (obj === 'crew' || obj.startsWith('crew')) setCameraMode('crew');
                  else if (obj === 'lifesupport') setCameraMode('lifesupport');
                  else if (obj === 'tanks') setCameraMode('tanks');
                  else if (obj === 'celestial') setCameraMode('celestial');
                }}
              />
            </Suspense>

            {/* Bottom guide tooltip */}
            <div className="absolute bottom-3 left-3 text-[9px] font-mono text-slate-300 bg-slate-950/80 px-2.5 py-1 rounded-full border border-slate-700/80 backdrop-blur-md pointer-events-none shadow-md">
              💡 Left Click & Drag for 360° Orbit • Click any Outpost Module, Rover, Astronaut, Earth/Phobos or Rock
            </div>
          </div>

          {/* Interactive 3D Object Inspection Card */}
          {inspectedObject && (() => {
            const inspectedCrewMember = (inspectedObject === 'crew' || inspectedObject.startsWith('crew-'))
              ? (crew.find(c => c.id === (inspectedObject === 'crew' ? (selectedCrewId || 'elena') : inspectedObject.replace('crew-', ''))) || crew[0])
              : null;

            return (
              <div className="mt-2 w-full bg-slate-900/95 border border-cyan-500/60 rounded-2xl p-3 backdrop-blur-2xl shadow-[0_0_35px_rgba(6,182,212,0.3)] flex items-center justify-between gap-3 animate-in fade-in zoom-in-95 duration-200 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-3xl shrink-0">
                    {inspectedCrewMember
                      ? inspectedCrewMember.avatar
                      : inspectedObject === 'rover'
                      ? '🚜'
                      : inspectedObject === 'dome'
                      ? '🏠'
                      : inspectedObject === 'greenhouse'
                      ? '🌱'
                      : inspectedObject === 'solar'
                      ? '⚡'
                      : inspectedObject === 'antenna'
                      ? '📡'
                      : inspectedObject === 'lifesupport'
                      ? '🧪'
                      : inspectedObject === 'tanks'
                      ? '🛢️'
                      : inspectedObject === 'shield'
                      ? '🛡️'
                      : inspectedObject === 'celestial'
                      ? (isMoon ? '🌍' : '🔴')
                      : inspectedObject === 'lights'
                      ? '💡'
                      : inspectedObject === 'boulder'
                      ? '🪨'
                      : '👨‍🚀'}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-black font-mono text-white uppercase flex items-center gap-2 flex-wrap">
                      {inspectedCrewMember ? (
                        <>
                          <span className="text-cyan-200 font-extrabold">{inspectedCrewMember.name}</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-cyan-950 border border-cyan-500/50 text-cyan-300 text-[9px] font-mono font-bold tracking-wider">
                            {inspectedCrewMember.role}
                          </span>
                          <span className="text-[9px] text-slate-400 font-normal">
                            ({inspectedCrewMember.status === 'sheltered' ? 'In Shelter' : inspectedCrewMember.status === 'incapacitated' ? 'Incapacitated' : 'EVA Station'})
                          </span>
                        </>
                      ) : inspectedObject === 'rover'
                        ? 'Surface Patrol Rover'
                        : inspectedObject === 'dome'
                        ? 'Pressurized Habitation Dome'
                        : inspectedObject === 'greenhouse'
                        ? 'Bio-Regenerative Hydroponic Greenhouse'
                        : inspectedObject === 'solar'
                        ? 'Ultraflex Solar Array'
                        : inspectedObject === 'antenna'
                        ? 'High-Gain Deep Space Antenna'
                        : inspectedObject === 'lifesupport'
                        ? 'ISRU Atmosphere Processor & MOXIE'
                        : inspectedObject === 'tanks'
                        ? 'Cryogenic LOX & Water Reservoirs'
                        : inspectedObject === 'shield'
                        ? 'Sinter-Shield Nanite Deflection Grid'
                        : inspectedObject === 'celestial'
                        ? (isMoon ? 'Earth - Houston Mission Control Direct Link' : 'Phobos Mars Reconnaissance Relay')
                        : inspectedObject === 'lights'
                        ? 'Outpost Perimeter Mast Floodlights'
                        : inspectedObject === 'boulder'
                        ? 'Basaltic Regolith Sample Deposit'
                        : 'Surface EVA Astronaut'}
                    </div>
                    <div className="text-[10px] font-mono text-cyan-400 truncate">
                      {inspectedCrewMember
                        ? `Duty: ${inspectedCrewMember.specialtySkill} • Health: ${inspectedCrewMember.health}% • Morale: ${inspectedCrewMember.morale}% • Radiation: ${inspectedCrewMember.radiationDose.toFixed(1)} mSv`
                        : inspectedObject === 'rover'
                        ? 'Status: Ready to deploy on crater resource survey'
                        : inspectedObject === 'dome'
                        ? `Internal Atmosphere: 101.3 kPa • O₂ ${resources.o2PartialPressure.toFixed(1)}% nominal`
                        : inspectedObject === 'greenhouse'
                        ? `Crops: Dwarf Wheat & Martian Microgreens • LED PAR: 450 μmol/m²/s • Current Store: ${resources.foodRations.toFixed(0)} rations`
                        : inspectedObject === 'solar'
                        ? (isNight ? 'Array Status: Parked (Night - 0kW)' : `Generating: +${resources.powerGeneration.toFixed(1)}kW clean power`)
                        : inspectedObject === 'antenna'
                        ? (isMoon ? 'Ground Station: Houston Direct Link (1.3s delay)' : 'Deep Space Network Relay: Canberra (14.2m delay)')
                        : inspectedObject === 'lifesupport'
                        ? `Sabatier Catalyst: 98.4% efficiency • O₂ Yield: +12.4 g/hr • CO₂ Level: ${resources.co2Level.toFixed(0)} ppm`
                        : inspectedObject === 'tanks'
                        ? `Tank A (H₂O): ${resources.waterReserve.toFixed(1)}L / ${resources.waterCapacity}L • Tank B (Liquid O₂): 90K Cryogenic`
                        : inspectedObject === 'shield'
                        ? `Thickness: ${resources.shieldingThicknessCm}cm Nanite Sintered • Status: ${resources.stormShelterActive ? 'MAX DEFLECTION' : 'STANDBY'}`
                        : inspectedObject === 'celestial'
                        ? (isMoon ? 'Apollo Horizon Link: 1.28s light delay • DSN Goldstone 34m Beam' : 'Mars Orbiter UHF Relay: 14m 18s light delay')
                        : inspectedObject === 'lights'
                        ? 'High-mast LED array • Lumens: 48,000 lm • Horizon Coverage: 120m'
                        : inspectedObject === 'boulder'
                        ? 'Composition: 84% Silicates, 12% Ilmenite (Titanium-Iron Oxide), 4% Volatiles'
                        : 'Suit Pressure: 29.6 kPa • O₂ Reserves 95%'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {inspectedObject === 'greenhouse' && (
                    <>
                      <button
                        onClick={harvestFood}
                        className="px-3 py-1.5 rounded-xl bg-linear-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white text-[10px] font-mono font-black shadow-md transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        <span>🌱 HARVEST</span>
                        <span className="text-emerald-200">(+15)</span>
                      </button>
                      <button
                        onClick={boostPAR}
                        className="px-3 py-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white text-[10px] font-mono font-black shadow-md transition-all cursor-pointer active:scale-95"
                      >
                        💡 BOOST PAR
                      </button>
                    </>
                  )}
                  {inspectedObject === 'rover' && (
                    <button
                      onClick={dispatchRover}
                      className="px-3 py-1.5 rounded-xl bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-[10px] font-mono font-black shadow-md transition-all cursor-pointer active:scale-95"
                    >
                      DISPATCH SURVEY
                    </button>
                  )}
                  {inspectedObject === 'dome' && (
                    <button
                      onClick={cycleAirlock}
                      className="px-3 py-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white text-[10px] font-mono font-black shadow-md transition-all cursor-pointer active:scale-95"
                    >
                      TEST AIRLOCK
                    </button>
                  )}
                  {inspectedObject === 'solar' && (
                    <button
                      onClick={realignSolar}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-mono font-black shadow-md transition-all cursor-pointer active:scale-95"
                    >
                      REALIGN CELLS
                    </button>
                  )}
                  {inspectedObject === 'antenna' && (
                    <button
                      onClick={pingMissionControl}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-mono font-black shadow-md transition-all cursor-pointer active:scale-95"
                    >
                      PING DSN
                    </button>
                  )}
                  {inspectedObject === 'lifesupport' && (
                    <>
                      <button
                        onClick={ventCO2}
                        className="px-3 py-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white text-[10px] font-mono font-black shadow-md transition-all cursor-pointer active:scale-95"
                      >
                        💨 PURGE CO₂
                      </button>
                      <button
                        onClick={boostISRU}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-mono font-black shadow-md transition-all cursor-pointer active:scale-95"
                      >
                        ⚡ BOOST ISRU
                      </button>
                    </>
                  )}
                  {inspectedObject === 'tanks' && (
                    <>
                      <button
                        onClick={ventCryoValve}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-mono font-black shadow-md transition-all cursor-pointer active:scale-95"
                      >
                        💧 VENT VALVE
                      </button>
                      <button
                        onClick={balanceTanks}
                        className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-mono font-black shadow-md transition-all cursor-pointer active:scale-95"
                      >
                        ⚖️ REBALANCE
                      </button>
                    </>
                  )}
                  {inspectedObject === 'shield' && (
                    <>
                      <button
                        onClick={() => soundFx.playBeep(440, 0.2)}
                        className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-mono font-black shadow-md transition-all cursor-pointer active:scale-95"
                      >
                        ⚡ DEFLECTION PULSE
                      </button>
                      <button
                        onClick={sinterShield}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-mono font-black shadow-md transition-all cursor-pointer active:scale-95"
                      >
                        🪨 SINTER +5CM
                      </button>
                    </>
                  )}
                  {inspectedObject === 'celestial' && (
                    <button
                      onClick={pingMissionControl}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-mono font-black shadow-md transition-all cursor-pointer active:scale-95"
                    >
                      🛰️ {isMoon ? 'HAIL HOUSTON' : 'RELAY TELEMETRY'}
                    </button>
                  )}
                  {inspectedObject === 'boulder' && (
                    <button
                      onClick={analyzeBoulder}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-mono font-black shadow-md transition-all cursor-pointer active:scale-95"
                    >
                      🔬 ANALYZE CORE (+2t)
                    </button>
                  )}
                  {inspectedCrewMember && (
                    <>
                      <button
                        onClick={saluteCrew}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-mono font-black shadow-md transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                        title="Salute astronaut at station"
                      >
                        <span>🫡</span>
                        <span>SALUTE</span>
                      </button>
                      <button
                        onClick={() => {
                          soundFx.playClick();
                          setShowCrewModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white text-[10px] font-mono font-black shadow-md transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                        title="View complete bio-telemetry and role details"
                      >
                        <span>📋</span>
                        <span>BIO & ROLES</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setInspectedObject(null)}
                    className="w-7 h-7 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Log ticker */}
          <div className="mt-2 w-full bg-slate-900/60 border border-slate-700/40 rounded-xl backdrop-blur-sm shrink-0">
            <LogTicker logs={state.logs} />
          </div>
        </div>

        {/* ─── RIGHT: Actions & Crew (Collapsible on Cinematic) ─── */}
        {!isCinematicFullscreen && (
          <div className="relative z-10 w-52 shrink-0 flex flex-col gap-2 p-3 bg-slate-950/75 backdrop-blur-xl border-l border-slate-800/80 overflow-y-auto">
            <div className="text-[9px] font-black text-cyan-400 font-mono uppercase tracking-widest mb-1">
              Commander Actions
            </div>

            {/* Shelter button */}
            <button
              onClick={toggleShelter}
              className={`w-full p-2.5 rounded-2xl border font-mono font-black text-sm transition-all flex items-center gap-2.5 ${
                resources.stormShelterActive
                  ? 'bg-indigo-700/80 border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]'
                  : hasFlare || hasStorm
                  ? 'bg-red-700/80 border-red-400 text-white animate-bounce shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                  : 'bg-slate-900/60 border-slate-700 text-slate-200 hover:border-red-500/50'
              }`}
            >
              <span className="text-xl">{resources.stormShelterActive ? '🛡️' : '🚨'}</span>
              <div className="text-left">
                <div className="text-[11px]">{resources.stormShelterActive ? 'IN SHELTER' : 'STORM SHELTER'}</div>
                <div className="text-[9px] text-slate-300 font-normal">{resources.stormShelterActive ? 'Protected' : 'Emergency'}</div>
              </div>
            </button>

            {/* Sinter button */}
            <button
              onClick={sinterShield}
              disabled={resources.regolithStored < 5}
              className={`w-full p-2.5 rounded-2xl border font-mono font-black transition-all flex items-center gap-2.5 ${
                resources.regolithStored >= 5
                  ? 'bg-purple-950/60 border-purple-500/50 text-purple-200 hover:bg-purple-900/50 hover:scale-105 active:scale-95'
                  : 'bg-slate-900/30 border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              <span className="text-xl">🪨</span>
              <div className="text-left">
                <div className="text-[11px]">SINTER SHIELD</div>
                <div className="text-[9px] font-normal text-slate-400">{resources.regolithStored.toFixed(0)}t / 5t</div>
              </div>
            </button>

            {/* Objectives */}
            <div className="text-[9px] font-black text-emerald-400 font-mono uppercase tracking-widest mt-1 mb-1">
              Goals
            </div>
            <div className="space-y-1.5">
              {state.objectives.map(obj => (
                <div key={obj.id} className={`p-2 rounded-xl border text-[10px] font-mono ${
                  obj.completed ? 'bg-emerald-950/60 border-emerald-500/40' : 'bg-slate-900/60 border-slate-700/60'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-200 font-bold truncate">{obj.title.split(' ').slice(0, 3).join(' ')}</span>
                    {obj.completed && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${obj.completed ? 'bg-emerald-400' : 'bg-cyan-500'}`}
                      style={{ width: `${Math.min(100, (obj.currentValue / obj.targetValue) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Crew */}
            <div className="flex items-center justify-between mt-1 mb-1">
              <div className="text-[9px] font-black text-cyan-400 font-mono uppercase tracking-widest">
                Outpost Crew ({crew.length})
              </div>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setShowCrewModal(true);
                }}
                className="text-[8px] font-mono text-cyan-300 hover:text-white px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/40 hover:bg-cyan-800/60 transition-all cursor-pointer flex items-center gap-0.5"
                title="Open Crew Bio-Telemetry and Roles Roster"
              >
                <span>Roles</span>
                <span>↗</span>
              </button>
            </div>
            <div className="space-y-1.5">
              {crew.map(member => {
                const isSelected = selectedCrewId === member.id;
                return (
                  <button
                    key={member.id}
                    onClick={() => {
                      soundFx.playBeep(880, 0.08);
                      setSelectedCrewId(member.id);
                      setInspectedObject(`crew-${member.id}`);
                      setCameraMode('crew');
                    }}
                    className={`w-full text-left p-2 rounded-xl border text-[10px] font-mono transition-all cursor-pointer flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-cyan-950/80 border-cyan-400 ring-1 ring-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                        : member.status === 'incapacitated'
                        ? 'bg-red-950/60 border-red-500/40 animate-pulse hover:border-red-400'
                        : member.status === 'sheltered'
                        ? 'bg-indigo-950/60 border-indigo-500/40 hover:border-indigo-400'
                        : 'bg-slate-900/60 border-slate-700/60 hover:border-cyan-500/40 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-base shrink-0">{member.avatar}</span>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-100 truncate text-[10px] leading-tight">
                            {member.name}
                          </div>
                          <div className="text-[8px] text-cyan-400 truncate font-semibold leading-tight">
                            {member.role}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 text-[10px]">
                        {member.status === 'sheltered' ? '🛡️' : member.status === 'incapacitated' ? '❌' : '✅'}
                      </div>
                    </div>

                    <div className="text-[8px] text-slate-400 line-clamp-1 leading-tight font-sans">
                      {member.specialtySkill}
                    </div>

                    <div className="w-full flex items-center gap-1.5 mt-0.5">
                      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${member.health > 50 ? 'bg-emerald-400' : 'bg-red-500'}`}
                          style={{ width: `${member.health}%` }}
                        />
                      </div>
                      <span className="text-[8px] text-slate-400 font-mono shrink-0">{member.health}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL: EXIT & MISSION MENU ── */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl">
          <div className="bg-slate-950 border border-slate-700 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4">
            <div className="text-4xl">🚀</div>
            <h3 className="text-lg font-black font-mono text-white">MISSION COMMAND MENU</h3>
            <p className="text-xs text-slate-400 font-mono">
              Sol {state.currentSol} • Sustainability {state.sustainabilityScore}% • {isMoon ? 'Moon Base Alpha' : 'Mars Outpost Prime'}
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => { soundFx.playClick(); setShowExitConfirm(false); }}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-black text-xs transition-all shadow-md"
              >
                RESUME MISSION
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setShowExitConfirm(false);
                  onSelectPlanetScreen();
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono font-black text-xs transition-all"
              >
                SWITCH PLANET / RESTART
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setShowExitConfirm(false);
                  onExitToMenu();
                }}
                className="w-full py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/60 border border-red-800 text-red-200 font-mono font-black text-xs transition-all"
              >
                ABORT TO MAIN MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: HOW TO PLAY QUICK GUIDE ── */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl">
          <div className="bg-slate-950 border border-cyan-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📖</span>
                <h3 className="text-sm font-black font-mono text-white">CADET FIELD MANUAL</h3>
              </div>
              <button
                onClick={() => setShowHowToPlay(false)}
                className="w-7 h-7 flex items-center justify-center rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40">
                <div className="font-black text-amber-300 flex items-center gap-1.5 mb-1">
                  <span>⚡</span> 1. POWER IS LIFE (DAY vs NIGHT)
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  • <strong>Daytime:</strong> Ultraflex Solar generates +12kW. Recharge your batteries!<br />
                  • <strong>Nighttime:</strong> Solar produces <strong>0kW</strong>. You MUST turn ON Kilopower Fission (+10kW) or your batteries will drain and life support will fail!
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/40">
                <div className="font-black text-cyan-300 flex items-center gap-1.5 mb-1">
                  <span>💨</span> 2. BREATHING & ECLSS
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Keep Sabatier O₂ active. If CO₂ exceeds 1800 ppm, turn ON Amine Thermal scrubbers immediately!
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-red-950/40 border border-red-500/40">
                <div className="font-black text-red-300 flex items-center gap-1.5 mb-1">
                  <span>🌪️</span> 3. WEATHER & HAZARDS
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  • When a Solar Flare or Dust Storm hits, click <strong>IN SHELTER</strong> immediately!<br />
                  • Gather regolith with the Rover and click <strong>SINTER SHIELD</strong> to permanently block radiation.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHowToPlay(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-black text-xs transition-all shadow-md mt-2"
            >
              GOT IT, COMMANDER! 🚀
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: CREW ROSTER & ASSIGNMENTS ── */}
      <CrewManagementModal
        isOpen={showCrewModal}
        crew={crew}
        onAssignCrew={handleAssignCrew}
        onClose={() => setShowCrewModal(false)}
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN APP — Flow controller
// ════════════════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [location, setLocation] = useState<OutpostLocation>('moon');
  const [state, setState] = useState<OutpostState>(() => getInitialScenario('moon'));
  const [isMuted, setIsMuted] = useState(false);
  const [showLearn, setShowLearn] = useState(false);

  // Simulation tick
  useEffect(() => {
    if (screen !== 'game') return;
    const timer = setInterval(() => {
      setState(prev => tickSimulation(prev, 0.6));
    }, 600);
    return () => clearInterval(timer);
  }, [screen]);

  // Alert sound on new hazard
  const prevHazardCount = useRef(0);
  useEffect(() => {
    if (state.activeHazards.length > prevHazardCount.current) soundFx.playAlarm();
    prevHazardCount.current = state.activeHazards.length;
  }, [state.activeHazards.length]);

  const handleEnterHome = useCallback(() => setScreen('select'), []);
  const handleSelectPlanet = useCallback((loc: OutpostLocation) => {
    setLocation(loc);
    setState(getInitialScenario(loc));
    setTimeout(() => setScreen('briefing'), 800);
  }, []);
  const handleStartMission = useCallback(() => setScreen('game'), []);
  const handleRestart = useCallback((loc: OutpostLocation) => {
    setState(getInitialScenario(loc));
    setLocation(loc);
    setScreen('select');
  }, []);

  // Game over
  if (screen === 'game' && state.gameOver) {
    return <DebriefScreen state={state} onRestart={handleRestart} />;
  }

  return (
    <>
      {screen === 'home' && <HomeScreen onEnter={handleEnterHome} />}
      {screen === 'select' && <PlanetSelectScreen onSelect={handleSelectPlanet} onBack={() => setScreen('home')} />}
      {screen === 'briefing' && <BriefingScreen location={location} onStart={handleStartMission} />}
      {screen === 'game' && (
        <GameHUD
          state={state}
          setState={setState}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          onLearn={() => { soundFx.playBeep(); setShowLearn(true); }}
          onExitToMenu={() => { soundFx.playClick(); setScreen('home'); }}
          onSelectPlanetScreen={() => { soundFx.playClick(); setScreen('select'); }}
        />
      )}
      {showLearn && <LearnModal onClose={() => setShowLearn(false)} />}
    </>
  );
}
