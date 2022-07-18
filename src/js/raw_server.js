// Require Node-Modules
var ws = require('ws');
var net = require('net');
// Load default values
const { svr, app } = require('./config');


// VARIABLES
var connected = false;   // Frontend <-> Backend connection status

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
        // Handle connection request from Frontend
        if (data = 'connection request') {
            ws.send('request ok');
            connected = true;
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
        // Event: Data from Simulator received
        var deltas = [0.0, 0.0];
        var currCoord = [0.0, 0.0];
        conn.on('data', function dataTCP(d) {
            // Only proceed if there is already a connection to the Frontend
            if (connected) {


                console.log(d.readDoubleBE(0));
                console.log(d.readDoubleBE(8));
                deltas[0] = d.readDoubleBE(0) * -1;
                deltas[1] = d.readDoubleBE(8) * -1;
                // Calculate new coordinates TODO implement changing start pos
                currCoord[0] = ( 71.5 * app.startLon - (deltas[0]/1000)) / 71.5
                currCoord[1] = ( 111.3 * app.startLat - (deltas[1]/1000)) / 111.3
                ws.send(JSON.stringify(currCoord));

            } else {
                console.log('Data cannot be forwarded to Frontend. No Websocket-Connection established.');
            }
            
        });
        // Event: Connection from Simulator closed
        conn.once('close', function closeTCP() {
            console.log('Connection from Simulink closed (%s)', remoteAddress);
        });
        // Event: Catch TCP connection error
        conn.on('error', function errorTCP(e) {
            console.log('TCP connection error: %s - %s', e.name, e.message);
        });
    });
});
