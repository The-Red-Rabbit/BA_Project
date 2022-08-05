// Require Node-Modules
var ws = require('ws');
var net = require('net');
// Load default values
const { svr, app } = require('./config');


// VARIABLES
var connected = false;   // Frontend <-> Backend connection status
var lonStart = app.startLon;
var latStart = app.startLat;

// Create Websocket-Server
const wss = new ws.WebSocketServer({ port: svr.wsPort });
console.log('WS-Server:  %o', wss.address());

// Create TCP-Server and listen
const server = net.createServer();
server.listen(svr.tcpPort, function () {
    console.log('TCP-Server: %o', server.address());
});

// Event: Websocket-Connection established
wss.on('connection', function connection(ws) {
    // Event: Data from Frontend received
    ws.on('message', function message(data) {
        var receivedMssg = JSON.parse(data);
        // Handle connection request from Frontend
        if (receivedMssg == 'connection request') {
            ws.send(JSON.stringify('request ok'));
            connected = true;
            console.log('conn req');
        } else if (receivedMssg.length == 2) {
            console.log('New start position recieved');
            lonStart = receivedMssg[0];
            latStart = receivedMssg[1];
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
        console.log('New Simulink connection (%s)', remoteAddress);
        ws.send(JSON.stringify('new simulation'));
        // Event: Data from Simulator received
        var deltas = [0.0, 0.0, 0.0, 0.0];
        var currCoord = [0.0, 0.0];
        conn.on('data', function dataTCP(d) {
            // Only proceed if there is already a connection to the Frontend
            if (connected) {
                //console.log('x: %d -- y: %d', Number((d.readDoubleBE(0)).toFixed(3)), Number((d.readDoubleBE(8)).toFixed(3)));
                deltas[0] = d.readDoubleBE(0) * -1;
                deltas[1] = d.readDoubleBE(8) * -1;
                //console.log('Diff: %d -- %d', Math.abs(deltas[0]-deltas[2]), Math.abs(deltas[1]-deltas[3]));
                if (Math.abs(deltas[0]-deltas[2])>1 || Math.abs(deltas[1]-deltas[3])>1) {
                    // Calculate new coordinates TODO implement changing start pos
                    currCoord[0] = ( 67.924 * lonStart - (deltas[0]/1000)) / 67.924
                    currCoord[1] = ( 111.317 * latStart - (deltas[1]/1000)) / 111.317
                    ws.send(JSON.stringify(currCoord));
                    triggerOnce();
                } else {
                    //console.count('discarded');
                }
                deltas[2] = deltas[0];
                deltas[3] = deltas[1];
            } else {
                console.log('Data cannot be forwarded to Frontend. No Websocket-Connection established.');
            }
        });
        // Event: Connection from Simulator closed
        conn.once('close', function closeTCP() {
            console.log('Connection from Simulink closed (%s)', remoteAddress);
            ws.send(JSON.stringify('end simulation'));
        });
        // Event: Catch TCP connection error
        conn.on('error', function errorTCP(e) {
            console.log('TCP connection error: %s - %s', e.name, e.message);
        });
    });
});

var triggerFlag = false;
function triggerOnce() {
    if (!triggerFlag) {
        console.log(+ new Date());
        triggerFlag = true;
    }
}
