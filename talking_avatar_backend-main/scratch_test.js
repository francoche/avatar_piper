async function testBypass() {
  const tests = [
    { prompt: "ia", expected: "materia" },
    { prompt: "bd", expected: "materia" },
    { prompt: "mate 1", expected: "clarificacion" },
    { prompt: "arquitectura", expected: "materia" },
    { prompt: "programacion avanzada", expected: "materia" },
    { prompt: "quiero info de sistemas", expected: "fallback" }, // o materia (si Sistemas y Org)
    { prompt: "historia", expected: "fallback" },
    { prompt: "farmacia", expected: "fallback" },
    { prompt: "olvidalo", expected: "fallback" },
  ];

  console.log("=== BATERIA DE TESTS BYPASS SEMANTICO ===");

  for (const t of tests) {
    try {
      console.log(`\n-> [TEST] Input: "${t.prompt}"`);
      const response = await fetch('http://localhost:5000/chat', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: t.prompt }) 
      });
      const data = await response.json();
      console.log(`   Type: ${data.type}`);
      console.log(`   Reply: ${data.reply}`);
      if (data.type === t.expected || (t.prompt === "quiero info de sistemas" && data.type === 'materia')) {
         console.log(`   ✅ PASS`);
      } else {
         console.log(`   ❌ FAIL (Expected: ${t.expected})`);
      }
    } catch (e) {
      console.log(`   ERROR: ${e.message}`);
    }
  }
}

testBypass();
