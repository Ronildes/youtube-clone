const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { randomInt } = require('crypto');
const cors = require("cors");
const helmet = require('helmet');
const localtunnel = require('localtunnel');

const app = express();

const server = http.createServer(app);

app.use((request, response, next) => {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-type, Authorization');
    response.setHeader('Access-Control-Allow-Credentials', true);

    return next();
});

const WebSocket = require('socket.io');
const sockets = new WebSocket.Server(server, { cors: true, origins: '*' });

sockets.on('connection', (socket) => {
    console.log(`> Socket connected. ID: ${socket.id}`);
    socket.on('send-clear', () => {
      sockets.emit('clear');
    });

    socket.on('send-next', () => {
      sockets.emit('next');
    });
  });

console.log(`App Web Socket Server is running!`);

const receiveData = ((request, response, next) => {
    let data = '';

    request.setEncoding('utf-8');

    request.on('data', (chunk) => {
        data += chunk;
    });

    request.on('end', () => {
        request.body = JSON.parse(data);

        next();
    });
});

const receiveUpload = ((request, response, next) => {
    let data = '';

    request.setEncoding('utf-8');

    request.on('data', (chunk) => {
        //console.log(chunk)

        data += chunk;
    });

    request.on('end', () => {
        const array = data.split('|')[1].replace('[', '').replace(']', '').split(',');
        const uint8Array = [];

        array.map((value) => {
            uint8Array.push(Number(value));
        });

        const dataFiltered = data.slice(data.split('|')[1].length + 3, data.length).split(',');

        const body = {
            uint8Array: uint8Array,
            byteLength: Number(dataFiltered[0]),
            type: dataFiltered[1],
            id: Number(dataFiltered[2]),
            index: Number(dataFiltered[3]),
        }

        request.body = body;

        next();
    });
});

app.post('/', receiveUpload, (request, response) => {
    const data = request.body;
    const filename = `file-${request.body.id}-${request.body.index}`;
    const type = data.type;

    const uint8Array = data.uint8Array;
    const byteLength = data.byteLength;
    const buffer = new Buffer.alloc(byteLength);

    for (let i = 0; i < buffer.length; i++) {
        buffer[i] = uint8Array[i];
    }

    const base64 = Buffer.from(buffer, 'base64');

    const filePath = path.resolve(__dirname, 'src', 'files', `${filename}.${type}`);
    const writer = fs.createWriteStream(filePath, { encoding: 'base64' });

    writer.on('open', () => {
        console.log('> Uploading File.');
    });

    writer.on('ready', () => {
        const reader = fs.createReadStream(filePath);

        let progress = 0;

        reader.on('data', (chunk) => {
            const size = byteLength;

            progress += chunk.length;

            console.log(`written ${progress} of ${size} bytes (${(progress / size * 100).toFixed(2)}%)`);
        });

        writer.write(base64);
        writer.end();
    });

    writer.on('finish', () => {
        console.log('> File Uploaded.');

        return response.json(true);
    });
});

app.post('/compose', receiveData, async (request, response) => {
    console.log('> Composing files chunks.');

    // MUDAR TUDO EM QUEStÂO DE NAME

    const {
        writeFile,
        readdir,
        readFile,
        unlink
    } = fs.promises;

    const id = request.body.id;
    const type = request.body.type;
    const size = request.body.size;
    const name = request.body.name;

    const rawFiles = await readdir(path.join(__dirname, 'src', 'files', '.'));

    const filesOutOfOrder = rawFiles.filter((value) => {
        return value.includes(`file-${id}`);
    });;

    const files = [];

    filesOutOfOrder.map((value, index) => {
        files.push(`file-${id}-${index}.${type}`);
    });

    const parts = [];

    for (let i = 0; i < files.length; i++) {
        parts.push(await readFile(path.join(__dirname, 'src', 'files', files[i])));
    }

    writeFile(path.join(__dirname, 'src', 'files', `file-${id}-complete.${type}`), Buffer.concat(parts, size)).then(() => {
        console.log('> Compressing File.');
        require('./src/compress')(`file-${id}-complete`, type);

        console.log(`> Files chunks composed.`);

        for(i=0; i < parts.length; i++) {
            console.log(path.join(__dirname, 'src', 'files', `file-${id}-${i}.${type}`));
            unlink(path.join(__dirname, 'src', 'files', `file-${id}-${i}.${type}`));
        }

        return response.json(true);
    });
});

app.get('/watch', async (request, response) => {
    async function createChunks() {
        const id = request.query.id === null ? 0 : request.query.id;

        const exists = fs.existsSync(path.join(__dirname, 'src', 'files', `file-${id}-complete.mp4`));

        if(!exists) return;

        const f = fs.createReadStream(path.join(__dirname, 'src', 'files', `file-${id}-complete.mp4`));
        
        f.pipe(response);

        f.on('end', () => {
            f.close();
            console.log('fechado');
        });
    }

    createChunks();
});

server.listen(3000, async () => {
    //const tunnel = await new localtunnel({ port: 3000, subdomain: 'ronildes' });

    //console.log(`> Local Tunnel server: ${tunnel.url}`);
    console.log('> Server is running on port 3000');
});