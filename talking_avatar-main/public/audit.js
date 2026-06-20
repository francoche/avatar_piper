const fs = require('fs');
const path = require('path');

const glbPath = path.join(__dirname, 'Robot_Esqueleto.glb');
const buffer = fs.readFileSync(glbPath);

// Header: magic (4), version (4), length (4)
const magic = buffer.readUInt32LE(0);
if (magic !== 0x46546C67) {
  console.error("Not a GLB file");
  process.exit(1);
}

// Chunk 0 (JSON)
const chunkLength = buffer.readUInt32LE(12);
const chunkType = buffer.readUInt32LE(16);
if (chunkType !== 0x4E4F534A) {
  console.error("First chunk is not JSON");
  process.exit(1);
}

const jsonBuffer = buffer.subarray(20, 20 + chunkLength);
const jsonString = jsonBuffer.toString('utf8');
const gltf = JSON.parse(jsonString);

console.log("=== GLTF AUDIT ===");
console.log("Nodes:", gltf.nodes ? gltf.nodes.length : 0);
console.log("Meshes:", gltf.meshes ? gltf.meshes.length : 0);

if (gltf.meshes) {
  gltf.meshes.forEach((mesh, i) => {
    console.log(`\nMesh [${i}] ${mesh.name}:`);
    if (mesh.primitives) {
      mesh.primitives.forEach((prim, j) => {
         if (prim.targets) {
           console.log(`  Primitive [${j}] has ${prim.targets.length} morph targets.`);
           // Extract target names if available in extras.targetNames
           if (mesh.extras && mesh.extras.targetNames) {
             console.log(`  Target Names:`, mesh.extras.targetNames);
           } else {
             console.log(`  (No targetNames found in extras)`);
           }
         }
      });
    }
  });
}

if (gltf.animations) {
  console.log("\nInternal Animations:", gltf.animations.map(a => a.name));
} else {
  console.log("\nInternal Animations: NONE");
}

