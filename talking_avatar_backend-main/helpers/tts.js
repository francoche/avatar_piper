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

        // Ajustes para voz robótica:
        // --length_scale 1.15 (un poco más lento, monótono)
        // --noise_scale 0.1 (remueve expresividad humana)
        // --noise_w 0.1 (fonemas planos)
        const child = spawn(piperExe, [
            '--model', modelPath,
            '--output_file', fullPath,
            '--length_scale', '1.1',
            '--noise_scale', '0.2',
            '--noise_w', '0.2'
        ], {
            shell: false,
            stdio: ['pipe', 'ignore', 'ignore'] 
        });

        // Callback nativo para cerrar I/O sólo cuando se vació el buffer de texto
        child.stdin.write(text, 'utf-8', () => {
            child.stdin.end();
        });

        child.on('exit', (code) => {
            if (code === 0) {
                // Pequeño delay extra para asegurar que Windows haya hecho el flush al disco
                setTimeout(() => {
                    const tiempoTTS = (performance.now() - startTTS).toFixed(0);
                    const outPath = `/audio/${filename}`;
                    audioCache.set(text, outPath);
                    
                    console.log(`[MEJORA] Optimización TTS aplicada`);
                    console.log(`[API] 🔊 Piper TTS Generado (${tiempoTTS}ms)`);
                    resolve({
                        filename: outPath
                    });
                }, 150); // 150ms delay
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