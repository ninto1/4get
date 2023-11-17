const fetch = require("node-fetch-commonjs")
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
});
var threadNum;
var board;

const saveImage = async (imageUrl, relativePath) => {
    try {
        if (!fs.existsSync(relativePath)) {
            const response = await axios({
                url: imageUrl,
                method: 'GET',
                responseType: 'stream',
            });

            const imagePath = path.join(__dirname, relativePath);
            const writer = fs.createWriteStream(imagePath);

            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
        }
    } catch (error) {
        if(error.message.includes("ECONNRESET") || error.message.includes("ETIMEDOUT")) {
            console.log("retrying "+imageUrl)
            saveImage(imageUrl, relativePath)
        }
        else throw new Error(`Error downloading and saving image: ${imageUrl}\n\n\n${error.message}`);
    }
};

const checkFolder = (relativePath) => {
    const folders = relativePath.split("/");
    let currentPath = '';
    folders.forEach((folder) => {
        currentPath = path.join(currentPath, folder);
        if (!fs.existsSync(currentPath)) {
            fs.mkdirSync(currentPath);
        }
    });
};
const scrapeThread = (url) => {
    try {
        fetch(url).then(data => {
            if(data.status!=200)throw new Error("invalid URL")
            data.text().then(body => {
                //console.log(body)
                //an/4578891
                const imageRegex = /<a class="fileThumb" href="(\/\/i[.]4cdn[.]org\/.{1,4}\/\d+[.][jpgifwebm]{3,4})" target="_bl.{1,4}k">/g;
                const found = body.match(imageRegex);
                console.log("Found "+found.length+" images.")
                const pth = "images/" + board + "/"+ threadNum
                checkFolder(pth)
                for (let i = 0; i < found.length; i++) {
                    let current = "https:"+found[i].match(/(\/\/i[.]4cdn[.]org\/.{1,4}\/\d+[.][jpgifwebm]{3,4})/g)[0];
                    let imageNum = current.match(/\d+[.][jpgifwebm]{3,4}/g);
                    imageNum = imageNum[0];
                    imageNum = imageNum.split("s").join("");
                    saveImage("https:"+found[i].match(/(\/\/i[.]4cdn[.]org\/.{1,4}\/\d+[.][jpgifwebm]{3,4})/g)[0], pth + "/" + imageNum)

                }
                console.log("Downloading the pictures to "+__dirname+path.sep+"images"+path.sep+board+path.sep+threadNum)
                console.log("Thank you for using 4get")
            })
        })
    }catch (e) {
        throw new Error("Unable to reach website. Typo?");
    }
}
console.log("  _  _             _   \n" +
    " | || |           | |  \n" +
    " | || |_ __ _  ___| |_ \n" +
    " |__   _/ _` |/ _ \\ __|\n" +
    "    | || (_| |  __/ |_ \n" +
    "    |_| \\__, |\\___|\\__|\n" +
    "         __/ |         \n" +
    "        |___/          \n" +
    "\n")
readline.question(`Enter thread URL or "board/threadnumber" (E.g. g/123456789):\n`, input => {
    if(input.includes(".org")){
        board = input.split("/")[3];
        threadNum = input.split("/")[5];
        scrapeThread(input)
    }else{
        if(input.split("/").length!=2)throw new Error("You screwed up the input")
        threadNum = input.split("/")[1]
        board = input.split("/")[0]
        scrapeThread("https://boards.4channel.org/"+input.split("/")[0]+"/thread/"+input.split("/")[1])
    }
    readline.close();
});