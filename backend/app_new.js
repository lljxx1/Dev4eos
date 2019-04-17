const Hapi = require('hapi');
const fs = require('fs');
const spawn = require('child_process').spawn;

var tls = {
    key: fs.readFileSync('/etc/letsencrypt/live/dev4eos.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/dev4eos.com/fullchain.pem')
};

const server = Hapi.server({
    port: 8081,
    host: '0.0.0.0',
    tls: tls
});

server.route({
    method: 'GET',
    path: '/info',
    handler: (request, h) => {
        return JSON.stringify({
            apiVersion: 1.1
        });
    }
});


var tempDIR = './temp';
var EOSIOCPP = '/usr/bin/eosio-cpp';

if (!fs.existsSync(tempDIR)) {
    fs.mkdirSync(tempDIR);
}



function doComplie(outputFile, templFileName) {
    return new Promise((resolve, reject) => {

        var spanArgs = ['-o', outputFile, templFileName];
        var complier = spawn(EOSIOCPP, spanArgs);
        console.log('spanArgs', spanArgs)
        var logs = [];
        var wasmOutput = templFileName + ".wasm";
        complier.stdout.on('data', (data) => {
            console.log(`doComplie stdout: ${data}`);
            logs.push(data.toString());
        });

        complier.stderr.on('data', (data) => {
            console.log(`doComplie stderr: ${data}`);
            logs.push(data.toString());
        });

        complier.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            if (fs.existsSync(outputFile)) {
                resolve({
                    wasm: fs.readFileSync(wasmOutput).toString('hex'),
                    logs: logs.join("\n")
                })
            } else {
                resolve({
                    logs: logs.join("\n")
                })
            }
        });
    })
}


async function complieCode(payload) {
    var isSingleFile = !payload.files;
    var templFileName = [tempDIR, (Math.round(Math.random() * 1000)), '.cpp'].join("/");
    var outputFile = templFileName + ".wast";

    if (isSingleFile) {
        fs.writeFileSync(templFileName, payload.content);
    } else {
        var fileName = "";
        var contractTempDir = [tempDIR, Date.now() + (Math.round(Math.random() * 1000))].join('/');
        fs.mkdirSync(contractTempDir);

        payload.files.forEach((file) => {
            var fileName = file.fileName.split("/")[0];
            var contractFilePath = [contractTempDir, fileName].join('/');

            fs.writeFileSync(contractFilePath, file.content);

            if (file.isLeader) {
                templFileName = contractFilePath;
                outputFile = contractFilePath + ".wast";
            }
        });
    }

    var complieResults = {};
    try {
        complieResults = await doComplie(outputFile, templFileName);
    } catch (e) {}

    return complieResults;
}


async function complieCodeHandller(request, h) {
    try {
        var results = await complieCode(request.payload);
        return h.response(results);
    } catch (e) {
        console.log(e);
    }
}

server.route({
    method: 'POST',
    path: '/complie',
    config: {
        cors: true
    },
    handler: complieCodeHandller
});

const init = async () => {
    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();