'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// ── Procedural texture generators ────────────────────────────

function makeRegolithTexture(isMars: boolean) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const base = isMars ? '#7c2d12' : '#374151';
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  // Noise layers
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 3 + 0.5;
    const alpha = Math.random() * 0.3 + 0.05;
    const dark = Math.random() > 0.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = dark
      ? `rgba(0,0,0,${alpha})`
      : `rgba(255,180,120,${alpha * (isMars ? 0.7 : 0.3)})`;
    ctx.fill();
  }

  // Small crater depressions
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 20 + 5;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(0,0,0,0.4)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0.1)');
    grad.addColorStop(1, 'rgba(255,255,255,0.05)');
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Rover track lines
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 4;
  ctx.setLineDash([6, 3]);
  ctx.beginPath();
  ctx.moveTo(300, 400);
  ctx.lineTo(400, 300);
  ctx.lineTo(450, 200);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(312, 400);
  ctx.lineTo(412, 300);
  ctx.lineTo(462, 200);
  ctx.stroke();
  ctx.setLineDash([]);

  return new THREE.CanvasTexture(canvas);
}

function makeRegolithNormalMap() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  // Base neutral normal (128,128,255)
  ctx.fillStyle = 'rgb(128,128,255)';
  ctx.fillRect(0, 0, size, size);
  // Random bumps in R/G channels
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 8 + 2;
    const dx = (Math.random() - 0.5) * 60 + 128;
    const dy = (Math.random() - 0.5) * 60 + 128;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(${dx|0},${dy|0},255,0.6)`);
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

  // Background deep blue
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, w, h);

  // Cell grid
  const cols = 12; const rows = 6;
  const pw = w / cols; const ph = h / rows;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const x = c * pw; const y = r * ph;
      // Cell body
      const cellGrad = ctx.createLinearGradient(x, y, x + pw, y + ph);
      cellGrad.addColorStop(0, '#1e3a8a');
      cellGrad.addColorStop(0.4, '#1d4ed8');
      cellGrad.addColorStop(1, '#1e3a8a');
      ctx.fillStyle = cellGrad;
      ctx.fillRect(x + 1.5, y + 1.5, pw - 3, ph - 3);

      // Metallic bus-bar cross lines
      ctx.strokeStyle = 'rgba(148,163,184,0.4)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x + pw / 2, y + 1);
      ctx.lineTo(x + pw / 2, y + ph - 1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 1, y + ph / 2);
      ctx.lineTo(x + pw - 1, y + ph / 2);
      ctx.stroke();
    }
  }

  // Grid border lines
  ctx.strokeStyle = 'rgba(30,58,138,0.9)';
  ctx.lineWidth = 1.5;
  for (let c = 0; c <= cols; c++) {
    ctx.beginPath(); ctx.moveTo(c * pw, 0); ctx.lineTo(c * pw, h); ctx.stroke();
  }
  for (let r = 0; r <= rows; r++) {
    ctx.beginPath(); ctx.moveTo(0, r * ph); ctx.lineTo(w, r * ph); ctx.stroke();
  }

  // Reflection sheen
  const sheen = ctx.createLinearGradient(0, 0, w, h);
  sheen.addColorStop(0, 'rgba(255,255,255,0.07)');
  sheen.addColorStop(0.5, 'rgba(255,255,255,0.0)');
  sheen.addColorStop(1, 'rgba(255,255,255,0.04)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, w, h);

  return new THREE.CanvasTexture(canvas);
}

function makeMetalTexture(base: string) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  // Brushed-metal streaks
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  for (let i = 0; i < 80; i++) {
    const y = Math.random() * size;
    ctx.lineWidth = Math.random() * 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + (Math.random() - 0.5) * 4);
    ctx.stroke();
  }

  // Scratch marks
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  for (let i = 0; i < 20; i++) {
    ctx.lineWidth = 0.5;
    const x1 = Math.random() * size; const y1 = Math.random() * size;
    ctx.beginPath(); ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + (Math.random() - 0.5) * 40, y1 + (Math.random() - 0.5) * 40);
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

  // Hexagonal panel grid pattern
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
  const R = 40;
  const hexW = R * Math.sqrt(3);
  const hexH = R * 2;
  for (let row = -1; row < size / hexH + 1; row++) {
    for (let col = -1; col < size / hexW + 1; col++) {
      const cx = col * hexW + (row % 2) * hexW / 2;
      const cy = row * hexH * 0.75;
      hex(cx, cy, R - 2);
      ctx.fillStyle = `rgba(15,23,42,${0.8 + Math.random() * 0.15})`;
      ctx.fill();
      ctx.strokeStyle = 'rgba(6,182,212,0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Reflection arc
  const arc = ctx.createRadialGradient(size * 0.3, size * 0.2, 0, size / 2, size / 2, size * 0.6);
  arc.addColorStop(0, 'rgba(255,255,255,0.08)');
  arc.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = arc;
  ctx.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
}

// ── Ground with regolith ──────────────────────────────────────
function Ground({ isMars }: { isMars: boolean }) {
  const textures = useMemo(() => ({
    color: makeRegolithTexture(isMars),
    normal: makeRegolithNormalMap(),
  }), [isMars]);

  return (
    <>
      {/* Main ground disk */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]} receiveShadow>
        <circleGeometry args={[3.0, 128]} />
        <meshStandardMaterial
          map={textures.color}
          normalMap={textures.normal}
          normalScale={new THREE.Vector2(1.2, 1.2)}
          roughness={0.97}
          metalness={0}
        />
      </mesh>

      {/* Berm ring */}
      <mesh position={[0, -0.14, 0]}>
        <torusGeometry args={[2.5, 0.15, 8, 96]} />
        <meshStandardMaterial
          color={isMars ? '#6b1d0a' : '#1f2937'}
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* Flat foundation pad under dome */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.16, 0]}>
        <circleGeometry args={[0.7, 32]} />
        <meshStandardMaterial color={isMars ? '#451a08' : '#111827'} roughness={0.9} />
      </mesh>
    </>
  );
}

// ── Habitat Dome ──────────────────────────────────────────────
function HabitatDome({ health, isMars }: { health: number; isMars: boolean }) {
  const innerRef = useRef<THREE.PointLight>(null);
  const domeTexture = useMemo(() => makeDomeTexture(), []);
  const metalTex = useMemo(() => makeMetalTexture('#374151'), []);

  useFrame((state) => {
    if (!innerRef.current) return;
    innerRef.current.intensity = 0.5 + 0.1 * Math.sin(state.clock.getElapsedTime() * 0.8);
  });

  return (
    <group>
      {/* Concrete foundation ring */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.6, 0.65, 0.12, 32]} />
        <meshStandardMaterial map={metalTex} roughness={0.8} metalness={0.5} />
      </mesh>

      {/* Outer pressure shell – textured hex panels */}
      <mesh position={[0, 0.07, 0]} castShadow>
        <sphereGeometry args={[0.58, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          map={domeTexture}
          roughness={0.25}
          metalness={0.55}
          envMapIntensity={0.8}
        />
      </mesh>

      {/* Inner glass tint layer */}
      <mesh position={[0, 0.07, 0]}>
        <sphereGeometry args={[0.56, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={isMars ? '#7c2d12' : '#0c1a33'}
          transparent
          opacity={0.22}
          metalness={0.1}
          roughness={0.0}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Airlock vestibule cylinder */}
      <mesh position={[0.55, -0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 0.22, 16]} />
        <meshStandardMaterial map={metalTex} roughness={0.4} metalness={0.75} />
      </mesh>

      {/* Airlock door circle */}
      <mesh position={[0.67, -0.05, 0]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.1, 16]} />
        <meshStandardMaterial color="#374151" roughness={0.5} metalness={0.8} />
      </mesh>

      {/* Airlock door bolts */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[0.672, -0.05 + Math.sin(a) * 0.08, Math.cos(a) * 0.08]} rotation={[0, Math.PI / 2, 0]}>
            <circleGeometry args={[0.008, 8]} />
            <meshStandardMaterial color="#6b7280" metalness={0.9} />
          </mesh>
        );
      })}

      {/* Neon cyan seal ring */}
      <mesh position={[0, 0.08, 0]}>
        <torusGeometry args={[0.585, 0.022, 12, 80]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={2.0} metalness={0.9} />
      </mesh>

      {/* Pressurization pipes around base */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 8;
        const x = Math.cos(angle) * 0.6;
        const z = Math.sin(angle) * 0.6;
        return (
          <mesh key={i} position={[x, -0.09, z]} rotation={[0, -angle, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.12, 8]} />
            <meshStandardMaterial color="#9ca3af" metalness={0.9} roughness={0.2} />
          </mesh>
        );
      })}

      {/* Interior warm glow */}
      <pointLight ref={innerRef} position={[0, 0.1, 0]} intensity={0.5} color="#fde68a" distance={0.9} />
    </group>
  );
}

// ── Solar Panel ────────────────────────────────────────────────
function SolarPanel({ side, isMars }: { side: -1 | 1; isMars: boolean }) {
  const panelRef = useRef<THREE.Group>(null);
  const cellTex = useMemo(() => makeSolarCellTexture(), []);
  const metalTex = useMemo(() => makeMetalTexture('#4b5563'), []);

  useFrame((state) => {
    if (!panelRef.current) return;
    panelRef.current.rotation.z = side * 0.03 * Math.sin(state.clock.getElapsedTime() * 0.5);
  });

  return (
    <group ref={panelRef} position={[side * 1.05, 0.12, 0.05]}>
      {/* Vertical mast */}
      <mesh position={[0, -0.06, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.28, 10]} />
        <meshStandardMaterial map={metalTex} metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Horizontal boom */}
      <mesh position={[0, 0.09, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.013, 0.013, 0.82, 8]} />
        <meshStandardMaterial map={metalTex} metalness={0.85} roughness={0.3} />
      </mesh>

      {/* Two panel arrays left and right of boom */}
      {([-0.28, 0.28] as const).map((offset, pi) => (
        <group key={pi} position={[offset, 0.09, 0]}>
          {/* Front panel */}
          <mesh rotation={[0.12, 0, 0]} castShadow>
            <boxGeometry args={[0.42, 0.02, 0.24]} />
            <meshStandardMaterial
              map={cellTex}
              metalness={0.6}
              roughness={0.15}
              emissive={isMars ? '#0c1550' : '#1e3a8a'}
              emissiveIntensity={isMars ? 0.15 : 0.3}
            />
          </mesh>

          {/* Back panel (anodised silver) */}
          <mesh rotation={[0.12, 0, 0]} position={[0, -0.021, 0]}>
            <boxGeometry args={[0.42, 0.005, 0.24]} />
            <meshStandardMaterial map={metalTex} metalness={0.8} roughness={0.3} />
          </mesh>

          {/* Frame rail top */}
          <mesh rotation={[0.12, 0, 0]} position={[0, 0.015, -0.12]}>
            <boxGeometry args={[0.42, 0.018, 0.012]} />
            <meshStandardMaterial color="#6b7280" metalness={0.9} roughness={0.2} />
          </mesh>

          {/* Frame rail bottom */}
          <mesh rotation={[0.12, 0, 0]} position={[0, 0.015, 0.12]}>
            <boxGeometry args={[0.42, 0.018, 0.012]} />
            <meshStandardMaterial color="#6b7280" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── Antenna Assembly ──────────────────────────────────────────
function Antenna({ isMars }: { isMars: boolean }) {
  const dishRef = useRef<THREE.Group>(null);
  const metalTex = useMemo(() => makeMetalTexture('#6b7280'), []);

  useFrame((state) => {
    if (!dishRef.current) return;
    dishRef.current.rotation.y = state.clock.getElapsedTime() * 0.35;
  });

  return (
    <group position={[0.18, 0, -0.42]}>
      {/* Foundation pad */}
      <mesh position={[0, -0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.08, 12]} />
        <meshStandardMaterial color="#374151" roughness={0.9} />
      </mesh>

      {/* Main mast */}
      <mesh position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.014, 0.018, 0.72, 10]} />
        <meshStandardMaterial map={metalTex} metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Strut braces */}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.04, 0.0, Math.sin(a) * 0.04]} rotation={[Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4]}>
            <cylinderGeometry args={[0.006, 0.006, 0.24, 6]} />
            <meshStandardMaterial map={metalTex} metalness={0.8} roughness={0.3} />
          </mesh>
        );
      })}

      {/* Dish assembly */}
      <group ref={dishRef} position={[0, 0.62, 0]} rotation={[0.45, 0, 0]}>
        {/* Dish bowl */}
        <mesh>
          <sphereGeometry args={[0.12, 24, 24, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
          <meshStandardMaterial map={metalTex} metalness={0.9} roughness={0.15} side={THREE.DoubleSide} />
        </mesh>

        {/* Focal point feed */}
        <mesh position={[0, 0.07, 0]}>
          <cylinderGeometry args={[0.015, 0.02, 0.05, 8]} />
          <meshStandardMaterial color="#1f2937" metalness={0.95} roughness={0.1} />
        </mesh>

        {/* Feed arm */}
        <mesh position={[0, 0.04, 0]} rotation={[0.45, 0, 0]}>
          <cylinderGeometry args={[0.004, 0.004, 0.12, 6]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Status beacon glow */}
        <pointLight position={[0, 0.08, 0]} intensity={0.35} color={isMars ? '#f97316' : '#06b6d4'} distance={0.4} />
      </group>

      {/* Blinking indicator */}
      <mesh position={[0, 0.64, 0]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial
          color={isMars ? '#f97316' : '#06b6d4'}
          emissive={isMars ? '#f97316' : '#06b6d4'}
          emissiveIntensity={1.5}
        />
      </mesh>
    </group>
  );
}

// ── MOXIE / ISRU module ────────────────────────────────────────
function LifeSupportModule({ isMars }: { isMars: boolean }) {
  const ledRef = useRef<THREE.Mesh>(null);
  const metalTex = useMemo(() => makeMetalTexture('#374151'), []);

  useFrame((state) => {
    if (!ledRef.current) return;
    const mat = ledRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.6 + 0.4 * Math.abs(Math.sin(state.clock.getElapsedTime() * 2.2));
  });

  return (
    <group position={[-0.78, -0.02, -0.32]}>
      {/* Main housing */}
      <mesh castShadow>
        <boxGeometry args={[0.26, 0.34, 0.24]} />
        <meshStandardMaterial map={metalTex} metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Louvres / vents on front */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 0.08 - i * 0.055, 0.123]}>
          <boxGeometry args={[0.2, 0.015, 0.006]} />
          <meshStandardMaterial color="#1f2937" metalness={0.85} />
        </mesh>
      ))}

      {/* Top exhaust stack */}
      <mesh position={[0.06, 0.2, 0]}>
        <cylinderGeometry args={[0.028, 0.022, 0.1, 8]} />
        <meshStandardMaterial color="#6b7280" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Pipe connecting to dome */}
      <mesh position={[0.2, 0.05, 0.1]} rotation={[0.4, 0.3, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 0.35, 8]} />
        <meshStandardMaterial color="#4b5563" metalness={0.75} roughness={0.3} />
      </mesh>

      {/* Status LED panel */}
      <mesh position={[0, 0.14, 0.125]}>
        <boxGeometry args={[0.1, 0.04, 0.004]} />
        <meshStandardMaterial color="#0f172a" metalness={0.5} />
      </mesh>
      <mesh ref={ledRef} position={[-0.03, 0.14, 0.128]}>
        <sphereGeometry args={[0.01, 6, 6]} />
        <meshStandardMaterial
          color={isMars ? '#f97316' : '#10b981'}
          emissive={isMars ? '#f97316' : '#10b981'}
          emissiveIntensity={0.8}
        />
      </mesh>
      <mesh position={[0.03, 0.14, 0.128]}>
        <sphereGeometry args={[0.01, 6, 6]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.5} />
      </mesh>

      {/* Label plate */}
      <mesh position={[0, -0.08, 0.126]}>
        <boxGeometry args={[0.16, 0.05, 0.002]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>
    </group>
  );
}

// ── Water / oxygen tanks ───────────────────────────────────────
function StorageTanks({ isMars }: { isMars: boolean }) {
  const metalTex = useMemo(() => makeMetalTexture('#94a3b8'), []);
  return (
    <group position={[-0.5, -0.04, 0.6]}>
      {[0, 1].map((i) => (
        <group key={i} position={[i * 0.22, 0, 0]}>
          {/* Tank body */}
          <mesh castShadow>
            <capsuleGeometry args={[0.08, 0.22, 8, 16]} />
            <meshStandardMaterial map={metalTex} metalness={0.85} roughness={0.2} />
          </mesh>
          {/* Color band */}
          <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.082, 0.012, 8, 24]} />
            <meshStandardMaterial
              color={i === 0 ? '#1d4ed8' : '#059669'}
              emissive={i === 0 ? '#1d4ed8' : '#059669'}
              emissiveIntensity={0.3}
            />
          </mesh>
          {/* Valve top */}
          <mesh position={[0, 0.17, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.04, 8]} />
            <meshStandardMaterial color="#374151" metalness={0.9} />
          </mesh>
          {/* Small pipe */}
          <mesh position={[0.085, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.008, 0.008, 0.1, 6]} />
            <meshStandardMaterial color="#6b7280" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── Rover ──────────────────────────────────────────────────────
function Rover({ isMars }: { isMars: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const metalTex = useMemo(() => makeMetalTexture('#374151'), []);
  const cellTex = useMemo(() => makeSolarCellTexture(), []);

  // Very slow drift bob
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = -0.11 + Math.sin(state.clock.getElapsedTime() * 0.4) * 0.003;
  });

  const wheelPos: [number, number, number][] = [
    [-0.14, -0.07, 0.12], [0.14, -0.07, 0.12],
    [-0.14, -0.07, -0.12], [0.14, -0.07, -0.12],
    [-0.14, -0.07, 0.0], [0.14, -0.07, 0.0],
  ];

  return (
    <group ref={ref} position={[1.0, -0.11, 0.65]} rotation={[0, 0.4, 0]}>
      {/* Main chassis */}
      <mesh castShadow>
        <boxGeometry args={[0.32, 0.09, 0.28]} />
        <meshStandardMaterial map={metalTex} metalness={0.65} roughness={0.4} />
      </mesh>

      {/* Equipment deck */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[0.28, 0.04, 0.22]} />
        <meshStandardMaterial map={metalTex} metalness={0.7} roughness={0.35} />
      </mesh>

      {/* Mini solar panel on top */}
      <mesh position={[0, 0.1, 0]} rotation={[-0.15, 0, 0]}>
        <boxGeometry args={[0.22, 0.012, 0.14]} />
        <meshStandardMaterial map={cellTex} metalness={0.6} roughness={0.15} emissive="#1e3a8a" emissiveIntensity={0.2} />
      </mesh>

      {/* Science arm */}
      <mesh position={[0.14, 0.1, 0]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.008, 0.008, 0.18, 6]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[0.2, 0.17, 0]}>
        <sphereGeometry args={[0.022, 8, 8]} />
        <meshStandardMaterial color="#4b5563" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Camera mast */}
      <mesh position={[-0.1, 0.15, 0]}>
        <cylinderGeometry args={[0.009, 0.009, 0.18, 6]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.85} roughness={0.2} />
      </mesh>
      {/* Camera head */}
      <mesh position={[-0.1, 0.25, 0]}>
        <boxGeometry args={[0.028, 0.022, 0.04]} />
        <meshStandardMaterial color="#1f2937" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Wheel suspension arms + wheels */}
      {wheelPos.map((pos, i) => (
        <group key={i} position={pos}>
          {/* Suspension */}
          <mesh position={[0, 0.03, 0]}>
            <boxGeometry args={[0.02, 0.06, 0.02]} />
            <meshStandardMaterial color="#4b5563" metalness={0.7} roughness={0.4} />
          </mesh>
          {/* Wheel */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.035, 18]} />
            <meshStandardMaterial color="#111827" roughness={0.97} metalness={0.0} />
          </mesh>
          {/* Hub */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.038, 8]} />
            <meshStandardMaterial color="#6b7280" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Tread marks */}
          {[0, 1, 2, 3, 4].map((t) => (
            <mesh key={t} rotation={[Math.PI / 2, (t / 5) * Math.PI * 2, 0]}>
              <torusGeometry args={[0.055, 0.006, 4, 18, Math.PI / 6]} />
              <meshStandardMaterial color="#0f172a" roughness={1} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Rover nav lights */}
      <pointLight position={[0.16, 0.04, 0.14]} intensity={0.2} color="#fbbf24" distance={0.4} />
    </group>
  );
}

// ── Power cable runs ───────────────────────────────────────────
function CableRun({ from, to, color = '#1f2937' }: { from: [number, number, number]; to: [number, number, number]; color?: string }) {
  const mid: [number, number, number] = [(from[0] + to[0]) / 2, from[1] - 0.04, (from[2] + to[2]) / 2];
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(...from),
    new THREE.Vector3(...mid),
    new THREE.Vector3(...to),
  ]);
  const points = curve.getPoints(24);
  const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => p)), 24, 0.012, 6, false);
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color={color} roughness={0.85} metalness={0.2} />
    </mesh>
  );
}

// ── Full Outpost Assembly ──────────────────────────────────────
function OutpostModel({ health, isMars }: { health: number; isMars: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.18) * 0.18;
  });

  return (
    <group ref={groupRef} position={[0, -0.02, 0]}>
      <Ground isMars={isMars} />
      <HabitatDome health={health} isMars={isMars} />
      <SolarPanel side={-1} isMars={isMars} />
      <SolarPanel side={1} isMars={isMars} />
      <Antenna isMars={isMars} />
      <LifeSupportModule isMars={isMars} />
      <StorageTanks isMars={isMars} />
      <Rover isMars={isMars} />

      {/* Power cables */}
      <CableRun from={[-0.62, -0.13, 0.05]} to={[-0.78, -0.13, -0.22]} color="#374151" />
      <CableRun from={[0.62, -0.13, 0.05]} to={[0.2, -0.13, -0.38]} color="#374151" />

      {/* Footprint path from airlock to rover */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[0.68 + i * 0.08, -0.175, 0.1 + i * 0.1]} rotation={[-Math.PI / 2, 0, i * 0.15]}>
          <planeGeometry args={[0.05, 0.08]} />
          <meshStandardMaterial color={isMars ? '#6b1d0a' : '#1f2937'} transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// ── Exported MiniOutpostScene ──────────────────────────────────
export function MiniOutpostScene({
  health = 100,
  isMars = false,
}: {
  health?: number;
  isMars?: boolean;
}) {
  return (
    <Canvas
      camera={{ position: [0.3, 2.1, 4.2], fov: 40 }}
      style={{ width: '100%', height: '100%' }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      shadows
    >
      {/* Sky ambient */}
      <ambientLight intensity={0.45} color="#dde8f0" />

      {/* Sun directional (key light) */}
      <directionalLight
        position={[6, 7, 5]}
        intensity={isMars ? 1.9 : 2.6}
        color={isMars ? '#fde8c8' : '#fff8f0'}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />

      {/* Sky hemisphere bounce */}
      <hemisphereLight
        args={[
          isMars ? '#f97316' : '#bfdbfe',
          isMars ? '#450a00' : '#0c1120',
          isMars ? 0.35 : 0.45,
        ]}
      />

      {/* Ground albedo fill */}
      <pointLight
        position={[-4, -1, 4]}
        intensity={isMars ? 0.5 : 0.6}
        color={isMars ? '#b45309' : '#1e40af'}
      />

      {/* Stars */}
      <Stars radius={70} depth={40} count={2000} factor={3} saturation={0} fade speed={0.3} />

      <OutpostModel health={health} isMars={isMars} />

      {/* Subtle auto-look guide */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.1}
        autoRotate={false}
      />
    </Canvas>
  );
}
