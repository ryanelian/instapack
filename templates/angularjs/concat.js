const uglify = require('uglify-js');
const fs = require('fs');
const path = require('path');

console.log('Concatenating and minifying these JS files:');
let inputs = [
    require.resolve('jquery'),
    require.resolve('jquery-validation'),
    require.resolve('jquery-validation-unobtrusive'),
    require.resolve('bootstrap-sass')
];
console.log(inputs);

console.log('Reading file contents...');
let codes = {};
for (let input of inputs) {
    codes[input] = fs.readFileSync(input, 'utf8');
}

let outputFileName = 'concat.js';

console.log('Concatenating and minifying...');
let result = uglify.minify(codes, {
    sourceMap: {
        filename: outputFileName,
        url: outputFileName + '.map'
    }
});

if (result.error) {
    console.error(result.error);
    return;
}

console.log('Writing files...');
let folder = path.join(__dirname, 'wwwroot', 'js');
let file = path.join(folder, outputFileName);

function ensureFolderExists(folder) {
    if (fs.existsSync(folder) === false) {
        let parent = path.dirname(folder);
        ensureFolderExists(parent);
        fs.mkdirSync(folder);
    }
}

ensureFolderExists(folder);
fs.writeFileSync(file, result.code);
fs.writeFileSync(file + '.map', result.map);
console.log('Concat successful!');
