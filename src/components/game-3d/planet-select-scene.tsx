'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float } from '@react-three/drei';
import * as THREE from 'three';

// ── Realistic Moon ────────────────────────────────────────────
function RealisticMoon({ hovered, selected }: { hovered: boolean; selected: boolean }) {
  const planetRef = useRef<THREE.Mesh>(null);
  const mareRef   = useRef<THREE.Mesh>(null);
  const craterRef = useRef<THREE.Mesh>(null);
  const glowRef   = useRef<THREE.Mesh>(null);
  const targetScale = hovered || selected ? 1.18 : 1.0;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (planetRef.current) {
      planetRef.current.rotation.y = t * 0.004;
      planetRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);
    }
    if (mareRef.current)   mareRef.current.rotation.y   = t * 0.004;
    if (craterRef.current) craterRef.current.rotation.y = t * 0.004 + 0.5;
    if (glowRef.current) {
      glowRef.current.scale.lerp(
        new THREE.Vector3(targetScale * 1.12, targetScale * 1.12, targetScale * 1.12), 0.05
      );
      (glowRef.current.material as THREE.MeshStandardMaterial).opacity =
        (hovered || selected ? 0.18 : 0.06) + Math.sin(t * 1.2) * 0.03;
    }
  });

  return (
    <Float speed={0.6} floatIntensity={hovered ? 0.4 : 0.15} rotationIntensity={0.03}>
      <group>
        {/* Main lunar body – highland grey */}
        <mesh ref={planetRef}>
          <sphereGeometry args={[1.5, 128, 128]} />
          <meshStandardMaterial color="#9ca3af" roughness={0.97} metalness={0.01} />
        </mesh>

        {/* Dark mare (lava plains) patches */}
        <mesh ref={mareRef}>
          <sphereGeometry args={[1.503, 64, 64]} />
          <meshStandardMaterial color="#374151" roughness={1} transparent opacity={0.40} depthWrite={false} />
        </mesh>

        {/* Lighter crater-texture overlay */}
        <mesh ref={craterRef}>
          <sphereGeometry args={[1.506, 48, 48]} />
          <meshStandardMaterial color="#d1d5db" roughness={1} transparent opacity={0.13} depthWrite={false} />
        </mesh>

        {/* South polar frost */}
        <mesh position={[0, -1.5, 0]} rotation={[Math.PI, 0, 0]}>
          <sphereGeometry args={[0.28, 32, 16, 0, Math.PI * 2, 0, 0.35]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} transparent opacity={0.6} />
        </mesh>

        {/* Faint limb scatter */}
        <mesh ref={glowRef}>
          <sphereGeometry args={[1.60, 32, 32]} />
          <meshStandardMaterial color="#bfdbfe" transparent opacity={0.07} side={THREE.BackSide} depthWrite={false} />
        </mesh>

        {selected && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.82, 1.98, 64]} />
            <meshBasicMaterial color="#06b6d4" transparent opacity={0.9} side={THREE.DoubleSide} />
          </mesh>
        )}
        {(hovered || selected) && (
          <pointLight position={[0, 0, 2.5]} intensity={2.5} color="#e0f2fe" distance={6} />
        )}
      </group>
    </Float>
  );
}

