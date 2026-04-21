import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { useTexture } from '@react-three/drei';
import { AVATAR_CONFIG } from './config';

export default function Avatar({ avatar_url, avatarState }) {

  const gltf = useGLTF(avatar_url || AVATAR_CONFIG.model);
  const mixer = useMemo(() => new THREE.AnimationMixer(gltf.scene), [gltf.scene]);
  
  const dicts = useRef({ headBone: null, headBaseRotX: 0 });
  const actions = useRef({});
  const currentAction = useRef(null);
  const baseGroupRef = useRef(); // Para micromovimiento de torso


  // Cargamos la imagen de la pintura
  const robotTexture = useTexture('/images/tripo_mat_f124fc35_Diffuse.PNG'); 
  
  // Le configuramos el color y evitamos que se aplique al revés
  robotTexture.flipY = false; 
  robotTexture.colorSpace = THREE.SRGBColorSpace;

  // 1.5. Le aplicamos la pintura al robot
  useEffect(() => {
    if (gltf.scene) {
      gltf.scene.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          node.frustumCulled = false;
          
          // Le creamos un material nuevo usando nuestra imagen
          node.material = new THREE.MeshStandardMaterial({
            map: robotTexture,
            roughness: 0.4, // Esto le da un toquecito de brillo a plástico/metal
            metalness: 0.1
          });
        }
      });
    }
  }, [gltf.scene, robotTexture]);

  

  // --- 2. CARGA Y PROCESAMIENTO DE ANIMACIONES ---
  useEffect(() => {
    const loader = new FBXLoader();
let isMounted = true;
    const loadAnim = async (key, url) => {
      if (!url) {
          console.warn(`[AVATAR] URL vacía para ${key}`);
          return;
      }

      try {
        console.log(`[AVATAR] 📥 Cargando animación: ${key} desde ${url}`);
        const fbx = await loader.loadAsync(url);

        if (!isMounted) return;
        if (!fbx.animations.length) {
            console.warn(`[AVATAR] ⚠️ FBX cargado pero sin animaciones: ${key}`);
            return;
        }

        let clip = fbx.animations[0];
        console.log(`[AVATAR] 🎬 FBX clip original: "${clip.name}", duracion: ${clip.duration.toFixed(2)}s, tracks: ${clip.tracks.length}`);
        
        if (!clip.tracks || clip.tracks.length === 0) {
          console.warn(`[AVATAR] ⚠️ Clip '${key}' no tiene tracks y será ignorado`);
          return;
        }
    
        const action = mixer.clipAction(clip);

      

        actions.current[key] = action;
        console.log(`[AVATAR] ✅ Acción registrada: ${key} (loop: ${key === 'idle' ? 'REPEAT' : 'ONCE'})`, action);

        if (key === 'idle' && !currentAction.current) {
          action.play();
          currentAction.current = 'idle';
          console.log(`[AVATAR] ▶️ Animación inicial: idle (AUTOPLAY)`);
        }
        
      } catch (err) {
        console.error(`[AVATAR] ❌ Error cargando animación '${key}':`, err);
      }
    };

    console.log(`[AVATAR] 🚀 Iniciando carga de animaciones`);
    console.log(`[AVATAR] Config de animaciones:`, AVATAR_CONFIG.animations);
    
    Object.entries(AVATAR_CONFIG.animations).forEach(([key, url]) => {
      loadAnim(key, url);
    });

    return () => {
      isMounted = false;
      console.log(`[AVATAR] 🛑 Limpiando mixer`);
      mixer.stopAllAction();
    };
  }, [mixer, gltf.scene]);

  
// --- 3. REPRODUCTOR DE ESTADOS (TRANSICIONES LIMPIAS) ---
const playAnimation = (name) => {
  const safeName = (name || 'idle').toLowerCase();

  // Esperar a que las acciones estén cargadas
  if (!actions.current || Object.keys(actions.current).length === 0) {
    console.warn(`[AVATAR] ⚠️ Acciones no cargadas aún. Ignorando petición: ${safeName}`);
    return;
  }

  let targetName = safeName;
  if (!actions.current[targetName]) {
    console.warn(`[AVATAR] ❌ Animación '${targetName}' no encontrada. Intentando fallback a 'idle'`);
    if (actions.current['idle']) {
      targetName = 'idle';
    } else {
      console.error(`[AVATAR] ❌ CRÍTICO: No existe ni siquiera la acción 'idle' - abandonando transición`);
      return;
    }
  }

  const newAction = actions.current[targetName];
  const oldName = currentAction.current;

  if (oldName === targetName) {
    console.log(`[AVATAR] ⚠️ Ya está reproduciendo: ${targetName}`);
    return;
  }

 const fadeTime = targetName === 'idle' ? 0.4 : 0.2;

    // 1. APAGADO SUAVE
    Object.entries(actions.current).forEach(([k, a]) => {
      if (a && a !== newAction) {
        a.fadeOut(fadeTime);
      }
    });

    // 2. PREPARAR NUEVA ANIMACIÓN
    newAction.reset();
    newAction.setEffectiveWeight(1); 
    
    if (targetName === "thinking") {
      newAction.timeScale = 0.5;
    } else if (targetName === "idle") {
      newAction.timeScale = 0.8 + Math.random() * 0.4;
    } else {
      newAction.timeScale = 1.0;
    }

    // 3. ENCENDIDO SUAVE
    newAction.fadeIn(fadeTime).play();

  currentAction.current = targetName;
  console.log(`[AVATAR] ✅ Acción activa: ${targetName}`);
};
  useEffect(() => {
     // ✅ Sin delays: Reproducir la animación inmediatamente
     playAnimation(avatarState);
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarState]);

  // --- 4. BUCLE RENDERIZACIÓN ---
  useFrame((state, delta) => {
    mixer.update(delta);
  });

  return (
    <group name="avatar" ref={baseGroupRef}>
  
      <primitive object={gltf.scene} dispose={null} scale={[1, 1, 1]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} />
    </group>
  );
}

useGLTF.preload(AVATAR_CONFIG.model);