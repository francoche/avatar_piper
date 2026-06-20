import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, PerspectiveCamera, OrbitControls, useProgress } from '@react-three/drei';
import Avatar from '../Avatar/Avatar';
import Background from '../Avatar/Background';
import { CANVAS_CONFIG, ENVIRONMENT_CONFIG } from '../../utils/constants';

/**
 * Componente de carga personalizado con el logo de la facultad
 */
function CustomLoader() {
  const { active, progress } = useProgress();
  if (!active) return null;
  
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center', zIndex: 9999,
      backgroundImage: "url('/images/fondoUader.png')", backgroundSize: 'cover', backgroundPosition: 'center'
    }}>
      <div style={{
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '50px 60px',
        borderRadius: '30px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        {/* Logo de la FCyT obtenido de su web oficial */}
        <img 
          src="https://fcyt.uader.edu.ar/wp-content/uploads/2023/11/logo-fcyt-1.png" 
          alt="FCyT UADER Logo" 
          style={{ height: '80px', marginBottom: '30px', objectFit: 'contain' }}
          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
        />
        <h1 style={{ display: 'none', color: '#fff', fontSize: '32px', margin: '0 0 20px 0', fontFamily: 'system-ui' }}>FCyT UADER</h1>
        
        <h2 style={{ color: '#e2e8f0', fontFamily: 'system-ui, sans-serif', fontSize: '18px', fontWeight: '500', marginBottom: '20px', letterSpacing: '1px' }}>
          INICIANDO CYTO...
        </h2>
        <div style={{ width: '280px', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #0284c7, #38bdf8)', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)', borderRadius: '4px' }}></div>
        </div>
        <p style={{ color: '#94a3b8', marginTop: '15px', fontSize: '15px', fontFamily: 'monospace', fontWeight: 'bold' }}>
          {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
}

/**
 * Componente que renderiza el canvas 3D con el avatar
 */
export function Canvas3D({ avatarState, analyserRef, gestureCategory }) {
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
        <OrbitControls target={CANVAS_CONFIG.controls.target} enableRotate={false} enablePan={false} enableZoom={false} />
        <Suspense fallback={null}>
          <Environment
            background={ENVIRONMENT_CONFIG.background}
            files={ENVIRONMENT_CONFIG.files}
          />
        </Suspense>
        <Suspense fallback={null}>
          <Avatar avatarState={avatarState} analyserRef={analyserRef} gestureCategory={gestureCategory} />
        </Suspense>
      </Canvas>
      <CustomLoader />
    </>
  );
}

export default Canvas3D;
