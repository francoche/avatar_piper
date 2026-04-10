const { spawn } = require('child_process');
const path = require('path');

const piperExe = path.join(__dirname, 'piper', 'piper.exe');
const modelPath = path.join(__dirname, 'piper', 'es_AR-daniela-high.onnx');

const child = spawn(piperExe, ['--model', modelPath, '--json-input', '--output_dir', path.join(__dirname, 'public', 'audio')]);

child.stdout.on('data', (d) => console.log('STDOUT:', d.toString()));
child.stderr.on('data', (d) => console.log('STDERR:', d.toString()));

setTimeout(() => {
    console.log("Sending text...");
    child.stdin.write(JSON.stringify({ text: "hola", output_file: path.join(__dirname, 'public', 'audio', 't1.wav') }) + '\\n');
}, 2000);

setTimeout(() => {
    console.log("Sending text 2...");
    child.stdin.write(JSON.stringify({ text: "adios" }) + '\\n');
}, 5000);

setTimeout(() => {
    child.kill();
}, 8000);
