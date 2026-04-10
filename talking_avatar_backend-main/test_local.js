const baseUrl = 'http://localhost:3055';

async function test(path, body) {
  try {
    const res = await fetch(baseUrl + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    console.log(`[TEST] ${path} ->`, data);
  } catch (err) {
    console.error(err);
  }
}

async function runTests() {
  console.log("--- TEST FAQ ---");
  await test('/chat', { prompt: "horario bedelia" });

  console.log("\\n--- TEST PARSER (MATERIA ALIAS) ---");
  await test('/chat', { prompt: "datos" });

  console.log("\\n--- TEST OLLAMA ---");
  await test('/chat', { prompt: "Hola, que es el sol" });

  console.log("\\n--- TEST CACHE ---(repite FAQ)");
  await test('/chat', { prompt: "horario bedelia" });

  console.log("\\n--- TEST TTS PIPER ---");
  await test('/talk', { text: "Audio generado exitosamente" });
}

runTests();
