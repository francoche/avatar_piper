import { useEffect, useRef } from 'react';

export const useAudioRecognition = (isListening, setIsListening, setText, setSpeak) => {
  const recognitionRef = useRef(null);
  const transcriptTimeoutRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'es-ES';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onstart = () => {
        console.log('[VOICE] Escuchando...');
      };

      recognitionRef.current.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }

        const cleanTranscript = transcript.trim().toLowerCase().replace(/\s+/g, ' ');
        console.log(`[VOICE] Parcial: "${cleanTranscript}"`);
        setText(cleanTranscript);

        if (transcriptTimeoutRef.current) {
          clearTimeout(transcriptTimeoutRef.current);
        }

        const words = cleanTranscript.split(' ').filter(w => w.length > 0);
        if (words.length < 3 || cleanTranscript.length < 10) {
          console.log('[VOICE] Texto muy corto, esperando más input...');
          transcriptTimeoutRef.current = setTimeout(() => {
            setIsListening(false);
          }, 1000);
          return;
        }

        console.log('[VOICE] Esperando confirmación de silencio...');
        setText(`🧠 Procesando lo que dijiste...`);

        transcriptTimeoutRef.current = setTimeout(() => {
          console.log(`[VOICE] Final enviado: "${cleanTranscript}"`);
          setText(cleanTranscript);
          setIsListening(false);
          setSpeak(true);
        }, 1000);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Error de voz:", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        console.log('[VOICE] Micrófono en pausa (onend).');
      };
    }
    
    return () => {
        if (transcriptTimeoutRef.current) clearTimeout(transcriptTimeoutRef.current);
    };
  }, [setIsListening, setSpeak, setText]);

  return recognitionRef;
};
