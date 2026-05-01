import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader, Environment, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import Avatar from '../Avatar/Avatar';
import Background from '../Avatar/Background';
import { CANVAS_CONFIG, ENVIRONMENT_CONFIG } from '../../utils/constants';

/**
 * Componente que renderiza el canvas 3D con el avatar
 */
export function Canvas3D({ avatarState }) {
  return (
    <>
      <Canvas
        dpr={CANVAS_CONFIG.dpr}
        onCreated={(ctx) => {
          ctx.gl.physicallyCorrectLights = true;
        }}
      >
     
        <PerspectiveCamera
          makeDefault
          fov={CANVAS_CONFIG.camera.fov}
          position={CANVAS_CONFIG.camera.position}
        />
        <OrbitControls target={CANVAS_CONFIG.controls.target} />
        <Suspense fallback={null}>
          <Environment
            background={ENVIRONMENT_CONFIG.background}
            files={ENVIRONMENT_CONFIG.files}
          />
        </Suspense>
        <Suspense fallback={null}>
          <Background />
        </Suspense>
        <Suspense fallback={null}>
          <Avatar avatarState={avatarState} />
        </Suspense>
      </Canvas>
      <Loader dataInterpolation={(p) => `Loading...`} />
    </>
  );
}

export default Canvas3D;
