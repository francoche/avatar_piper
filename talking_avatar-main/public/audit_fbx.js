const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const dom = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);
global.window = dom.window;
global.document = dom.window.document;
global.self = global.window;

// Now require three
const THREE = require('three');
global.THREE = THREE;

const { FBXLoader } = require('three/examples/jsm/loaders/FBXLoader.js');

const loader = new FBXLoader();

const animsDir = path.join(__dirname, 'animations');
const files = fs.readdirSync(animsDir).filter(f => f.endsWith('.FBX'));

console.log("=== FBX AUDIT ===");
files.forEach(file => {
    const buffer = fs.readFileSync(path.join(animsDir, file));
    try {
        const object = loader.parse(buffer.buffer, animsDir);
        if (object.animations && object.animations.length > 0) {
            object.animations.forEach(anim => {
                console.log(`File: ${file} | AnimName: ${anim.name} | Duration: ${anim.duration.toFixed(2)}s | Tracks: ${anim.tracks.length}`);
            });
        } else {
            console.log(`File: ${file} | NO ANIMATIONS FOUND`);
        }
    } catch (e) {
        console.error(`File: ${file} | ERROR parsing FBX: ${e.message}`);
    }
});