// ── Realistic Mars ────────────────────────────────────────────
function RealisticMars({ hovered, selected }: { hovered: boolean; selected: boolean }) {
  const planetRef = useRef<THREE.Mesh>(null);
  const dustRef   = useRef<THREE.Mesh>(null);
  const highlandRef = useRef<THREE.Mesh>(null);
  const hazeRef   = useRef<THREE.Mesh>(null);
  const glowRef   = useRef<THREE.Mesh>(null);
  const targetScale = hovered || selected ? 1.18 : 1.0;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (planetRef.current) {
      planetRef.current.rotation.y = t * 0.009;
      planetRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);
    }
    if (dustRef.current)     dustRef.current.rotation.y     = t * 0.011;
    if (highlandRef.current) highlandRef.current.rotation.y = t * 0.007;
    if (hazeRef.current)     hazeRef.current.rotation.y     = t * 0.005;
    if (glowRef.current) {
      glowRef.current.scale.lerp(
        new THREE.Vector3(targetScale * 1.14, targetScale * 1.14, targetScale * 1.14), 0.05
      );
      (glowRef.current.material as THREE.MeshStandardMaterial).opacity =
        (hovered || selected ? 0.28 : 0.1) + Math.sin(t * 1.5) * 0.05;
    }
  });

  return (
    <Float speed={0.7} floatIntensity={hovered ? 0.45 : 0.18} rotationIntensity={0.035}>
      <group>
        {/* Main body – rusty ochre */}
        <mesh ref={planetRef}>
          <sphereGeometry args={[1.5, 128, 128]} />
          <meshStandardMaterial color="#b45309" roughness={0.9} metalness={0.0} />
        </mesh>

        {/* Darker rust surface variation */}
        <mesh ref={dustRef}>
          <sphereGeometry args={[1.503, 72, 72]} />
          <meshStandardMaterial color="#7c2d12" roughness={1} transparent opacity={0.32} depthWrite={false} />
        </mesh>

        {/* Bright tan highland patches */}
        <mesh ref={highlandRef}>
          <sphereGeometry args={[1.506, 48, 48]} />
          <meshStandardMaterial color="#d97706" roughness={1} transparent opacity={0.20} depthWrite={false} />
        </mesh>

        {/* Thin CO₂ atmosphere limb haze */}
        <mesh ref={hazeRef}>
          <sphereGeometry args={[1.56, 48, 48]} />
          <meshStandardMaterial color="#fb923c" transparent opacity={0.08} side={THREE.BackSide} depthWrite={false} />
        </mesh>

        {/* North polar ice cap */}
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.4, 32, 16, 0, Math.PI * 2, 0, 0.48]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.35} transparent opacity={0.9} />
        </mesh>

        {/* South polar cap */}
        <mesh position={[0, -1.5, 0]} rotation={[Math.PI, 0, 0]}>
          <sphereGeometry args={[0.22, 32, 16, 0, Math.PI * 2, 0, 0.32]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.4} transparent opacity={0.7} />
        </mesh>

        {/* Orange atmosphere outer glow */}
        <mesh ref={glowRef}>
          <sphereGeometry args={[1.65, 32, 32]} />
          <meshStandardMaterial color="#f97316" transparent opacity={0.12} side={THREE.BackSide} depthWrite={false} />
        </mesh>

        {selected && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.82, 1.98, 64]} />
            <meshBasicMaterial color="#f97316" transparent opacity={0.9} side={THREE.DoubleSide} />
          </mesh>
        )}
        {(hovered || selected) && (
          <pointLight position={[0, 0, 2.5]} intensity={3} color="#fed7aa" distance={6} />
        )}
      </group>
    </Float>
  );
}

interface PlanetSelectSceneProps {
  hoveredPlanet: 'moon' | 'mars' | null;
  selectedPlanet: 'moon' | 'mars' | null;
}

export function PlanetSelectScene({ hoveredPlanet, selectedPlanet }: PlanetSelectSceneProps) {
  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 52 }} style={{ position: 'absolute', inset: 0 }} dpr={[1, 1.5]}>
      <color attach="background" args={['#020617']} />
      <ambientLight intensity={0.12} />
      {/* Primary sunlight – warm white from upper-right */}
      <directionalLight position={[8, 5, 5]} intensity={3.5} color="#fff8f0" />
      {/* Blue rim / bounce light */}
      <pointLight position={[-8, -3, 4]} intensity={1.2} color="#3b82f6" />
      {/* Subtle cool back fill */}
      <pointLight position={[0, 8, -6]} intensity={0.4} color="#e0f2fe" />

      <Stars radius={120} depth={60} count={5000} factor={4} saturation={0} fade speed={0.25} />

      {/* Moon — left */}
      <group position={[-3, 0, 0]}>
        <RealisticMoon hovered={hoveredPlanet === 'moon'} selected={selectedPlanet === 'moon'} />
      </group>

      {/* Mars — right */}
      <group position={[3, 0, 0]}>
        <RealisticMars hovered={hoveredPlanet === 'mars'} selected={selectedPlanet === 'mars'} />
      </group>
    </Canvas>
  );
}
