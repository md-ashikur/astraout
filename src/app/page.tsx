'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { WelcomeScreen } from '../components/ui/welcome-screen';
import { PlanetSceneProps } from '../components/game-3d/planet-scene';
import {
  Zap, Wind, Shield, Sprout, Users, BookOpen, Play, Pause,
  ChevronRight, Star, Rocket, AlertTriangle, CheckCircle2,
  ShieldAlert, Wrench, Settings, Award, Volume2, VolumeX,
  Flame, Droplets, Sun, Moon, Radio, BatteryCharging, Heart,
  ArrowRight, Cpu, Globe, Sparkles, Clock
} from 'lucide-react';
import { OutpostState, OutpostLocation, SimulationSpeed, OutpostModule, Astronaut } from '../engine/simulation-types';
import { tickSimulation } from '../engine/simulation-core';
import { getInitialScenario } from '../engine/default-scenarios';
import { soundFx } from '../audio/sound-synthesizer';

// Dynamic imports for 3D components (client-only)
const PlanetScene = dynamic<PlanetSceneProps>(
  () => import('../components/game-3d/planet-scene').then(m => ({ default: m.PlanetScene })),
  { ssr: false }
);
const MiniOutpostScene = dynamic(
  () => import('../components/game-3d/mini-outpost-scene').then(m => ({ default: m.MiniOutpostScene })),
  { ssr: false }
);

// ---------- Resource Gauge Component ----------
function ResourceGauge({
  label, value, max, unit, color, icon, warning, critical
}: {
  label: string; value: number; max: number; unit: string;
  color: string; icon: React.ReactNode; warning?: number; critical?: number;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const isWarning = warning !== undefined && pct < warning;
  const isCritical = critical !== undefined && pct < critical;

  return (
    <div className={`relative flex flex-col gap-1.5 p-3 rounded-2xl border transition-all duration-300 ${
      isCritical ? 'bg-red-950/60 border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse'
      : isWarning ? 'bg-amber-950/40 border-amber-500/60'
      : 'bg-slate-900/60 border-slate-700/60 hover:border-slate-500/60'
    } backdrop-blur-sm`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className={`text-${color}`}>{icon}</div>
          <span className="text-xs font-bold text-slate-200 font-mono tracking-wide">{label}</span>
        </div>
        <span className={`text-xs font-mono font-black ${isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : `text-${color}`}`}>
          {typeof value === 'number' ? value.toFixed(1) : value}{unit}
        </span>
      </div>
      <div className="w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isCritical ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
            : isWarning ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
            : `bg-${color} shadow-[0_0_8px_rgba(6,182,212,0.5)]`
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-[10px] text-slate-500 font-mono">{pct.toFixed(0)}% capacity</div>
    </div>
  );
}

// ---------- Crew Avatar Card ----------
function CrewCard({ crew, onClick }: { crew: Astronaut; onClick: () => void }) {
  const isInDanger = crew.health < 50 || crew.fatigue > 80;
  return (
    <button onClick={onClick} className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
      isInDanger ? 'bg-red-950/60 border-red-500/50 animate-pulse' : 'bg-slate-900/60 border-slate-700/50 hover:border-cyan-500/50'
    }`}>
      <span className="text-xl">{crew.avatar}</span>
      <div className="text-left">
        <div className="text-[11px] font-bold text-slate-200 font-mono">{crew.name.split(' ')[0]}</div>
        <div className="flex items-center gap-1">
          <Heart className={`w-3 h-3 ${isInDanger ? 'text-red-400' : 'text-emerald-400'}`} />
          <div className="w-12 h-1 bg-slate-800 rounded-full">
            <div className={`h-full rounded-full ${isInDanger ? 'bg-red-500' : 'bg-emerald-400'}`} style={{ width: `${crew.health}%` }} />
          </div>
        </div>
      </div>
    </button>
  );
}

// ---------- Animated Alert Badge ----------
function AlertBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center animate-bounce shadow-[0_0_10px_rgba(239,68,68,0.8)]">
      {count}
    </span>
  );
}

// ---------- Game Action Button ----------
function GameButton({
  icon, label, onClick, variant = 'default', disabled, badge, glow
}: {
  icon: React.ReactNode; label: string; onClick: () => void;
  variant?: 'default' | 'danger' | 'success' | 'power' | 'purple';
  disabled?: boolean; badge?: number; glow?: boolean;
}) {
  const variants = {
    default: 'bg-slate-800/80 border-slate-600 text-slate-200 hover:bg-slate-700/80 hover:border-cyan-500/60',
    danger: 'bg-red-950/60 border-red-500/60 text-red-300 hover:bg-red-900/60 shadow-[0_0_15px_rgba(239,68,68,0.3)]',
    success: 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 hover:bg-emerald-900/60',
    power: 'bg-amber-950/60 border-amber-500/60 text-amber-300 hover:bg-amber-900/60',
    purple: 'bg-purple-950/60 border-purple-500/60 text-purple-300 hover:bg-purple-900/60',
  };

  return (
    <button
      onClick={() => { soundFx.playClick(); onClick(); }}
      disabled={disabled}
      className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all duration-200 font-mono text-[11px] font-bold uppercase tracking-wide
        ${variants[variant]} ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
        ${glow ? 'shadow-[0_0_20px_rgba(6,182,212,0.4)] border-cyan-400' : ''}`}
    >
      {badge !== undefined && <AlertBadge count={badge} />}
      <div className="text-lg">{icon}</div>
      <span className="leading-tight text-center">{label}</span>
    </button>
  );
}

