'use client';

import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import * as THREE from 'three';
import { soundFx } from '../../audio/sound-synthesizer';

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

const HAZARD_PARTICLES = Array.from({ length: 100 }, (_, i) => ({
  angle: (i / 100) * Math.PI * 2,
  dist: 0.6 + ((i * 13) % 30) * 0.1,
  height: 0.1 + ((i * 9) % 25) * 0.08,
  speed: 1.2 + ((i * 5) % 8) * 0.3,
  size: 0.025 + ((i * 3) % 5) * 0.008,
}));

// ── Procedural texture generators ────────────────────────────

function makeRegolithTexture(isMars: boolean) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const base = isMars ? '#7c2d12' : '#374151';
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  // Deterministic noise layers
  for (let i = 0; i < 2500; i++) {
    const x = ((i * 167) % size);
    const y = ((i * 313) % size);
    const r = (i % 4) * 0.8 + 0.6;
    const dark = i % 2 === 0;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = dark
      ? 'rgba(0,0,0,0.18)'
      : `rgba(255,180,120,${isMars ? 0.22 : 0.08})`;
    ctx.fill();
  }

  // Craters
  for (let i = 0; i < 12; i++) {
    const x = ((i * 191 + 50) % (size - 60)) + 30;
    const y = ((i * 241 + 40) % (size - 60)) + 30;
    const r = (i % 5) * 4 + 10;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(0,0,0,0.45)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0.15)');
    grad.addColorStop(1, 'rgba(255,255,255,0.06)');
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Rover track path lines
  ctx.strokeStyle = 'rgba(0,0,0,0.28)';
  ctx.lineWidth = 4;
  ctx.setLineDash([8, 4]);
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 170, 0, Math.PI * 1.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 185, 0, Math.PI * 1.5);
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

  ctx.fillStyle = '#0a1020';
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
      ctx.strokeStyle = 'rgba(6,182,212,0.35)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }
  return new THREE.CanvasTexture(canvas);
}

// ── 3D Holographic Pin Marker ────────────────────────────────
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
        <meshBasicMaterial color={color} transparent opacity={hovered ? 0.8 : 0.4} />
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
      <pointLight color={color} intensity={hovered ? 0.8 : 0.3} distance={0.6} />

      {/* Floating HTML label tool tip on hover */}
      {hovered && (
        <group position={[0, 0.22, 0]}>
          <mesh>
            <planeGeometry args={[0.36, 0.12]} />
            <meshBasicMaterial color="#020617" transparent opacity={0.85} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0, 0.002]}>
            <planeGeometry args={[0.34, 0.1]} />
            <meshBasicMaterial color={color} transparent opacity={0.2} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ── Interactive Animated Astronaut ────────────────────────────
