//Some inital node code experiments
console.log("Hello :)");

global.luckNum = '13';
console.log(global.luckNum);
console.log(process.platform);
console.log(process.env.USER);

process.on('exit', function() {
    console.log("done.")
});

const { readFile, readFileSync } = require('fs');

const txt = readFileSync('./README.md', 'utf8');
console.log(txt);

const myModule = require('./my-module');
console.log(myModule);

// Setup and run virtual Express Webserver
const express = require('express');

const app = express();

app.get('/', (request, response) => {
    readFile('./home.html', 'utf8', (err, html) => {
        if (err) {
            response.status(500).send('sorryy out');
        }
        response.send(html);
    });
});

app.listen(process.env.PORT || 3000, () => console.log('App here http://localhost:3000'));