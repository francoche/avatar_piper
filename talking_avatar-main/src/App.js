import React, { Suspense, useEffect, useRef, useState, useMemo } from 'react'

import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, useTexture, Loader, Environment, useFBX, useAnimations, OrthographicCamera } from '@react-three/drei';
import { MeshStandardMaterial } from 'three/src/materials/MeshStandardMaterial';

import { LineBasicMaterial, MeshPhysicalMaterial, Vector2 } from 'three';
import ReactAudioPlayer from 'react-audio-player';

import createAnimation from './converter';
import blinkData from './blendDataBlink.json';

import * as THREE from 'three';
import axios from 'axios';
import { SRGBColorSpace, LinearSRGBColorSpace } from 'three';


const _ = require('lodash');

function Avatar({ avatar_url, speak, setSpeak, text, setAudioSource, playing }) {

  let gltf = useGLTF(avatar_url);
  let morphTargetDictionaryBody = null;
  let morphTargetDictionaryLowerTeeth = null;

  const [ 
    bodyTexture, 
    eyesTexture, 
    teethTexture, 
    bodySpecularTexture, 
    bodyRoughnessTexture, 
    bodyNormalTexture,
    teethNormalTexture,
    // teethSpecularTexture,
    hairTexture,
    tshirtDiffuseTexture,
    tshirtNormalTexture,
    tshirtRoughnessTexture,
    hairAlphaTexture,
    hairNormalTexture,
    hairRoughnessTexture,
    ] = useTexture([
    "/images/body.webp",
    "/images/eyes.webp",
    "/images/teeth_diffuse.webp",
    "/images/body_specular.webp",
    "/images/body_roughness.webp",
    "/images/body_normal.webp",
    "/images/teeth_normal.webp",
    // "/images/teeth_specular.webp",
    "/images/h_color.webp",
    "/images/tshirt_diffuse.webp",
    "/images/tshirt_normal.webp",
    "/images/tshirt_roughness.webp",
    "/images/h_alpha.webp",
    "/images/h_normal.webp",
    "/images/h_roughness.webp",
  ]);

  _.each([
    bodyTexture, 
    eyesTexture, 
    teethTexture, 
    teethNormalTexture, 
    bodySpecularTexture, 
    bodyRoughnessTexture, 
    bodyNormalTexture, 
    tshirtDiffuseTexture, 
    tshirtNormalTexture, 
    tshirtRoughnessTexture,
    hairAlphaTexture,
    hairNormalTexture,
    hairRoughnessTexture
  ], t => {
    t.colorSpace = SRGBColorSpace;
    t.flipY = false;
  });

  bodyNormalTexture.colorSpace = LinearSRGBColorSpace;
  tshirtNormalTexture.colorSpace = LinearSRGBColorSpace;
  teethNormalTexture.colorSpace = LinearSRGBColorSpace;
  hairNormalTexture.colorSpace = LinearSRGBColorSpace;

  
  gltf.scene.traverse(node => {


    if(node.type === 'Mesh' || node.type === 'LineSegments' || node.type === 'SkinnedMesh') {

      node.castShadow = true;
      node.receiveShadow = true;
      node.frustumCulled = false;

    
      if (node.name.includes("Body")) {

        node.castShadow = true;
        node.receiveShadow = true;

        node.material = new MeshPhysicalMaterial();
        node.material.map = bodyTexture;
        // node.material.shininess = 60;
        node.material.roughness = 1.7;

        // node.material.specularMap = bodySpecularTexture;
        node.material.roughnessMap = bodyRoughnessTexture;
        node.material.normalMap = bodyNormalTexture;
        node.material.normalScale = new Vector2(0.6, 0.6);

        morphTargetDictionaryBody = node.morphTargetDictionary;

        node.material.envMapIntensity = 0.8;
        // node.material.visible = false;

      }

      if (node.name.includes("Eyes")) {
        node.material = new MeshStandardMaterial();
        node.material.map = eyesTexture;
        // node.material.shininess = 100;
        node.material.roughness = 0.1;
        node.material.envMapIntensity = 0.5;


      }

      if (node.name.includes("Brows")) {
        node.material = new LineBasicMaterial({color: 0x000000});
        node.material.linewidth = 1;
        node.material.opacity = 0.5;
        node.material.transparent = true;
        node.visible = false;
      }

      if (node.name.includes("Teeth")) {

        node.receiveShadow = true;
        node.castShadow = true;
        node.material = new MeshStandardMaterial();
        node.material.roughness = 0.1;
        node.material.map = teethTexture;
        node.material.normalMap = teethNormalTexture;

        node.material.envMapIntensity = 0.7;


      }

      if (node.name.includes("Hair")) {
        node.material = new MeshStandardMaterial();
        node.material.map = hairTexture;
        node.material.alphaMap = hairAlphaTexture;
        node.material.normalMap = hairNormalTexture;
        node.material.roughnessMap = hairRoughnessTexture;
        
        node.material.transparent = true;
        node.material.depthWrite = false;
        node.material.side = 2;
        node.material.color.setHex(0x000000);
        
        node.material.envMapIntensity = 0.3;

      
      }

      if (node.name.includes("TSHIRT")) {
        node.material = new MeshStandardMaterial();

        node.material.map = tshirtDiffuseTexture;
        node.material.roughnessMap = tshirtRoughnessTexture;
        node.material.normalMap = tshirtNormalTexture;
        node.material.color.setHex(0xffffff);

        node.material.envMapIntensity = 0.5;


      }

      if (node.name.includes("TeethLower")) {
        morphTargetDictionaryLowerTeeth = node.morphTargetDictionary;
      }

    }

  });

  const [clips, setClips] = useState([]);
  const mixer = useMemo(() => new THREE.AnimationMixer(gltf.scene), []);
/*
  useEffect(() => {

    if (speak === false)
      return;

    makeAIResponse(text)
    .then(response => {
      let { blendData, filename } = response.data;

      // respuesta real de Ollama (opcional: mostrarla en pantalla)
      console.log("Respuesta de IA:", response.aiReply);

      let newClips = [ 
        createAnimation(blendData, morphTargetDictionaryBody, 'HG_Body'), 
        createAnimation(blendData, morphTargetDictionaryLowerTeeth, 'HG_TeethLower')
      ];

      filename = AZURE_HOST + filename;

      setClips(newClips);
      
      setAudioSource(filename);
    })
    .catch(err => {
      console.error(err);
      setSpeak(false);
    });


  }, [speak]);
  */

  useEffect(() => {
    if (speak === false) return;

    makeAIResponse(text)
    .then(response => {
        // Obtenemos los datos de la respuesta
        let { filename } = response.data;

        // Log de la respuesta de Ollama para confirmar en consola
        console.log("Respuesta de IA:", response.aiReply);

        // --- IMPORTANTE: Construir la URL completa ---
        // Sin esto, el reproductor no encontrará el archivo .wav
        const fullPath = AZURE_HOST + filename; 

        // Seteamos la fuente, lo que dispara el evento playerReady en tu ReactAudioPlayer
        setAudioSource(fullPath);
    })
    .catch(err => {
        console.error("Error al procesar habla:", err);
        // Reseteamos el botón si algo sale mal en la petición
        setSpeak(false);
    });
}, [speak]);

  let idleFbx = useFBX('/idle.fbx');
  let { clips: idleClips } = useAnimations(idleFbx.animations);

  idleClips[0].tracks = _.filter(idleClips[0].tracks, track => {
    return track.name.includes("Head") || track.name.includes("Neck") || track.name.includes("Spine2");
  });

  idleClips[0].tracks = _.map(idleClips[0].tracks, track => {

    if (track.name.includes("Head")) {
      track.name = "head.quaternion";
    }

    if (track.name.includes("Neck")) {
      track.name = "neck.quaternion";
    }

    if (track.name.includes("Spine")) {
      track.name = "spine2.quaternion";
    }

    return track;

  });

  useEffect(() => {

    let idleClipAction = mixer.clipAction(idleClips[0]);
    idleClipAction.play();

    let blinkClip = createAnimation(blinkData, morphTargetDictionaryBody, 'HG_Body');
    let blinkAction = mixer.clipAction(blinkClip);
    blinkAction.play();


  }, []);
  

  // Play animation clips when available
  useEffect(() => {

    if (playing === false)
      return;
    
    _.each(clips, clip => {
        let clipAction = mixer.clipAction(clip);
        clipAction.setLoop(THREE.LoopOnce);
        clipAction.play();

    });

  }, [playing]);

  
  useFrame((state, delta) => {
    mixer.update(delta);
  });


  return (
    <group name="avatar">
      <primitive object={gltf.scene} dispose={null} />
    </group>
  );
}

