// Require Node-Modules
var ws = require('ws');
var net = require('net');

// Debug
//var asciichart = require('asciichart');
const debugBuffer = Buffer.alloc(15);
const debugArrX = [0.0, 1.3, 2.4, 3.5, 4.6];
const debugArrY = [0.0, 0.6, 1.7, 2.8, 3.9];
var debugIntvX;
var debugIntvY;
var debugI = 0;
function debugSimulinkX(wsc) {
    debugBuffer.writeDoubleBE(debugArrX[debugI], 0);
    wsc.send(debugBuffer.readDoubleBE());
}
function debugSimulinkY(wsc) {
    debugBuffer.writeDoubleBE(debugArrY[debugI], 0);
    wsc.send(debugBuffer.readDoubleBE());
    debugI++;
    if (debugI >= debugArrX.length) {
        clearInterval(debugIntvX);
        clearInterval(debugIntvY);
        debugI = 0;
    }
}

// Frontend <-> Backend connection status
var connected = false;

// Create Websocket-Server
const wss = new ws.WebSocketServer({ port: 8080 });
console.log('WS-Server:  %o', wss.address());

// Create TCP-Server and listen on Port 42640
const server = net.createServer();
server.listen(42640, function () {
    console.log('TCP-Server: %o', server.address());
});

// Event: Websocket-Connection established
wss.on('connection', function connection(ws) {
    // Event: Data from Frontend received
    ws.on('message', function message(data) {
        console.log('WS data received: %s', data);
        // Handle connection request from Frontend
        if (data = 'connection request') {
            ws.send('request ok');
            connected = true;
            // Debug
            debugIntvX = setInterval(debugSimulinkX, 500, ws);
            setTimeout((wscref) => {
                debugIntvY = setInterval(debugSimulinkY, 500, wscref);
            }, 250, ws);
            
        } else {
            console.log('unknown request');
        }
    });
    ws.on('close', function close(code, msg) {
        console.log('WS connection closed %o %s', code, msg.toString('utf-8'));
        connected = false;
    });
    // Event: TCP-Connection established
    server.on('connection', function connectionTCP(conn) {
        var remoteAddress = conn.remoteAddress + ':' + conn.remotePort;
        console.log('New client connection from %s', remoteAddress);
        // Event: Data from Simulator received
        conn.on('data', function dataTCP(d) {
            console.log('Data: '+d.readDoubleBE());
            // Only proceed if there is already a connection to the Frontend
            if (connected) {
                ws.send(d.readDoubleBE());
            } else {
                console.log('Data cannot be forwarded to Frontend. No Websocket-Connection established.');
            }
        });
        // Event: Connection from Simulator closed
        conn.once('close', function closeTCP() {
            console.log('Connection from %s closed', remoteAddress);
        });
        // Event: Catch TCP connection error
        conn.on('error', function errorTCP(e) {
            console.log('TCP connection error: %s - %s', e.name, e.message);
        });
    });
});




/*





function handleConnection(conn) {
    var dataPointCount = 0;
    var remoteAddress = conn.remoteAddress + ':' + conn.remotePort;
    console.log('new client connection from %s', remoteAddress);

    conn.on('data', onConnData);
    conn.once('close', onConnClose);
    conn.on('error', onConnError);

    
    //conn.setEncoding('hex');

    var outGraph = [];

    function onConnData(d) {
        var outString = '';
        
        for (let index = 0; index < d.length; index++) {
            outString += d[index];
            if (index%2 != 0) {
                outString += ' ';
            }
        }
        
        outGraph.push(d.readDoubleBE());

        dataPointCount++;
        console.log('Datapoint No.: %d', dataPointCount);


        console.log('Debug: '+d.readDoubleBE());
        for (x of d.entries()) {
            //console.log(x);
        }

        if (connected) {
            
        }



        console.log('connection data from %s: %j\n', remoteAddress, outString);
        conn.write(d);
    }

    function onConnClose() {  
        console.log('connection from %s closed', remoteAddress);  

        if (outGraph.length > 50) {
            outGraph = outGraph.slice(0,49);
        }
        //console.log(asciichart.plot(outGraph));
        outGraph = [];
    }

    function onConnError(err) {  
        console.log('Connection %s error: %s', remoteAddress, err.message);  
    }  
}






*/
