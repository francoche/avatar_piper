const textToSpeech = require('@google-cloud/text-to-speech');
const path = require('path');
const fs = require('fs');
const util = require('util');

// Configuración del cliente de Google con tu archivo JSON
const client = new textToSpeech.TextToSpeechClient({
    keyFilename: path.join(__dirname, './avatar-voz-494015-bd87526811bc.json') 
});

const textToSpeechGoogle = async (text) => {
    return new Promise(async (resolve, reject) => {
        try {
            // 1. Mantener exactamente la misma lógica de nombres de archivo
            const randomString = Math.random().toString(36).slice(2, 7);
            const filename = `speech-${randomString}.mp3`; 
            
            const audioDir = path.join(__dirname, '../public/audio');
            const fullPath = path.join(audioDir, filename);

            if (!fs.existsSync(audioDir)){
                fs.mkdirSync(audioDir, { recursive: true });
            }

            // 2. Petición a Google
            const request = {
             input: { text: text },
             voice: { 
             languageCode: 'es-US', // Cambiamos a español de EE. UU.
            name: 'es-US-Chirp3-HD-Puck', // El nombre exacto que te dieron
            },
                audioConfig: { 
                    audioEncoding: 'MP3',
                    // Opcional: Las voces Chirp3 suelen sonar mejor a 24khz o 48khz
                    sampleRateHertz: 24000 
                },
            };

            const [response] = await client.synthesizeSpeech(request);

            // 3. Guardar el archivo
            fs.writeFile(fullPath, response.audioContent, 'binary', (err) => {
                if (err) return reject(err);
                
                // --- LA CLAVE ESTÁ AQUÍ ---
                // Devolvemos el objeto con la propiedad 'filename' 
                // tal cual lo hacía tu función de Piper.
                resolve({
                    filename: `/audio/${filename}`
                });
            });

        } catch (err) {
            reject(err);
        }
    });
};

module.exports = { textToSpeechGoogle };