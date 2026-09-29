'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

// ── Shooting star streaks ────────────────────────────────────
function ShootingStar({ delay, index }: { delay: number; index: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const { startX, startY, startZ } = SHOOTING_STAR_DATA[index];
  useFrame((state) => {
    if (!ref.current) return;
    const t = ((state.clock.getElapsedTime() + delay) % 4) / 4;
    ref.current.position.set(startX + t * 8, startY - t * 4, startZ);
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = t < 0.1 ? t * 10 : t > 0.7 ? (1 - t) * 3.3 : 1;
  });
  return (
    <mesh ref={ref} rotation={[0, 0, -0.6]}>
      <boxGeometry args={[0.5, 0.015, 0.015]} />
      <meshBasicMaterial color="#e0f2fe" transparent />
    </mesh>
  );
}

// ── Floating Astronaut ───────────────────────────────────────
function FloatingAstronaut() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.position.y = 0.5 + Math.sin(t * 0.6) * 0.4;
    ref.current.rotation.z = Math.sin(t * 0.4) * 0.15;
    ref.current.rotation.y = t * 0.3;
  });
  return (
    <group ref={ref} position={[3.5, 0.5, -1]}>
      {/* Helmet */}
      <mesh position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.3} roughness={0.4} />
      </mesh>
      {/* Visor */}
      <mesh position={[0, 0.55, 0.22]}>
        <sphereGeometry args={[0.18, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.05} transparent opacity={0.85} />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 0.1, 0]}>
        <capsuleGeometry args={[0.22, 0.35, 8, 16]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.2} roughness={0.6} />
      </mesh>
      {/* Arms */}
      {[-1, 1].map((s, i) => (
        <group key={i}>
          <mesh position={[s * 0.32, 0.12, 0]} rotation={[0, 0, s * 0.5]}>
            <capsuleGeometry args={[0.08, 0.3, 6, 12]} />
            <meshStandardMaterial color="#f1f5f9" metalness={0.2} roughness={0.6} />
          </mesh>
          {/* Glove */}
          <mesh position={[s * 0.42, -0.06, 0]}>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshStandardMaterial color="#1e293b" metalness={0.4} roughness={0.5} />
          </mesh>
        </group>
      ))}
      {/* Legs */}
      {[-1, 1].map((s, i) => (
        <mesh key={i} position={[s * 0.12, -0.3, 0]}>
          <capsuleGeometry args={[0.09, 0.28, 6, 12]} />
          <meshStandardMaterial color="#f1f5f9" metalness={0.2} roughness={0.6} />
        </mesh>
      ))}
      {/* Backpack (life support) */}
      <mesh position={[0, 0.1, -0.24]}>
        <boxGeometry args={[0.3, 0.38, 0.1]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Helmet glow */}
      <pointLight position={[0, 0.55, 0]} intensity={0.6} color="#fbbf24" distance={1.5} />
    </group>
  );
}

// ── Space Station ────────────────────────────────────────────
function SpaceStation() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.getElapsedTime() * 0.08;
    ref.current.rotation.z = state.clock.getElapsedTime() * 0.02;
    ref.current.position.y = -1.5 + Math.sin(state.clock.getElapsedTime() * 0.25) * 0.3;
  });
  return (
    <group ref={ref} position={[-4.5, -1.5, -3]}>
      {/* Central hub */}
      <mesh>
        <cylinderGeometry args={[0.18, 0.18, 0.9, 12]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* End caps */}
      {[-1, 1].map((s, i) => (
        <mesh key={i} position={[0, s * 0.48, 0]} rotation={[s > 0 ? 0 : Math.PI, 0, 0]}>
          <sphereGeometry args={[0.18, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.25} />
        </mesh>
      ))}
      {/* Solar wings */}
      {[-1, 1].map((s, i) => (
        <group key={i} position={[s * 0.8, 0, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
            <meshStandardMaterial color="#6b7280" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.05, 0.55, 0.28]} />
            <meshStandardMaterial color="#1e3a8a" emissive="#1d4ed8" emissiveIntensity={0.35} metalness={0.6} roughness={0.2} />
          </mesh>
        </group>
      ))}
      {/* Docking port */}
      <mesh position={[0, 0, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.1, 10]} />
        <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.2} />
      </mesh>
    </group>
  );
}

