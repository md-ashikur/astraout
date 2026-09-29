'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, OrbitControls, Html } from '@react-three/drei';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import * as THREE from 'three';
import { soundFx } from '../../audio/sound-synthesizer';
import type { Astronaut } from '../../engine/simulation-types';

// ── Pre-computed static arrays for ESLint purity ─────────────
const DUST_COUNT = 70;
const DUST_DATA = Array.from({ length: DUST_COUNT }, (_, i) => ({
  seed: i,
  radius: 1.2 + (i % 25) * 0.12,
  angle: (i / DUST_COUNT) * Math.PI * 2,
  height: 0.05 + ((i * 7) % 30) * 0.05,
  speed: 0.4 + ((i * 3) % 10) * 0.1,
  size: 0.02 + ((i * 5) % 6) * 0.008,
}));

const HAZARD_PARTICLES = Array.from({ length: 140 }, (_, i) => ({
  angle: (i / 140) * Math.PI * 2,
  dist: 0.5 + ((i * 17) % 35) * 0.1,
  height: 0.08 + ((i * 11) % 30) * 0.08,
  speed: 1.5 + ((i * 5) % 8) * 0.4,
  size: 0.03 + ((i * 3) % 5) * 0.01,
}));

// Pre-computed realistic boulders on terrain (low profile, natural embed)
const ROCK_DATA = [
  { x: -1.7, z: 0.9, s: 0.12, rx: 0.4, ry: 1.2 },
  { x: -1.9, z: -0.8, s: 0.14, rx: 1.1, ry: 0.3 },
  { x: 1.8, z: -0.5, s: 0.11, rx: 0.2, ry: 2.1 },
  { x: 1.6, z: 1.4, s: 0.10, rx: 0.8, ry: 0.9 },
  { x: -0.9, z: 1.6, s: 0.12, rx: 1.4, ry: 1.5 },
  { x: 0.5, z: 1.8, s: 0.08, rx: 0.3, ry: 2.4 },
  { x: -1.3, z: -1.5, s: 0.15, rx: 0.9, ry: 0.7 },
  { x: 1.1, z: -1.6, s: 0.11, rx: 0.5, ry: 1.8 },
  { x: -2.2, z: 0.3, s: 0.16, rx: 1.2, ry: 0.4 },
  { x: 2.1, z: 0.7, s: 0.13, rx: 0.6, ry: 1.1 },
  { x: -0.5, z: -1.9, s: 0.10, rx: 0.7, ry: 2.0 },
  { x: 1.3, z: 2.0, s: 0.12, rx: 1.3, ry: 0.5 },
];

// ── Procedural texture generators ────────────────────────────

function makeRegolithTexture(isMars: boolean) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const base = isMars ? '#7a2e14' : '#222834';
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  // Subtle natural terrain tonality / dunes gradient
  const grad = ctx.createRadialGradient(size / 2, size / 2, 40, size / 2, size / 2, size / 2);
  grad.addColorStop(0, isMars ? 'rgba(154, 52, 18, 0.35)' : 'rgba(30, 41, 59, 0.45)');
  grad.addColorStop(0.7, isMars ? 'rgba(113, 38, 14, 0.25)' : 'rgba(23, 30, 44, 0.35)');
  grad.addColorStop(1, isMars ? 'rgba(69, 26, 11, 0.55)' : 'rgba(15, 23, 42, 0.65)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Fine regolith mineral flecks & micro-grain
  for (let i = 0; i < 3500; i++) {
    const x = ((i * 167 + (i % 7) * 41) % size);
    const y = ((i * 313 + (i % 11) * 29) % size);
    const r = (i % 3) * 0.6 + 0.4;
    const dark = i % 2 === 0;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = dark
      ? 'rgba(0,0,0,0.18)'
      : isMars
      ? 'rgba(254, 215, 170, 0.12)'
      : 'rgba(226, 232, 240, 0.10)';
    ctx.fill();
  }

  // Realistic natural impact craters (soft rim & depth shadow)
  const craterCenters = [
    { x: 110, y: 140, r: 24 },
    { x: 380, y: 120, r: 18 },
    { x: 420, y: 390, r: 28 },
    { x: 120, y: 380, r: 20 },
    { x: 260, y: 80,  r: 14 },
    { x: 390, y: 250, r: 16 },
  ];
  for (const c of craterCenters) {
    const cGrad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
    cGrad.addColorStop(0, 'rgba(0,0,0,0.45)');
    cGrad.addColorStop(0.7, 'rgba(0,0,0,0.12)');
    cGrad.addColorStop(0.9, isMars ? 'rgba(254, 215, 170, 0.15)' : 'rgba(255,255,255,0.12)');
    cGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fillStyle = cGrad;
    ctx.fill();
  }

  // Realistic rover wheel ruts (subtle curved tracks through the dust)
  ctx.strokeStyle = isMars ? 'rgba(60, 20, 10, 0.25)' : 'rgba(10, 15, 25, 0.3)';
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 3]);
  ctx.beginPath();
  ctx.ellipse(size / 2, size / 2 + 10, 160, 130, 0.2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  return new THREE.CanvasTexture(canvas);
}

