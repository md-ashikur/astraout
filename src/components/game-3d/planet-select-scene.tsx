'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float } from '@react-three/drei';
import * as THREE from 'three';
import { soundFx } from '../../audio/sound-synthesizer';

// ── Static pre-computed arrays for ESLint purity ─────────────
const ASTEROID_COUNT = 18;
const ASTEROID_DATA = Array.from({ length: ASTEROID_COUNT }, (_, i) => ({
  x: ((i * 37) % 16) - 8,
  y: ((i * 23) % 10) - 5,
  z: -2 - ((i * 19) % 6),
  scale: 0.08 + ((i * 7) % 6) * 0.03,
  speed: 0.15 + ((i * 11) % 5) * 0.08,
  rotSpeed: 0.3 + ((i * 5) % 5) * 0.15,
}));

const SPACE_DUST_COUNT = 80;
const SPACE_DUST_DATA = Array.from({ length: SPACE_DUST_COUNT }, (_, i) => ({
  x: ((i * 47) % 24) - 12,
  y: ((i * 29) % 16) - 8,
  z: ((i * 31) % 10) - 5,
  size: 0.025 + ((i * 7) % 4) * 0.01,
}));

// ── Floating Asteroids Field ──────────────────────────────────
function FloatingAsteroids() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const item = ASTEROID_DATA[i];
        if (!item) return;
        child.rotation.x = t * item.rotSpeed;
        child.rotation.y = t * item.rotSpeed * 0.8;
        child.position.y = item.y + Math.sin(t * item.speed + i) * 0.2;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {ASTEROID_DATA.map((ast, i) => (
        <mesh key={i} position={[ast.x, ast.y, ast.z]} scale={ast.scale}>
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color="#64748b" roughness={0.95} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

// ── Cosmic Stardust Field ─────────────────────────────────────
function CosmicStardust() {
  const pointsRef = useRef<THREE.Points>(null);

  const dustPositions = useMemo(() => {
    const pos = new Float32Array(SPACE_DUST_COUNT * 3);
    SPACE_DUST_DATA.forEach((d, i) => {
      pos[i * 3] = d.x;
      pos[i * 3 + 1] = d.y;
      pos[i * 3 + 2] = d.z;
    });
    return pos;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (pointsRef.current) {
      pointsRef.current.rotation.y = t * 0.02;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[dustPositions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#94a3b8" transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

// ── Orbiting Lunar Gateway Space Station ──────────────────────
function LunarGateway() {
  const orbitRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!orbitRef.current) return;
    const speed = 0.22;
    const radius = 2.4;
    orbitRef.current.position.x = Math.sin(t * speed) * radius;
    orbitRef.current.position.z = Math.cos(t * speed) * radius;
    orbitRef.current.position.y = Math.sin(t * speed * 2) * 0.4;
    orbitRef.current.rotation.y = t * 0.4;
  });

  return (
    <group ref={orbitRef} scale={0.45}>
      {/* Central Habitation Cylinder */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.32, 12]} />
        <meshStandardMaterial color="#f1f5f9" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Docking Node Sphere */}
      <mesh position={[0.2, 0, 0]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Power & Propulsion Module */}
      <mesh position={[-0.2, 0, 0]}>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Massive Ultraflex Solar Wings */}
      {[-0.38, 0.38].map((y, i) => (
        <group key={i} position={[0, y, 0]}>
          <mesh rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.18, 0.38, 0.015]} />
            <meshStandardMaterial color="#1e3a8a" emissive="#1e40af" emissiveIntensity={0.3} metalness={0.7} />
          </mesh>
        </group>
      ))}
      {/* Communications Antenna */}
      <mesh position={[0.22, 0.14, 0]} rotation={[0.4, 0, 0]}>
        <coneGeometry args={[0.06, 0.04, 10, 1, true]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* Green Nav Beacon */}
      <pointLight position={[0.2, 0.1, 0.1]} intensity={0.6} color="#10b981" distance={1.2} />
    </group>
  );
}

// ── Orbiting Orion Spacecraft ─────────────────────────────────
function OrionSpacecraft() {
  const orbitRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!orbitRef.current) return;
    const speed = -0.16;
    const radius = 2.1;
    orbitRef.current.position.x = Math.sin(t * speed + 2.5) * radius;
    orbitRef.current.position.z = Math.cos(t * speed + 2.5) * radius;
    orbitRef.current.position.y = Math.cos(t * speed) * 0.3;
    orbitRef.current.rotation.y = t * speed + Math.PI;
  });

  return (
    <group ref={orbitRef} scale={0.35}>
      {/* Conical Crew Module */}
      <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.12, 0.16, 16]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Service Module */}
      <mesh position={[0, 0, -0.06]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.14, 16]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* 4 Solar Array Wings in X-formation */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.22, Math.sin(a) * 0.22, -0.06]}
            rotation={[0, 0, a]}
          >
            <boxGeometry args={[0.22, 0.06, 0.008]} />
            <meshStandardMaterial color="#1e40af" emissive="#1e3a8a" emissiveIntensity={0.25} />
          </mesh>
        );
      })}
    </group>
  );
}

