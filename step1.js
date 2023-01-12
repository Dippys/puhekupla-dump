
import request from 'request';
import fs from 'fs';
import chalk from 'chalk';
import path from 'path';
import rl from 'readline-sync';

const logo = `
$$\\                 $$\\                           $$\\           
$$ |                $$ |                          $$ |          
$$$$$$\\  $$\\   $$\\ $$$$$$$\\   $$$$$$\\  $$ |  $$\\ $$\\   $$\\  $$$$$$\\  $$ | $$$$$$\\  
$$  __$$\\ $$ |  $$ |$$  __$$\\ $$  __$$\\ $$ | $$  |$$ |  $$ |$$  __$$\\ $$ | \\____$$\\ 
$$ /  $$ |$$ |  $$ |$$ |  $$ |$$$$$$$$ |$$$$$$  / $$ |  $$ |$$ /  $$ |$$ | $$$$$$$ |
$$ |  $$ |$$ |  $$ |$$ |  $$ |$$   ____|$$  _$$<  $$ |  $$ |$$ |  $$ |$$ |$$  __$$ |
$$$$$$$  |\\$$$$$$  |$$ |  $$ |\\$$$$$$$\\ $$ | \\$$\\ \\$$$$$$  |$$$$$$$  |$$ |\\$$$$$$$ |
$$  ____/  \\______/ \\__|  \\__| \\_______|\\__|  \\__| \\______/ $$  ____/ \\__| \\_______|
$$ |                                                        $$ |                    
$$ |                                                        $$ |                    
\\__|                                                        \\__|                    

DUMPER v1.0 | Love you Mark ♥
`;

var api = "https://content.puhekupla.com/api/v1/dump"
var query1 = "per_page"
var query2 = "page"
var x_puhekupla_apikey = "GET-YOUR-OWN-API-KEY"
var hekupla_language = "en"
let per_page = 100
let count = 0
var root = new URL(import.meta.url).pathname.substring(0,new URL(import.meta.url).pathname.lastIndexOf('/')) + '/assets';
let pages = 51;
let start_page = 1;
let delay = 5000;
let download_delay = 500;
let retry = 3; 


/**
 * @async
 * @function downloadAPI
 * @param {string} url - The URL to download the data from.
 * @param {number} i - The current page number of the request
 * @return {Promise} - Resolves with the response body or an error message
 * @throws {Error} - If there is an error with the request.
 * @description - This function makes a GET request to the specified URL with headers and query parameters. The function 
 * returns a promise that resolves with the body of the response if the request is successful or reject with an error.
 */
async function downloadAPI(url, i){
    return new Promise((resolve, reject) => {
        request({
            url: url,
            headers: {
                "x-puhekupla-apikey": x_puhekupla_apikey,
                "hekupla-language": hekupla_language
            },
            qs: {
                [query1]: per_page,
                [query2]: i
            }
        }, function (error, response, body) {
            if (error) {
                reject(error);
            }
            else if (response.statusCode !== 200) {
                reject('Invalid status code <' + response.statusCode + '>');
            }
            else {
                resolve(body);
            }
        });
    });
}


/**
 * @async
 * @function downloadFile
 * @param {string} url - The URL of the file to be downloaded
 * @return {void}
 * @description - This function makes a GET request to the specified URL and downloads the file to the file system. 
 * If the URL is not valid or request fails, it logs an error message and file is not downloaded.
 * It creates the directory if it doesn't exist and also use chalk library to color the logs.
 */
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


async function start(){

    for (let i = start_page; i < pages; i++) {

        // we need to call the downloadAPI function and wait for the response
        // then for each entry in the response, we need to call the downloadFile function
        // once the downloadFile function is done, we need to wait for the delay time
        // then we need to call the downloadAPI function again and so on
        console.log(chalk.yellow("Downloading page: ") + chalk.blue(i));
        let response = await downloadAPI(api, i);
        let data = JSON.parse(response);
        let urls = data.result.map(item => item.url.replace(/\\/g, ''));
        for (let url of urls) {
            await downloadFile(url);
            await new Promise(resolve => setTimeout(resolve, download_delay));
        }
        await new Promise(resolve => setTimeout(resolve, delay));
    }

}

async function main() {

    console.log(chalk.blue(logo));

    // get "--default" command line argument
    let defaultArg = process.argv[2];
    if(defaultArg && defaultArg === "--auto" || defaultArg === "--a"){
        start()
    } else {

    rl.question('Enter the number of pages to download (423): ', (answer) => {
        pages = parseInt(answer ? answer : pages);
        rl.close();
    });

    rl.question('Enter the start page number (1): ', (answer) => {
        start_page = parseInt(answer ? answer : start_page);
        rl.close();
    });

    rl.question('Enter the delay (ms) between requests (500): ', (answer) => {
        delay = parseInt(answer ? answer : delay);
        rl.close();
    });

    rl.question('Enter the number of entries per page (12): '), (answer) => {
        per_page = parseInt(answer ? answer : per_page);
        rl.close();
    }

    rl.question('Enter the delay (ms) between downloads of assets (500): '), (answer) => {
        download_delay = parseInt(answer ? answer : download_delay);
        rl.close();
    }

    console.log();
    console.log(chalk.blue("Pages: " + pages));
    console.log(chalk.blue("Start Page: " + start_page));
    console.log(chalk.blue("Delay: " + delay));
    console.log(chalk.blue("Entries per page: " + per_page));
    console.log();
    console.log("Please make sure you are appropriately using the API, and not abusing it.")
    console.log("If you do large number of requests, you might get blocked by the API.")
    console.log();

    rl.keyInPause("Press any key to continue...");

    start();
    }
}

main();
