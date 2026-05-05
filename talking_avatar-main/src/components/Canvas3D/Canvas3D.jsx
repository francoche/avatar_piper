import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useTexture, Environment, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import Avatar from '../../avatar/Avatar';

function Bg() {
  const texture = useTexture('/images/bg.webp');
  return (
    <mesh position={[0, 1.0, -2]} scale={[5, 5, 1]}>
      <planeGeometry />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

export const Canvas3D = ({ avatarState }) => {
  return (
    <Canvas dpr={2} onCreated={(ctx) => { ctx.gl.physicallyCorrectLights = true; }}>
      <PerspectiveCamera makeDefault fov={40} position={[0, 1.2, 4]} />
      <OrbitControls target={[0, 1.0, 0]} />
      <Suspense fallback={null}>
        <Environment background={false} files="/images/photo_studio_loft_hall_1k.hdr" />
      </Suspense>
      <Suspense fallback={null}>
        <Bg />
      </Suspense>
      <Suspense fallback={null}>
        <Avatar avatarState={avatarState} />
      </Suspense>
    </Canvas>
  );
};
