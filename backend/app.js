const Hapi = require('hapi');
const fs = require('fs');
const spawn = require('child_process').spawn;

const server = Hapi.server({
    port: 3000,
    host: '0.0.0.0'
});

server.route({
    method: 'GET',
    path: '/info',
    
    handler: (request, h) => {
        return  JSON.stringify({
            apiVersion: '1'
        });
    }
});



async function complieCode(file){
    return new Promise((resolve, reject) => {
        var outputFile = file+".wast";
        var wasm = file+".wasm";
        var complier = spawn('eosiocpp', ['-o', outputFile, file]);
        var logs = [];

        complier.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        complier.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
            logs.push(data.toString());
        });

        complier.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            if(fs.existsSync(outputFile)){
                resolve({
                    wasm: fs.readFileSync(wasm).toString('hex'),
                    logs: logs.join("\n")
                })
            }else{
                resolve({
                    // wast: fs.readFileSync(outputFile).toString('hex'),
                    logs: logs.join("\n")
                })
            }
        });

    })
}


async function complieCodeHandller(request, h){
    if(!fs.existsSync('./temp')){
        fs.mkdirSync('./temp');
    }

    var tempFile = "./temp/"+Date.now()+".cpp";
    var payload = request.payload;
    try{
        fs.writeFileSync(tempFile, payload.content);
        var wast = await complieCode(tempFile);
        return h.response(wast);
    }catch(e){
        console.log(e);
    }
}

server.route({
    method: 'POST',
    path: '/complie',
    config: {
        cors : true
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