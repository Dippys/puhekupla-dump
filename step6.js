import fs from 'fs';
import path from 'path';

var root = new URL(import.meta.url).pathname.substring(0,new URL(import.meta.url).pathname.lastIndexOf('/')) + '/assets';

function deleteEmptyDirs(dir) {
    let files = fs.readdirSync(dir);
    if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
            let filePath = path.join(dir, files[i]);
            let stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                deleteEmptyDirs(filePath);
                if (fs.readdirSync(filePath).length === 0) {
                    fs.rmdirSync(filePath);
                    console.log(`Deleted empty directory: ${filePath}`);
                }
            }
        }
    }
}

deleteEmptyDirs(root);