'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float } from '@react-three/drei';
import * as THREE from 'three';

// ── Glowing Planet for selection ─────────────────────────────
function SelectPlanet({
  isMars,
  hovered,
  selected,
}: {
  isMars: boolean;
  hovered: boolean;
  selected: boolean;
}) {
  const planetRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const targetScale = hovered || selected ? 1.18 : 1.0;

  useFrame((state) => {
    if (!planetRef.current || !glowRef.current) return;
    const t = state.clock.getElapsedTime();
    planetRef.current.rotation.y = t * (isMars ? 0.01 : 0.006);

    // Smooth scale
    planetRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.08
    );
    glowRef.current.scale.lerp(
      new THREE.Vector3(targetScale * 1.15, targetScale * 1.15, targetScale * 1.15),
      0.05
    );

    // Pulsing glow
    const mat = glowRef.current.material as THREE.MeshStandardMaterial;
    mat.opacity = (hovered || selected ? 0.25 : 0.08) + Math.sin(t * 1.5) * 0.05;
  });

  const moonCraterRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!moonCraterRef.current) return;
    moonCraterRef.current.rotation.y = state.clock.getElapsedTime() * 0.003;
  });

  return (
    <Float speed={0.8} floatIntensity={hovered ? 0.5 : 0.2} rotationIntensity={0.04}>
      <group>
        {/* Planet body */}
        <mesh ref={planetRef}>
          <sphereGeometry args={[1.5, 96, 96]} />
          <meshStandardMaterial
            color={isMars ? '#b45309' : '#9ca3af'}
            roughness={isMars ? 0.82 : 0.96}
            metalness={isMars ? 0.02 : 0.05}
          />
        </mesh>

        {/* Mars polar cap / Moon mare */}
        {isMars ? (
          <mesh position={[0, 1.5, 0]}>
            <sphereGeometry args={[0.38, 32, 16, 0, Math.PI * 2, 0, 0.45]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.4} transparent opacity={0.85} />
          </mesh>
        ) : (
          <mesh ref={moonCraterRef} rotation={[0.4, 1.2, 0]}>
            <sphereGeometry args={[1.51, 32, 32]} />
            <meshStandardMaterial color="#475569" roughness={1} transparent opacity={0.28} depthWrite={false} />
          </mesh>
        )}

        {/* Atmosphere glow */}
        <mesh ref={glowRef}>
          <sphereGeometry args={[1.62, 32, 32]} />
          <meshStandardMaterial
            color={isMars ? '#f97316' : '#bfdbfe'}
            transparent
            opacity={0.1}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>

        {/* Selection ring */}
        {selected && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.8, 1.95, 64]} />
            <meshBasicMaterial color={isMars ? '#f97316' : '#06b6d4'} transparent opacity={0.9} side={THREE.DoubleSide} />
          </mesh>
        )}

        {/* Point light to make planet pop */}
        {(hovered || selected) && (
          <pointLight
            position={[0, 0, 2]}
            intensity={2}
            color={isMars ? '#f97316' : '#38bdf8'}
            distance={5}
          />
        )}
      </group>
    </Float>
  );
}

function PlanetCard({
  isMars,
  hovered,
  selected,
  position,
}: {
  isMars: boolean;
  hovered: boolean;
  selected: boolean;
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      <SelectPlanet isMars={isMars} hovered={hovered} selected={selected} />
    </group>
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
      <ambientLight intensity={0.2} />
      <pointLight position={[8, 5, 6]} intensity={3} color="#fde8c8" />
      <pointLight position={[-8, -3, 4]} intensity={1} color="#3b82f6" />
      <Stars radius={120} depth={60} count={4000} factor={4} saturation={0} fade speed={0.3} />

      {/* Moon — left */}
      <PlanetCard
        isMars={false}
        hovered={hoveredPlanet === 'moon'}
        selected={selectedPlanet === 'moon'}
        position={[-3, 0, 0]}
      />

      {/* Mars — right */}
      <PlanetCard
        isMars
        hovered={hoveredPlanet === 'mars'}
        selected={selectedPlanet === 'mars'}
        position={[3, 0, 0]}
      />
    </Canvas>
  );
}