// ── Orbiting Phobos & Deimos Moons for Mars ───────────────────
function MarsMoons() {
  const phobosRef = useRef<THREE.Group>(null);
  const deimosRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // Phobos (inner, rapid orbit)
    if (phobosRef.current) {
      const pSpeed = 0.35;
      const pRadius = 2.1;
      phobosRef.current.position.x = Math.sin(t * pSpeed) * pRadius;
      phobosRef.current.position.z = Math.cos(t * pSpeed) * pRadius;
      phobosRef.current.position.y = Math.sin(t * 0.5) * 0.2;
      phobosRef.current.rotation.y = t * 0.8;
    }
    // Deimos (outer, slower orbit)
    if (deimosRef.current) {
      const dSpeed = 0.18;
      const dRadius = 2.65;
      deimosRef.current.position.x = Math.sin(t * dSpeed + 2.0) * dRadius;
      deimosRef.current.position.z = Math.cos(t * dSpeed + 2.0) * dRadius;
      deimosRef.current.position.y = Math.cos(t * 0.4) * 0.35;
      deimosRef.current.rotation.y = t * 0.5;
    }
  });

  return (
    <group>
      {/* Phobos: Craggy potato-shaped moon */}
      <group ref={phobosRef} scale={0.16}>
        <mesh>
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color="#78716c" roughness={0.98} metalness={0.02} />
        </mesh>
      </group>

      {/* Deimos: Smaller outer moon */}
      <group ref={deimosRef} scale={0.11}>
        <mesh>
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color="#a8a29e" roughness={0.95} metalness={0.02} />
        </mesh>
      </group>
    </group>
  );
}

// ── Orbiting Mars Reconnaissance Orbiter (MRO) ────────────────
function MarsOrbiter() {
  const mroRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!mroRef.current) return;
    const speed = -0.25;
    const radius = 2.35;
    mroRef.current.position.x = Math.sin(t * speed) * radius;
    mroRef.current.position.z = Math.cos(t * speed) * radius;
    mroRef.current.position.y = Math.sin(t * speed * 1.5) * 0.5;
    mroRef.current.rotation.y = t * 0.6;
  });

  return (
    <group ref={mroRef} scale={0.38}>
      {/* Gold thermal insulation box */}
      <mesh>
        <boxGeometry args={[0.16, 0.16, 0.2]} />
        <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* 3-meter High-Gain Dish */}
      <mesh position={[0, 0.14, 0]} rotation={[0.4, 0, 0]}>
        <coneGeometry args={[0.15, 0.06, 16, 1, true]} />
        <meshStandardMaterial color="#f1f5f9" metalness={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* Solar Wings */}
      {[-0.32, 0.32].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <boxGeometry args={[0.3, 0.08, 0.01]} />
          <meshStandardMaterial color="#1e3a8a" emissive="#1e40af" emissiveIntensity={0.3} metalness={0.7} />
        </mesh>
      ))}
      <pointLight position={[0, 0.1, 0]} intensity={0.4} color="#f97316" distance={1.0} />
    </group>
  );
}

