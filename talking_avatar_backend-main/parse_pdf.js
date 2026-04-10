const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('../conocimiento.pdf');

pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('conocimiento.txt', data.text);
    console.log("PDF parsed successfully.");
});
