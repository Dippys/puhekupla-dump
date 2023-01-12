import request from 'request';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
let retry = 3;
let count = 0;


var root = new URL(import.meta.url).pathname.substring(0,new URL(import.meta.url).pathname.lastIndexOf('/')) + '/assets';
const urlsFile = path.join(root,'output.txt');

// Read the contents of the URLs file
fs.readFile(urlsFile, 'utf8', (err, data) => {
    if (err) throw err;

    // Split the file contents into an array of URLs
    let urls = data.split('\n');
    let index = 0;

    // Download the first URL in the array
    downloadFile(urls[index]);

    // Download the next URL in the array every 2 seconds
    let interval = setInterval(() => {
        index++;
        if (index === urls.length) {
            clearInterval(interval);
        }
        downloadFile(urls[index]);
    }, 250);
} );

async function downloadFile(url) {

    let regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
    if (!regex.test(url)) {
        console.log(chalk.yellow(count) +  chalk.red(" | Failed: ") + chalk.blue(url));
        return;
    }
    // add the http if it's not there
    if (!/^(f|ht)tps?:\/\//i.test(url)) {
        url = "https://" + url;
    }

    let fileName = url.substring(url.lastIndexOf('/') + 1);
    let baseDir = url.substring(url.indexOf('/') + 1,url.lastIndexOf('/'));
    let filePath = path.join(root, baseDir, fileName);
    let dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    let file = fs.createWriteStream(filePath);

    let sendReq = request.get(url);

    // verify response code
    sendReq.on('response', (response) => {
        if (response.statusCode !== 200) {
            return file.close();
        }
        sendReq.pipe(file);
    });

    file.on('finish', () => {
        fs.stat(filePath, (err, stats) => {
            if (stats.size === 0) {
                if (retry === 0) {
                    console.log(chalk.red(`Error: file ${fileName} could not be downloaded after multiple attempts`));
                    return;
                }
                retry--;
                console.log(chalk.yellow(`File ${fileName} is empty. Re-downloading... Retries left: ${retry}`));
                // call downloadFile() again to re-download the file
                downloadFile(url);
            } else {
                file.close(() => {
                    console.log(chalk.yellow(count) +  chalk.green(" | Downloaded: ") + chalk.blue(filePath));
                    count++;
                }); 
            }
        });
    });



    // check for request errors
    sendReq.on('error', (err) => {
        fs.unlink(filePath + fileName, () => {});
        console.log(chalk.yellow(count) +  chalk.red(" | Failed: ") + chalk.blue(filePath));
        count++;
    });

    file.on('error', (err) => {
        fs.unlink(filePath + fileName, () => {});
        console.log(chalk.yellow(count) +  chalk.red(" | Failed: ") + chalk.blue(filePath));
        count++;
    });

}