// ── Holographic Targeting Reticle ─────────────────────────────
function TargetingReticle({
  color,
  active,
}: {
  color: string;
  active: boolean;
}) {
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ringRef1.current) {
      ringRef1.current.rotation.z = t * 0.8;
      const s = 1 + Math.sin(t * 3) * 0.03;
      ringRef1.current.scale.set(s, s, s);
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.z = -t * 0.5;
    }
  });

  if (!active) return null;

  return (
    <group rotation={[Math.PI / 3, 0, 0]}>
      {/* Primary targeting ring with tick marks */}
      <mesh ref={ringRef1}>
        <ringGeometry args={[1.88, 1.94, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>
      {/* Outer coordinate ring */}
      <mesh ref={ringRef2}>
        <ringGeometry args={[2.02, 2.05, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ── Realistic Moon ────────────────────────────────────────────
function RealisticMoon({
  hovered,
  selected,
  onClick,
  onPointerOver,
  onPointerOut,
}: {
  hovered: boolean;
  selected: boolean;
  onClick?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}) {
  const planetRef = useRef<THREE.Mesh>(null);
  const mareRef = useRef<THREE.Mesh>(null);
  const craterRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const targetScale = hovered || selected ? 1.2 : 1.0;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const spinMult = hovered ? 3 : 1;
    if (planetRef.current) {
      planetRef.current.rotation.y += 0.003 * spinMult;
      planetRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);
    }
    if (mareRef.current) mareRef.current.rotation.y += 0.003 * spinMult;
    if (craterRef.current) craterRef.current.rotation.y += 0.003 * spinMult;
    if (glowRef.current) {
      glowRef.current.scale.lerp(
        new THREE.Vector3(targetScale * 1.14, targetScale * 1.14, targetScale * 1.14),
        0.05
      );
      (glowRef.current.material as THREE.MeshStandardMaterial).opacity =
        (hovered || selected ? 0.22 : 0.07) + Math.sin(t * 1.5) * 0.04;
    }
  });

  return (
    <Float speed={0.6} floatIntensity={hovered ? 0.45 : 0.18} rotationIntensity={0.03}>
      <group
        onClick={(e) => {
          e.stopPropagation();
          soundFx.playBeep(1200);
          onClick?.();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
          onPointerOver?.();
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
          onPointerOut?.();
        }}
      >
        {/* Main lunar body – highland grey */}
        <mesh ref={planetRef}>
          <sphereGeometry args={[1.5, 128, 128]} />
          <meshStandardMaterial color="#9ca3af" roughness={0.97} metalness={0.02} />
        </mesh>

        {/* Dark mare lava plains */}
        <mesh ref={mareRef}>
          <sphereGeometry args={[1.503, 64, 64]} />
          <meshStandardMaterial color="#374151" roughness={1} transparent opacity={0.42} depthWrite={false} />
        </mesh>

        {/* Crater-texture overlay */}
        <mesh ref={craterRef}>
          <sphereGeometry args={[1.506, 48, 48]} />
          <meshStandardMaterial color="#d1d5db" roughness={1} transparent opacity={0.14} depthWrite={false} />
        </mesh>

        {/* South polar ice / frost */}
        <mesh position={[0, -1.5, 0]} rotation={[Math.PI, 0, 0]}>
          <sphereGeometry args={[0.28, 32, 16, 0, Math.PI * 2, 0, 0.35]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} transparent opacity={0.65} />
        </mesh>

        {/* Ethereal lunar limb scatter */}
        <mesh ref={glowRef}>
          <sphereGeometry args={[1.62, 32, 32]} />
          <meshStandardMaterial color="#bae6fd" transparent opacity={0.08} side={THREE.BackSide} depthWrite={false} />
        </mesh>

        {/* Orbiting Spacecraft */}
        <LunarGateway />
        <OrionSpacecraft />

        {/* Interactive Holographic Targeting Reticle */}
        <TargetingReticle color="#22d3ee" active={hovered || selected} />

        {(hovered || selected) && (
          <pointLight position={[0, 0, 2.6]} intensity={3.0} color="#e0f2fe" distance={7} />
        )}
      </group>
    </Float>
  );
}

// ── Realistic Mars ────────────────────────────────────────────
function RealisticMars({
  hovered,
  selected,
  onClick,
  onPointerOver,
  onPointerOut,
}: {
  hovered: boolean;
  selected: boolean;
  onClick?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}) {
  const planetRef = useRef<THREE.Mesh>(null);
  const dustRef = useRef<THREE.Mesh>(null);
  const highlandRef = useRef<THREE.Mesh>(null);
  const hazeRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const targetScale = hovered || selected ? 1.2 : 1.0;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const spinMult = hovered ? 3 : 1;
    if (planetRef.current) {
      planetRef.current.rotation.y += 0.005 * spinMult;
      planetRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);
    }
    if (dustRef.current) dustRef.current.rotation.y += 0.006 * spinMult;
    if (highlandRef.current) highlandRef.current.rotation.y += 0.004 * spinMult;
    if (hazeRef.current) hazeRef.current.rotation.y += 0.003 * spinMult;
    if (glowRef.current) {
      glowRef.current.scale.lerp(
        new THREE.Vector3(targetScale * 1.15, targetScale * 1.15, targetScale * 1.15),
        0.05
      );
      (glowRef.current.material as THREE.MeshStandardMaterial).opacity =
        (hovered || selected ? 0.32 : 0.12) + Math.sin(t * 1.8) * 0.06;
    }
  });

  return (
    <Float speed={0.7} floatIntensity={hovered ? 0.48 : 0.2} rotationIntensity={0.035}>
      <group
        onClick={(e) => {
          e.stopPropagation();
          soundFx.playBeep(940);
          onClick?.();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
          onPointerOver?.();
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
          onPointerOut?.();
        }}
      >
        {/* Main body – rusty ochre */}
        <mesh ref={planetRef}>
          <sphereGeometry args={[1.5, 128, 128]} />
          <meshStandardMaterial color="#b45309" roughness={0.88} metalness={0.02} />
        </mesh>

        {/* Dark rust surface markings */}
        <mesh ref={dustRef}>
          <sphereGeometry args={[1.503, 72, 72]} />
          <meshStandardMaterial color="#7c2d12" roughness={1} transparent opacity={0.36} depthWrite={false} />
        </mesh>

        {/* Tan highland features */}
        <mesh ref={highlandRef}>
          <sphereGeometry args={[1.506, 48, 48]} />
          <meshStandardMaterial color="#d97706" roughness={1} transparent opacity={0.22} depthWrite={false} />
        </mesh>

        {/* Thin CO2 atmospheric limb haze */}
        <mesh ref={hazeRef}>
          <sphereGeometry args={[1.57, 48, 48]} />
          <meshStandardMaterial color="#fb923c" transparent opacity={0.1} side={THREE.BackSide} depthWrite={false} />
        </mesh>

        {/* North polar cap */}
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.4, 32, 16, 0, Math.PI * 2, 0, 0.48]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.35} transparent opacity={0.92} />
        </mesh>

        {/* South polar cap */}
        <mesh position={[0, -1.5, 0]} rotation={[Math.PI, 0, 0]}>
          <sphereGeometry args={[0.22, 32, 16, 0, Math.PI * 2, 0, 0.32]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.4} transparent opacity={0.75} />
        </mesh>

        {/* Glowing Martian atmospheric rim */}
        <mesh ref={glowRef}>
          <sphereGeometry args={[1.66, 32, 32]} />
          <meshStandardMaterial color="#f97316" transparent opacity={0.14} side={THREE.BackSide} depthWrite={false} />
        </mesh>

        {/* Orbiting Moons & Space Probe */}
        <MarsMoons />
        <MarsOrbiter />

        {/* Interactive Holographic Targeting Reticle */}
        <TargetingReticle color="#f97316" active={hovered || selected} />

        {(hovered || selected) && (
          <pointLight position={[0, 0, 2.6]} intensity={3.5} color="#fed7aa" distance={7} />
        )}
      </group>
    </Float>
  );
}

