const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const textToSpeech = async (text) => {
    return new Promise((resolve, reject) => {
        // Generamos un nombre de archivo único
        const randomString = Math.random().toString(36).slice(2, 7);
        const filename = `speech-${randomString}.wav`;
        
        // Rutas (usando las que ya tienes configuradas)
        const audioDir = path.join(__dirname, '../public/audio');
        const fullPath = path.join(audioDir, filename);
        //const piperExe = 'C:\\Users\\franc\\Downloads\\avatar_piper\\Talking_Avatar\\piper\\piper.exe';
        //const modelPath = 'C:\\Users\\franc\\Downloads\\avatar_piper\\Talking_Avatar\\piper\\es_AR-daniela-high.onnx';
        const piperExe = '../piper/piper.exe';
        const modelPath = '../piper/es_AR-daniela-high.onnx';

        // Asegurar que la carpeta de destino exista
        if (!fs.existsSync(audioDir)){
            fs.mkdirSync(audioDir, { recursive: true });
        }

        // Ejecutar Piper
        // Eliminamos la lógica de visemas y simplificamos el spawn
        const child = spawn(piperExe, [
            '--model', modelPath,
            '--output_file', fullPath
        ], {
            shell: false
        });

        // Escribir el texto en la entrada estándar de Piper
        const buffer = Buffer.from(text, 'utf-8');
        child.stdin.write(buffer);
        child.stdin.end();

        child.on('close', (code) => {
            if (code === 0) {
                // Devolvemos solo la ruta del audio para que el frontend lo reproduzca
                resolve({
                    filename: `/audio/${filename}`
                });
            } else {
                console.error(`Piper falló con código: ${code}`);
                reject(new Error(`Piper cerró con código: ${code}`));
            }
        });

        child.on('error', (err) => {
            console.error('Error al iniciar Piper:', err);
            reject(err);
        });
    });
};

module.exports = { textToSpeech };