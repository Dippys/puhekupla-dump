import fs from 'fs';
import path from 'path';

var root = new URL(import.meta.url).pathname.substring(0,new URL(import.meta.url).pathname.lastIndexOf('/')) + '/assets';
const inputFile = path.join(root, 'output.txt');
const outputFile = path.join(root, 'output.txt');
const replaceText = root;
const newText = 'https:/';

fs.readFile(inputFile, 'utf8', (err, data) => {
    if (err) throw err;

    let lines = data.split("\n");
    let modifiedData = lines.map(line => line.replace(replaceText, newText)).join("\n");

    fs.writeFile(outputFile, modifiedData, 'utf8', (err) => {
        if (err) throw err;
        console.log('File paths converted successfully!');
    });
});