// ---------- Mission Alert Overlay ----------
function MissionAlertOverlay({ hazard, onAction }: {
  hazard: { title: string; description: string; type: string; severity: string; nasaRemedy: string } | null;
  onAction: () => void;
}) {
  if (!hazard) return null;
  const isSevere = hazard.severity === 'severe' || hazard.severity === 'catastrophic';
  return (
    <div className={`fixed inset-x-0 top-16 z-40 mx-4 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all ${
      isSevere ? 'bg-red-950/95 border-red-400 shadow-[0_0_40px_rgba(239,68,68,0.5)]'
      : 'bg-amber-950/95 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.4)]'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl text-2xl ${isSevere ? 'bg-red-900' : 'bg-amber-900'} shrink-0`}>
          {hazard.type === 'solar-flare' ? '☀️' : hazard.type === 'dust-storm' ? '🌪️' : '⚠️'}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${isSevere ? 'bg-red-600 text-white' : 'bg-amber-600 text-slate-900'}`}>
              {hazard.severity}
            </span>
            <span className="text-sm font-black text-white font-mono">{hazard.title}</span>
          </div>
          <p className="text-xs text-slate-300 font-sans mb-2">{hazard.description}</p>
          <div className="text-[11px] text-cyan-300 font-mono">
            <span className="text-slate-400 font-sans">NASA says: </span>{hazard.nasaRemedy}
          </div>
        </div>
        <button
          onClick={onAction}
          className={`shrink-0 px-4 py-2 rounded-xl font-mono text-xs font-black transition-all hover:scale-105 ${
            isSevere ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-amber-500 hover:bg-amber-400 text-slate-900'
          }`}
        >
          RESPOND!
        </button>
      </div>
    </div>
  );
}

// ---------- Learn Modal ----------
function LearnModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [tab, setTab] = useState(0);
  if (!isOpen) return null;
  const topics = [
    {
      icon: '⚡', label: 'Power',
      title: 'How Do We Power a Mars Base?',
      content: `On Earth we plug into the wall. On Mars? No power lines exist! 
      
      🌞 Solar Panels: Giant wings that catch sunlight. But Mars gets hit by massive dust storms that block 90% of sunlight for months! The Opportunity rover died in 2018 because of one.
      
      ⚛️ Nuclear Kilopower: NASA's amazing mini nuclear reactor! Works 24/7, zero sunlight needed. About the size of a trash can but powers a whole outpost!
      
      🔋 Batteries: Store daytime solar energy for the night. But the lunar night lasts 14 EARTH DAYS!
      
      🤔 The Big Question: Would you gamble everything on solar power, or pay extra rocket mass for nuclear safety?`,
    },
    {
      icon: '💨', label: 'Air',
      title: 'Making Air on Mars!',
      content: `Mars air is 95% Carbon Dioxide (CO2) — which we breathe OUT! Breathing it in = bad.

      🏭 MOXIE Machine: NASA tested this on Mars with Perseverance! It takes CO2 from the Martian air and converts it into breathable oxygen. Like a tiny tree, but electronic!
      
      🔬 The Sabatier Reaction: CO2 + Hydrogen → Water + Methane. Then we split the water into Oxygen and Hydrogen. Science is magical!
      
      😵 What happens if scrubbers fail? CO2 builds up. First: headaches. Then: confusion. Then: blackout. That's why astronauts are VERY careful about this system!`,
    },
    {
      icon: '☢️', label: 'Radiation',
      title: 'The Invisible Danger!',
      content: `Earth has a magnetic shield (magnetosphere) protecting us. Mars has almost none!

      ☀️ Solar Particle Events (CME): The Sun randomly shoots massive waves of radiation. On Earth we see pretty auroras. On Mars, it would fry your DNA in minutes without protection!
      
      🪨 Regolith Shielding: Scientists discovered that 50cm of Martian rock blocks most radiation! Robots can 3D print homes using Mars rocks.
      
      💧 Water Shield: Water molecules contain hydrogen, which absorbs radiation really well. Astronauts could live inside water tanks! (Gross but safe!)
      
      🏃 Storm Shelter: When a solar flare hits, everyone runs to the deepest, most shielded room immediately!`,
    },
    {
      icon: '🌱', label: 'Food',
      title: 'Growing Food in Space!',
      content: `Can't order pizza on Mars! Each kg shipped from Earth costs $10,000. So we GROW food there!

      🥬 Hydroponics: Growing plants WITHOUT soil, in nutrient water! NASA astronauts already grow lettuce on the ISS. They called it "space salad" 🥗
      
      🌾 Aeroponics: Misting plant roots with water droplets. Uses 95% less water than normal farming!
      
      🔵 Spirulina Algae: A tiny blue-green algae that produces MORE protein per kilogram than beef, makes oxygen, AND absorbs CO2! NASA's secret superfood.
      
      🥔 What Would You Grow? Sweet potatoes (high calories), dwarf wheat, tomatoes... The trick is fitting a farm in a tiny pressurized dome!`,
    },
    {
      icon: '🌍', label: 'Moon vs Mars',
      title: 'Two Worlds, Different Challenges!',
      content: `MOON 🌕
      → 3 days travel from Earth
      → No atmosphere (hard vacuum)
      → Temperature: -170°C night, +120°C day
      → 14 Earth-day nights! (Power crisis!)
      → Water ice buried in dark craters at South Pole
      → Talking to Earth: only 1.3 second delay!
      
      MARS 🔴
      → 6-9 MONTHS travel time
      → Thin CO2 atmosphere
      → Temperature: -90°C to +20°C
      → Giant dust storms lasting months
      → Water frozen underground & in polar ice caps
      → Talking to Earth: 4 to 24 MINUTE delay!
      
      🤔 If something breaks on Mars, you can't call for help. YOU have to fix it!`,
    },
  ];

  const t = topics[tab];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
      <div className="bg-slate-950 border border-cyan-500/40 rounded-3xl max-w-xl w-full shadow-[0_0_60px_rgba(6,182,212,0.3)] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-950 to-cyan-950 border-b border-cyan-500/30 p-5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-xl shadow-lg">
                🚀
              </div>
              <div>
                <h2 className="text-base font-black text-white font-mono tracking-wide">NASA CADET FIELD GUIDE</h2>
                <p className="text-xs text-cyan-400 font-mono">Learn the science behind your outpost!</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-800">✕</button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-1 p-3 bg-slate-950/80 border-b border-slate-800 overflow-x-auto">
          {topics.map((t, i) => (
            <button
              key={i}
              onClick={() => setTab(i)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold font-mono whitespace-nowrap transition-all ${
                tab === i ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="p-5 max-h-[55vh] overflow-y-auto">
          <h3 className="text-base font-black text-white font-mono mb-3 flex items-center gap-2">
            <span className="text-2xl">{t.icon}</span>
            {t.title}
          </h3>
          <div className="text-sm text-slate-300 font-sans leading-relaxed whitespace-pre-line">
            {t.content}
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-black font-mono text-sm transition-all hover:scale-105"
          >
            Got it! Back to Mission 🚀
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Debrief Screen ----------
function DebriefScreen({ state, onRestart }: { state: OutpostState; onRestart: (loc: OutpostLocation) => void }) {
  useEffect(() => {
    if (state.gameWon) {
      soundFx.playSuccess();
      if (typeof window !== 'undefined') {
        import('canvas-confetti').then(({ default: confetti }) => {
          confetti({ particleCount: 200, spread: 80, origin: { y: 0.5 } });
        });
      }
    } else {
      soundFx.playAlarm();
    }
  }, [state.gameWon]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl">
      <div className="text-center max-w-md w-full p-8">
        <div className="text-8xl mb-6 animate-bounce">{state.gameWon ? '🏆' : '💥'}</div>
        <h1 className={`text-4xl font-black font-mono mb-3 ${state.gameWon ? 'text-emerald-400' : 'text-red-400'}`}>
          {state.gameWon ? 'MISSION COMPLETE!' : 'MISSION FAILED'}
        </h1>
        <p className="text-slate-300 font-sans text-sm mb-6 max-w-sm mx-auto leading-relaxed">{state.endCause}</p>
        <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-4 mb-6 text-left space-y-3">
          <div className="flex justify-between text-sm font-mono">
            <span className="text-slate-400">Sols Survived:</span>
            <span className="text-cyan-300 font-black">SOL {state.currentSol}</span>
          </div>
          <div className="flex justify-between text-sm font-mono">
            <span className="text-slate-400">Sustainability:</span>
            <span className={`font-black ${state.sustainabilityScore > 70 ? 'text-emerald-400' : 'text-amber-400'}`}>{state.sustainabilityScore}%</span>
          </div>
          <div className="flex justify-between text-sm font-mono">
            <span className="text-slate-400">Crew Status:</span>
            <span className="text-slate-200 font-black">{state.crew.filter(c => c.status !== 'incapacitated').length}/{state.crew.length} Active</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => onRestart(state.location)} className="flex-1 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-black font-mono text-sm transition-all hover:scale-105">
            🔄 Try Again
          </button>
          <button onClick={() => onRestart(state.location === 'moon' ? 'mars' : 'moon')} className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-black font-mono text-sm border border-slate-600 transition-all hover:scale-105">
            {state.location === 'moon' ? '🔴 Try Mars' : '🌕 Try Moon'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ========== MAIN GAME PAGE ==========
export default function GamePage() {
  const [gameStarted, setGameStarted] = useState(false);
  const [state, setState] = useState<OutpostState>(() => getInitialScenario('moon'));
  const [isMuted, setIsMuted] = useState(false);
  const [showLearn, setShowLearn] = useState(false);
  const [activePanel, setActivePanel] = useState<'resources' | 'crew' | 'modules' | 'objectives'>('resources');
  const [showShelterActive, setShowShelterActive] = useState(false);

  // Simulation clock
  useEffect(() => {
    const timer = setInterval(() => {
      setState(prev => tickSimulation(prev, 0.6));
    }, 600);
    return () => clearInterval(timer);
  }, []);

  // Sound FX for events
  const prevHazardCount = useRef(0);
  useEffect(() => {
    if (state.activeHazards.length > prevHazardCount.current) {
      soundFx.playAlarm();
    }
    prevHazardCount.current = state.activeHazards.length;
  }, [state.activeHazards.length]);

  const togglePause = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  const switchLocation = useCallback((loc: OutpostLocation) => {
    soundFx.playSuccess();
    setState(getInitialScenario(loc));
  }, []);

  const handleToggleActive = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      modules: prev.modules.map(m => m.id === id ? { ...m, isActive: !m.isActive } : m),
    }));
  }, []);

  const handleShelterToggle = useCallback(() => {
    soundFx.playAlarm();
    setState(prev => {
      const active = !prev.resources.stormShelterActive;
      return {
        ...prev,
        resources: { ...prev.resources, stormShelterActive: active },
        crew: prev.crew.map(c => ({ ...c, status: active ? 'sheltered' as const : 'active' as const })),
        logs: [{
          id: `shelter-${Date.now()}`, sol: prev.currentSol, timeString: `SOL ${prev.currentSol}`,
          message: active ? '🚨 ALL CREW TO STORM SHELTER!' : '✅ All clear! Crew back on duty.',
          type: active ? 'critical' as const : 'success' as const,
        }, ...prev.logs].slice(0, 30),
      };
    });
  }, []);

  const handleSinterShield = useCallback(() => {
    setState(prev => {
      if (prev.resources.regolithStored < 5) return prev;
      soundFx.playSuccess();
      return {
        ...prev,
        resources: {
          ...prev.resources,
          shieldingThicknessCm: prev.resources.shieldingThicknessCm + 5,
          regolithStored: prev.resources.regolithStored - 5,
        },
        logs: [{
          id: `sinter-${Date.now()}`, sol: prev.currentSol, timeString: `SOL ${prev.currentSol}`,
          message: `🪨 Shield upgraded to ${prev.resources.shieldingThicknessCm + 5}cm!`,
          type: 'success' as const,
        }, ...prev.logs].slice(0, 30),
      };
    });
  }, []);

  const { resources, modules, crew, activeHazards, logs, objectives } = state;
  const currentAlert = activeHazards[0] || null;
  const batteryPct = (resources.batteryStored / resources.batteryCapacity) * 100;
  const o2Pct = (resources.o2Reserve / resources.o2Capacity) * 100;
  const waterPct = (resources.waterReserve / resources.waterCapacity) * 100;
  const isMoon = state.location === 'moon';

  const handleStart = useCallback((loc: OutpostLocation) => {
    soundFx.playSuccess();
    setState(getInitialScenario(loc));
    setGameStarted(true);
  }, []);

  if (!gameStarted) {
    return <WelcomeScreen onStart={handleStart} />;
  }

  if (state.gameOver) {
    return <DebriefScreen state={state} onRestart={(loc) => { setState(getInitialScenario(loc)); setGameStarted(true); }} />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 relative select-none flex flex-col">

      {/* ── 3D BACKGROUND PLANET ── */}
      <div className="fixed inset-0 z-0">
        <Suspense fallback={
          <div className="w-full h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
        }>
          <PlanetScene location={state.location} />
        </Suspense>
      </div>

      {/* ── STAR OVERLAY GRADIENT ── */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-transparent via-slate-950/20 to-slate-950/90 pointer-events-none" />

      {/* ── ALERT OVERLAY ── */}
      <MissionAlertOverlay
        hazard={currentAlert}
        onAction={currentAlert?.type === 'solar-flare' ? handleShelterToggle : () => {}}
      />

      {/* ── TOP NAV BAR ── */}
      <header className="relative z-20 flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/60 backdrop-blur-xl shrink-0">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-lg font-black shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            🚀
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-black text-white font-mono tracking-tight leading-tight">Junior Astronaut</div>
            <div className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">Mission Trainer</div>
          </div>
        </div>

        {/* Center: Mission Status */}
        <div className="flex items-center gap-3">
          {/* Location Toggle */}
          <div className="flex items-center bg-slate-900/80 rounded-xl border border-slate-700/60 p-0.5">
            <button
              onClick={() => switchLocation('moon')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black font-mono transition-all ${
                isMoon ? 'bg-slate-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🌕 Moon
            </button>
            <button
              onClick={() => switchLocation('mars')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black font-mono transition-all ${
                !isMoon ? 'bg-red-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🔴 Mars
            </button>
          </div>

          {/* Sol Counter */}
          <div className="bg-slate-900/80 border border-cyan-500/30 px-3 py-1.5 rounded-xl text-center">
            <div className="text-[10px] text-slate-400 font-mono uppercase">Sol</div>
            <div className="text-base font-black text-cyan-400 font-mono leading-none">{state.currentSol.toString().padStart(3,'0')}</div>
          </div>

          {/* Sustainability Score */}
          <div className={`px-3 py-1.5 rounded-xl border text-center font-mono ${
            state.sustainabilityScore >= 70 ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
            : state.sustainabilityScore >= 40 ? 'bg-amber-950/60 border-amber-500/40 text-amber-400'
            : 'bg-red-950/60 border-red-500/40 text-red-400 animate-pulse'
          }`}>
            <div className="text-[10px] uppercase">Score</div>
            <div className="text-base font-black leading-none">{state.sustainabilityScore}%</div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { soundFx.playClick(); togglePause(); }}
            className={`p-2 rounded-xl border font-mono text-xs font-black transition-all ${
              state.isPaused ? 'bg-amber-600 border-amber-400 text-white' : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {state.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>

          {/* Speed */}
          {([1, 2, 5] as SimulationSpeed[]).map(s => (
            <button
              key={s}
              onClick={() => { soundFx.playClick(); setState(prev => ({ ...prev, speed: s, isPaused: false })); }}
              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-black font-mono transition-all ${
                state.speed === s && !state.isPaused ? 'bg-cyan-600 border-cyan-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {s}×
            </button>
          ))}

          <button onClick={() => { const m = soundFx.toggleMute(); setIsMuted(m); }} className="p-2 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-400 hover:text-white">
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => { soundFx.playBeep(); setShowLearn(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-black font-mono transition-all hover:scale-105 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">LEARN</span>
          </button>
        </div>
      </header>

      {/* ── MAIN GAME AREA ── */}
      <div className="relative z-10 flex-1 flex overflow-hidden">

        {/* ───── LEFT PANEL: Resource Gauges ───── */}
        <div className="w-72 shrink-0 flex flex-col gap-2 p-3 overflow-y-auto bg-slate-950/40 backdrop-blur-lg border-r border-slate-800/60">

          <div className="text-[10px] font-black text-cyan-400 font-mono uppercase tracking-widest px-1 mb-1 flex items-center gap-1.5">
            <Cpu className="w-3 h-3" /> Outpost Systems
          </div>

          {/* Power */}
          <div className={`p-3 rounded-2xl border backdrop-blur-sm transition-all ${
            batteryPct < 15 ? 'bg-red-950/60 border-red-400 animate-pulse' : 'bg-slate-900/60 border-slate-700/60'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-300 font-mono">
                <Zap className="w-4 h-4 text-amber-400" /> Power Grid
              </div>
              <span className={`text-xs font-black font-mono ${resources.powerGeneration >= resources.powerDemand ? 'text-emerald-400' : 'text-red-400'}`}>
                {resources.powerGeneration >= resources.powerDemand ? '+' : '-'}{Math.abs(resources.powerGeneration - resources.powerDemand).toFixed(1)} kW
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 mb-2 text-[10px] font-mono text-center">
              <div className="bg-slate-950/60 rounded-lg p-1.5">
                <div className="text-amber-400 font-black">{resources.powerGeneration} kW</div>
                <div className="text-slate-400">Generated</div>
              </div>
              <div className="bg-slate-950/60 rounded-lg p-1.5">
                <div className="text-slate-200 font-black">{resources.powerDemand} kW</div>
                <div className="text-slate-400">Demand</div>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <BatteryCharging className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${
                  batteryPct < 15 ? 'bg-red-500' : batteryPct < 40 ? 'bg-amber-500' : 'bg-emerald-400'
                }`} style={{ width: `${batteryPct}%` }} />
              </div>
              <span className="text-[10px] font-black text-amber-300 font-mono">{batteryPct.toFixed(0)}%</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">{resources.batteryStored}/{resources.batteryCapacity} kWh battery</div>
          </div>

          {/* O2 & CO2 */}
          <div className={`p-3 rounded-2xl border backdrop-blur-sm ${
            resources.o2PartialPressure < 18 ? 'bg-red-950/60 border-red-400 animate-pulse' : 'bg-slate-900/60 border-slate-700/60'
          }`}>
            <div className="flex items-center gap-1.5 mb-2 text-xs font-black text-cyan-300 font-mono">
              <Wind className="w-4 h-4" /> Life Support (ECLSS)
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[10px] font-mono mb-1">
                  <span className="text-slate-400">O₂ Pressure</span>
                  <span className={resources.o2PartialPressure < 19 ? 'text-red-400 font-black' : 'text-cyan-300 font-black'}>
                    {resources.o2PartialPressure} kPa
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${resources.o2PartialPressure < 19 ? 'bg-red-500' : 'bg-cyan-400'}`}
                    style={{ width: `${(resources.o2PartialPressure / 21) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-mono mb-1">
                  <span className="text-slate-400">CO₂ Level</span>
                  <span className={resources.co2Level > 2500 ? 'text-red-400 font-black animate-pulse' : resources.co2Level > 1500 ? 'text-amber-400 font-black' : 'text-emerald-400 font-black'}>
                    {resources.co2Level} ppm
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${
                    resources.co2Level > 2500 ? 'bg-red-500' : resources.co2Level > 1500 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`} style={{ width: `${Math.min(100, (resources.co2Level / 5000) * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Water */}
          <div className="p-3 rounded-2xl border border-slate-700/60 bg-slate-900/60 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-blue-300 font-mono">
                <Droplets className="w-4 h-4 text-blue-400" /> Water Loop
              </div>
              <span className="text-[10px] font-mono text-slate-400">{resources.waterRecyclingEfficiency}% recycled</span>
            </div>
            <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden mb-1">
              <div className={`h-full rounded-full transition-all duration-700 ${waterPct < 20 ? 'bg-red-500' : 'bg-blue-400'}`}
                style={{ width: `${waterPct}%` }} />
            </div>
            <div className="text-[10px] font-mono text-slate-500">{resources.waterReserve.toFixed(0)}L / {resources.waterCapacity}L</div>
          </div>

          {/* Radiation */}
          <div className={`p-3 rounded-2xl border backdrop-blur-sm ${
            resources.internalRadiation > 0.05 ? 'bg-purple-950/60 border-purple-400' : 'bg-slate-900/60 border-slate-700/60'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-purple-300 font-mono">
                <Radio className="w-4 h-4 text-purple-400" /> Radiation Shield
              </div>
              {resources.stormShelterActive && (
                <span className="text-[10px] font-black text-indigo-300 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-500/50">SHELTERED</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-center mb-2">
              <div className="bg-slate-950/60 rounded-lg p-1.5">
                <div className="text-purple-300 font-black">{resources.shieldingThicknessCm}cm</div>
                <div className="text-slate-400">Rock Shield</div>
              </div>
              <div className="bg-slate-950/60 rounded-lg p-1.5">
                <div className={`font-black ${resources.internalRadiation > 0.05 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {resources.internalRadiation.toFixed(3)}
                </div>
                <div className="text-slate-400">mSv/hr</div>
              </div>
            </div>
          </div>

          {/* Food */}
          <div className={`p-3 rounded-2xl border backdrop-blur-sm ${
            resources.foodRations < 12 ? 'bg-red-950/60 border-red-400 animate-pulse' : 'bg-slate-900/60 border-slate-700/60'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-300 font-mono">
                <Sprout className="w-4 h-4 text-emerald-400" /> Agriculture
              </div>
              <span className={`text-[10px] font-black font-mono ${resources.foodRations < 12 ? 'text-red-400' : 'text-emerald-400'}`}>
                {resources.foodRations.toFixed(0)} meals
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 mb-1">Crop Growth</div>
            <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden mb-1">
              <div className="h-full rounded-full bg-emerald-400 transition-all duration-700"
                style={{ width: `${resources.cropHarvestProgress}%` }} />
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              {resources.cropHarvestProgress}% — {resources.cropHealth}% plant health
            </div>
          </div>
        </div>

        {/* ───── CENTER: 3D Outpost View ───── */}
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden p-4">

          {/* Outpost Name */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-center">
            <div className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-400 mb-0.5">Command Post</div>
            <h2 className="text-xl font-black text-white font-mono drop-shadow-2xl">
              {isMoon ? '🌕 ARTEMIS BASE ALPHA' : '🔴 ARES OUTPOST PRIME'}
            </h2>
            <div className="text-xs text-cyan-400 font-mono">
              {isMoon ? 'Shackleton Crater, Lunar South Pole' : 'Jezero Crater, Mars Northern Lowlands'}
            </div>
          </div>

          {/* 3D Mini Outpost View */}
          <div className="w-full max-w-sm aspect-square relative mt-8">
            <div className="absolute inset-0 rounded-3xl overflow-hidden border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.2)] bg-slate-950/40 backdrop-blur-sm">
              <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center bg-slate-900">
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-5xl animate-spin">🚀</div>
                    <span className="text-xs text-cyan-400 font-mono">Loading Outpost...</span>
                  </div>
                </div>
              }>
                <MiniOutpostScene health={state.sustainabilityScore} isMars={!isMoon} />
              </Suspense>
            </div>
            {/* Orbit ring decoration */}
            <div className="absolute -inset-6 rounded-full border border-cyan-500/10 pointer-events-none" />
            <div className="absolute -inset-12 rounded-full border border-cyan-500/5 pointer-events-none" />
          </div>

          {/* Day/Night Status */}
          <div className="flex items-center gap-4 mt-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-black font-mono ${
              state.isDaytime
                ? 'bg-amber-950/60 border-amber-400/50 text-amber-300'
                : 'bg-indigo-950/60 border-indigo-400/50 text-indigo-300'
            }`}>
              {state.isDaytime ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {state.isDaytime ? 'DAYTIME' : 'NIGHTFALL'}
              <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden ml-1">
                <div className="h-full bg-current rounded-full" style={{ width: `${state.solProgress * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Recent log entries */}
          <div className="mt-4 w-full max-w-sm space-y-1">
            {logs.slice(0, 3).map(log => (
              <div key={log.id} className={`text-[11px] font-mono px-3 py-1.5 rounded-xl border flex items-center gap-2 ${
                log.type === 'critical' ? 'bg-red-950/60 border-red-500/40 text-red-300'
                : log.type === 'warning' ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                : log.type === 'success' ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900/60 border-slate-700/60 text-slate-400'
              }`}>
                <span>{log.type === 'critical' ? '🚨' : log.type === 'success' ? '✅' : log.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
                <span className="truncate">{log.message}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ───── RIGHT PANEL: Actions ───── */}
        <div className="w-64 shrink-0 flex flex-col gap-2 p-3 bg-slate-950/40 backdrop-blur-lg border-l border-slate-800/60 overflow-y-auto">

          <div className="text-[10px] font-black text-cyan-400 font-mono uppercase tracking-widest px-1 mb-1 flex items-center gap-1.5">
            <Settings className="w-3 h-3" /> Commander Actions
          </div>

          {/* Emergency Storm Shelter */}
          <button
            onClick={handleShelterToggle}
            className={`w-full p-3 rounded-2xl border font-mono font-black text-sm transition-all flex items-center gap-3 ${
              resources.stormShelterActive
                ? 'bg-indigo-600/80 border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] animate-pulse'
                : currentAlert?.type === 'solar-flare'
                ? 'bg-red-600/80 border-red-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-bounce'
                : 'bg-slate-900/60 border-slate-700 text-slate-200 hover:border-red-500/60 hover:bg-red-950/30'
            }`}
          >
            <span className="text-2xl">{resources.stormShelterActive ? '🛡️' : '🚨'}</span>
            <div className="text-left">
              <div className="text-xs">{resources.stormShelterActive ? 'SHELTER ACTIVE' : 'STORM SHELTER'}</div>
              <div className="text-[9px] text-slate-300 font-normal">
                {resources.stormShelterActive ? 'Crew is protected' : 'Emergency evacuation'}
              </div>
            </div>
          </button>

          {/* Sinter Shield */}
          <button
            onClick={handleSinterShield}
            disabled={resources.regolithStored < 5}
            className={`w-full p-3 rounded-2xl border font-mono font-black text-sm transition-all flex items-center gap-3 ${
              resources.regolithStored >= 5
                ? 'bg-purple-950/60 border-purple-500/60 text-purple-200 hover:bg-purple-900/60 hover:scale-105 active:scale-95'
                : 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span className="text-2xl">🪨</span>
            <div className="text-left">
              <div className="text-xs">SINTER SHIELD</div>
              <div className="text-[9px] text-slate-300 font-normal">{resources.regolithStored.toFixed(1)}t / 5t needed</div>
            </div>
          </button>

          {/* Objectives Panel */}
          <div className="mt-1">
            <div className="text-[10px] font-black text-emerald-400 font-mono uppercase tracking-widest px-1 mb-2 flex items-center gap-1.5">
              <Star className="w-3 h-3" /> Mission Goals
            </div>
            <div className="space-y-2">
              {objectives.map(obj => (
                <div key={obj.id} className={`p-2.5 rounded-xl border text-[11px] font-mono transition-all ${
                  obj.completed ? 'bg-emerald-950/60 border-emerald-500/40' : 'bg-slate-900/60 border-slate-700/60'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-200 font-bold truncate text-[10px]">{obj.title}</span>
                    {obj.completed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : null}
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${obj.completed ? 'bg-emerald-400' : 'bg-cyan-500'}`}
                      style={{ width: `${Math.min(100, (obj.currentValue / obj.targetValue) * 100)}%` }} />
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{obj.currentValue} / {obj.targetValue} {obj.unit}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Crew Roster Quick View */}
          <div className="mt-1">
            <div className="text-[10px] font-black text-cyan-400 font-mono uppercase tracking-widest px-1 mb-2 flex items-center gap-1.5">
              <Users className="w-3 h-3" /> Crew Status
            </div>
            <div className="space-y-1.5">
              {crew.map(member => (
                <div key={member.id} className={`flex items-center gap-2 p-2 rounded-xl border text-[10px] font-mono transition-all ${
                  member.status === 'incapacitated' ? 'bg-red-950/60 border-red-500/50'
                  : member.status === 'sheltered' ? 'bg-indigo-950/60 border-indigo-500/50'
                  : member.status === 'eva-repair' ? 'bg-amber-950/60 border-amber-500/50'
                  : 'bg-slate-900/60 border-slate-700/60'
                }`}>
                  <span className="text-base">{member.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-200 truncate">{member.name.split(' ')[0]}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="flex-1 h-1 bg-slate-800 rounded-full">
                        <div className={`h-full rounded-full ${member.health > 50 ? 'bg-emerald-400' : 'bg-red-500'}`}
                          style={{ width: `${member.health}%` }} />
                      </div>
                      <span className={`text-[9px] ${member.status === 'eva-repair' ? 'text-amber-400' : member.status === 'sheltered' ? 'text-indigo-400' : 'text-slate-500'}`}>
                        {member.status === 'eva-repair' ? '🔧' : member.status === 'sheltered' ? '🛡️' : member.status === 'resting' ? '💤' : '✅'}
                      </span>
                    </div>
                  </div>
                  <div className="text-[9px] text-slate-500 font-black">{member.radiationDose.toFixed(0)}mSv</div>
                </div>
              ))}
            </div>
          </div>

          {/* Modules Power List */}
          <div className="mt-1">
            <div className="text-[10px] font-black text-amber-400 font-mono uppercase tracking-widest px-1 mb-2 flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> Module Power
            </div>
            <div className="space-y-1">
              {modules.slice(0, 6).map(mod => (
                <button
                  key={mod.id}
                  onClick={() => { soundFx.playClick(); handleToggleActive(mod.id); }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-[10px] font-mono transition-all ${
                    mod.isActive
                      ? 'bg-slate-900/80 border-emerald-500/30 text-slate-200 hover:border-amber-500/50'
                      : 'bg-slate-950/60 border-slate-800/60 text-slate-500 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${mod.isActive ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-slate-600'}`} />
                    <span className="truncate">{mod.name.split(' ').slice(0, 2).join(' ')}</span>
                  </div>
                  <span className={`font-black shrink-0 ${mod.powerConsumption < 0 ? 'text-emerald-400' : 'text-amber-300'}`}>
                    {mod.powerConsumption > 0 ? '-' : '+'}{Math.abs(mod.powerConsumption)}kW
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Learn Modal */}
      <LearnModal isOpen={showLearn} onClose={() => setShowLearn(false)} />
    </div>
  );
}
