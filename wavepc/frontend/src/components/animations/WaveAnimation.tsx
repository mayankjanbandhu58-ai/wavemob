"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

function Particles() {
    const points = useRef<THREE.Points>(null!);
    const { mouse } = useThree();

    const positions = useMemo(() => {
        const positions = new Float32Array(5000 * 3);
        for (let i = 0; i < 5000; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }
        return positions;
    }, []);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        for (let i = 0; i < 5000; i++) {
            const i3 = i * 3;
            points.current.geometry.attributes.position.array[i3 + 1] += Math.sin(time + points.current.geometry.attributes.position.array[i3]) * 0.002;
        }
        points.current.geometry.attributes.position.needsUpdate = true;

        // Smooth camera movement based on mouse
        state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, mouse.x * 2, 0.05);
        state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, mouse.y * 2, 0.05);
        state.camera.lookAt(0, 0, 0);
    });

    return (
        <points ref={points}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={positions.length / 3}
                    array={positions}
                    itemSize={3}
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.015}
                color="#1e3a8a" // Navy Blue
                transparent
                opacity={0.3} // Subtle particles on light bg
                sizeAttenuation
            />
        </points>
    );
}

export default function WaveAnimation() {
    return (
        <div className="absolute inset-0 z-0 bg-[#fdfcfa]">
            <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
                <ambientLight intensity={1.5} />
                <Particles />
            </Canvas>
            <div className="absolute inset-0 bg-gradient-to-b from-[#fdfcfa]/50 via-transparent to-[#fdfcfa]" />
        </div>
    );
}
