import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { MeshStandardMaterial, MeshPhysicalMaterial, LineBasicMaterial, Vector2 } from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

import { AVATAR_CONFIG } from './config';

const _ = require('lodash');

export default function Avatar({ avatar_url, avatarState }) {

   const gltf = useGLTF(avatar_url || AVATAR_CONFIG.model);
   const mixer = useMemo(() => new THREE.AnimationMixer(gltf.scene), [gltf.scene]);

   const dicts = useRef({ faceMesh: null });
   const morphIndices = useRef({ mouth: -1, jaw: -1, leftEye: -1, rightEye: -1 });

   const actions = useRef({});
   const currentAction = useRef(null);
   const baseGroupRef = useRef(); // Para micromovimiento de torso

   // Relojes Procedurales
   const lipSyncClock = useRef(0);
   const targetMouthOpen = useRef(0);

   const blinkClock = useRef(0);
   const nextBlinkInterval = useRef(Math.random() * 4 + 2);
   const isBlinking = useRef(false);

   // Ya no cargamos las texturas del modelo humano viejo.

   useMemo(() => {
      if (!gltf || !gltf.scene) return;
      gltf.scene.traverse(node => {
         if (node.type === 'Mesh' || node.type === 'LineSegments' || node.type === 'SkinnedMesh') {
            node.castShadow = true;
            node.receiveShadow = true;
            node.frustumCulled = false;

            if (node.name.includes("Body") || node.name.includes("Head") || node.name.includes("Wolf3D_Face") || node.isMesh) {
               if (node.morphTargetDictionary) {
                  dicts.current.faceMesh = node;

                  const m = node.morphTargetDictionary;
                  morphIndices.current.mouth = m.hasOwnProperty('mouthOpen') ? m['mouthOpen'] : (m.hasOwnProperty('viseme_O') ? m['viseme_O'] : -1);
                  morphIndices.current.jaw = m.hasOwnProperty('jawOpen') ? m['jawOpen'] : -1;
                  morphIndices.current.leftEye = m.hasOwnProperty('eyeBlinkLeft') ? m['eyeBlinkLeft'] : -1;
                  morphIndices.current.rightEye = m.hasOwnProperty('eyeBlinkRight') ? m['eyeBlinkRight'] : -1;
               }
            }
         }
      });
   }, [gltf]);

   // Carga de Tracks de Animación Limpios
   useEffect(() => {
      const loader = new FBXLoader();

      const loadAnim = async (key, url) => {
         if (!url) return;
         try {
            const fbx = await loader.loadAsync(url);
            if (!fbx.animations.length) return;

            let clip = fbx.animations[0];

            // ELIMINAR ROOT MOTION (CRÍTICO)
            // Removemos las pistas de posición globales y escala que causan los desplazamientos fuera de lugar
            clip.tracks = clip.tracks.filter(track => {
               const nameLower = track.name.toLowerCase();
               if (nameLower.includes('.scale')) return false;
               if (nameLower.includes('position')) return false;
               return true;
            });
            console.log(`[AVATAR] Sistema estable sin root motion para clip ${key}`);

            const action = mixer.clipAction(clip);
            action.setLoop(THREE.LoopRepeat);
            actions.current[key] = action;

            if (key === 'idle' && !currentAction.current) {
               action.play();
               currentAction.current = 'idle';
               console.log(`[AVATAR] Animación inicial: idle`);
            }

         } catch (err) {
            console.warn(`[AVATAR] No se pudo cargar animación '${key}' desde '${url}'. Fallback activo.`);
         }
      };

      Object.entries(AVATAR_CONFIG.animations).forEach(([key, url]) => {
         loadAnim(key, url);
      });

      return () => {
         mixer.stopAllAction();
      };
   }, [mixer]);

   const playAnimation = (name) => {
      let targetName = name;

      if (!actions.current[name]) {
         console.warn(`[AVATAR] Fallback a idle (Animación '${name}' no encontrada)`);
         targetName = 'idle';
      }

      const newAction = actions.current[targetName];
      if (!newAction) return;

      const oldName = currentAction.current;
      if (oldName === targetName) return;

      const oldAction = actions.current[oldName];

      newAction.reset();

      // [MEJORA] Naturalidad de animaciones: velocidad dinámica
      if (targetName === "thinking") {
         newAction.timeScale = 0.5;
      } else if (targetName === "idle") {
         newAction.timeScale = 0.8 + Math.random() * 0.4;
      } else {
         newAction.timeScale = 1.0;
      }

      newAction.play();

      if (oldAction) {
         // Si pasa a idle, hacer fade más lento (~0.4), en resto más rápido (~0.2)
         const fadeTime = targetName === 'idle' ? 0.4 : 0.2;
         newAction.crossFadeFrom(oldAction, fadeTime, true);
      }

      currentAction.current = targetName;

      const fileUrl = AVATAR_CONFIG.animations[targetName] || targetName;
      const fileName = fileUrl.split('/').pop();
      console.log(`[AVATAR] Animación ejecutada: ${fileName}`);
   };

   const timeoutRef = useRef(null);

   useEffect(() => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      if (avatarState === 'idle') {
         const dropDelay = Math.floor(Math.random() * (300 - 150 + 1)) + 150;
         timeoutRef.current = setTimeout(() => {
            //playAnimation('idle');
         }, dropDelay);
      } else {
         //playAnimation(avatarState);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [avatarState]);

   // Bucle de Renderización Activa (UX Procedural)
   useFrame((state, delta) => {
      mixer.update(delta);

      // Micro-movimientos de sistema (idle vivo)
      if (baseGroupRef.current) {
         if (avatarState === 'idle') {
            baseGroupRef.current.rotation.y = THREE.MathUtils.lerp(baseGroupRef.current.rotation.y, Math.sin(state.clock.elapsedTime * 0.8) * 0.03, 0.08);
            baseGroupRef.current.rotation.x = THREE.MathUtils.lerp(baseGroupRef.current.rotation.x, 0, 0.08);
         } else if (avatarState === 'listening') {
            baseGroupRef.current.rotation.y = THREE.MathUtils.lerp(baseGroupRef.current.rotation.y, Math.sin(state.clock.elapsedTime * 1.8) * 0.05, 0.1);
            baseGroupRef.current.rotation.x = THREE.MathUtils.lerp(baseGroupRef.current.rotation.x, 0.08, 0.1); // Leve inclinación
         } else {
            baseGroupRef.current.rotation.y = THREE.MathUtils.lerp(baseGroupRef.current.rotation.y, 0, 0.1);
            baseGroupRef.current.rotation.x = THREE.MathUtils.lerp(baseGroupRef.current.rotation.x, 0, 0.1);
         }
      }

      if (dicts.current.faceMesh) {
         const mesh = dicts.current.faceMesh;
         const indices = morphIndices.current;

         // TAREA 1: Fake Lip Sync (Sincronía perfecta al estado de habla activo)
         const isSpeaking = !['idle', 'listening', 'thinking'].includes(avatarState);
         if (isSpeaking) {
            // [MEJORA] LipSync más natural variando intensidad
            const lipIntensity = avatarState === "talking" ? 1 : 0.3;
            lipSyncClock.current += delta;
            if (lipSyncClock.current >= 0.1) {
               lipSyncClock.current = 0;
               targetMouthOpen.current = (Math.random() * 0.45 + 0.15) * lipIntensity;
            }
         } else {
            targetMouthOpen.current = 0;
         }

         if (indices.mouth !== -1) {
            mesh.morphTargetInfluences[indices.mouth] = THREE.MathUtils.lerp(mesh.morphTargetInfluences[indices.mouth], targetMouthOpen.current, 0.35);
         }
         if (indices.jaw !== -1) {
            mesh.morphTargetInfluences[indices.jaw] = THREE.MathUtils.lerp(mesh.morphTargetInfluences[indices.jaw], targetMouthOpen.current * 0.6, 0.35);
         }

         // TAREA 2: Blink Natural Mejorado
         blinkClock.current += delta;
         if (!isBlinking.current && blinkClock.current >= nextBlinkInterval.current) {
            isBlinking.current = true;
            blinkClock.current = 0;
            console.log('[AVATAR] Blink trigger (Orgánico)');

            setTimeout(() => {
               isBlinking.current = false;
               nextBlinkInterval.current = Math.random() * 4 + 2;
            }, Math.random() * 80 + 100);
         }

         const targetBlink = isBlinking.current ? 1 : 0;
         if (indices.leftEye !== -1) {
            mesh.morphTargetInfluences[indices.leftEye] = THREE.MathUtils.lerp(mesh.morphTargetInfluences[indices.leftEye], targetBlink, 0.5);
         }
         if (indices.rightEye !== -1) {
            mesh.morphTargetInfluences[indices.rightEye] = THREE.MathUtils.lerp(mesh.morphTargetInfluences[indices.rightEye], targetBlink, 0.5);
         }
      }
   });

   return (
      <group name="avatar" ref={baseGroupRef}>
         <primitive object={gltf.scene} dispose={null} scale={[1, 1, 1]} position={[0, 0.6, 0]} />
      </group>
   );
}

useGLTF.preload(AVATAR_CONFIG.model);