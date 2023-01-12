import fs from 'fs';
import path from 'path';

var root = new URL(import.meta.url).pathname.substring(0,new URL(import.meta.url).pathname.lastIndexOf('/')) + '/assets';
const inputFile = root + '/output.txt';
const outputFile = root + '/output.txt';
const replaceText = '/home/dippy/Projects/puhekupla-dump/assets';
const newText = 'https://images.habbo.com';

fs.readFile(inputFile, 'utf8', (err, data) => {
    if (err) throw err;

    let modifiedData = data.replace(replaceText, newText);

    fs.writeFile(outputFile, modifiedData, 'utf8', (err) => {
        if (err) throw err;
        console.log('File paths converted successfully!');
    });
});