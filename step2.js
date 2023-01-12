import fs from 'fs';
import path from 'path';

var root = new URL(import.meta.url).pathname.substring(0,new URL(import.meta.url).pathname.lastIndexOf('/')) + '/assets';
const outputFile = root + '/output.txt';

function scanDir(dir) {
    let files = fs.readdirSync(dir);
    for (let i = 0; i < files.length; i++) {
        let filePath = path.join(dir, files[i]);
        let stats = fs.statSync(filePath);
        if (stats.isFile() && stats.size === 0) {
            fs.appendFileSync(outputFile, filePath + '\n');
        } else if (stats.isDirectory()) {
            scanDir(filePath);
        }
    }
}

scanDir(root);
console.log(`Found and written ${outputFile}`)