function AstronautCharacter({
  isMars,
  onClick,
}: {
  isMars: boolean;
  onClick?: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const [waving, setWaving] = useState(false);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!groupRef.current) return;

    // Gentle low-gravity moon bounce / patrol walk between airlock and rover
    const walkCycle = Math.sin(t * 1.8);
    const posX = 0.55 + Math.sin(t * 0.4) * 0.2;
    const posZ = 0.25 + Math.cos(t * 0.4) * 0.15;
    groupRef.current.position.x = posX;
    groupRef.current.position.z = posZ;
    groupRef.current.position.y = -0.11 + Math.abs(Math.sin(t * 1.8)) * 0.035;
    groupRef.current.rotation.y = -Math.atan2(Math.cos(t * 0.4) * 0.15, Math.sin(t * 0.4) * 0.2) + Math.PI / 2;

    if (leftLegRef.current && rightLegRef.current) {
      leftLegRef.current.rotation.x = walkCycle * 0.35;
      rightLegRef.current.rotation.x = -walkCycle * 0.35;
    }

    if (rightArmRef.current) {
      if (waving) {
        rightArmRef.current.rotation.z = -1.6 + Math.sin(t * 12) * 0.4;
      } else {
        rightArmRef.current.rotation.x = -walkCycle * 0.3;
        rightArmRef.current.rotation.z = -0.2;
      }
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundFx.playBeep(980, 0.12);
    setWaving(true);
    setTimeout(() => setWaving(false), 2200);
    onClick?.();
  };

  return (
    <group
      ref={groupRef}
      position={[0.55, -0.11, 0.25]}
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
      {/* Chest LED status */}
      <mesh position={[-0.015, 0.17, 0.042]}>
        <sphereGeometry args={[0.005, 6, 6]} />
        <meshBasicMaterial color={isMars ? '#f97316' : '#10b981'} />
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
        <meshStandardMaterial color="#3b82f6" metalness={0.8} />
      </mesh>
      <mesh position={[0.025, 0.23, -0.042]}>
        <cylinderGeometry args={[0.01, 0.01, 0.02, 8]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.8} />
      </mesh>

      {/* Helmet sphere */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Gold reflective solar visor */}
      <mesh position={[0, 0.25, 0.025]} rotation={[0.1, 0, 0]}>
        <sphereGeometry args={[0.04, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
        <meshStandardMaterial
          color="#f59e0b"
          metalness={0.96}
          roughness={0.06}
          emissive="#d97706"
          emissiveIntensity={hovered ? 0.8 : 0.3}
        />
      </mesh>

      {/* Left arm */}
      <mesh position={[-0.065, 0.14, 0]}>
        <boxGeometry args={[0.03, 0.1, 0.03]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>

      {/* Right arm (waving / tool arm) */}
      <group ref={rightArmRef} position={[0.065, 0.19, 0]}>
        <mesh position={[0, -0.05, 0]}>
          <boxGeometry args={[0.03, 0.1, 0.03]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
        {/* Handheld scientific scanner */}
        <mesh position={[0, -0.1, 0.03]} rotation={[0.4, 0, 0]}>
          <boxGeometry args={[0.02, 0.04, 0.03]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} />
        </mesh>
        <mesh position={[0, -0.11, 0.045]}>
          <coneGeometry args={[0.01, 0.02, 8]} />
          <meshBasicMaterial color="#06b6d4" />
        </mesh>
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

      {/* Mission patch stripe on shoulder */}
      <mesh position={[-0.05, 0.18, 0]}>
        <boxGeometry args={[0.005, 0.02, 0.02]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
    </group>
  );
}

// ── Interactive Patrol Rover ─────────────────────────────────
function PatrolRover({
  isMars,
  onClick,
}: {
  isMars: boolean;
  onClick?: () => void;
}) {
  const roverGroup = useRef<THREE.Group>(null);
  const wheelsRef = useRef<THREE.Group>(null);
  const [honking, setHonking] = useState(false);
  const [hovered, setHovered] = useState(false);

  const metalTex = useMemo(() => makeMetalTexture('#374151'), []);
  const cellTex = useMemo(() => makeSolarCellTexture(), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!roverGroup.current) return;

    // Patrol trajectory in wide elliptical arc on terrain
    const angle = t * 0.15;
    const rX = 1.35;
    const rZ = 1.0;
    const x = Math.sin(angle) * rX;
    const z = Math.cos(angle) * rZ + 0.3;
    roverGroup.current.position.x = x;
    roverGroup.current.position.z = z;
    roverGroup.current.position.y = -0.11 + Math.sin(t * 2) * 0.004;

    // Face direction of motion
    const dx = Math.cos(angle) * rX;
    const dz = -Math.sin(angle) * rZ;
    roverGroup.current.rotation.y = Math.atan2(dx, dz);

    if (wheelsRef.current) {
      wheelsRef.current.children.forEach((w) => {
        w.rotation.x += 0.08;
      });
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundFx.playRoverHorn();
    setHonking(true);
    setTimeout(() => setHonking(false), 800);
    onClick?.();
  };

  const wheelPositions: [number, number, number][] = [
    [-0.14, -0.07, 0.12], [0.14, -0.07, 0.12],
    [-0.14, -0.07, -0.12], [0.14, -0.07, -0.12],
    [-0.14, -0.07, 0.0], [0.14, -0.07, 0.0],
  ];

  return (
    <group
      ref={roverGroup}
      position={[1.2, -0.11, 0.8]}
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
      <mesh position={[0.13, 0.12, 0.06]} rotation={[0, 0, -0.4]}>
        <cylinderGeometry args={[0.009, 0.009, 0.18, 6]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[0.19, 0.19, 0.06]}>
        <sphereGeometry args={[0.024, 8, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
      </mesh>

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
        intensity={honking || hovered ? 2.5 : 1.2}
        color="#fef08a"
        angle={0.5}
        penumbra={0.6}
        distance={2.5}
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
}: {
  active: boolean;
  thicknessCm: number;
  isMars: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.06;
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      const pulse = Math.sin(t * 3) * 0.05;
      const baseOpacity = active ? 0.35 : Math.min(0.25, (thicknessCm / 50) * 0.25);
      mat.opacity = baseOpacity + pulse;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = -t * 0.2;
    }
  });

  const shieldColor = isMars ? '#f97316' : '#06b6d4';
  const emissiveColor = isMars ? '#ea580c' : '#0891b2';

  if (!active && thicknessCm <= 0) return null;

  return (
    <group position={[0, 0.07, 0]}>
      {/* Geodesic translucent forcefield dome */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.82, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={shieldColor}
          emissive={emissiveColor}
          emissiveIntensity={active ? 1.5 : 0.6}
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
          opacity={active ? 0.18 : 0.08}
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
    </group>
  );
}

// ── Overhead Satellite in Orbit ──────────────────────────────
function OverheadSatellite({ isMars }: { isMars: boolean }) {
  const satRef = useRef<THREE.Group>(null);
  const beaconRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!satRef.current) return;
    const speed = 0.12;
    const x = Math.sin(t * speed) * 3.8;
    const z = Math.cos(t * speed) * 3.8;
    satRef.current.position.set(x, 2.8 + Math.sin(t * 0.2) * 0.3, z);
    satRef.current.rotation.y = t * 0.3;

    if (beaconRef.current) {
      beaconRef.current.intensity = Math.sin(t * 6) > 0.5 ? 1.2 : 0.1;
    }
  });

  return (
    <group ref={satRef} position={[2, 2.8, -2]} scale={0.6}>
      {/* Central body */}
      <mesh>
        <boxGeometry args={[0.14, 0.1, 0.1]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Solar wings left and right */}
      {[-0.24, 0.24].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <boxGeometry args={[0.26, 0.01, 0.12]} />
          <meshStandardMaterial color="#1e3a8a" emissive="#1e40af" emissiveIntensity={0.3} metalness={0.8} />
        </mesh>
      ))}

      {/* Comms dish */}
      <mesh position={[0, -0.07, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.06, 0.04, 12, 1, true]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* Beacon light */}
      <pointLight ref={beaconRef} color={isMars ? '#22c55e' : '#ef4444'} intensity={0.5} distance={1.2} />
    </group>
  );
}

// ── Environmental Weather / Hazard Effects ────────────────────
function EnvironmentalEffects({
  isMars,
  activeHazard,
}: {
  isMars: boolean;
  activeHazard?: string | null;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const stormRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (pointsRef.current) {
      pointsRef.current.rotation.y = t * 0.04;
    }
    if (stormRef.current) {
      stormRef.current.rotation.y = t * 0.8;
      stormRef.current.position.y = Math.sin(t * 2) * 0.08;
    }
  });

  // Base ambient stardust / floating micro-particles
  const dustPositions = useMemo(() => {
    const pos = new Float32Array(DUST_COUNT * 3);
    DUST_DATA.forEach((d, i) => {
      pos[i * 3] = Math.cos(d.angle) * d.radius;
      pos[i * 3 + 1] = d.height;
      pos[i * 3 + 2] = Math.sin(d.angle) * d.radius;
    });
    return pos;
  }, []);

  // Storm hazard particle array
  const stormPositions = useMemo(() => {
    const pos = new Float32Array(100 * 3);
    HAZARD_PARTICLES.forEach((p, i) => {
      pos[i * 3] = Math.cos(p.angle) * p.dist;
      pos[i * 3 + 1] = p.height;
      pos[i * 3 + 2] = Math.sin(p.angle) * p.dist;
    });
    return pos;
  }, []);

  return (
    <group>
      {/* Floating ambient space dust */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.03}
          color={isMars ? '#fdba74' : '#93c5fd'}
          transparent
          opacity={0.5}
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
            size={0.05}
            color={activeHazard === 'solar-flare' ? '#f59e0b' : '#ef4444'}
            transparent
            opacity={0.8}
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
  onClick,
}: {
  health: number;
  isMars: boolean;
  onClick?: () => void;
}) {
  const innerRef = useRef<THREE.PointLight>(null);
  const [pulse, setPulse] = useState(false);
  const [hovered, setHovered] = useState(false);

  const domeTexture = useMemo(() => makeDomeTexture(), []);
  const metalTex = useMemo(() => makeMetalTexture('#374151'), []);

  useFrame((state) => {
    if (!innerRef.current) return;
    const boost = pulse ? 1.5 : 0;
    innerRef.current.intensity = 0.6 + 0.15 * Math.sin(state.clock.getElapsedTime() * 1.2) + boost;
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundFx.playAirlockHiss();
    setPulse(true);
    setTimeout(() => setPulse(false), 900);
    onClick?.();
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
          emissive={hovered ? '#06b6d4' : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>

      {/* Glowing Neon Seal Ring */}
      <mesh position={[0, 0.08, 0]}>
        <torusGeometry args={[0.585, 0.024, 12, 80]} />
        <meshStandardMaterial
          color="#06b6d4"
          emissive="#06b6d4"
          emissiveIntensity={hovered ? 3.0 : 1.8}
          metalness={0.9}
        />
      </mesh>

      {/* Airlock Vestibule */}
      <mesh position={[0.55, -0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 0.22, 16]} />
        <meshStandardMaterial map={metalTex} roughness={0.4} metalness={0.75} />
      </mesh>
      {/* Airlock Door */}
      <mesh position={[0.67, -0.05, 0]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.1, 16]} />
        <meshStandardMaterial color="#374151" roughness={0.5} metalness={0.8} />
      </mesh>

      {/* Interior Warm Habitation Light */}
      <pointLight ref={innerRef} position={[0, 0.12, 0]} intensity={0.6} color="#fde68a" distance={1.2} />
    </group>
  );
}

// ── Solar Panel Array ─────────────────────────────────────────
function SolarPanel({
  side,
  isMars,
  onClick,
}: {
  side: -1 | 1;
  isMars: boolean;
  onClick?: () => void;
}) {
  const panelRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const cellTex = useMemo(() => makeSolarCellTexture(), []);
  const metalTex = useMemo(() => makeMetalTexture('#4b5563'), []);

  useFrame((state) => {
    if (!panelRef.current) return;
    panelRef.current.rotation.z = side * 0.04 * Math.sin(state.clock.getElapsedTime() * 0.6);
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundFx.playScanner();
    onClick?.();
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
      {/* Mast */}
      <mesh position={[0, -0.06, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.28, 10]} />
        <meshStandardMaterial map={metalTex} metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Boom */}
      <mesh position={[0, 0.09, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.013, 0.013, 0.82, 8]} />
        <meshStandardMaterial map={metalTex} metalness={0.85} roughness={0.3} />
      </mesh>

      {/* Two panel arrays */}
      {([-0.28, 0.28] as const).map((offset, pi) => (
        <group key={pi} position={[offset, 0.09, 0]}>
          <mesh rotation={[0.12, 0, 0]} castShadow>
            <boxGeometry args={[0.42, 0.02, 0.24]} />
            <meshStandardMaterial
              map={cellTex}
              metalness={0.7}
              roughness={0.15}
              emissive={hovered ? '#3b82f6' : isMars ? '#0c1550' : '#1e3a8a'}
              emissiveIntensity={hovered ? 0.6 : 0.25}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── Spinning High-Gain Antenna Dish ──────────────────────────
function HighGainAntenna({
  isMars,
  onClick,
}: {
  isMars: boolean;
  onClick?: () => void;
}) {
  const dishRef = useRef<THREE.Group>(null);
  const ringPulseRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const metalTex = useMemo(() => makeMetalTexture('#6b7280'), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (dishRef.current) {
      dishRef.current.rotation.y = t * 0.45;
    }
    if (ringPulseRef.current) {
      const s = 1 + (t * 2) % 2.5;
      ringPulseRef.current.scale.set(s, s, s);
      const mat = ringPulseRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 1 - (s - 1) / 1.5) * 0.5;
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundFx.playTelemetryPing();
    onClick?.();
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

      {/* Dish Assembly */}
      <group ref={dishRef} position={[0, 0.62, 0]} rotation={[0.45, 0, 0]}>
        <mesh>
          <sphereGeometry args={[0.13, 24, 24, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
          <meshStandardMaterial
            map={metalTex}
            metalness={0.9}
            roughness={0.15}
            side={THREE.DoubleSide}
            emissive={hovered ? '#06b6d4' : '#000000'}
            emissiveIntensity={hovered ? 0.3 : 0}
          />
        </mesh>
        <mesh position={[0, 0.07, 0]}>
          <cylinderGeometry args={[0.015, 0.02, 0.05, 8]} />
          <meshStandardMaterial color="#1f2937" metalness={0.95} />
        </mesh>
      </group>

      {/* Expanding radio telemetry wave ring */}
      <mesh ref={ringPulseRef} position={[0, 0.64, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.1, 0.12, 24]} />
        <meshBasicMaterial color={isMars ? '#f97316' : '#22d3ee'} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Blinking Top Beacon */}
      <mesh position={[0, 0.64, 0]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial
          color={isMars ? '#f97316' : '#06b6d4'}
          emissive={isMars ? '#f97316' : '#06b6d4'}
          emissiveIntensity={hovered ? 3.0 : 1.6}
        />
      </mesh>
    </group>
  );
}

// ── MOXIE / Life Support & ISRU Unit ──────────────────────────
function LifeSupportUnit({
  isMars,
  onClick,
}: {
  isMars: boolean;
  onClick?: () => void;
}) {
  const metalTex = useMemo(() => makeMetalTexture('#374151'), []);

  return (
    <group
      position={[-0.78, -0.02, -0.32]}
      onClick={(e) => {
        e.stopPropagation();
        soundFx.playBeep(640);
        onClick?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      <mesh castShadow>
        <boxGeometry args={[0.26, 0.34, 0.24]} />
        <meshStandardMaterial map={metalTex} metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Exhaust stack */}
      <mesh position={[0.06, 0.2, 0]}>
        <cylinderGeometry args={[0.028, 0.022, 0.1, 8]} />
        <meshStandardMaterial color="#6b7280" metalness={0.85} roughness={0.2} />
      </mesh>
      {/* Pipe connection */}
      <mesh position={[0.2, 0.05, 0.1]} rotation={[0.4, 0.3, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 0.35, 8]} />
        <meshStandardMaterial color="#4b5563" metalness={0.75} roughness={0.3} />
      </mesh>
      {/* Dual status LEDs */}
      <mesh position={[-0.03, 0.14, 0.128]}>
        <sphereGeometry args={[0.01, 6, 6]} />
        <meshStandardMaterial
          color={isMars ? '#f97316' : '#10b981'}
          emissive={isMars ? '#f97316' : '#10b981'}
          emissiveIntensity={1.2}
        />
      </mesh>
      <mesh position={[0.03, 0.14, 0.128]}>
        <sphereGeometry args={[0.01, 6, 6]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

// ── Water & Oxygen Storage Tanks ──────────────────────────────
function ResourceTanks() {
  const metalTex = useMemo(() => makeMetalTexture('#94a3b8'), []);
  return (
    <group position={[-0.5, -0.04, 0.6]}>
      {[0, 1].map((i) => (
        <group key={i} position={[i * 0.22, 0, 0]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.08, 0.22, 8, 16]} />
            <meshStandardMaterial map={metalTex} metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.082, 0.012, 8, 24]} />
            <meshStandardMaterial
              color={i === 0 ? '#1d4ed8' : '#059669'}
              emissive={i === 0 ? '#1d4ed8' : '#059669'}
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── Ground Terrain ───────────────────────────────────────────
function TerrainGround({ isMars }: { isMars: boolean }) {
  const textures = useMemo(() => ({
    color: makeRegolithTexture(isMars),
    normal: makeRegolithNormalMap(),
  }), [isMars]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]} receiveShadow>
        <circleGeometry args={[3.2, 96]} />
        <meshStandardMaterial
          map={textures.color}
          normalMap={textures.normal}
          normalScale={new THREE.Vector2(1.2, 1.2)}
          roughness={0.95}
          metalness={0.05}
        />
      </mesh>
      {/* Outer berm perimeter */}
      <mesh position={[0, -0.14, 0]}>
        <torusGeometry args={[2.7, 0.16, 8, 96]} />
        <meshStandardMaterial color={isMars ? '#6b1d0a' : '#1f2937'} roughness={1} />
      </mesh>
    </group>
  );
}

// ── Interactive Smooth Camera Controller ──────────────────────
function SmoothCameraController({
  cameraMode,
  controlsRef,
}: {
  cameraMode: 'orbit' | 'dome' | 'rover' | 'solar' | 'comms' | 'wide';
  controlsRef: React.RefObject<OrbitControlsType | null>;
}) {
  const { camera } = useThree();

  const presets = useMemo(() => ({
    orbit: { pos: new THREE.Vector3(0.3, 2.1, 4.2), target: new THREE.Vector3(0, 0, 0) },
    dome:  { pos: new THREE.Vector3(0.0, 0.85, 2.2), target: new THREE.Vector3(0, 0.15, 0) },
    rover: { pos: new THREE.Vector3(1.6, 0.65, 1.8), target: new THREE.Vector3(1.2, -0.05, 0.7) },
    solar: { pos: new THREE.Vector3(-1.6, 0.75, 1.5), target: new THREE.Vector3(-1.0, 0.15, 0.05) },
    comms: { pos: new THREE.Vector3(0.6, 1.1, 0.6), target: new THREE.Vector3(0.18, 0.5, -0.42) },
    wide:  { pos: new THREE.Vector3(0.0, 3.9, 5.8), target: new THREE.Vector3(0, -0.1, 0) },
  }), []);

  useFrame(() => {
    const target = presets[cameraMode] || presets.orbit;
    camera.position.lerp(target.pos, 0.05);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(target.target, 0.05);
      controlsRef.current.update();
    }
  });

  return null;
}

// ── Main Outpost Assembly ────────────────────────────────────
function FullOutpostModel({
  health,
  isMars,
  activeHazard,
  shieldActive,
  shieldThickness,
  onInspect,
}: {
  health: number;
  isMars: boolean;
  activeHazard?: string | null;
  shieldActive: boolean;
  shieldThickness: number;
  onInspect?: (objectName: string) => void;
}) {
  return (
    <group position={[0, -0.02, 0]}>
      <TerrainGround isMars={isMars} />
      <HabitatDome health={health} isMars={isMars} onClick={() => onInspect?.('dome')} />
      <SolarPanel side={-1} isMars={isMars} onClick={() => onInspect?.('solar')} />
      <SolarPanel side={1} isMars={isMars} onClick={() => onInspect?.('solar')} />
      <HighGainAntenna isMars={isMars} onClick={() => onInspect?.('antenna')} />
      <LifeSupportUnit isMars={isMars} onClick={() => onInspect?.('lifesupport')} />
      <ResourceTanks />
      <PatrolRover isMars={isMars} onClick={() => onInspect?.('rover')} />
      <AstronautCharacter isMars={isMars} onClick={() => onInspect?.('crew')} />
      <SinterShieldDome active={shieldActive} thicknessCm={shieldThickness} isMars={isMars} />
      <OverheadSatellite isMars={isMars} />
      <EnvironmentalEffects isMars={isMars} activeHazard={activeHazard} />

      {/* Floating 3D Holographic Pins over key modules */}
      <HoloPin
        position={[0, 0.88, 0]}
        label="HAB DOME"
        icon="🏠"
        color="#22d3ee"
        onClick={() => onInspect?.('dome')}
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
    </group>
  );
}

// ── Exported MiniOutpostScene ──────────────────────────────────
export interface MiniOutpostSceneProps {
  health?: number;
  isMars?: boolean;
  activeHazard?: string | null;
  shieldActive?: boolean;
  shieldThickness?: number;
  cameraMode?: 'orbit' | 'dome' | 'rover' | 'solar' | 'comms' | 'wide';
  onInspect?: (objectName: string) => void;
}

export function MiniOutpostScene({
  health = 100,
  isMars = false,
  activeHazard = null,
  shieldActive = false,
  shieldThickness = 20,
  cameraMode = 'orbit',
  onInspect,
}: MiniOutpostSceneProps) {
  const controlsRef = useRef<OrbitControlsType | null>(null);

  return (
    <Canvas
      camera={{ position: [0.3, 2.1, 4.2], fov: 42 }}
      style={{ width: '100%', height: '100%' }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      shadows
    >
      <ambientLight intensity={0.4} color="#dde8f0" />

      {/* Primary directional sun */}
      <directionalLight
        position={[6, 7, 5]}
        intensity={isMars ? 2.0 : 2.8}
        color={isMars ? '#fde8c8' : '#fff8f0'}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* Atmospheric hemisphere bounce */}
      <hemisphereLight
        args={[
          isMars ? '#f97316' : '#bfdbfe',
          isMars ? '#450a00' : '#0c1120',
          isMars ? 0.35 : 0.45,
        ]}
      />

      {/* Ground albedo fill */}
      <pointLight position={[-4, -1, 4]} intensity={0.5} color={isMars ? '#b45309' : '#1e40af'} />

      {/* Deep space stars */}
      <Stars radius={70} depth={40} count={2200} factor={3} saturation={0} fade speed={0.3} />

      {/* Smooth camera animation controller */}
      <SmoothCameraController cameraMode={cameraMode} controlsRef={controlsRef} />

      {/* The 3D outpost */}
      <FullOutpostModel
        health={health}
        isMars={isMars}
        activeHazard={activeHazard}
        shieldActive={shieldActive}
        shieldThickness={shieldThickness}
        onInspect={onInspect}
      />

      {/* User Orbit Controls with zoom allowed for interactive inspection */}
      <OrbitControls
        ref={controlsRef}
        enableZoom={true}
        minDistance={1.8}
        maxDistance={7.5}
        enablePan={false}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 2.05}
      />
    </Canvas>
  );
}
