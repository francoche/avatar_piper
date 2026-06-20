import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { useTexture } from '@react-three/drei';
import { AVATAR_CONFIG } from './config';

export default function Avatar({ avatar_url, avatarState, analyserRef, gestureCategory }) {

  const gltf = useGLTF(avatar_url || AVATAR_CONFIG.model);
  const mixer = useMemo(() => new THREE.AnimationMixer(gltf.scene), [gltf.scene]);
  
  const actions = useRef({});
  const activeAction = useRef(null);
  const targetState = useRef('idle');
  const baseGroupRef = useRef();
  const jawRotationRef = useRef(0);

  const robotTexture = useTexture('/images/tripo_mat_f124fc35_Diffuse.PNG'); 
  robotTexture.flipY = false; 
  robotTexture.colorSpace = THREE.SRGBColorSpace;

  useEffect(() => {
    if (gltf.scene) {
      gltf.scene.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          node.frustumCulled = false;
          node.material = new THREE.MeshStandardMaterial({
            map: robotTexture,
            roughness: 0.4,
            metalness: 0.1
          });
        }
      });
    }
  }, [gltf.scene, robotTexture]);

  // --- CARGA DE ANIMACIONES ---
  useEffect(() => {
    const loader = new FBXLoader();
    let isMounted = true;

    const loadAnim = async (key, url) => {
      if (!url) return;
      try {
        const fbx = await loader.loadAsync(url);
        if (!isMounted) return;
        if (fbx.animations.length > 0) {
          let clip = fbx.animations[0];
          const action = mixer.clipAction(clip);
          actions.current[key] = action;
          console.log(`[AVATAR] ✅ Acción registrada: ${key}`);

          // Autoplay inicial
          if (key === 'idle_loop' && !activeAction.current) {
            playClip('idle_loop', THREE.LoopRepeat, 0);
          }
        }
      } catch (err) {
        console.error(`[AVATAR] ❌ Error cargando animación '${key}':`, err);
      }
    };
    
    Object.entries(AVATAR_CONFIG.animations).forEach(([key, url]) => {
      loadAnim(key, url);
    });

    return () => {
      isMounted = false;
      mixer.stopAllAction();
    };
  }, [mixer, gltf.scene]);

  // --- REPRODUCTOR Y MÁQUINA DE ESTADOS ---
  const playClip = (clipName, loopType = THREE.LoopRepeat, fadeTime = 0.2) => {
    const newAction = actions.current[clipName];
    if (!newAction) return;

    if (activeAction.current === newAction) return;

    newAction.reset();
    newAction.setLoop(loopType, loopType === THREE.LoopOnce ? 1 : Infinity);
    newAction.clampWhenFinished = true;
    newAction.setEffectiveTimeScale(1);
    newAction.setEffectiveWeight(1);

    if (activeAction.current) {
      newAction.crossFadeFrom(activeAction.current, fadeTime, true);
    }
    
    newAction.play();
    activeAction.current = newAction;
    activeAction.current._clipName = clipName;
    console.log(`[AVATAR] 🎬 Animando: ${clipName}`);
  };

  useEffect(() => {
    targetState.current = avatarState;
    console.log(`[AVATAR] Cambio de estado: ${avatarState}`);
    
    if (avatarState === 'listening') {
      playClip('listening_enter', THREE.LoopOnce, 0.2);
    } 
    else if (avatarState === 'thinking') {
      // Si el backend es rápido, podríamos pasar de idle directo a thinking
      playClip('thinking_in', THREE.LoopOnce, 0.2);
    } 
    else if (avatarState === 'talking') {
      playClip('thinking_out', THREE.LoopOnce, 0.2);
    } 
    else if (avatarState === 'idle') {
      if (activeAction.current && activeAction.current._clipName && activeAction.current._clipName.startsWith('talking')) {
         playClip('talking_out', THREE.LoopOnce, 0.2);
      } else {
         playClip('idle_loop', THREE.LoopRepeat, 0.4);
      }
    }
  }, [avatarState]);

  // Helper to map category to gesture
  const getGestureForCategory = (category) => {
    if (!category) return null;
    const cat = category.toLowerCase();
    if (cat === 'cito') return 'laughing';
    if (cat.includes('facultad') || cat.includes('servicios') || cat.includes('ubicacion')) return 'pointing_front';
    if (cat === 'fallback' || cat.includes('error')) return 'negative';
    return null;
  };

  // Manejador de eventos 'finished' para secuenciar in/loop/out y gestos
  useEffect(() => {
    const onFinished = (e) => {
      const finishedClipName = e.action._clipName;
      if (!finishedClipName) return;

      if (finishedClipName === 'listening_enter') {
        if (targetState.current === 'listening') {
          playClip('listening_loop', THREE.LoopRepeat, 0.1);
        }
      } 
      else if (finishedClipName === 'thinking_in') {
        if (targetState.current === 'thinking') {
          playClip('thinking_loop', THREE.LoopRepeat, 0.1);
        }
      }
      else if (finishedClipName === 'thinking_out') {
        if (targetState.current === 'talking') {
          const gesture = getGestureForCategory(gestureCategory);
          // CITO o FALLBACK entran directo al gesto antes de hablar
          if (gesture === 'laughing' || gesture === 'negative') {
            playClip(gesture, THREE.LoopOnce, 0.1);
          } else {
            playClip('talking_in', THREE.LoopOnce, 0.1);
          }
        }
      }
      else if (finishedClipName === 'talking_in') {
        if (targetState.current === 'talking') {
          const gesture = getGestureForCategory(gestureCategory);
          // FACULTAD hace el gesto después del talking_in
          if (gesture === 'pointing_front') {
            playClip(gesture, THREE.LoopOnce, 0.1);
          } else {
            playClip('talking_loop', THREE.LoopRepeat, 0.1);
          }
        }
      }
      // Cuando termina cualquier gesto secundario
      else if (['laughing', 'negative', 'pointing_front'].includes(finishedClipName)) {
        if (targetState.current === 'talking') {
          playClip('talking_loop', THREE.LoopRepeat, 0.2);
        } else if (targetState.current === 'idle') {
          playClip('idle_loop', THREE.LoopRepeat, 0.2);
        }
      }
      else if (finishedClipName === 'talking_out') {
        if (targetState.current === 'idle') {
          playClip('idle_loop', THREE.LoopRepeat, 0.2);
        }
      }
    };

    mixer.addEventListener('finished', onFinished);
    return () => mixer.removeEventListener('finished', onFinished);
  }, [mixer, gestureCategory]);


  const jawBoneRef = useRef(null);
  const leftEyeRef = useRef(null);
  const rightEyeRef = useRef(null);

  useEffect(() => {
    if (gltf.scene) {
      jawBoneRef.current = gltf.scene.getObjectByName('cc_base_jawroot');
      leftEyeRef.current = gltf.scene.getObjectByName('cc_base_l_eye');
      rightEyeRef.current = gltf.scene.getObjectByName('cc_base_r_eye');
    }
  }, [gltf.scene]);

  useFrame((state, delta) => {
    mixer.update(delta);

    const time = state.clock.getElapsedTime();

    if (baseGroupRef.current) {
      baseGroupRef.current.position.y = Math.sin(time * 1.5) * 0.005;
      baseGroupRef.current.rotation.y = Math.cos(time * 0.8) * 0.005;
    }

    const blinkCycle = time % 4;
    let eyeScaleY = 1.0;
    if (blinkCycle > 3.85) {
      eyeScaleY = 0.1;
    }
    if (leftEyeRef.current && rightEyeRef.current) {
      leftEyeRef.current.scale.y = eyeScaleY;
      rightEyeRef.current.scale.y = eyeScaleY;
    }

    let averageVolume = 0;
    if (analyserRef && analyserRef.current) {
      const analyser = analyserRef.current;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      averageVolume = sum / dataArray.length;
    }

    if (avatarState === 'talking' && averageVolume > 2) {
      const targetRotationX = (averageVolume / 255) * 0.45;
      jawRotationRef.current = THREE.MathUtils.lerp(
        jawRotationRef.current,
        targetRotationX,
        0.15
      );
    } else {
      jawRotationRef.current = THREE.MathUtils.lerp(
        jawRotationRef.current,
        0,
        0.15
      );
    }

    // Sobrescribir rotación después del mixer para evitar doble movimiento y temblores
    if (jawBoneRef.current) {
      jawBoneRef.current.rotation.x = jawRotationRef.current;
    }
  });

  return (
    <group name="avatar" ref={baseGroupRef}>
      <primitive object={gltf.scene} dispose={null} scale={[1, 1, 1]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} />
    </group>
  );
}

useGLTF.preload(AVATAR_CONFIG.model);