function makeRegolithNormalMap() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgb(128,128,255)';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 400; i++) {
    const x = (i * 127) % size;
    const y = (i * 179) % size;
    const r = (i % 6) + 2;
    const dx = ((i * 31) % 60) - 30 + 128;
    const dy = ((i * 47) % 60) - 30 + 128;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(${dx | 0},${dy | 0},255,0.6)`);
    grad.addColorStop(1, 'rgba(128,128,255,0)');
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

function makeSolarCellTexture() {
  const w = 512; const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#080d1a';
  ctx.fillRect(0, 0, w, h);

  const cols = 12; const rows = 6;
  const pw = w / cols; const ph = h / rows;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const x = c * pw; const y = r * ph;
      const cellGrad = ctx.createLinearGradient(x, y, x + pw, y + ph);
      cellGrad.addColorStop(0, '#1e3a8a');
      cellGrad.addColorStop(0.4, '#2563eb');
      cellGrad.addColorStop(1, '#1e3a8a');
      ctx.fillStyle = cellGrad;
      ctx.fillRect(x + 1.5, y + 1.5, pw - 3, ph - 3);

      ctx.strokeStyle = 'rgba(191,219,254,0.4)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x + pw / 2, y + 1);
      ctx.lineTo(x + pw / 2, y + ph - 1);
      ctx.stroke();
    }
  }

  return new THREE.CanvasTexture(canvas);
}

function makeMetalTexture(base: string) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  for (let i = 0; i < 60; i++) {
    const y = (i * 23) % size;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + 1);
    ctx.stroke();
  }
  return new THREE.CanvasTexture(canvas);
}

function makeDomeTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, size, size);

  const hex = (cx: number, cy: number, r: number) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  };
  const R = 36;
  const hexW = R * Math.sqrt(3);
  const hexH = R * 2;
  for (let row = -1; row < size / hexH + 1; row++) {
    for (let col = -1; col < size / hexW + 1; col++) {
      const cx = col * hexW + (row % 2) * hexW / 2;
      const cy = row * hexH * 0.75;
      hex(cx, cy, R - 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.strokeStyle = 'rgba(6,182,212,0.4)';
      ctx.lineWidth = 1.3;
      ctx.stroke();
    }
  }
  return new THREE.CanvasTexture(canvas);
}

// ── Realistic 3D Terrain Boulders ─────────────────────────────
function TerrainBoulders({
  isMars,
  onInspect,
}: {
  isMars: boolean;
  onInspect?: (obj: string) => void;
}) {
  const rockColor = isMars ? '#3d2015' : '#334155';
  const [selectedRock, setSelectedRock] = useState<number | null>(null);

  return (
    <group>
      {ROCK_DATA.map((r, i) => (
        <group key={i} position={[r.x, -0.17 + r.s * 0.25, r.z]}>
          <mesh
            rotation={[r.rx, r.ry, 0]}
            scale={[r.s * 1.3, r.s * 0.45, r.s * 0.9]}
            castShadow
            receiveShadow
            onClick={(e) => {
              e.stopPropagation();
              soundFx.playScanner();
              setSelectedRock((prev) => (prev === i ? null : i));
              onInspect?.('boulder');
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'default';
            }}
          >
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color={selectedRock === i ? (isMars ? '#b45309' : '#0284c7') : rockColor}
              emissive={selectedRock === i ? (isMars ? '#f97316' : '#38bdf8') : '#000000'}
              emissiveIntensity={selectedRock === i ? 0.7 : 0}
              roughness={0.96}
              metalness={0.04}
            />
          </mesh>

          {/* 3D Scientific Analysis Tag on Click */}
          {selectedRock === i && (
            <Html center distanceFactor={6} position={[0, r.s * 0.7, 0]} style={{ pointerEvents: 'none', userSelect: 'none' }}>
              <div className="flex flex-col items-center">
                <div className="px-2 py-0.5 rounded-lg bg-slate-950/90 border border-amber-400 text-amber-300 text-[9px] font-mono shadow-xl backdrop-blur-md whitespace-nowrap flex items-center gap-1">
                  <span>🪨 SAMPLE #{i + 1}: Silicates 84% • Ilmenite 12%</span>
                </div>
                <div className="mt-1 flex items-center gap-1 pointer-events-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      soundFx.playBeep(1200, 0.1);
                      setSelectedRock(null);
                    }}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[8px] font-mono shadow cursor-pointer active:scale-95"
                  >
                    DISMISS
                  </button>
                </div>
              </div>
            </Html>
          )}
        </group>
      ))}
    </group>
  );
}

// ── Base Perimeter Floodlights (Active at Night) ──────────────
function PerimeterFloodlights({
  isDaytime,
  onClick,
}: {
  isDaytime: boolean;
  onClick?: () => void;
}) {
  const floodlightPositions: [number, number, number][] = [
    [-1.2, 0.4, 1.2],
    [1.2, 0.4, 1.2],
    [-1.2, 0.4, -1.2],
    [1.2, 0.4, -1.2],
  ];

  const [prevIsDaytime, setPrevIsDaytime] = useState(isDaytime);
  const [lightsActive, setLightsActive] = useState(!isDaytime);
  const [colorMode, setColorMode] = useState<'white' | 'amber' | 'red'>('white');
  const [hovered, setHovered] = useState(false);

  if (isDaytime !== prevIsDaytime) {
    setPrevIsDaytime(isDaytime);
    setLightsActive(!isDaytime);
  }

  const toggleLights = () => {
    soundFx.playClick();
    setLightsActive((prev) => !prev);
    onClick?.();
  };

  const cycleColor = () => {
    soundFx.playClick();
    setColorMode((prev) => (prev === 'white' ? 'amber' : prev === 'amber' ? 'red' : 'white'));
    onClick?.();
  };

  const lightColor = colorMode === 'white' ? '#f8fafc' : colorMode === 'amber' ? '#f59e0b' : '#ef4444';
  const bulbColor = colorMode === 'white' ? '#e0f2fe' : colorMode === 'amber' ? '#fbbf24' : '#f87171';

  return (
    <group>
      {floodlightPositions.map((pos, i) => (
        <group
          key={i}
          position={pos}
          onClick={(e) => {
            e.stopPropagation();
            toggleLights();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = 'default';
          }}
        >
          {/* Light mast */}
          <mesh position={[0, -0.25, 0]}>
            <cylinderGeometry args={[0.015, 0.02, 0.5, 8]} />
            <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Floodlight head */}
          <mesh position={[0, 0.02, 0]} rotation={[0.4, 0, 0]}>
            <boxGeometry args={[0.06, 0.04, 0.04]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>

          {/* Active spotlight beam */}
          {lightsActive && (
            <>
              <spotLight
                position={[0, 0.04, 0]}
                target-position={[0, -0.18, 0]}
                intensity={colorMode === 'white' ? 3.0 : 2.5}
                color={lightColor}
                angle={0.65}
                penumbra={0.5}
                distance={4.5}
              />
              <pointLight color={bulbColor} intensity={0.9} distance={0.9} />
            </>
          )}

          {/* Glowing bulb face */}
          <mesh position={[0, 0.01, 0.021]} rotation={[0.4, 0, 0]}>
            <circleGeometry args={[0.016, 8]} />
            <meshBasicMaterial color={lightsActive ? bulbColor : '#334155'} />
          </mesh>

          {/* Interactive HUD on first mast */}
          {i === 0 && hovered && (
            <Html center distanceFactor={7} position={[0, 0.25, 0]} style={{ pointerEvents: 'none', userSelect: 'none' }}>
              <div className="flex flex-col items-center">
                <div className="px-2 py-0.5 rounded-lg bg-slate-950/90 border border-amber-400/80 text-white text-[9px] font-mono shadow-xl backdrop-blur-md whitespace-nowrap flex items-center gap-1">
                  <span>💡</span>
                  <span className="font-bold text-amber-300">FLOODLIGHTS:</span>
                  <span className="text-slate-200">{lightsActive ? colorMode.toUpperCase() : 'OFF'}</span>
                </div>
                <div className="mt-1 flex items-center gap-1 pointer-events-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLights();
                    }}
                    className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-[9px] font-mono font-bold shadow cursor-pointer active:scale-95"
                  >
                    {lightsActive ? 'TURN OFF' : 'TURN ON'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      cycleColor();
                    }}
                    className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-white text-[9px] font-mono font-bold shadow cursor-pointer active:scale-95"
                  >
                    🎨 COLOR
                  </button>
                </div>
              </div>
            </Html>
          )}
        </group>
      ))}
    </group>
  );
}

// ── 3D Holographic Pin Marker with Clear Label ───────────────
function HoloPin({
  position,
  label: _label,
  icon: _icon,
  color = '#06b6d4',
  onClick,
}: {
  position: [number, number, number];
  label: string;
  icon: string;
  color?: string;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 1.5;
      const s = 1 + Math.sin(t * 3) * 0.08;
      ringRef.current.scale.set(s, s, s);
    }
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 2.0;
      coreRef.current.position.y = position[1] + Math.sin(t * 2.5) * 0.04;
    }
  });

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        soundFx.playBeep(1200);
        onClick?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      {/* Vertical laser beacon beam */}
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.005, 0.012, 0.4, 8]} />
        <meshBasicMaterial color={color} transparent opacity={hovered ? 0.9 : 0.45} />
      </mesh>

      {/* Rotating holo ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.07, 0.09, 24]} />
        <meshBasicMaterial color={color} transparent opacity={hovered ? 0.95 : 0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Floating diamond core */}
      <mesh ref={coreRef} position={[0, 0.06, 0]}>
        <octahedronGeometry args={[0.045, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? 2.5 : 1.2} />
      </mesh>

      {/* Light glow */}
      <pointLight color={color} intensity={hovered ? 0.9 : 0.3} distance={0.7} />

      {/* Label billboard on hover */}
      {hovered && (
        <group position={[0, 0.22, 0]}>
          <mesh>
            <planeGeometry args={[0.42, 0.12]} />
            <meshBasicMaterial color="#020617" transparent opacity={0.9} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0, 0.002]}>
            <planeGeometry args={[0.4, 0.1]} />
            <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ── Interactive Animated Astronaut with Duty Shifts & Full Crew Support ──
interface CrewStationConfig {
  accentColor: string;
  accentHex: string;
  stationPos: [number, number, number];
  shelterPos: [number, number, number];
  stationName: string;
  dutyLabel: string;
  defaultDialogue: string;
}

const CREW_CONFIG_MAP: Record<string, CrewStationConfig> = {
  'crew-1': {
    accentColor: '#38bdf8', // Cyan / Gold
    accentHex: '#0284c7',
    stationPos: [0.55, -0.11, 0.25],
    shelterPos: [0.18, -0.11, 0.12],
    stationName: 'Hab Airlock & Command Hub',
    dutyLabel: 'OUTPOST COMMAND',
    defaultDialogue: 'Base Alpha operational. Life support, power, and communications nominal.',
  },
  'crew-2': {
    accentColor: '#f59e0b', // Amber / Orange
    accentHex: '#d97706',
    stationPos: [-0.78, -0.11, 0.12],
    shelterPos: [0.08, -0.11, 0.18],
    stationName: 'Solar Junction Array',
    dutyLabel: 'POWER & GRID',
    defaultDialogue: 'Photovoltaic arrays tracking sun azimuth. Power reserves nominal.',
  },
  'crew-3': {
    accentColor: '#10b981', // Emerald Green
    accentHex: '#059669',
    stationPos: [-0.52, -0.11, 0.58],
    shelterPos: [-0.08, -0.11, 0.18],
    stationName: 'Hydroponic Bio-Dome',
    dutyLabel: 'HYDROPONICS',
    defaultDialogue: 'Biomass growth rate stable under high PAR lighting. O₂ release positive.',
  },
  'crew-4': {
    accentColor: '#a855f7', // Purple / Blue
    accentHex: '#7c3aed',
    stationPos: [-0.72, -0.11, -0.28],
    shelterPos: [-0.18, -0.11, 0.12],
    stationName: 'Life Support / Cryo Unit',
    dutyLabel: 'BIO-TELEMETRY',
    defaultDialogue: 'Sabatier reactor recovering O₂ from crew CO₂. Vitals within safe margins.',
  },
};

function AstronautCharacter({
  member,
  isMars: _isMars,
  isSheltered = false,
  onClick,
  crewCommand,
  targetWaypoint,
  isSelected = false,
  showLabels = false,
}: {
  member: Astronaut;
  isMars?: boolean;
  isSheltered?: boolean;
  onClick?: () => void;
  crewCommand?: { type: string; id: number } | null;
  targetWaypoint?: THREE.Vector3 | null;
  isSelected?: boolean;
  showLabels?: boolean;
}) {
  const config = CREW_CONFIG_MAP[member.id] || (
    member.role === 'Commander' ? CREW_CONFIG_MAP['crew-1'] :
    member.role === 'Systems Engineer' ? CREW_CONFIG_MAP['crew-2'] :
    member.role === 'Astrobiologist' ? CREW_CONFIG_MAP['crew-3'] :
    CREW_CONFIG_MAP['crew-4']
  );

  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  const [mode, setMode] = useState<'working' | 'walking' | 'saluting'>('working');
  const [dialogue, setDialogue] = useState(config.defaultDialogue);
  const [speechVisible, setSpeechVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  const homePos = isSheltered ? config.shelterPos : config.stationPos;
  const posRef = useRef(new THREE.Vector3(...homePos));
  const headingRef = useRef(-1.2);
  const targetPosRef = useRef(new THREE.Vector3(...homePos));
  const taskTimer = useRef(6.0);
  const saluteTimer = useRef(0);
  const speechTimer = useRef(0);
  const prevCrewCommandId = useRef<number | null>(null);
  const prevWaypoint = useRef<THREE.Vector3 | null>(null);

  // Handle external salute command from UI card
  useEffect(() => {
    if (!crewCommand || crewCommand.id === prevCrewCommandId.current) return;
    prevCrewCommandId.current = crewCommand.id;
    soundFx.playBeep(1100, 0.12);
    setMode('saluting');
    setDialogue(`${member.name}: Base Alpha operational, Commander! Salute!`);
    setSpeechVisible(true);
    saluteTimer.current = 3.5;
    speechTimer.current = 4.5;
  }, [crewCommand, member.name]);

  // Handle terrain click-to-move (only if selected)
  useEffect(() => {
    if (!isSelected || !targetWaypoint || targetWaypoint === prevWaypoint.current) return;
    prevWaypoint.current = targetWaypoint;
    soundFx.playBeep(880, 0.08);
    targetPosRef.current.set(targetWaypoint.x, -0.11, targetWaypoint.z);
    setMode('walking');
    setDialogue(`${member.name}: Moving to coordinates!`);
    setSpeechVisible(true);
    speechTimer.current = 4.0;
  }, [isSelected, targetWaypoint, member.name]);

  const doSalute = () => {
    soundFx.playBeep(1100, 0.12);
    setMode('saluting');
    setDialogue(`${member.name}: Base Alpha operational, Commander! Salute!`);
    setSpeechVisible(true);
    saluteTimer.current = 3.5;
    speechTimer.current = 4.5;
  };

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    doSalute();
    onClick?.();
  };

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    if (speechTimer.current > 0) {
      speechTimer.current -= delta;
      if (speechTimer.current <= 0) setSpeechVisible(false);
    }

    // React to sheltering state
    const desiredPos = isSheltered ? config.shelterPos : config.stationPos;
    if (isSheltered && posRef.current.distanceTo(new THREE.Vector3(...desiredPos)) > 0.08 && mode !== 'walking') {
      targetPosRef.current.set(desiredPos[0], desiredPos[1], desiredPos[2]);
      setMode('walking');
      setDialogue('Retreating to storm shelter!');
      setSpeechVisible(true);
      speechTimer.current = 3.0;
    }

    if (mode === 'saluting') {
      saluteTimer.current -= delta;
      const dx = state.camera.position.x - posRef.current.x;
      const dz = state.camera.position.z - posRef.current.z;
      const targetAngle = Math.atan2(dx, dz);
      let diff = targetAngle - headingRef.current;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      headingRef.current += diff * 0.15;

      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = 0.5;
        rightArmRef.current.rotation.z = -1.9;
      }
      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x = 0;
        rightLegRef.current.rotation.x = 0;
      }

      if (saluteTimer.current <= 0) {
        setMode('working');
        taskTimer.current = 4.0;
      }
    } else if (mode === 'walking') {
      const dx = targetPosRef.current.x - posRef.current.x;
      const dz = targetPosRef.current.z - posRef.current.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.04) {
        const targetAngle = Math.atan2(dx, dz);
        let diff = targetAngle - headingRef.current;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        headingRef.current += diff * 0.12;

        const speed = 0.01;
        posRef.current.x += (dx / dist) * Math.min(dist, speed);
        posRef.current.z += (dz / dist) * Math.min(dist, speed);
        posRef.current.y = -0.11 + Math.abs(Math.sin(t * 6)) * 0.035;

        const cycle = Math.sin(t * 6);
        if (leftLegRef.current && rightLegRef.current) {
          leftLegRef.current.rotation.x = cycle * 0.45;
          rightLegRef.current.rotation.x = -cycle * 0.45;
        }
        if (rightArmRef.current) {
          rightArmRef.current.rotation.x = -cycle * 0.35;
          rightArmRef.current.rotation.z = -0.2;
        }
      } else {
        setMode('working');
        taskTimer.current = 6.0;
        setDialogue(isSheltered ? 'Sheltered in radiation bunker. All safe!' : config.defaultDialogue);
        if (leftLegRef.current && rightLegRef.current) {
          leftLegRef.current.rotation.x = 0;
          rightLegRef.current.rotation.x = 0;
        }
      }
    } else if (mode === 'working') {
      taskTimer.current -= delta;
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -0.7 + Math.sin(t * 3) * 0.08;
        rightArmRef.current.rotation.z = -0.15;
      }
      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x = 0;
        rightLegRef.current.rotation.x = 0;
      }
      if (taskTimer.current <= 0) {
        taskTimer.current = 8.0;
      }
    }

    groupRef.current.position.copy(posRef.current);
    groupRef.current.rotation.y = headingRef.current;
  });

  return (
    <group
      ref={groupRef}
      position={homePos}
      scale={0.8}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      {/* Floating 3D HUD & Speech Bubble (Visible on hover, selection, speech, or if showLabels is enabled) */}
      {(hovered || isSelected || speechVisible || showLabels) && (
        <Html center distanceFactor={7} position={[0, 0.44, 0]} style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div className="flex flex-col items-center">
            {/* Radio dialogue bubble */}
            {(speechVisible || hovered || isSelected) && (
              <div className="mb-1.5 px-2.5 py-1 rounded-xl bg-slate-950/90 border border-slate-700 text-white text-[10px] font-mono shadow-2xl backdrop-blur-md whitespace-nowrap flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: config.accentColor }} />
                <span className="font-bold" style={{ color: config.accentColor }}>{member.name}:</span>
                <span className="text-slate-200">{isSheltered ? '🛡️ Sheltered in bunker!' : dialogue}</span>
              </div>
            )}

            {/* Astronaut Unit Tag */}
            <div
              className={`px-2 py-0.5 rounded-lg border backdrop-blur-md shadow-lg flex items-center gap-1.5 transition-all ${
                isSelected
                  ? 'bg-slate-950/95 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-950/80 border-slate-700 text-slate-300'
              }`}
              style={{ borderColor: isSelected ? config.accentColor : undefined }}
            >
              <span className="text-[11px]">{member.avatar}</span>
              <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-slate-100">
                {member.name} • {member.role.toUpperCase()}
              </span>
            </div>

            {/* Quick Actions on hover/select */}
            {(hovered || isSelected) && (
              <div className="mt-1 flex items-center gap-1 pointer-events-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    doSalute();
                  }}
                  className="px-2 py-0.5 rounded text-white text-[9px] font-mono font-bold shadow cursor-pointer active:scale-95"
                  style={{ backgroundColor: config.accentHex }}
                >
                  🫡 SALUTE
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    soundFx.playClick();
                    onClick?.();
                  }}
                  className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-white text-[9px] font-mono font-bold shadow cursor-pointer active:scale-95"
                >
                  📋 BIO
                </button>
              </div>
            )}
          </div>
        </Html>
      )}

      {/* Torso / Suit */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.09, 0.12, 0.06]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Chest pack / life support controls */}
      <mesh position={[0, 0.16, 0.033]}>
        <boxGeometry args={[0.06, 0.06, 0.015]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Chest LED status matching role color */}
      <mesh position={[-0.015, 0.17, 0.042]}>
        <sphereGeometry args={[0.005, 6, 6]} />
        <meshBasicMaterial color={config.accentColor} />
      </mesh>
      <mesh position={[0.015, 0.17, 0.042]}>
        <sphereGeometry args={[0.005, 6, 6]} />
        <meshBasicMaterial color="#06b6d4" />
      </mesh>

      {/* PLSS Backpack */}
      <mesh position={[0, 0.16, -0.042]} castShadow>
        <boxGeometry args={[0.08, 0.13, 0.045]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.4} metalness={0.2} />
      </mesh>
      {/* O2 tank caps */}
      <mesh position={[-0.025, 0.23, -0.042]}>
        <cylinderGeometry args={[0.01, 0.01, 0.02, 8]} />
        <meshStandardMaterial color={config.accentColor} metalness={0.8} />
      </mesh>
      <mesh position={[0.025, 0.23, -0.042]}>
        <cylinderGeometry args={[0.01, 0.01, 0.02, 8]} />
        <meshStandardMaterial color={config.accentColor} metalness={0.8} />
      </mesh>

      {/* Helmet sphere */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Gold reflective solar visor with role accent */}
      <mesh position={[0, 0.25, 0.025]} rotation={[0.1, 0, 0]}>
        <sphereGeometry args={[0.04, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
        <meshStandardMaterial
          color="#f59e0b"
          metalness={0.96}
          roughness={0.06}
          emissive="#d97706"
          emissiveIntensity={hovered || isSelected ? 0.8 : 0.3}
        />
      </mesh>

      {/* Left arm */}
      <mesh position={[-0.065, 0.14, 0]}>
        <boxGeometry args={[0.03, 0.1, 0.03]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>

      {/* Right arm (waving / tool arm / salute) */}
      <group ref={rightArmRef} position={[0.065, 0.19, 0]}>
        <mesh position={[0, -0.05, 0]}>
          <boxGeometry args={[0.03, 0.1, 0.03]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.1, 0.03]} rotation={[0.4, 0, 0]}>
          <boxGeometry args={[0.02, 0.04, 0.03]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} />
        </mesh>
        <mesh position={[0, -0.11, 0.045]}>
          <coneGeometry args={[0.01, 0.02, 8]} />
          <meshBasicMaterial color={config.accentColor} />
        </mesh>
        {mode === 'working' && (
          <pointLight position={[0, -0.12, 0.05]} color={config.accentColor} intensity={1.2} distance={0.5} />
        )}
      </group>

      {/* Legs */}
      <mesh ref={leftLegRef} position={[-0.03, 0.04, 0]}>
        <boxGeometry args={[0.032, 0.1, 0.035]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.6} />
      </mesh>
      <mesh ref={rightLegRef} position={[0.03, 0.04, 0]}>
        <boxGeometry args={[0.032, 0.1, 0.035]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.6} />
      </mesh>
    </group>
  );
}

// ── Interactive Patrol Rover with Real Navigation & Survey ────
const ROVER_STATIONS = [
  { name: 'Crater Mineral Mine', pos: [1.75, -0.11, -0.65] as const, action: 'drilling', label: 'Crater Survey' },
  { name: 'Solar Array Perimeter', pos: [-1.3, -0.11, 0.6] as const, action: 'scanning', label: 'Solar Field' },
  { name: 'Communications Ridge', pos: [0.55, -0.11, -1.25] as const, action: 'scanning', label: 'Comms Relay' },
  { name: 'Bio-Greenhouse Loading', pos: [-0.75, -0.11, 1.15] as const, action: 'scanning', label: 'Bio-Dome Bay' },
  { name: 'Dock & Maintenance Hub', pos: [1.2, -0.11, 0.45] as const, action: 'docked', label: 'Base Dock' },
];

function PatrolRover({
  isMars,
  onClick,
  roverCommand,
  targetWaypoint,
  isSelected = false,
  showLabels = false,
}: {
  isMars: boolean;
  onClick?: () => void;
  roverCommand?: { type: string; id: number } | null;
  targetWaypoint?: THREE.Vector3 | null;
  isSelected?: boolean;
  showLabels?: boolean;
}) {
  const roverGroup = useRef<THREE.Group>(null);
  const wheelsRef = useRef<THREE.Group>(null);
  const scienceMastRef = useRef<THREE.Group>(null);

  const [mode, setMode] = useState<'docked' | 'driving' | 'drilling' | 'scanning'>('docked');
  const [stationIdx, setStationIdx] = useState(4); // Starts docked at maintenance hub
  const [statusText, setStatusText] = useState('DOCKED • READY FOR SURVEY');
  const [hovered, setHovered] = useState(false);
  const [honking, setHonking] = useState(false);

  const posRef = useRef(new THREE.Vector3(1.2, -0.11, 0.45));
  const headingRef = useRef(0.2);
  const targetPosRef = useRef(new THREE.Vector3(1.2, -0.11, 0.45));
  const actionTimer = useRef(0);
  const prevRoverCommandId = useRef<number | null>(null);
  const prevWaypoint = useRef<THREE.Vector3 | null>(null);

  const metalTex = useMemo(() => makeMetalTexture('#374151'), []);
  const cellTex = useMemo(() => makeSolarCellTexture(), []);

  const startCraterSurvey = () => {
    soundFx.playRoverHorn();
    setHonking(true);
    setTimeout(() => setHonking(false), 600);
    setStationIdx(0);
    const cr = ROVER_STATIONS[0];
    targetPosRef.current.set(cr.pos[0], cr.pos[1], cr.pos[2]);
    setMode('driving');
    setStatusText('EN ROUTE TO CRATER MINE');
  };

  const startAreaScan = () => {
    soundFx.playScanner();
    setMode('scanning');
    actionTimer.current = 4.0;
    setStatusText('LiDAR AREA SCAN ACTIVE');
  };

  const returnToDock = () => {
    soundFx.playRoverHorn();
    setStationIdx(4);
    const dk = ROVER_STATIONS[4];
    targetPosRef.current.set(dk.pos[0], dk.pos[1], dk.pos[2]);
    setMode('driving');
    setStatusText('RETURNING TO DOCK');
  };

  // Handle external dispatch command from UI card
  useEffect(() => {
    if (!roverCommand || roverCommand.id === prevRoverCommandId.current) return;
    prevRoverCommandId.current = roverCommand.id;
    startCraterSurvey();
  }, [roverCommand]);

  // Handle terrain click-to-move
  useEffect(() => {
    if (!isSelected || !targetWaypoint || targetWaypoint === prevWaypoint.current) return;
    prevWaypoint.current = targetWaypoint;
    soundFx.playRoverHorn();
    setHonking(true);
    setTimeout(() => setHonking(false), 500);
    targetPosRef.current.set(targetWaypoint.x, -0.11, targetWaypoint.z);
    setMode('driving');
    setStatusText('NAVIGATING TO COORDINATES');
  }, [isSelected, targetWaypoint]);

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundFx.playRoverHorn();
    setHonking(true);
    setTimeout(() => setHonking(false), 800);
    if (mode === 'docked') {
      startCraterSurvey();
    } else if (mode === 'driving') {
      startAreaScan();
    }
    onClick?.();
  };

  useFrame((state, delta) => {
    if (!roverGroup.current) return;
    const t = state.clock.getElapsedTime();

    if (mode === 'driving') {
      const dx = targetPosRef.current.x - posRef.current.x;
      const dz = targetPosRef.current.z - posRef.current.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.06) {
        const targetAngle = Math.atan2(dx, dz);
        let diff = targetAngle - headingRef.current;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        headingRef.current += diff * 0.09;

        const speed = 0.013;
        posRef.current.x += (dx / dist) * Math.min(dist, speed);
        posRef.current.z += (dz / dist) * Math.min(dist, speed);
        posRef.current.y = -0.11 + Math.sin(t * 10) * 0.003;

        // Spin wheels
        if (wheelsRef.current) {
          wheelsRef.current.children.forEach((w) => {
            w.rotation.x += 0.12;
          });
        }
      } else {
        // Arrived at destination
        const currentStation = ROVER_STATIONS[stationIdx];
        if (currentStation?.action === 'drilling') {
          setMode('drilling');
          actionTimer.current = 4.5;
          soundFx.playScanner();
        } else if (currentStation?.action === 'scanning') {
          setMode('scanning');
          actionTimer.current = 3.5;
          soundFx.playScanner();
        } else {
          setMode('docked');
          setStatusText('DOCKED • BATTERY 100%');
        }
      }
    } else if (mode === 'drilling' || mode === 'scanning') {
      actionTimer.current -= delta;
      // Articulate science mast / drill head
      if (scienceMastRef.current) {
        scienceMastRef.current.rotation.x = -0.4 + Math.sin(t * 5) * 0.12;
        scienceMastRef.current.rotation.y = Math.sin(t * 2) * 0.2;
      }

      const totalTime = mode === 'drilling' ? 4.5 : 3.5;
      const pct = Math.min(100, Math.floor(((totalTime - actionTimer.current) / totalTime) * 100));
      setStatusText(mode === 'drilling' ? `DRILLING CORE... ${pct}%` : `LiDAR SCANNING... ${pct}%`);

      if (actionTimer.current <= 0) {
        soundFx.playSuccess();
        if (stationIdx === 0) {
          // Finished crater drill, return to base dock
          setStatusText('CORE SECURED! (+8 REGOLITH/ICE)');
          setTimeout(() => {
            returnToDock();
          }, 1800);
        } else {
          // Move to next patrol station
          const next = (stationIdx + 1) % ROVER_STATIONS.length;
          setStationIdx(next);
          const st = ROVER_STATIONS[next];
          targetPosRef.current.set(st.pos[0], st.pos[1], st.pos[2]);
          setMode('driving');
          setStatusText(`PATROLLING TO ${st.label.toUpperCase()}`);
        }
      }
    }

    roverGroup.current.position.copy(posRef.current);
    roverGroup.current.rotation.y = headingRef.current;
  });

  const wheelPositions: [number, number, number][] = [
    [-0.14, -0.07, 0.12], [0.14, -0.07, 0.12],
    [-0.14, -0.07, -0.12], [0.14, -0.07, -0.12],
    [-0.14, -0.07, 0.0], [0.14, -0.07, 0.0],
  ];

  return (
    <group
      ref={roverGroup}
      position={[1.2, -0.11, 0.45]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      {/* Floating 3D HUD */}
      {(hovered || isSelected || showLabels) && (
        <Html center distanceFactor={7} position={[0, 0.52, 0]} style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div className="flex flex-col items-center">
            <div
              className={`px-2.5 py-1 rounded-xl border backdrop-blur-md shadow-2xl flex items-center gap-1.5 transition-all ${
                isSelected
                  ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-950/85 border-slate-700 text-slate-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  mode === 'drilling' || mode === 'scanning'
                    ? 'bg-amber-400 animate-ping'
                    : mode === 'driving'
                    ? 'bg-cyan-400 animate-pulse'
                    : 'bg-emerald-400'
                }`}
              />
              <span className="text-[11px]">🚜</span>
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase">
                {statusText}
              </span>
            </div>

            {/* Quick action buttons on hover / select */}
            {(hovered || isSelected) && (
              <div className="mt-1 flex items-center gap-1 pointer-events-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startCraterSurvey();
                  }}
                  className="px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[9px] font-mono font-bold shadow cursor-pointer active:scale-95"
                >
                  ⛏️ CRATER
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startAreaScan();
                  }}
                  className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-mono font-bold shadow cursor-pointer active:scale-95"
                >
                  📡 SCAN
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    returnToDock();
                  }}
                  className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-white text-[9px] font-mono font-bold shadow cursor-pointer active:scale-95"
                >
                  🏠 DOCK
                </button>
              </div>
            )}
          </div>
        </Html>
      )}

      {/* Main Chassis */}
      <mesh castShadow>
        <boxGeometry args={[0.34, 0.09, 0.28]} />
        <meshStandardMaterial map={metalTex} metalness={0.7} roughness={0.35} />
      </mesh>

      {/* Equipment Deck */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[0.28, 0.04, 0.24]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Top Solar Wing Panel */}
      <mesh position={[0, 0.1, -0.02]} rotation={[-0.1, 0, 0]}>
        <boxGeometry args={[0.24, 0.012, 0.16]} />
        <meshStandardMaterial map={cellTex} metalness={0.7} roughness={0.15} emissive="#1e3a8a" emissiveIntensity={0.25} />
      </mesh>

      {/* Science Arm & Mast */}
      <group ref={scienceMastRef}>
        <mesh position={[0.13, 0.12, 0.06]} rotation={[0, 0, -0.4]}>
          <cylinderGeometry args={[0.009, 0.009, 0.18, 6]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.2} />
        </mesh>
        <mesh position={[0.19, 0.19, 0.06]}>
          <sphereGeometry args={[0.024, 8, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* LiDAR Laser Scanning Cone & Floor Rings during drilling/scanning */}
      {(mode === 'drilling' || mode === 'scanning') && (
        <group position={[0.16, 0.05, 0.2]}>
          <mesh rotation={[0.35, 0, 0]}>
            <cylinderGeometry args={[0.01, 0.28, 0.38, 16, 1, true]} />
            <meshBasicMaterial color="#22d3ee" transparent opacity={0.35} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, -0.16, 0.12]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.04, 0.22, 24]} />
            <meshBasicMaterial color="#22d3ee" transparent opacity={0.65} side={THREE.DoubleSide} />
          </mesh>
          <pointLight color="#22d3ee" intensity={2.0} distance={1.2} />
        </group>
      )}

      {/* Camera Mast */}
      <mesh position={[-0.1, 0.16, 0]}>
        <cylinderGeometry args={[0.009, 0.009, 0.2, 6]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[-0.1, 0.26, 0]}>
        <boxGeometry args={[0.032, 0.024, 0.045]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Active Headlights / High Beams */}
      <spotLight
        position={[0, 0.04, 0.16]}
        target-position={[0, -0.15, 1.2]}
        intensity={mode === 'driving' || honking || hovered ? 3.0 : 1.2}
        color="#fef08a"
        angle={0.5}
        penumbra={0.6}
        distance={2.8}
      />
      <mesh position={[-0.1, 0.04, 0.145]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshBasicMaterial color={honking ? '#ffffff' : '#fef08a'} />
      </mesh>
      <mesh position={[0.1, 0.04, 0.145]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshBasicMaterial color={honking ? '#ffffff' : '#fef08a'} />
      </mesh>

      {/* 6 Wheels with individual hubs */}
      <group ref={wheelsRef}>
        {wheelPositions.map((pos, i) => (
          <group key={i} position={pos}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.062, 0.062, 0.04, 16]} />
              <meshStandardMaterial color="#111827" roughness={0.95} metalness={0.05} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.024, 0.024, 0.044, 8]} />
              <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Status indicator pin */}
      <mesh position={[0, 0.24, -0.06]}>
        <sphereGeometry args={[0.012, 6, 6]} />
        <meshBasicMaterial color={isMars ? '#f97316' : '#22d3ee'} />
      </mesh>
    </group>
  );
}

// ── Sintered Regolith / Forcefield Shield Dome ─────────────────
function SinterShieldDome({
  active,
  thicknessCm,
  isMars,
  onClick,
}: {
  active: boolean;
  thicknessCm: number;
  isMars: boolean;
  onClick?: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [pulse, setPulse] = useState(false);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.06;
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      const basePulse = Math.sin(t * 3) * 0.05;
      const shockwave = pulse ? 0.35 : 0;
      const baseOpacity = active ? 0.35 : Math.min(0.25, (thicknessCm / 50) * 0.25);
      mat.opacity = baseOpacity + basePulse + shockwave;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = -t * 0.2;
    }
  });

  const shieldColor = isMars ? '#f97316' : '#06b6d4';
  const emissiveColor = isMars ? '#ea580c' : '#0891b2';

  const triggerDeflectionPulse = () => {
    soundFx.playBeep(440, 0.2);
    setPulse(true);
    setTimeout(() => setPulse(false), 900);
    onClick?.();
  };

  if (!active && thicknessCm <= 0) return null;

  return (
    <group
      position={[0, 0.07, 0]}
      onClick={(e) => {
        e.stopPropagation();
        triggerDeflectionPulse();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      {/* Geodesic translucent forcefield dome */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.82, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={shieldColor}
          emissive={emissiveColor}
          emissiveIntensity={pulse ? 3.5 : active ? 1.5 : 0.6}
          wireframe
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Shimmer inner layer */}
      <mesh>
        <sphereGeometry args={[0.8, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={shieldColor}
          transparent
          opacity={pulse ? 0.45 : active ? 0.18 : 0.08}
          roughness={0.1}
          metalness={0.9}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Ground perimeter emitter ring */}
      <mesh ref={ringRef} position={[0, -0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.82, 0.88, 36]} />
        <meshBasicMaterial color={shieldColor} transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>

      {/* Interactive HUD on hover */}
      {hovered && (
        <Html center distanceFactor={7} position={[0, 0.95, 0]} style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div className="flex flex-col items-center">
            <div className="px-2.5 py-1 rounded-xl bg-slate-950/90 border border-cyan-400 text-white text-[10px] font-mono shadow-xl backdrop-blur-md whitespace-nowrap flex items-center gap-1.5">
              <span>🛡️</span>
              <span className="font-bold text-cyan-300">SINTER-SHIELD:</span>
              <span className="text-slate-200">{thicknessCm}cm ARMOR • {active ? 'ACTIVE' : 'STANDBY'}</span>
            </div>
            <div className="mt-1 pointer-events-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerDeflectionPulse();
                }}
                className="px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[9px] font-mono font-bold shadow cursor-pointer active:scale-95"
              >
                ⚡ DEFLECTION PULSE
              </button>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Pre-computed Crop Positions inside Greenhouse ─────────────
const CROP_POSITIONS: Array<{ x: number; z: number; color: string; size: number }> = [
  // Ring 1 (Inner, 6 crops)
  { x: 0.12, z: 0.0, color: '#22c55e', size: 0.035 },
  { x: 0.06, z: 0.104, color: '#16a34a', size: 0.036 },
  { x: -0.06, z: 0.104, color: '#84cc16', size: 0.034 },
  { x: -0.12, z: 0.0, color: '#4ade80', size: 0.037 },
  { x: -0.06, z: -0.104, color: '#10b981', size: 0.035 },
  { x: 0.06, z: -0.104, color: '#22c55e', size: 0.036 },
  // Ring 2 (Middle, 10 crops)
  { x: 0.22, z: 0.0, color: '#84cc16', size: 0.042 },
  { x: 0.178, z: 0.129, color: '#4ade80', size: 0.044 },
  { x: 0.068, z: 0.209, color: '#10b981', size: 0.041 },
  { x: -0.068, z: 0.209, color: '#22c55e', size: 0.043 },
  { x: -0.178, z: 0.129, color: '#16a34a', size: 0.042 },
  { x: -0.22, z: 0.0, color: '#84cc16', size: 0.044 },
  { x: -0.178, z: -0.129, color: '#4ade80', size: 0.041 },
  { x: -0.068, z: -0.209, color: '#10b981', size: 0.043 },
  { x: 0.068, z: -0.209, color: '#22c55e', size: 0.042 },
  { x: 0.178, z: -0.129, color: '#16a34a', size: 0.044 },
  // Ring 3 (Outer, 12 crops)
  { x: 0.31, z: 0.0, color: '#10b981', size: 0.048 },
  { x: 0.268, z: 0.155, color: '#22c55e', size: 0.046 },
  { x: 0.155, z: 0.268, color: '#16a34a', size: 0.049 },
  { x: 0.0, z: 0.31, color: '#84cc16', size: 0.047 },
  { x: -0.155, z: 0.268, color: '#4ade80', size: 0.048 },
  { x: -0.268, z: 0.155, color: '#10b981', size: 0.046 },
  { x: -0.31, z: 0.0, color: '#22c55e', size: 0.049 },
  { x: -0.268, z: -0.155, color: '#16a34a', size: 0.047 },
  { x: -0.155, z: -0.268, color: '#84cc16', size: 0.048 },
  { x: 0.0, z: -0.31, color: '#4ade80', size: 0.046 },
  { x: 0.155, z: -0.268, color: '#10b981', size: 0.049 },
  { x: 0.268, z: -0.155, color: '#22c55e', size: 0.047 },
];

// ── Bio-Regenerative Hydroponic Greenhouse Dome ───────────────
function BioGreenhouseDome({
  isMars: _isMars,
  isDaytime: _isDaytime,
  foodRations = 100,
  onClick,
  showLabels = false,
}: {
  isMars: boolean;
  isDaytime: boolean;
  foodRations?: number;
  onClick?: () => void;
  showLabels?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [harvesting, setHarvesting] = useState(false);
  const [parBoost, setParBoost] = useState(false);
  const [misting, setMisting] = useState(false);

  const cropsGroupRef = useRef<THREE.Group>(null);
  const glowLightRef = useRef<THREE.PointLight>(null);
  const mistRingRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (glowLightRef.current) {
      const baseIntensity = parBoost ? 3.6 : 1.8;
      glowLightRef.current.intensity = baseIntensity + Math.sin(t * 2) * 0.3;
    }
    if (cropsGroupRef.current) {
      const bounce = harvesting ? 1.25 + Math.sin(t * 12) * 0.15 : 1;
      cropsGroupRef.current.children.forEach((crop, idx) => {
        crop.scale.y = (1 + Math.sin(t * 1.5 + idx) * 0.04) * bounce;
      });
    }
    if (mistRingRef.current && misting) {
      const ms = 1 + (t * 3) % 2;
      mistRingRef.current.scale.set(ms, ms, ms);
    }
  });

  const doHarvest = () => {
    soundFx.playSuccess();
    setHarvesting(true);
    setTimeout(() => setHarvesting(false), 2000);
    onClick?.();
  };

  const togglePar = () => {
    soundFx.playClick();
    setParBoost((prev) => !prev);
  };

  const triggerMist = () => {
    soundFx.playAirlockHiss();
    setMisting(true);
    setTimeout(() => setMisting(false), 1800);
  };

  const cropHeightScale = Math.max(0.7, Math.min(1.3, foodRations / 80));

  return (
    <group
      position={[-0.85, -0.06, 0.55]}
      onClick={(e) => {
        e.stopPropagation();
        doHarvest();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      {/* Floating 3D HUD */}
      {(hovered || harvesting || showLabels) && (
        <Html center distanceFactor={7} position={[0, 0.55, 0]} style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div className="flex flex-col items-center">
            <div className="px-2.5 py-1 rounded-xl bg-slate-950/90 border border-emerald-400 text-white text-[10px] font-mono shadow-xl backdrop-blur-md whitespace-nowrap flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-emerald-300">BIO-GREENHOUSE:</span>
              <span className="text-slate-200">
                {foodRations.toFixed(0)} RATIONS • {parBoost ? 'HYPER-PAR (600 μmol)' : 'NOMINAL PAR'}
              </span>
            </div>

            {(hovered || harvesting) && (
              <div className="mt-1 flex items-center gap-1 pointer-events-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    doHarvest();
                  }}
                  className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-mono font-bold shadow cursor-pointer active:scale-95"
                >
                  🌾 HARVEST
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePar();
                  }}
                  className={`px-2 py-0.5 rounded text-white text-[9px] font-mono font-bold shadow cursor-pointer active:scale-95 ${
                    parBoost ? 'bg-fuchsia-600 hover:bg-fuchsia-500' : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  💡 {parBoost ? 'PAR MAX' : 'BOOST PAR'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerMist();
                  }}
                  className="px-2 py-0.5 rounded bg-cyan-700 hover:bg-cyan-600 text-white text-[9px] font-mono font-bold shadow cursor-pointer active:scale-95"
                >
                  💧 MIST
                </button>
              </div>
            )}
          </div>
        </Html>
      )}

      {/* Pressurized Corridor linking Main Habitat to Greenhouse */}
      <mesh position={[0.42, 0.1, -0.28]} rotation={[0, -0.58, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.52, 16]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Corridor seal ring */}
      <mesh position={[0.42, 0.1, -0.28]} rotation={[0, -0.58, Math.PI / 2]}>
        <torusGeometry args={[0.08, 0.015, 8, 16]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.6} />
      </mesh>

      {/* Hydroponic Base Basin / Foundation */}
      <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.42, 0.44, 0.12, 32]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.38, 0.43, 32]} />
        <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Internal Tiered Grow Shelves / Nutrient Trays */}
      {[0.08, 0.13, 0.18].map((y, idx) => (
        <mesh key={idx} position={[0, y, 0]}>
          <cylinderGeometry args={[0.36 - idx * 0.08, 0.36 - idx * 0.08, 0.02, 24]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* Vertical Nutrient Aeroponics Core Column */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.32, 16]} />
        <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Aeroponics Mist Ring */}
      {misting && (
        <mesh ref={mistRingRef} position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.05, 0.28, 24]} />
          <meshBasicMaterial color="#e0f2fe" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Harvest Sparkle Effect */}
      {harvesting && (
        <mesh position={[0, 0.25, 0]}>
          <torusGeometry args={[0.32, 0.02, 12, 32]} />
          <meshBasicMaterial color="#facc15" transparent opacity={0.8} />
        </mesh>
      )}

      {/* 3D Growing Crops / Plants */}
      <group ref={cropsGroupRef} position={[0, 0.08, 0]} scale={[1, cropHeightScale, 1]}>
        {CROP_POSITIONS.map((c, i) => (
          <group key={i} position={[c.x, 0.03, c.z]}>
            {/* Plant stem */}
            <mesh position={[0, c.size * 0.6, 0]}>
              <cylinderGeometry args={[0.005, 0.006, c.size * 1.2, 6]} />
              <meshStandardMaterial color="#15803d" />
            </mesh>
            {/* Lush leaves / crop head */}
            <mesh position={[0, c.size * 1.2, 0]} scale={[1.2, 1.0, 1.2]}>
              <sphereGeometry args={[c.size, 7, 7]} />
              <meshStandardMaterial
                color={harvesting ? '#facc15' : c.color}
                emissive={harvesting ? '#eab308' : c.color}
                emissiveIntensity={hovered || harvesting ? 0.8 : 0.25}
                roughness={0.6}
              />
            </mesh>
            {/* Foliage leaves */}
            <mesh position={[c.size * 0.4, c.size * 0.9, 0]} rotation={[0.4, 0, 0.5]} scale={[0.8, 0.5, 0.8]}>
              <sphereGeometry args={[c.size * 0.7, 5, 5]} />
              <meshStandardMaterial color="#4ade80" />
            </mesh>
          </group>
        ))}
      </group>

      {/* NASA Photosynthetic Magenta Grow Lights */}
      <pointLight
        ref={glowLightRef}
        position={[0, 0.32, 0]}
        color={parBoost ? '#a855f7' : '#ec4899'}
        intensity={hovered ? 3.0 : 1.8}
        distance={1.5}
      />
      <pointLight position={[0, 0.15, 0]} color="#38bdf8" intensity={0.9} distance={0.9} />

      {/* Transparent Geodesic Glass Dome */}
      <mesh position={[0, 0.08, 0]}>
        <sphereGeometry args={[0.42, 28, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#a7f3d0"
          transparent
          opacity={hovered ? 0.45 : 0.3}
          roughness={0.08}
          metalness={0.1}
          transmission={0.8}
          ior={1.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Structural Geodesic Rib Struts */}
      <mesh position={[0, 0.08, 0]}>
        <sphereGeometry args={[0.422, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial
          wireframe
          color={hovered ? '#34d399' : '#10b981'}
          transparent
          opacity={0.55}
        />
      </mesh>

      {/* Base Foundation Rim Ring */}
      <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.41, 0.43, 32]} />
        <meshStandardMaterial
          color="#10b981"
          emissive="#10b981"
          emissiveIntensity={hovered ? 1.0 : 0.4}
        />
      </mesh>
    </group>
  );
}

