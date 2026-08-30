"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Float } from "@react-three/drei";
import { Color, Mesh, MeshStandardMaterial } from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Group } from "three";

const MODEL_PATH = "/models/nave-logo-3d-clean.glb";
const SAGE_GREEN = "#82A874";

function LogoModel() {
  const { scene } = useGLTF(MODEL_PATH);
  const groupRef = useRef<Group>(null);

  const coloredScene = useMemo(() => {
    const clone = scene.clone(true);
    const color = new Color(SAGE_GREEN);
    clone.traverse((obj) => {
      if (obj instanceof Mesh) {
        obj.geometry = mergeVertices(obj.geometry.clone(), 0.05);
        obj.geometry.computeVertexNormals();
        obj.material = new MeshStandardMaterial({
          color,
          roughness: 0.75,
          metalness: 0.0,
        });
      }
    });
    return clone;
  }, [scene]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += 0.6 * delta;
  });

  return (
    <Float
      speed={1.4}
      rotationIntensity={0}
      floatIntensity={0.6}
      floatingRange={[-0.08, 0.08]}
    >
      <group ref={groupRef}>
        <primitive object={coloredScene} scale={2.4} />
      </group>
    </Float>
  );
}

useGLTF.preload(MODEL_PATH);

interface LoginLogo3DProps {
  width?: string | number;
  height?: string | number;
}

export default function LoginLogo3D({
  width = "100%",
  height = "280px",
}: LoginLogo3DProps) {
  return (
    <div style={{ width, height }}>
      <Canvas
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
        camera={{ position: [0, 1.2, 8], fov: 44 }}
        style={{ background: "transparent" }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <ambientLight intensity={3.5} />
        <directionalLight position={[3, 5, 5]} intensity={0.7} color="#ffffff" />
        <directionalLight position={[-3, 3, 5]} intensity={0.7} color="#ffffff" />
        <directionalLight position={[0, -4, 4]} intensity={0.4} color="#ffffff" />
        <LogoModel />
      </Canvas>
    </div>
  );
}