// 1. CORREGIR LA VARIABLE DE OLLAMA (Debe apuntar al puerto 5000 de tu Express)
const API_BACKEND = 'http://localhost:5000'; // CAMBIADO de 5001 a 5000

// 2. CORREGIR LA VARIABLE DE AZURE aa (Si el servicio de Azure corre en 5001)
// Si no sabes dónde corre Azure TTS, asumiremos que es 5001 para diferenciar.
const AZURE_HOST = 'http://localhost:5000'; // CAMBIADO de 5000 a 5001


async function makeAIResponse(userText) {
  try {
    // 1. Pedir respuesta a Ollama (Express). USA LA RUTA CORRECTA: /chat
    const chatRes = await axios.post(`${API_BACKEND}/chat`, { prompt: userText });
    const aiReply = chatRes.data.reply;

    // 2. Generar audio + animación con Azure (debe usar su propio puerto)
    // **NOTA:** Si el servicio de Azure TTS SÍ tiene una ruta llamada /talk, déjalo así. 
    // Si no, debes corregirla.
    const speechRes = await axios.post(`${AZURE_HOST}/talk`, { text: aiReply });

    // devolver también el texto que contestó Ollama
    return { ...speechRes, aiReply };
  } catch (err) {
    console.error("Error en makeAIResponse:", err);
    throw err;
  }
}