// ── Realistic Celestial Bodies in Sky (Earth on Moon / Phobos on Mars) ───
function SkyCelestialBodies({
  isMars,
  onClick,
  onInspect,
}: {
  isMars: boolean;
  onClick?: () => void;
  onInspect?: (obj: string) => void;
}) {
  const earthRef = useRef<THREE.Group>(null);
  const moonRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [hailing, setHailing] = useState(false);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (earthRef.current) {
      earthRef.current.rotation.y = t * 0.02;
    }
    if (moonRef.current) {
      moonRef.current.rotation.y = t * 0.03;
    }
  });

  const triggerHail = () => {
    soundFx.playTelemetryPing();
    soundFx.playBeep(1400, 0.12);
    setHailing(true);
    setTimeout(() => setHailing(false), 2200);
    onClick?.();
    onInspect?.('celestial');
  };

  const syncEphemeris = () => {
    soundFx.playScanner();
    onInspect?.('celestial');
  };

  // Optical laser carrier uplink beam geometry from outpost antenna to celestial target
  const beamData = useMemo(() => {
    const p1 = new THREE.Vector3(0.18, 0.62, -0.42);
    const p2 = isMars ? new THREE.Vector3(-3.8, 3.2, -4.2) : new THREE.Vector3(-4.5, 3.8, -4.8);
    const diff = p2.clone().sub(p1);
    const length = diff.length();
    const mid = p1.clone().add(diff.clone().multiplyScalar(0.5));
    const quat = new THREE.Quaternion();
    quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), diff.normalize());
    return { length, mid, quat };
  }, [isMars]);

  if (!isMars) {
    // 🌍 Earth in the Lunar Sky (Iconic Apollo Earthrise)
    return (
      <group>
        {/* Optical Uplink Laser Beam */}
        {hailing && (
          <group position={beamData.mid} quaternion={beamData.quat}>
            <mesh>
              <cylinderGeometry args={[0.015, 0.015, beamData.length, 8]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={0.85} />
            </mesh>
            <mesh>
              <cylinderGeometry args={[0.045, 0.045, beamData.length, 8]} />
              <meshBasicMaterial color="#93c5fd" transparent opacity={0.25} />
            </mesh>
          </group>
        )}

        <group
          position={[-4.5, 3.8, -4.8]}
          onClick={(e) => {
            e.stopPropagation();
            triggerHail();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = 'default';
          }}
        >
          {/* The Blue Marble */}
          <group ref={earthRef}>
            {/* Oceans */}
            <mesh>
              <sphereGeometry args={[0.72, 32, 32]} />
              <meshStandardMaterial
                color="#1d4ed8"
                roughness={0.3}
                metalness={0.1}
                emissive={hovered || hailing ? '#38bdf8' : '#000000'}
                emissiveIntensity={hovered || hailing ? 0.35 : 0}
              />
            </mesh>
            {/* Continents */}
            <mesh scale={1.002}>
              <sphereGeometry args={[0.72, 24, 24]} />
              <meshStandardMaterial color="#15803d" roughness={0.8} transparent opacity={0.65} />
            </mesh>
            {/* Swirling Clouds */}
            <mesh scale={1.01}>
              <sphereGeometry args={[0.72, 24, 24]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.45} />
            </mesh>
          </group>

          {/* Earth atmospheric glow rim */}
          <mesh scale={hovered || hailing ? 1.12 : 1.06}>
            <sphereGeometry args={[0.72, 24, 24]} />
            <meshBasicMaterial
              color={hailing ? '#60a5fa' : '#38bdf8'}
              transparent
              opacity={hovered || hailing ? 0.45 : 0.25}
              side={THREE.BackSide}
            />
          </mesh>
          <pointLight color="#93c5fd" intensity={hovered || hailing ? 1.4 : 0.6} distance={8} />

          {/* 3D Celestial HUD */}
          <Html center distanceFactor={13} position={[0, 1.05, 0]} style={{ pointerEvents: 'none', userSelect: 'none' }}>
            <div className="flex flex-col items-center">
              <div className="px-2.5 py-1 rounded-xl bg-slate-950/90 border border-blue-400 text-white text-[10px] font-mono shadow-xl backdrop-blur-md whitespace-nowrap flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="font-bold text-blue-300">EARTH LINK:</span>
                <span className="text-slate-200">HOUSTON DSN • 1.28s DELAY {hailing ? '• UPLINK ACTIVE' : ''}</span>
              </div>
              {(hovered || hailing) && (
                <div className="mt-1 flex items-center gap-1 pointer-events-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHail();
                    }}
                    className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-mono font-bold shadow cursor-pointer active:scale-95"
                  >
                    🛰️ HAIL HOUSTON
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      syncEphemeris();
                    }}
                    className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-white text-[9px] font-mono font-bold shadow cursor-pointer active:scale-95"
                  >
                    📡 SYNC DSN
                  </button>
                </div>
              )}
            </div>
          </Html>
        </group>
      </group>
    );
  }

  // 🔴 Phobos & Deimos in the Martian Sky
  return (
    <group>
      {/* Optical Uplink Laser Beam */}
      {hailing && (
        <group position={beamData.mid} quaternion={beamData.quat}>
          <mesh>
            <cylinderGeometry args={[0.015, 0.015, beamData.length, 8]} />
            <meshBasicMaterial color="#f97316" transparent opacity={0.85} />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.045, 0.045, beamData.length, 8]} />
            <meshBasicMaterial color="#fdba74" transparent opacity={0.25} />
          </mesh>
        </group>
      )}

      {/* Phobos: Irregular cratered moon */}
      <group
        position={[-3.8, 3.2, -4.2]}
        onClick={(e) => {
          e.stopPropagation();
          triggerHail();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
      >
        <mesh ref={moonRef} scale={[0.26, 0.22, 0.2]}>
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial
            color="#78716c"
            roughness={0.95}
            metalness={0.05}
            emissive={hovered || hailing ? '#f97316' : '#000000'}
            emissiveIntensity={hovered || hailing ? 0.4 : 0}
          />
        </mesh>

        {/* 3D Celestial HUD */}
        <Html center distanceFactor={13} position={[0, 0.55, 0]} style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div className="flex flex-col items-center">
            <div className="px-2.5 py-1 rounded-xl bg-slate-950/90 border border-orange-400 text-white text-[10px] font-mono shadow-xl backdrop-blur-md whitespace-nowrap flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              <span className="font-bold text-orange-300">PHOBOS RELAY:</span>
              <span className="text-slate-200">MRO SAT-LINK • 14.2m DELAY {hailing ? '• UPLINK ACTIVE' : ''}</span>
            </div>
            {(hovered || hailing) && (
              <div className="mt-1 flex items-center gap-1 pointer-events-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHail();
                  }}
                  className="px-2 py-0.5 rounded bg-orange-600 hover:bg-orange-500 text-white text-[9px] font-mono font-bold shadow cursor-pointer active:scale-95"
                >
                  🛰️ RELAY TELEMETRY
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    syncEphemeris();
                  }}
                  className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-white text-[9px] font-mono font-bold shadow cursor-pointer active:scale-95"
                >
                  📡 SYNC EPHEMERIS
                </button>
              </div>
            )}
          </div>
        </Html>
      </group>

      {/* Deimos: Distant small moon */}
      <mesh position={[3.5, 4.0, -4.8]} scale={0.11}>
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#a8a29e" roughness={0.9} />
      </mesh>
      {/* Soft atmospheric dust haze layer on horizon */}
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[5.2, 5.2, 1.2, 48, 1, true]} />
        <meshBasicMaterial color="#b45309" transparent opacity={0.12} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

