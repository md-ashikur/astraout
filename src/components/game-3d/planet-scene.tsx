'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, MeshDistortMaterial, Float, Sphere, Ring } from '@react-three/drei';
import * as THREE from 'three';

// ── Floating Asteroid ──────────────────────────────────────
function FloatingAsteroid({
  position,
  scale,
  speed,
}: {
  position: [number, number, number];
  scale: number;
  speed: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const startY = position[1];
  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += speed * 0.6;
    meshRef.current.rotation.y += speed;
    meshRef.current.rotation.z += speed * 0.3;
    meshRef.current.position.y =
      startY + Math.sin(state.clock.getElapsedTime() * speed * 1.5) * 0.5;
  });
  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <icosahedronGeometry args={[0.35, 1]} />
      <meshStandardMaterial
        color="#6b7280"
        roughness={0.95}
        metalness={0.05}
      />
    </mesh>
  );
}

// ── Particle Dust Field ─────────────────────────────────────
function ParticleDust() {
  const count = 500;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 5 + Math.random() * 15;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi) - 10;
    }
    return pos;
  }, []);

  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.getElapsedTime() * 0.01;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#94a3b8"
        transparent
        opacity={0.45}
        sizeAttenuation
      />
    </points>
  );
}

// ── Sun Light Source ────────────────────────────────────────
function SunGlow({ color }: { color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!meshRef.current) return;
    const pulse = 0.97 + Math.sin(state.clock.getElapsedTime() * 1.5) * 0.03;
    meshRef.current.scale.setScalar(pulse);
  });
  return (
    <group position={[9, 6, -8]}>
      {/* Core white hot disk */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshBasicMaterial color="white" />
      </mesh>
      {/* Corona glow 1 */}
      <mesh>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} />
      </mesh>
      {/* Corona glow 2 */}
      <mesh>
        <sphereGeometry args={[1.3, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.08} />
      </mesh>
    </group>
  );
}

// ── Realistic Mars Planet ────────────────────────────────────
function MarsPlanet() {
  const planetRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (planetRef.current) planetRef.current.rotation.y = t * 0.008;
    if (atmosphereRef.current) atmosphereRef.current.rotation.y = t * 0.005;
    if (cloudRef.current) cloudRef.current.rotation.y = t * 0.01;
  });

  return (
    <Float speed={0.3} rotationIntensity={0.04} floatIntensity={0.25}>
      <group>
        {/* Main Planet Body */}
        <mesh ref={planetRef}>
          <sphereGeometry args={[2.0, 128, 128]} />
          <meshStandardMaterial
            color="#b45309"
            roughness={0.88}
            metalness={0.0}
          />
        </mesh>

        {/* Surface detail overlay – subtle darker patches */}
        <mesh ref={cloudRef}>
          <sphereGeometry args={[2.02, 64, 64]} />
          <meshStandardMaterial
            color="#92400e"
            roughness={1}
            transparent
            opacity={0.25}
            depthWrite={false}
          />
        </mesh>

        {/* Thin CO₂ Atmosphere (limb glow) */}
        <mesh ref={atmosphereRef}>
          <sphereGeometry args={[2.18, 64, 64]} />
          <meshStandardMaterial
            color="#f97316"
            transparent
            opacity={0.09}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>

        {/* Outer haze */}
        <mesh>
          <sphereGeometry args={[2.28, 32, 32]} />
          <meshStandardMaterial
            color="#b45309"
            transparent
            opacity={0.04}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>

        {/* North Polar Ice Cap */}
        <mesh position={[0, 2.0, 0]}>
          <sphereGeometry args={[0.42, 32, 16, 0, Math.PI * 2, 0, 0.5]} />
          <meshStandardMaterial
            color="#e2e8f0"
            roughness={0.4}
            transparent
            opacity={0.85}
          />
        </mesh>

        {/* South Polar Cap */}
        <mesh position={[0, -2.0, 0]} rotation={[Math.PI, 0, 0]}>
          <sphereGeometry args={[0.3, 32, 16, 0, Math.PI * 2, 0, 0.4]} />
          <meshStandardMaterial
            color="#e2e8f0"
            roughness={0.4}
            transparent
            opacity={0.7}
          />
        </mesh>

        {/* Phobos (moon) */}
        <mesh position={[3.2, 0.4, 0]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color="#78716c" roughness={0.95} />
        </mesh>

        {/* Deimos (moon) */}
        <mesh position={[-3.8, -0.3, 0.5]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#6b7280" roughness={0.95} />
        </mesh>
      </group>
    </Float>
  );
}

// ── Realistic Moon ───────────────────────────────────────────
function MoonPlanet() {
  const planetRef = useRef<THREE.Mesh>(null);
  const craterRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (planetRef.current) planetRef.current.rotation.y = t * 0.004;
  });

  return (
    <Float speed={0.25} rotationIntensity={0.03} floatIntensity={0.2}>
      <group>
        {/* Main lunar body */}
        <mesh ref={planetRef}>
          <sphereGeometry args={[2.0, 128, 128]} />
          <meshStandardMaterial
            color="#94a3b8"
            roughness={0.97}
            metalness={0.02}
          />
        </mesh>

        {/* Dark mare regions */}
        <mesh ref={craterRef} rotation={[0.3, 1.2, 0]}>
          <sphereGeometry args={[2.01, 32, 32]} />
          <meshStandardMaterial
            color="#475569"
            roughness={1}
            transparent
            opacity={0.30}
            depthWrite={false}
          />
        </mesh>

        {/* Subtle outer glow from Earth-shine */}
        <mesh>
          <sphereGeometry args={[2.14, 32, 32]} />
          <meshStandardMaterial
            color="#bfdbfe"
            transparent
            opacity={0.05}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>

        {/* Earth in the distance */}
        <group position={[-4.5, 1.8, -5]}>
          <mesh>
            <sphereGeometry args={[0.55, 32, 32]} />
            <meshStandardMaterial
              color="#1d4ed8"
              roughness={0.5}
              metalness={0.0}
            />
          </mesh>
          {/* Cloud layer */}
          <mesh>
            <sphereGeometry args={[0.58, 24, 24]} />
            <meshStandardMaterial
              color="white"
              transparent
              opacity={0.22}
              depthWrite={false}
            />
          </mesh>
          {/* Atmosphere */}
          <mesh>
            <sphereGeometry args={[0.63, 24, 24]} />
            <meshStandardMaterial
              color="#60a5fa"
              transparent
              opacity={0.08}
              side={THREE.BackSide}
              depthWrite={false}
            />
          </mesh>
        </group>
      </group>
    </Float>
  );
}