// ── Orbiting rocket ──────────────────────────────────────────
function OrbitingRocket() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime() * 0.35;
    ref.current.position.set(Math.cos(t) * 5.5, Math.sin(t * 0.6) * 1.5, Math.sin(t) * 3 - 2);
    ref.current.rotation.y = -t + Math.PI / 2;
    ref.current.rotation.z = Math.sin(t * 0.6) * 0.3;
  });
  return (
    <group ref={ref}>
      {/* Fuselage */}
      <mesh>
        <capsuleGeometry args={[0.07, 0.35, 6, 12]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Nose cone */}
      <mesh position={[0, 0.28, 0]}>
        <coneGeometry args={[0.07, 0.18, 12]} />
        <meshStandardMaterial color="#ef4444" metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Fins */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.08, -0.22, Math.sin(a) * 0.08]} rotation={[0, a, 0.3]}>
            <boxGeometry args={[0.06, 0.12, 0.01]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.5} roughness={0.4} />
          </mesh>
        );
      })}
      {/* Engine glow */}
      <pointLight position={[0, -0.28, 0]} intensity={1.5} color="#f97316" distance={0.8} />
      <mesh position={[0, -0.32, 0]}>
        <coneGeometry args={[0.05, 0.1, 12]} />
        <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={3} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

// Pre-computed per-instance random positions for shooting stars
const SHOOTING_STAR_DATA = [
  { startX: (Math.random() - 0.5) * 20, startY: Math.random() * 8 + 2, startZ: -Math.random() * 5 },
  { startX: (Math.random() - 0.5) * 20, startY: Math.random() * 8 + 2, startZ: -Math.random() * 5 },
  { startX: (Math.random() - 0.5) * 20, startY: Math.random() * 8 + 2, startZ: -Math.random() * 5 },
];

// Pre-computed once at module load – avoids Math.random during render
const ASTEROID_DATA = Array.from({ length: 12 }, () => ({
  pos: [(Math.random() - 0.5) * 14, (Math.random() - 0.5) * 8, -Math.random() * 8 - 2] as [number, number, number],
  scale: Math.random() * 0.25 + 0.08,
  speed: Math.random() * 0.006 + 0.002,
  rotAxis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
}));

// ── Floating asteroids ───────────────────────────────────────
function Asteroids() {
  const data = ASTEROID_DATA;

  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((state) => {
    data.forEach((d, i) => {
      const m = refs.current[i];
      if (!m) return;
      m.rotateOnAxis(d.rotAxis, d.speed);
      m.position.y = d.pos[1] + Math.sin(state.clock.getElapsedTime() * d.speed * 10 + i) * 0.3;
    });
  });

  return (
    <>
      {data.map((d, i) => (
        <mesh key={i} ref={el => { refs.current[i] = el; }} position={d.pos} scale={d.scale}>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color="#6b7280" roughness={0.95} metalness={0.05} />
        </mesh>
      ))}
    </>
  );
}

const NEBULA_POSITIONS = (() => {
  const pos = new Float32Array(80 * 3);
  for (let i = 0; i < 80; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 24;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
    pos[i * 3 + 2] = -Math.random() * 12 - 4;
  }
  return pos;
})();

// ── Nebula / color cloud ────────────────────────────────────
function NebulaClouds() {
  const positions = NEBULA_POSITIONS;
  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.z = state.clock.getElapsedTime() * 0.005;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.8} color="#312e81" transparent opacity={0.12} sizeAttenuation />
    </points>
  );
}

// ── Full Home 3D Scene ───────────────────────────────────────
export function HomeScene() {
  return (
    <Canvas camera={{ position: [0, 0, 7], fov: 58 }} style={{ position: 'absolute', inset: 0 }} dpr={[1, 1.5]}>
      <color attach="background" args={['#020617']} />
      <ambientLight intensity={0.25} />
      <pointLight position={[5, 5, 5]} intensity={3} color="#fde8c8" />
      <pointLight position={[-5, -3, 3]} intensity={1} color="#3b82f6" />
      <pointLight position={[0, 0, 2]} intensity={0.5} color="#06b6d4" />

      <Stars radius={140} depth={80} count={5000} factor={4} saturation={0} fade speed={0.3} />
      <NebulaClouds />
      <Asteroids />
      <FloatingAstronaut />
      <SpaceStation />
      <OrbitingRocket />
      {[0, 1, 2].map(i => <ShootingStar key={i} delay={i * 1.4} index={i} />)}
    </Canvas>
  );
}
