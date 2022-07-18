// Require Node-Modules
var ws = require('ws');
var net = require('net');
// Load default values
const { svr, app } = require('./config');


// VARIABLES
var connected = false;   // Frontend <-> Backend connection status
var deltaBuffer = [0.0, 0.0, 0.0, 0.0];

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
        var stepLength = 0;
        const stepRate = 5;
        var dataIndex = 0;
        var deltas = [0.0, 0.0];
        var currCoord = [0.0, 0.0];
        conn.on('data', function dataTCP(d) {
            // Only proceed if there is already a connection to the Frontend
            if (connected) {
              // Store 2 coordinates in buffer
              deltaBuffer[dataIndex] = d.readDoubleBE();
              if (dataIndex == 3) {
                // Check for x, y mismatch 
                if (isSimilar(deltaBuffer[0], deltaBuffer[1]) || isSimilar(deltaBuffer[2], deltaBuffer[3])) {
                  console.log('Possible x, y mismatch detected:');
                  console.info(deltaBuffer);
                }
                dataIndex = 0;
              } else {
                dataIndex++;
              }
              
              
                if (dataIndex == 0) {       // Set X-Coordinate
                    deltas[1] = d.readDoubleBE();
                    deltas[1] *= -1;
                    dataIndex = 1;
                } else {                    // Set Y-Coordinate
                    deltas[0] = d.readDoubleBE();
                    deltas[0] *= -1;
                    dataIndex = 0;
                    // Calculate new coordinates TODO implement changing start pos
                    currCoord[0] = ( 71.5 * app.startLon - (deltas[0]/1000)) / 71.5
                    currCoord[1] = ( 111.3 * app.startLat - (deltas[1]/1000)) / 111.3
                    if (stepLength == stepRate) {
                        // Send to frontend
                        ws.send(JSON.stringify(currCoord));
                        stepLength = 0;
                        /*
                        console.log('Datapoint:');
                        console.group();
                        console.log('Deltas:\nx = '+deltas[0]+'\ny = '+deltas[1]+'\nCoords:\nLon = '+currCoord[0]+'\nLat = '+currCoord[1]);
                        console.groupEnd();
                        */
                    } else {
                        stepLength++;
                    }
                
                }
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

// FUNCTIONS
function isSimilar(a, b) {
  if (a <= 10) {
    return false;
  } else {
    return a >= b-10 && a<= b+10;
  }
}