var net = require('net');
var asciichart = require ('asciichart');

var server = net.createServer();
server.on('connection', handleConnection);


server.listen(9000, function () {
    console.log('server listening to %j', server.address());
});

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


        console.log('connection data from %s: %j\n', remoteAddress, outString);
        conn.write(d);
    }

    function onConnClose() {  
        console.log('connection from %s closed', remoteAddress);  

        if (outGraph.length > 50) {
            outGraph = outGraph.slice(0,49);
        }
        console.log(asciichart.plot(outGraph));
        outGraph = [];
    }

    function onConnError(err) {  
        console.log('Connection %s error: %s', remoteAddress, err.message);  
    }  
}