const STYLES = {
  area: {position: 'absolute', bottom:'10px', left: '10px', zIndex: 500},
  text: {margin: '0px', width:'300px', padding: '5px', background: 'none', color: '#ffffff', fontSize: '1.2em', border: 'none'},
  speak: {padding: '10px', marginTop: '5px', display: 'block', color: '#FFFFFF', background: '#222222', border: 'None'},
  area2: {position: 'absolute', top:'5px', right: '15px', zIndex: 500},
  label: {color: '#777777', fontSize:'0.8em'}
}

function App() {
  const audioPlayer = useRef();

  const [speak, setSpeak] = useState(false);
  const [text, setText] = useState(""); // Empezamos vacío
  const [audioSource, setAudioSource] = useState(null);
  const [playing, setPlaying] = useState(false);

  // --- LÓGICA DE VOZ ---
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'es-ES'; // Idioma español
      recognitionRef.current.continuous = false; // Se detiene al terminar la frase

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setText(transcript); // Guardamos lo que escuchó
        setIsListening(false);
        
        // DISPARO AUTOMÁTICO: En cuanto termina de procesar la voz, activa el Avatar
        setSpeak(true);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Error de voz:", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const handleMicClick = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setText(""); // Limpiamos texto previo
      setIsListening(true);
      recognitionRef.current.start();
    }
  };
  // ----------------------

  function playerEnded(e) {
    setAudioSource(null);
    setSpeak(false);
    setPlaying(false);
  }

  function playerReady(e) {
    audioPlayer.current.audioEl.current.play();
    setPlaying(true);
  }

  return (
    <div className="full">
      <div style={STYLES.area}>
        {/* Feedback visual de lo que se escuchó */}
        <div style={{ color: 'white', marginBottom: '10px', fontSize: '1.2em', minHeight: '1.5em' }}>
          {isListening ? "🎤 Escuchando..." : text}
        </div>

        {/* Botón único de Micrófono */}
        <button 
          onClick={handleMicClick} 
          style={{
            ...STYLES.speak,
            backgroundColor: isListening ? '#ff4b4b' : '#222222',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5em'
          }}
          disabled={speak} // Bloqueado mientras el avatar responde
        >
          {speak ? '⏳' : '🎤'}
        </button>
        
        {speak && <span style={{color: 'white', fontSize: '0.8em'}}>El avatar está procesando...</span>}
      </div>

      <ReactAudioPlayer
        src={audioSource}
        ref={audioPlayer}
        onEnded={playerEnded}
        onCanPlayThrough={playerReady}
      />

      <Canvas dpr={2} onCreated={(ctx) => { ctx.gl.physicallyCorrectLights = true; }}>
        <OrthographicCamera makeDefault zoom={2000} position={[0, 1.65, 1]} />
        <Suspense fallback={null}>
          <Environment background={false} files="/images/photo_studio_loft_hall_1k.hdr" />
        </Suspense>
        <Suspense fallback={null}>
          <Bg />
        </Suspense>
        <Suspense fallback={null}>
          <Avatar 
            avatar_url="/model.glb" 
            speak={speak} 
            setSpeak={setSpeak}
            text={text}
            setAudioSource={setAudioSource}
            playing={playing}
          />
        </Suspense>
      </Canvas>
      <Loader dataInterpolation={(p) => `Loading...`} />
    </div>
  );
}


function Bg() {
  
  const texture = useTexture('/images/bg.webp');

  return(
    <mesh position={[0, 1.5, -2]} scale={[0.8, 0.8, 0.8]}>
      <planeGeometry />
      <meshBasicMaterial map={texture} />
    </mesh>
  )
}

export default App;
