import React from 'react';
import { useTexture } from '@react-three/drei';
import { BG_MESH_CONFIG } from '../../utils/constants';

/**
 * Componente que renderiza el fondo del avatar
 */
export function Background() {
  const texture = useTexture(BG_MESH_CONFIG.texture);
  
  return (
    <mesh position={BG_MESH_CONFIG.position} scale={BG_MESH_CONFIG.scale}>
      <planeGeometry />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

export default Background;