// ── Exported PlanetSelectScene ─────────────────────────────────
export interface PlanetSelectSceneProps {
  hoveredPlanet: 'moon' | 'mars' | null;
  selectedPlanet: 'moon' | 'mars' | null;
  onSelectPlanet?: (planet: 'moon' | 'mars') => void;
  onHoverPlanet?: (planet: 'moon' | 'mars' | null) => void;
}

export function PlanetSelectScene({
  hoveredPlanet,
  selectedPlanet,
  onSelectPlanet,
  onHoverPlanet,
}: PlanetSelectSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 8.2], fov: 50 }}
      style={{ position: 'absolute', inset: 0 }}
      dpr={[1, 1.5]}
    >
      <color attach="background" args={['#020617']} />
      <ambientLight intensity={0.15} />

      {/* Primary warm sunlight */}
      <directionalLight position={[8, 5, 5]} intensity={3.8} color="#fff8f0" />

      {/* Deep blue fill bounce light */}
      <pointLight position={[-8, -3, 4]} intensity={1.4} color="#3b82f6" />

      {/* Back glow light */}
      <pointLight position={[0, 8, -6]} intensity={0.5} color="#e0f2fe" />

      {/* Dynamic light shift toward hovered planet */}
      {hoveredPlanet === 'moon' && (
        <pointLight position={[-3, 1, 3]} intensity={2.0} color="#38bdf8" distance={8} />
      )}
      {hoveredPlanet === 'mars' && (
        <pointLight position={[3, 1, 3]} intensity={2.2} color="#fb923c" distance={8} />
      )}

      {/* Starfield */}
      <Stars radius={120} depth={60} count={5000} factor={4} saturation={0} fade speed={0.25} />

      {/* Floating 3D Asteroids & Stardust */}
      <FloatingAsteroids />
      <CosmicStardust />

      {/* Moon on left */}
      <group position={[-3.1, 0, 0]}>
        <RealisticMoon
          hovered={hoveredPlanet === 'moon'}
          selected={selectedPlanet === 'moon'}
          onClick={() => onSelectPlanet?.('moon')}
          onPointerOver={() => onHoverPlanet?.('moon')}
          onPointerOut={() => onHoverPlanet?.(null)}
        />
      </group>

      {/* Mars on right */}
      <group position={[3.1, 0, 0]}>
        <RealisticMars
          hovered={hoveredPlanet === 'mars'}
          selected={selectedPlanet === 'mars'}
          onClick={() => onSelectPlanet?.('mars')}
          onPointerOver={() => onHoverPlanet?.('mars')}
          onPointerOut={() => onHoverPlanet?.(null)}
        />
      </group>
    </Canvas>
  );
}