// ── Environmental Weather / Storm Hazards ─────────────────────
function EnvironmentalEffects({
  isMars,
  activeHazard,
  isDaytime,
}: {
  isMars: boolean;
  activeHazard?: string | null;
  isDaytime: boolean;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const stormRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (pointsRef.current) {
      pointsRef.current.rotation.y = t * 0.04;
    }
    if (stormRef.current) {
      stormRef.current.rotation.y = t * 1.2;
      stormRef.current.position.y = Math.sin(t * 3) * 0.12;
    }
  });

  // Base ambient stardust / floating micro-particles / night frost
  const dustPositions = useMemo(() => {
    const pos = new Float32Array(DUST_COUNT * 3);
    DUST_DATA.forEach((d, i) => {
      pos[i * 3] = Math.cos(d.angle) * d.radius;
      pos[i * 3 + 1] = d.height;
      pos[i * 3 + 2] = Math.sin(d.angle) * d.radius;
    });
    return pos;
  }, []);

  // Storm hazard particle array (heavier during dust storms / solar flares)
  const stormPositions = useMemo(() => {
    const pos = new Float32Array(140 * 3);
    HAZARD_PARTICLES.forEach((p, i) => {
      pos[i * 3] = Math.cos(p.angle) * p.dist;
      pos[i * 3 + 1] = p.height;
      pos[i * 3 + 2] = Math.sin(p.angle) * p.dist;
    });
    return pos;
  }, []);

  return (
    <group>
      {/* Ambient particles (dust or cryogenic frost) */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.032}
          color={!isDaytime ? '#e0f2fe' : isMars ? '#fdba74' : '#93c5fd'}
          transparent
          opacity={!isDaytime ? 0.75 : 0.45}
          sizeAttenuation
        />
      </points>

      {/* Swirling storm particles when hazard is active */}
      {activeHazard && (
        <points ref={stormRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[stormPositions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            size={0.06}
            color={activeHazard === 'solar-flare' ? '#fbbf24' : '#ef4444'}
            transparent
            opacity={0.85}
            sizeAttenuation
          />
        </points>
      )}
    </group>
  );
}

// ── Habitat Dome ──────────────────────────────────────────────
function HabitatDome({
  health: _health,
  isMars: _isMars,
  isDaytime,
  onClick,
  onInspect,
  showLabels = false,
}: {
  health: number;
  isMars: boolean;
  isDaytime: boolean;
  onClick?: () => void;
  onInspect?: (obj: string) => void;
  showLabels?: boolean;
}) {
  const innerRef = useRef<THREE.PointLight>(null);
  const [pulse, setPulse] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [airlockCycling, setAirlockCycling] = useState(false);
  const [airlockStep, setAirlockStep] = useState<'idle' | 'depressurizing' | 'equalized'>('idle');
  const [moodLight, setMoodLight] = useState<'solar' | 'night' | 'alert'>(isDaytime ? 'solar' : 'night');

  const domeTexture = useMemo(() => makeDomeTexture(), []);
  const metalTex = useMemo(() => makeMetalTexture('#374151'), []);

  useFrame((state) => {
    if (!innerRef.current) return;
    const boost = pulse ? 1.5 : 0;
    const t = state.clock.getElapsedTime();
    if (moodLight === 'alert') {
      innerRef.current.intensity = 1.6 + 1.2 * Math.sin(t * 8) + boost;
      innerRef.current.color.set('#ef4444');
    } else if (moodLight === 'night') {
      innerRef.current.intensity = 1.0 + 0.15 * Math.sin(t * 1.5) + boost;
      innerRef.current.color.set('#06b6d4');
    } else {
      const base = isDaytime ? 0.8 : 1.2;
      innerRef.current.intensity = base + 0.2 * Math.sin(t * 1.5) + boost;
      innerRef.current.color.set('#fde68a');
    }
  });

  const cycleAirlock = () => {
    soundFx.playAirlockHiss();
    setAirlockCycling(true);
    setAirlockStep('depressurizing');
    setTimeout(() => {
      setAirlockStep('equalized');
      soundFx.playBeep(920, 0.1);
    }, 1100);
    setTimeout(() => {
      setAirlockCycling(false);
      setAirlockStep('idle');
    }, 2200);
    onClick?.();
    onInspect?.('dome');
  };

  const cycleMood = () => {
    soundFx.playClick();
    setMoodLight((prev) => (prev === 'solar' ? 'night' : prev === 'night' ? 'alert' : 'solar'));
    if (moodLight === 'alert') {
      soundFx.playAlarm();
    }
    onClick?.();
    onInspect?.('dome');
  };

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundFx.playAirlockHiss();
    setPulse(true);
    setTimeout(() => setPulse(false), 900);
    onClick?.();
    onInspect?.('dome');
  };

  return (
    <group
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      {/* Foundation ring */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.6, 0.65, 0.12, 32]} />
        <meshStandardMaterial map={metalTex} roughness={0.8} metalness={0.5} />
      </mesh>

      {/* Main pressurized dome */}
      <mesh position={[0, 0.07, 0]} castShadow>
        <sphereGeometry args={[0.58, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          map={domeTexture}
          roughness={0.22}
          metalness={0.6}
          emissive={hovered ? '#06b6d4' : moodLight === 'alert' ? '#7f1d1d' : !isDaytime ? '#0c2238' : '#000000'}
          emissiveIntensity={hovered ? 0.4 : moodLight === 'alert' ? 0.6 : !isDaytime ? 0.2 : 0}
        />
      </mesh>

      {/* Glowing Neon Seal Ring */}
      <mesh position={[0, 0.08, 0]}>
        <torusGeometry args={[0.585, 0.024, 12, 80]} />
        <meshStandardMaterial
          color={moodLight === 'alert' ? '#ef4444' : '#06b6d4'}
          emissive={moodLight === 'alert' ? '#ef4444' : '#06b6d4'}
          emissiveIntensity={hovered ? 3.0 : moodLight === 'alert' ? 2.8 : !isDaytime ? 2.5 : 1.6}
          metalness={0.9}
        />
      </mesh>

      {/* Airlock Vestibule */}
      <mesh position={[0.55, -0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 0.22, 16]} />
        <meshStandardMaterial map={metalTex} roughness={0.4} metalness={0.75} />
      </mesh>

      {/* Airlock Door with glowing indicator LED */}
      <mesh position={[0.67, -0.05, 0]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.1, 16]} />
        <meshStandardMaterial color="#374151" roughness={0.5} metalness={0.8} />
      </mesh>
      <mesh position={[0.672, 0.02, 0]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.014, 8]} />
        <meshBasicMaterial
          color={airlockStep === 'depressurizing' ? '#f59e0b' : airlockStep === 'equalized' ? '#38bdf8' : '#10b981'}
        />
      </mesh>

      {/* Expanding Airlock Depressurization Steam Rings */}
      {airlockCycling && (
        <group position={[0.68, -0.05, 0]} rotation={[0, Math.PI / 2, 0]}>
          {[0.08, 0.14, 0.2].map((r, ri) => (
            <mesh key={ri} scale={1 + ri * 0.4}>
              <ringGeometry args={[r, r + 0.02, 24]} />
              <meshBasicMaterial color="#e0f2fe" transparent opacity={0.65 - ri * 0.18} side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
      )}

      {/* Interior Habitation Light */}
      <pointLight
        ref={innerRef}
        position={[0, 0.15, 0]}
        intensity={!isDaytime ? 1.4 : 0.6}
        color="#fde68a"
        distance={1.6}
      />

      {/* 3D Floating Habitat HUD */}
      {(hovered || airlockCycling || showLabels) && (
        <Html center distanceFactor={7} position={[0, 0.78, 0]} style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div className="flex flex-col items-center">
            <div className="px-2.5 py-1 rounded-xl bg-slate-950/90 border border-cyan-400 text-white text-[10px] font-mono shadow-xl backdrop-blur-md whitespace-nowrap flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${moodLight === 'alert' ? 'bg-red-400 animate-ping' : 'bg-cyan-400 animate-pulse'}`} />
              <span className="font-bold text-cyan-300">HABITAT DOME:</span>
              <span className="text-slate-200">101.3 kPa • O₂ 20.9% • {moodLight.toUpperCase()}</span>
            </div>

            {(hovered || airlockCycling) && (
              <div className="mt-1 flex items-center gap-1 pointer-events-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    cycleAirlock();
                  }}
                  className="px-2 py-0.5 rounded bg-cyan-700 hover:bg-cyan-600 text-white text-[9px] font-mono font-bold shadow cursor-pointer active:scale-95"
                >
                  💨 {airlockCycling ? 'CYCLING...' : 'AIRLOCK CYCLE'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    cycleMood();
                  }}
                  className={`px-2 py-0.5 rounded text-white text-[9px] font-mono font-bold shadow cursor-pointer active:scale-95 ${
                    moodLight === 'alert' ? 'bg-red-600 hover:bg-red-500' : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  💡 MOOD: {moodLight.toUpperCase()}
                </button>
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Solar Panel Array ─────────────────────────────────────────
function SolarPanel({
  side,
  isMars,
  isDaytime,
  onClick,
  onInspect,
  showLabels = false,
}: {
  side: -1 | 1;
  isMars: boolean;
  isDaytime: boolean;
  onClick?: () => void;
  onInspect?: (obj: string) => void;
  showLabels?: boolean;
}) {
  const panelRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [dustPurging, setDustPurging] = useState(false);
  const [manualTiltOffset, setManualTiltOffset] = useState(0);
  const [cleanliness, setCleanliness] = useState(98);

  const cellTex = useMemo(() => makeSolarCellTexture(), []);
  const metalTex = useMemo(() => makeMetalTexture('#4b5563'), []);

  useFrame((state) => {
    if (!panelRef.current) return;
    const t = state.clock.getElapsedTime();
    const wave = isDaytime ? Math.sin(t * 0.6) * 0.04 : -0.15;
    const jitter = dustPurging ? Math.sin(t * 45) * 0.05 : 0;
    panelRef.current.rotation.z = side * (wave + manualTiltOffset) + jitter;
  });

  const purgeDust = () => {
    soundFx.playScanner();
    soundFx.playBeep(1200, 0.1);
    setDustPurging(true);
    setCleanliness(100);
    setTimeout(() => setDustPurging(false), 900);
    onClick?.();
    onInspect?.('solar');
  };

  const realignCells = () => {
    soundFx.playBeep(980, 0.08);
    setManualTiltOffset((prev) => (prev === 0 ? 0.2 : prev === 0.2 ? -0.2 : 0));
    onClick?.();
    onInspect?.('solar');
  };

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundFx.playScanner();
    onClick?.();
    onInspect?.('solar');
  };

  return (
    <group
      ref={panelRef}
      position={[side * 1.05, 0.12, 0.05]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      <mesh position={[0, -0.06, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.28, 10]} />
        <meshStandardMaterial map={metalTex} metalness={0.85} roughness={0.25} />
      </mesh>

      <mesh position={[0, 0.09, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.013, 0.013, 0.82, 8]} />
        <meshStandardMaterial map={metalTex} metalness={0.85} roughness={0.3} />
      </mesh>

      {([-0.28, 0.28] as const).map((offset, pi) => (
        <group key={pi} position={[offset, 0.09, 0]}>
          <mesh rotation={[0.12, 0, 0]} castShadow>
            <boxGeometry args={[0.42, 0.02, 0.24]} />
            <meshStandardMaterial
              map={cellTex}
              metalness={0.7}
              roughness={0.15}
              emissive={hovered ? '#3b82f6' : isDaytime ? (isMars ? '#0c1550' : '#1e3a8a') : '#020617'}
              emissiveIntensity={hovered ? 0.6 : isDaytime ? 0.3 : 0.02}
            />
          </mesh>

          {/* Ultrasonic Dust Purge Shockwave Ring */}
          {dustPurging && (
            <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.12, 0.3, 24]} />
              <meshBasicMaterial color="#fed7aa" transparent opacity={0.7} side={THREE.DoubleSide} />
            </mesh>
          )}
        </group>
      ))}

      {/* 3D Floating Solar HUD on Starboard / Port Array */}
      {(hovered || dustPurging || showLabels) && (
        <Html center distanceFactor={7} position={[0, 0.36, 0]} style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div className="flex flex-col items-center">
            <div className="px-2 py-0.5 rounded-lg bg-slate-950/90 border border-amber-400 text-white text-[9px] font-mono shadow-xl backdrop-blur-md whitespace-nowrap flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-bold text-amber-300">SOLAR {side === -1 ? 'PORT' : 'STBD'}:</span>
              <span className="text-slate-200">{isDaytime ? '+3.2 kW' : 'NIGHT (0kW)'} • {cleanliness}% CLEAN</span>
            </div>

            {(hovered || dustPurging) && (
              <div className="mt-1 flex items-center gap-1 pointer-events-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    realignCells();
                  }}
                  className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-[8px] font-mono font-bold shadow cursor-pointer active:scale-95"
                >
                  🔄 REALIGN
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    purgeDust();
                  }}
                  className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-white text-[8px] font-mono font-bold shadow cursor-pointer active:scale-95"
                >
                  🧹 DUST PURGE
                </button>
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Spinning High-Gain Antenna Dish ──────────────────────────
function HighGainAntenna({
  isMars,
  onClick,
  onInspect,
  showLabels = false,
}: {
  isMars: boolean;
  onClick?: () => void;
  onInspect?: (obj: string) => void;
  showLabels?: boolean;
}) {
  const dishRef = useRef<THREE.Group>(null);
  const ringPulseRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [transmitting, setTransmitting] = useState(false);
  const [dishElevation, setDishElevation] = useState(0.45);
  const metalTex = useMemo(() => makeMetalTexture('#6b7280'), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (dishRef.current) {
      dishRef.current.rotation.y = t * 0.45;
      dishRef.current.rotation.x = THREE.MathUtils.lerp(dishRef.current.rotation.x, dishElevation, 0.08);
    }
    if (ringPulseRef.current) {
      const s = 1 + (t * (transmitting ? 4 : 2)) % 2.5;
      ringPulseRef.current.scale.set(s, s, s);
      const mat = ringPulseRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 1 - (s - 1) / 1.5) * (transmitting ? 0.9 : 0.4);
    }
  });

  const transmitPing = () => {
    soundFx.playTelemetryPing();
    soundFx.playBeep(1400, 0.1);
    setTransmitting(true);
    setTimeout(() => setTransmitting(false), 1400);
    onClick?.();
    onInspect?.('antenna');
  };

  const slewDish = () => {
    soundFx.playBeep(700, 0.12);
    setDishElevation((prev) => (prev === 0.45 ? 0.8 : prev === 0.8 ? 0.15 : 0.45));
    onClick?.();
    onInspect?.('antenna');
  };

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    transmitPing();
  };

  return (
    <group
      position={[0.18, 0, -0.42]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      <mesh position={[0, -0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.08, 12]} />
        <meshStandardMaterial color="#374151" roughness={0.9} />
      </mesh>

      <mesh position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.014, 0.018, 0.72, 10]} />
        <meshStandardMaterial map={metalTex} metalness={0.9} roughness={0.2} />
      </mesh>

      <group ref={dishRef} position={[0, 0.62, 0]}>
        <mesh>
          <sphereGeometry args={[0.13, 24, 24, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
          <meshStandardMaterial
            map={metalTex}
            metalness={0.9}
            roughness={0.15}
            side={THREE.DoubleSide}
            emissive={hovered || transmitting ? '#06b6d4' : '#000000'}
            emissiveIntensity={hovered || transmitting ? 0.5 : 0}
          />
        </mesh>
        <mesh position={[0, 0.07, 0]}>
          <cylinderGeometry args={[0.015, 0.02, 0.05, 8]} />
          <meshStandardMaterial color="#1f2937" metalness={0.95} />
        </mesh>
      </group>

      {/* Electromagnetic Wavefront Rings */}
      <mesh ref={ringPulseRef} position={[0, 0.64, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.1, 0.12, 24]} />
        <meshBasicMaterial
          color={transmitting ? '#38bdf8' : isMars ? '#f97316' : '#22d3ee'}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Feed Horn Indicator */}
      <mesh position={[0, 0.64, 0]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial
          color={transmitting ? '#ffffff' : isMars ? '#f97316' : '#06b6d4'}
          emissive={transmitting ? '#38bdf8' : isMars ? '#f97316' : '#06b6d4'}
          emissiveIntensity={hovered || transmitting ? 3.5 : 1.6}
        />
      </mesh>

      {/* 3D Floating Comms HUD */}
      {(hovered || transmitting || showLabels) && (
        <Html center distanceFactor={7} position={[0, 0.86, 0]} style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div className="flex flex-col items-center">
            <div className="px-2 py-0.5 rounded-lg bg-slate-950/90 border border-purple-400 text-white text-[9px] font-mono shadow-xl backdrop-blur-md whitespace-nowrap flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span className="font-bold text-purple-300">COMMS DISH:</span>
              <span className="text-slate-200">DSN CANBERRA • -78 dBm</span>
            </div>

            {(hovered || transmitting) && (
              <div className="mt-1 flex items-center gap-1 pointer-events-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    transmitPing();
                  }}
                  className="px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-[8px] font-mono font-bold shadow cursor-pointer active:scale-95"
                >
                  🛰️ PING DSN
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    slewDish();
                  }}
                  className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-white text-[8px] font-mono font-bold shadow cursor-pointer active:scale-95"
                >
                  🎯 SLEW DISH
                </button>
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

// ── MOXIE / Life Support & ISRU Unit ──────────────────────────
function LifeSupportUnit({
  isMars,
  onClick,
  onInspect,
  showLabels = false,
}: {
  isMars: boolean;
  onClick?: () => void;
  onInspect?: (obj: string) => void;
  showLabels?: boolean;
}) {
  const pistonRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [venting, setVenting] = useState(false);
  const [isruActive, setIsruActive] = useState(true);
  const metalTex = useMemo(() => makeMetalTexture('#374151'), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (pistonRef.current) {
      pistonRef.current.position.y = 0.2 + Math.sin(t * (isruActive ? 6 : 1.5)) * 0.02;
    }
  });

  const ventCo2 = () => {
    soundFx.playAirlockHiss();
    setVenting(true);
    setTimeout(() => setVenting(false), 1200);
    onClick?.();
    onInspect?.('lifesupport');
  };

  const toggleIsru = () => {
    soundFx.playSuccess();
    setIsruActive((prev) => !prev);
    onClick?.();
    onInspect?.('lifesupport');
  };

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundFx.playBeep(640);
    onClick?.();
    onInspect?.('lifesupport');
  };

  return (
    <group
      position={[-0.78, -0.02, -0.32]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      <mesh castShadow>
        <boxGeometry args={[0.26, 0.34, 0.24]} />
        <meshStandardMaterial
          map={metalTex}
          metalness={0.7}
          roughness={0.4}
          emissive={hovered ? '#10b981' : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>

      {/* Cycling Compressor Piston */}
      <mesh ref={pistonRef} position={[0.06, 0.2, 0]}>
        <cylinderGeometry args={[0.028, 0.022, 0.1, 8]} />
        <meshStandardMaterial color="#6b7280" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* CO₂ Venting Steam Cloud Rings */}
      {venting && (
        <group position={[0.06, 0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          {[0.04, 0.08, 0.13].map((r, ri) => (
            <mesh key={ri} scale={1 + ri * 0.5}>
              <ringGeometry args={[r, r + 0.02, 16]} />
              <meshBasicMaterial color="#e0f2fe" transparent opacity={0.65 - ri * 0.18} side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
      )}

      {/* Manifold transfer tube */}
      <mesh position={[0.2, 0.05, 0.1]} rotation={[0.4, 0.3, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 0.35, 8]} />
        <meshStandardMaterial color="#4b5563" metalness={0.75} roughness={0.3} />
      </mesh>

      {/* Status indicator LEDs */}
      <mesh position={[-0.03, 0.14, 0.128]}>
        <sphereGeometry args={[0.01, 6, 6]} />
        <meshStandardMaterial
          color={isMars ? '#f97316' : '#10b981'}
          emissive={isMars ? '#f97316' : '#10b981'}
          emissiveIntensity={isruActive ? 1.4 : 0.2}
        />
      </mesh>
      <mesh position={[0.03, 0.14, 0.128]}>
        <sphereGeometry args={[0.01, 6, 6]} />
        <meshStandardMaterial
          color="#3b82f6"
          emissive="#3b82f6"
          emissiveIntensity={isruActive ? 1.0 : 0.2}
        />
      </mesh>

      {/* 3D Floating ISRU HUD */}
      {(hovered || venting || showLabels) && (
        <Html center distanceFactor={7} position={[0, 0.38, 0]} style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div className="flex flex-col items-center">
            <div className="px-2 py-0.5 rounded-lg bg-slate-950/90 border border-emerald-400 text-white text-[9px] font-mono shadow-xl backdrop-blur-md whitespace-nowrap flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isruActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className="font-bold text-emerald-300">ISRU / MOXIE:</span>
              <span className="text-slate-200">O₂ +12 g/hr • {isruActive ? 'CATALYST ON' : 'STANDBY'}</span>
            </div>

            {(hovered || venting) && (
              <div className="mt-1 flex items-center gap-1 pointer-events-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    ventCo2();
                  }}
                  className="px-2 py-0.5 rounded bg-cyan-700 hover:bg-cyan-600 text-white text-[8px] font-mono font-bold shadow cursor-pointer active:scale-95"
                >
                  💨 VENT CO₂
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleIsru();
                  }}
                  className={`px-2 py-0.5 rounded text-white text-[8px] font-mono font-bold shadow cursor-pointer active:scale-95 ${
                    isruActive ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  ⚡ {isruActive ? 'ISRU ACTIVE' : 'START ISRU'}
                </button>
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Water & Oxygen Storage Tanks ──────────────────────────────
function ResourceTanks({
  isMars: _isMars,
  onClick,
  onInspect,
  showLabels = false,
}: {
  isMars?: boolean;
  onClick?: () => void;
  onInspect?: (obj: string) => void;
  showLabels?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [venting, setVenting] = useState(false);
  const [equalizing, setEqualizing] = useState(false);
  const metalTex = useMemo(() => makeMetalTexture('#94a3b8'), []);

  const ventValve = () => {
    soundFx.playAirlockHiss();
    setVenting(true);
    setTimeout(() => setVenting(false), 1100);
    onClick?.();
    onInspect?.('tanks');
  };

  const equalizeManifold = () => {
    soundFx.playBeep(720, 0.15);
    setEqualizing(true);
    setTimeout(() => setEqualizing(false), 1400);
    onClick?.();
    onInspect?.('tanks');
  };

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundFx.playBeep(520, 0.08);
    onClick?.();
    onInspect?.('tanks');
  };

  return (
    <group
      position={[-0.5, -0.04, 0.6]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      {[0, 1].map((i) => (
        <group key={i} position={[i * 0.22, 0, 0]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.08, 0.22, 8, 16]} />
            <meshStandardMaterial
              map={metalTex}
              metalness={0.85}
              roughness={0.2}
              emissive={hovered ? (i === 0 ? '#1d4ed8' : '#059669') : '#000000'}
              emissiveIntensity={hovered ? 0.3 : 0}
            />
          </mesh>
          <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.082, 0.012, 8, 24]} />
            <meshStandardMaterial
              color={i === 0 ? '#1d4ed8' : '#059669'}
              emissive={i === 0 ? '#1d4ed8' : '#059669'}
              emissiveIntensity={hovered || equalizing ? 1.5 : 0.5}
            />
          </mesh>

          {/* Cryogenic Vapor Vent Puff */}
          {venting && (
            <mesh position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.04, 0.12, 16]} />
              <meshBasicMaterial color="#e0f2fe" transparent opacity={0.7} side={THREE.DoubleSide} />
            </mesh>
          )}
        </group>
      ))}

      {/* Cross-feed manifold tube between tanks */}
      <mesh position={[0.11, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, 0.22, 8]} />
        <meshStandardMaterial
          color={equalizing ? '#38bdf8' : '#64748b'}
          emissive={equalizing ? '#38bdf8' : '#000000'}
          emissiveIntensity={equalizing ? 1.2 : 0}
          metalness={0.9}
        />
      </mesh>

      {/* 3D Floating Cryo Tank HUD */}
      {(hovered || venting || equalizing || showLabels) && (
        <Html center distanceFactor={7} position={[0.11, 0.36, 0]} style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div className="flex flex-col items-center">
            <div className="px-2 py-0.5 rounded-lg bg-slate-950/90 border border-blue-400 text-white text-[9px] font-mono shadow-xl backdrop-blur-md whitespace-nowrap flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="font-bold text-blue-300">CRYO TANKS:</span>
              <span className="text-slate-200">H₂O 94% • LOX 88%</span>
            </div>

            {(hovered || venting || equalizing) && (
              <div className="mt-1 flex items-center gap-1 pointer-events-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    ventValve();
                  }}
                  className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-[8px] font-mono font-bold shadow cursor-pointer active:scale-95"
                >
                  💧 VENT VALVE
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    equalizeManifold();
                  }}
                  className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-white text-[8px] font-mono font-bold shadow cursor-pointer active:scale-95"
                >
                  ⚖️ REBALANCE
                </button>
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Ground Terrain with Click-to-Move Dispatch ───────────────
function TerrainGround({
  isMars,
  onPointerClick,
  onInspect,
}: {
  isMars: boolean;
  onPointerClick?: (point: THREE.Vector3) => void;
  onInspect?: (obj: string) => void;
}) {
  const textures = useMemo(() => ({
    color: makeRegolithTexture(isMars),
    normal: makeRegolithNormalMap(),
  }), [isMars]);

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.18, 0]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onPointerClick?.(e.point);
        }}
      >
        <circleGeometry args={[4.8, 80]} />
        <meshStandardMaterial
          map={textures.color}
          normalMap={textures.normal}
          normalScale={new THREE.Vector2(0.8, 0.8)}
          roughness={0.96}
          metalness={0.04}
        />
      </mesh>
      {/* Realistic scattered interactive boulders */}
      <TerrainBoulders isMars={isMars} onInspect={onInspect} />
    </group>
  );
}

// ── Interactive Smooth Camera Controller ──────────────────────
function SmoothCameraController({
  cameraMode,
  controlsRef,
  cameraCommand,
  selectedCrewId,
}: {
  cameraMode: 'orbit' | 'dome' | 'greenhouse' | 'rover' | 'solar' | 'comms' | 'wide' | 'crew' | 'lifesupport' | 'tanks' | 'celestial';
  controlsRef: React.RefObject<OrbitControlsType | null>;
  cameraCommand?: { type: string; id: number } | null;
  selectedCrewId?: string | null;
}) {
  const { camera } = useThree();

  const presets = useMemo(() => {
    let crewPos = new THREE.Vector3(0.9, 0.45, 0.7);
    let crewTarget = new THREE.Vector3(0.55, 0.05, 0.25);
    if (selectedCrewId === 'marcus') {
      crewPos = new THREE.Vector3(-0.35, 0.45, 0.55);
      crewTarget = new THREE.Vector3(-0.65, 0.05, 0.15);
    } else if (selectedCrewId === 'maya') {
      crewPos = new THREE.Vector3(-0.55, 0.45, 1.25);
      crewTarget = new THREE.Vector3(-0.85, 0.05, 0.85);
    } else if (selectedCrewId === 'tariq') {
      crewPos = new THREE.Vector3(-0.05, 0.45, -0.15);
      crewTarget = new THREE.Vector3(-0.35, 0.05, -0.45);
    }

    return {
      orbit:       { pos: new THREE.Vector3(0.3, 2.1, 4.2), target: new THREE.Vector3(0, 0, 0) },
      dome:        { pos: new THREE.Vector3(0.0, 0.85, 2.0), target: new THREE.Vector3(0, 0.15, 0) },
      greenhouse:  { pos: new THREE.Vector3(-0.95, 0.65, 1.4), target: new THREE.Vector3(-0.85, 0.12, 0.55) },
      rover:       { pos: new THREE.Vector3(1.6, 0.65, 1.8), target: new THREE.Vector3(1.2, -0.05, 0.7) },
      solar:       { pos: new THREE.Vector3(-1.6, 0.75, 1.5), target: new THREE.Vector3(-1.0, 0.15, 0.05) },
      comms:       { pos: new THREE.Vector3(0.6, 1.1, 0.6), target: new THREE.Vector3(0.18, 0.5, -0.42) },
      wide:        { pos: new THREE.Vector3(0.0, 4.2, 6.2), target: new THREE.Vector3(0, -0.1, 0) },
      crew:        { pos: crewPos, target: crewTarget },
      lifesupport: { pos: new THREE.Vector3(-1.3, 0.55, 0.1), target: new THREE.Vector3(-0.78, 0.1, -0.32) },
      tanks:       { pos: new THREE.Vector3(-0.9, 0.55, 1.2), target: new THREE.Vector3(-0.39, 0.05, 0.6) },
      celestial:   { pos: new THREE.Vector3(0.5, 1.4, 2.5), target: new THREE.Vector3(-3.5, 3.2, -3.8) },
    };
  }, [selectedCrewId]);

  const animating = useRef(false);
  const progress = useRef(0);
  const prevMode = useRef(cameraMode);
  const prevCrewId = useRef(selectedCrewId);

  useEffect(() => {
    if (cameraMode !== prevMode.current || (cameraMode === 'crew' && selectedCrewId !== prevCrewId.current)) {
      prevMode.current = cameraMode;
      prevCrewId.current = selectedCrewId;
      animating.current = true;
      progress.current = 0;
    }
  }, [cameraMode, selectedCrewId]);

  // Handle manual rotate/zoom toolbar buttons
  const prevCommandId = useRef<number | null>(null);
  useEffect(() => {
    if (!cameraCommand || cameraCommand.id === prevCommandId.current || !controlsRef.current) return;
    prevCommandId.current = cameraCommand.id;
    animating.current = false;

    if (cameraCommand.type === 'rotateLeft') {
      controlsRef.current.setAzimuthalAngle(controlsRef.current.getAzimuthalAngle() - Math.PI / 8);
    } else if (cameraCommand.type === 'rotateRight') {
      controlsRef.current.setAzimuthalAngle(controlsRef.current.getAzimuthalAngle() + Math.PI / 8);
    } else if (cameraCommand.type === 'zoomIn') {
      controlsRef.current.dollyIn(1.25);
    } else if (cameraCommand.type === 'zoomOut') {
      controlsRef.current.dollyOut(1.25);
    } else if (cameraCommand.type === 'reset') {
      animating.current = true;
      progress.current = 0;
    }
    controlsRef.current.update();
  }, [cameraCommand, controlsRef]);

  useFrame(() => {
    if (!animating.current) return;
    const target = presets[cameraMode] || presets.orbit;
    camera.position.lerp(target.pos, 0.08);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(target.target, 0.08);
      controlsRef.current.update();
    }
    progress.current += 1;
    // Release completely to OrbitControls after transition
    if (progress.current > 35 || camera.position.distanceTo(target.pos) < 0.03) {
      animating.current = false;
    }
  });

  return null;
}

