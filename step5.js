import fs from 'fs';
import path from 'path';

var root = new URL(import.meta.url).pathname.substring(0,new URL(import.meta.url).pathname.lastIndexOf('/')) + '/assets';

function deleteZeroByteFiles(dir) {
    fs.readdirSync(dir).forEach(file => {
        let filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            deleteZeroByteFiles(filePath);
        } else if (fs.statSync(filePath).size === 0) {
            fs.unlinkSync(filePath);
            console.log(`Deleted zero byte file: ${filePath}`);
        }
    });
}

deleteZeroByteFiles(root);