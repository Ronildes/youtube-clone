const compress = (name, type) => {
    const fs = require('fs');
    const path = require('path');
    const util = require('util');
    const ls = require('node:child_process');

    const py = ls.spawn('python', ['./src/python/videoToFrame.py'], { cwd: path.resolve(), shell: true })

    let dataString = '';
    let data = [name, `.${type}`];

    py.stdout.on('data', function(data){
        dataString = data.toString();
    });

    py.stdout.on('end', function(){
        console.log('> File Compressed.')
        console.log(dataString);
    });

    py.stdin.write(JSON.stringify(data));
    py.stdin.end();
}   

module.exports = compress;