// ── Main Outpost Assembly ────────────────────────────────────
function FullOutpostModel({
  health,
  isMars,
  isDaytime,
  activeHazard,
  shieldActive,
  shieldThickness,
  foodRations,
  onInspect,
  roverCommand,
  crewCommand,
  selectedUnit,
  targetWaypoint,
  onSelectUnit,
  onTerrainClick,
  showLabels = false,
  crew,
  selectedCrewId,
  onSelectCrew,
}: {
  health: number;
  isMars: boolean;
  isDaytime: boolean;
  activeHazard?: string | null;
  shieldActive: boolean;
  shieldThickness: number;
  foodRations?: number;
  onInspect?: (objectName: string) => void;
  roverCommand?: { type: string; id: number } | null;
  crewCommand?: { type: string; id: number } | null;
  selectedUnit?: 'rover' | 'crew' | null;
  targetWaypoint?: THREE.Vector3 | null;
  onSelectUnit?: (unit: 'rover' | 'crew' | null) => void;
  onTerrainClick?: (pt: THREE.Vector3) => void;
  showLabels?: boolean;
  crew?: Astronaut[];
  selectedCrewId?: string | null;
  onSelectCrew?: (crewId: string) => void;
}) {
  const crewMembers = crew && crew.length > 0 ? crew : [
    {
      id: 'crew-1',
      name: 'Elena Vance',
      role: 'Commander' as const,
      avatar: '👨‍🚀',
      health: 100,
      morale: 95,
      fatigue: 15,
      radiationDose: 4.2,
      status: 'active' as const,
      specialtySkill: 'Mission command: boosts overall outpost sustainability score and prevents morale panic.',
    },
    {
      id: 'crew-2',
      name: 'Marcus Cole',
      role: 'Systems Engineer' as const,
      avatar: '👩‍🚀',
      health: 100,
      morale: 90,
      fatigue: 20,
      radiationDose: 5.1,
      status: 'active' as const,
      specialtySkill: 'Rapid EVA repair and optimization of power grid and battery life.',
    },
    {
      id: 'crew-3',
      name: 'Dr. Maya Lin',
      role: 'Astrobiologist' as const,
      avatar: '🧑‍🚀',
      health: 100,
      morale: 92,
      fatigue: 18,
      radiationDose: 3.8,
      status: 'active' as const,
      specialtySkill: 'Hydroponics master: increases crop growth rate and oxygen output by 25%.',
    },
    {
      id: 'crew-4',
      name: 'Dr. Tariq Al-Mansoor',
      role: 'Flight Surgeon' as const,
      avatar: '👨‍⚕️',
      health: 100,
      morale: 88,
      fatigue: 22,
      radiationDose: 4.0,
      status: 'active' as const,
      specialtySkill: 'Bio-telemetry monitor: rapidly detects radiation sickness and treats fatigue.',
    },
  ];

  return (
    <group position={[0, -0.02, 0]}>
      <TerrainGround isMars={isMars} onPointerClick={onTerrainClick} onInspect={onInspect} />
      <HabitatDome
        health={health}
        isMars={isMars}
        isDaytime={isDaytime}
        onClick={() => onInspect?.('dome')}
        onInspect={onInspect}
        showLabels={showLabels}
      />
      <BioGreenhouseDome
        isMars={isMars}
        isDaytime={isDaytime}
        foodRations={foodRations}
        onClick={() => onInspect?.('greenhouse')}
        showLabels={showLabels}
      />
      <SolarPanel
        side={-1}
        isMars={isMars}
        isDaytime={isDaytime}
        onClick={() => onInspect?.('solar')}
        onInspect={onInspect}
        showLabels={showLabels}
      />
      <SolarPanel
        side={1}
        isMars={isMars}
        isDaytime={isDaytime}
        onClick={() => onInspect?.('solar')}
        onInspect={onInspect}
        showLabels={showLabels}
      />
      <HighGainAntenna
        isMars={isMars}
        onClick={() => onInspect?.('antenna')}
        onInspect={onInspect}
        showLabels={showLabels}
      />
      <LifeSupportUnit
        isMars={isMars}
        onClick={() => onInspect?.('lifesupport')}
        onInspect={onInspect}
        showLabels={showLabels}
      />
      <ResourceTanks
        isMars={isMars}
        onClick={() => onInspect?.('tanks')}
        onInspect={onInspect}
        showLabels={showLabels}
      />

      {/* Interactive Rover with Survey Mission AI */}
      <PatrolRover
        isMars={isMars}
        roverCommand={roverCommand}
        targetWaypoint={targetWaypoint}
        isSelected={selectedUnit === 'rover'}
        showLabels={showLabels}
        onClick={() => {
          onSelectUnit?.('rover');
          onInspect?.('rover');
        }}
      />

      {/* Interactive Outpost Crew (All 4 Astronauts with specialized duties & stations) */}
      {crewMembers.map((member) => (
        <AstronautCharacter
          key={member.id}
          member={member}
          isMars={isMars}
          isSheltered={shieldActive || member.status === 'sheltered'}
          crewCommand={crewCommand}
          targetWaypoint={targetWaypoint}
          isSelected={selectedUnit === 'crew' && (selectedCrewId === member.id || (!selectedCrewId && member.id === 'crew-1'))}
          showLabels={showLabels}
          onClick={() => {
            onSelectUnit?.('crew');
            onSelectCrew?.(member.id);
            onInspect?.(`crew-${member.id}`);
          }}
        />
      ))}

      {/* Dynamic Waypoint Marker when player clicks ground */}
      {targetWaypoint && (
        <group position={[targetWaypoint.x, -0.175, targetWaypoint.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.08, 0.14, 32]} />
            <meshBasicMaterial
              color={selectedUnit === 'crew' ? '#10b981' : '#06b6d4'}
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
            />
          </mesh>
          <pointLight
            color={selectedUnit === 'crew' ? '#10b981' : '#06b6d4'}
            intensity={1.2}
            distance={0.8}
          />
        </group>
      )}

      <SinterShieldDome
        active={shieldActive}
        thicknessCm={shieldThickness}
        isMars={isMars}
        onClick={() => onInspect?.('shield')}
      />
      <SkyCelestialBodies
        isMars={isMars}
        onClick={() => onInspect?.('celestial')}
        onInspect={onInspect}
      />
      <PerimeterFloodlights
        isDaytime={isDaytime}
        onClick={() => onInspect?.('lights')}
      />
      <EnvironmentalEffects isMars={isMars} activeHazard={activeHazard} isDaytime={isDaytime} />

      {/* Floating 3D Holographic Pins over stationary modules (visible only when labels are turned on) */}
      {showLabels && (
        <>
          <HoloPin
            position={[0, 0.88, 0]}
            label="HAB DOME"
            icon="🏠"
            color="#22d3ee"
            onClick={() => onInspect?.('dome')}
          />
          <HoloPin
            position={[-0.85, 0.58, 0.55]}
            label="GREENHOUSE"
            icon="🌱"
            color="#34d399"
            onClick={() => onInspect?.('greenhouse')}
          />
          <HoloPin
            position={[-1.05, 0.58, 0.05]}
            label="SOLAR ARRAY"
            icon="⚡"
            color="#fbbf24"
            onClick={() => onInspect?.('solar')}
          />
          <HoloPin
            position={[0.18, 0.88, -0.42]}
            label="COMMS DISH"
            icon="📡"
            color="#a78bfa"
            onClick={() => onInspect?.('antenna')}
          />
          <HoloPin
            position={[-0.78, 0.45, -0.32]}
            label="ISRU MOXIE"
            icon="🧪"
            color="#10b981"
            onClick={() => onInspect?.('lifesupport')}
          />
          <HoloPin
            position={[-0.39, 0.42, 0.6]}
            label="CRYO TANKS"
            icon="🛢️"
            color="#38bdf8"
            onClick={() => onInspect?.('tanks')}
          />
        </>
      )}
    </group>
  );
}

