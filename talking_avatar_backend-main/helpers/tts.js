const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { mkdir } = require('fs/promises');
const crypto = require('crypto');

const audioCache = new Map();

const textToSpeech = async (text) => {
    const startTTS = performance.now();

    if (audioCache.has(text)) {
        console.log('[TTS] ⚡ Audio desde cache');
        return new Promise(resolve => resolve({ filename: audioCache.get(text) }));
    }
    
    // Asegurar directorio asincrónicamente para no clavar el Event Loop
    const audioDir = path.join(__dirname, '../public/audio');
    try {
        await mkdir(audioDir, { recursive: true });
    } catch (e) { /* Ya existe */ }

    return new Promise((resolve, reject) => {
        // Nombres verdaderamente únicos y rápidos
        const randomString = crypto.randomBytes(4).toString('hex');
        const filename = `speech-${randomString}.wav`;
        const fullPath = path.join(audioDir, filename);

        const piperExe = path.join(__dirname, '../piper/piper.exe');
        const modelPath = path.join(__dirname, '../piper/es_AR-daniela-high.onnx');

        // Ignoramos stdout/stderr para no acumular buffers de memoria en Node 
        // y hacer el IPC muchísimo más rápido.
        const child = spawn(piperExe, [
            '--model', modelPath,
            '--output_file', fullPath
        ], {
            shell: false,
            stdio: ['pipe', 'ignore', 'ignore'] 
        });

        // Callback nativo para cerrar I/O sólo cuando se vació el buffer de texto
        child.stdin.write(text, 'utf-8', () => {
            child.stdin.end();
        });

        child.on('close', (code) => {
            if (code === 0) {
                const tiempoTTS = (performance.now() - startTTS).toFixed(0);
                const outPath = `/audio/${filename}`;
                audioCache.set(text, outPath);
                
                console.log(`[MEJORA] Optimización TTS aplicada`);
                console.log(`[API] 🔊 Piper TTS Generado en ciclo asincrónico directo (${tiempoTTS}ms)`);
                resolve({
                    filename: outPath
                });
            } else {
                console.error(`[TTS] Piper falló con código: ${code}`);
                reject(new Error(`Piper cerró con código: ${code}`));
            }
        });

        child.on('error', (err) => {
            console.error('[TTS] Error en spawn:', err);
            reject(err);
        });
    });
};

module.exports = { textToSpeech };