// ── Orbit ring for moons ─────────────────────────────────────
function OrbitRing() {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[3.15, 3.18, 128]} />
      <meshBasicMaterial color="#475569" transparent opacity={0.15} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ── Main exported scene ──────────────────────────────────────
export interface PlanetSceneProps {
  location: 'moon' | 'mars';
  minimal?: boolean;
}

export function PlanetScene({ location, minimal }: PlanetSceneProps) {
  const isMars = location === 'mars';

  const asteroids: Array<{
    pos: [number, number, number];
    scale: number;
    speed: number;
  }> = [
    { pos: [-5.5, 1.8, -4], scale: 0.55, speed: 0.006 },
    { pos: [6.2, -1.2, -5], scale: 0.85, speed: 0.004 },
    { pos: [-6.5, -2.5, -3], scale: 0.42, speed: 0.008 },
    { pos: [5.5, 3.2, -6], scale: 0.65, speed: 0.005 },
    { pos: [-4.2, -3.5, -5.5], scale: 0.35, speed: 0.007 },
    { pos: [7.5, 1.5, -7], scale: 0.5, speed: 0.003 },
    { pos: [-7, 0.5, -6], scale: 0.4, speed: 0.009 },
  ];

  return (
    <Canvas
      camera={{ position: [0, 0.8, 6.5], fov: 52 }}
      style={{ position: 'absolute', inset: 0 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false }}
    >
      {/* Lighting */}
      <color attach="background" args={['#020617']} />
      <ambientLight intensity={0.15} />

      {/* Sunlight */}
      <directionalLight
        position={[9, 6, -8]}
        intensity={isMars ? 2.2 : 2.8}
        color={isMars ? '#fde8c8' : '#fffdf0'}
        castShadow={false}
      />

      {/* Rim / secondary bounce fill */}
      <pointLight
        position={[-6, -4, 4]}
        intensity={isMars ? 0.4 : 0.6}
        color={isMars ? '#b45309' : '#1e40af'}
      />

      {/* Star field */}
      <Stars
        radius={120}
        depth={60}
        count={5000}
        factor={3.5}
        saturation={0}
        fade
        speed={0.2}
      />

      {/* Cosmic dust */}
      <ParticleDust />

      {/* Sun visual */}
      <SunGlow color={isMars ? '#f97316' : '#fbbf24'} />

      {/* Planet */}
      {isMars ? <MarsPlanet /> : <MoonPlanet />}

      {/* Orbit ring (Mars only, for Phobos) */}
      {isMars && <OrbitRing />}

      {/* Asteroid belt */}
      {!minimal &&
        asteroids.map((a, i) => (
          <FloatingAsteroid key={i} position={a.pos} scale={a.scale} speed={a.speed} />
        ))}
    </Canvas>
  );
}