// ── Exported MiniOutpostScene ──────────────────────────────────
export interface MiniOutpostSceneProps {
  health?: number;
  isMars?: boolean;
  isDaytime?: boolean;
  activeHazard?: string | null;
  shieldActive?: boolean;
  shieldThickness?: number;
  foodRations?: number;
  cameraMode?: 'orbit' | 'dome' | 'greenhouse' | 'rover' | 'solar' | 'comms' | 'wide' | 'crew' | 'lifesupport' | 'tanks' | 'celestial';
  cameraCommand?: { type: string; id: number } | null;
  roverCommand?: { type: string; id: number } | null;
  crewCommand?: { type: string; id: number } | null;
  showLabels?: boolean;
  crew?: Astronaut[];
  selectedCrewId?: string | null;
  onSelectCrew?: (crewId: string) => void;
  onInspect?: (objectName: string) => void;
}

export function MiniOutpostScene({
  health = 100,
  isMars = false,
  isDaytime = true,
  activeHazard = null,
  shieldActive = false,
  shieldThickness = 20,
  foodRations = 100,
  cameraMode = 'orbit',
  cameraCommand = null,
  roverCommand = null,
  crewCommand = null,
  showLabels = false,
  crew,
  selectedCrewId,
  onSelectCrew,
  onInspect,
}: MiniOutpostSceneProps) {
  const controlsRef = useRef<OrbitControlsType | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<'rover' | 'crew' | null>(null);
  const [targetWaypoint, setTargetWaypoint] = useState<THREE.Vector3 | null>(null);

  const handleTerrainClick = (pt: THREE.Vector3) => {
    setTargetWaypoint(pt.clone());
    // Auto-select rover if no unit is currently active
    if (!selectedUnit) {
      setSelectedUnit('rover');
    }
  };

  // Storm and night lighting configurations
  const isStorm = activeHazard === 'dust-storm';
  const isFlare = activeHazard === 'solar-flare';

  return (
    <Canvas
      camera={{ position: [0.3, 2.1, 4.2], fov: 42 }}
      style={{ width: '100%', height: '100%' }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      shadows
    >
      {/* Fog during dust storm */}
      {isStorm && <fog attach="fog" args={['#7c2d12', 1, 8]} />}
      {isFlare && <fog attach="fog" args={['#b45309', 2, 10]} />}

      {/* Sky ambient: high during day, low at night */}
      <ambientLight
        intensity={isDaytime ? (isStorm ? 0.6 : 0.45) : 0.15}
        color={!isDaytime ? '#1e293b' : isMars ? '#fed7aa' : '#dde8f0'}
      />

      {/* Primary directional sun (disabled or dimmed at night) */}
      <directionalLight
        position={isDaytime ? [6, 7, 5] : [2, -5, 2]}
        intensity={
          !isDaytime ? 0.08 : isStorm ? 0.8 : isMars ? 2.2 : 3.2
        }
        color={!isDaytime ? '#38bdf8' : isMars ? '#fde8c8' : '#fff8f0'}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* Atmospheric hemisphere bounce */}
      <hemisphereLight
        args={[
          !isDaytime ? '#0f172a' : isMars ? '#f97316' : '#bfdbfe',
          !isDaytime ? '#020617' : isMars ? '#450a00' : '#0c1120',
          !isDaytime ? 0.15 : isMars ? 0.35 : 0.45,
        ]}
      />

      {/* Ground albedo fill */}
      <pointLight
        position={[-4, -1, 4]}
        intensity={!isDaytime ? 0.2 : 0.5}
        color={isMars ? '#b45309' : '#1e40af'}
      />

      {/* Deep space stars (brighter at night) */}
      <Stars
        radius={70}
        depth={40}
        count={!isDaytime ? 3500 : 2000}
        factor={!isDaytime ? 4 : 2.5}
        saturation={0}
        fade
        speed={0.3}
      />

      {/* Smooth camera animation controller */}
      <SmoothCameraController
        cameraMode={cameraMode}
        controlsRef={controlsRef}
        cameraCommand={cameraCommand}
        selectedCrewId={selectedCrewId}
      />

      {/* The 3D outpost */}
      <FullOutpostModel
        health={health}
        isMars={isMars}
        isDaytime={isDaytime}
        activeHazard={activeHazard}
        shieldActive={shieldActive}
        shieldThickness={shieldThickness}
        foodRations={foodRations}
        onInspect={onInspect}
        roverCommand={roverCommand}
        crewCommand={crewCommand}
        selectedUnit={selectedUnit}
        targetWaypoint={targetWaypoint}
        onSelectUnit={setSelectedUnit}
        onTerrainClick={handleTerrainClick}
        showLabels={showLabels}
        crew={crew}
        selectedCrewId={selectedCrewId}
        onSelectCrew={onSelectCrew}
      />

      {/* User Orbit Controls with full 360 rotation and smooth zoom */}
      <OrbitControls
        ref={controlsRef}
        enableZoom={true}
        minDistance={0.5}
        maxDistance={10.0}
        enablePan={false}
        enableDamping={true}
        dampingFactor={0.08}
        minPolarAngle={0.05}
        maxPolarAngle={Math.PI / 2.02}
      />
    </Canvas>
  );
}
