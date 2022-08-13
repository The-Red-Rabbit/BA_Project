import {OSM, Vector as VectorSource} from 'ol/source';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {Map, View, Feature} from 'ol';
import {Point, LineString} from 'ol/geom';
import {Circle as CircleStyle, Fill, Icon, Stroke, Style} from 'ol/style';
import {fromLonLat} from 'ol/proj';


/* 
 * VARIABLES
 */

var hasWSConnection = false;
var isVisualizing = false;
var currPath = [];
var positionMarkers = [];
var dMarkerCount = 0;
var dFunctionCount = 0;
var socket;
// Load default values
const { app } = require('./config');


/* 
 * UI ELEMENTS
 */

const startCoordPopup = document.getElementById('startcoord-popup');
const startCoordInput = document.getElementById('startcoord-input');
const startCoordBttn = document.getElementById('startcoord-bttn');
const dotOne = document.getElementById('dot-one');
const dotTwo = document.getElementById('dot-two');
const tcpBttn = document.getElementById('tcp-bttn');


/* 
 * OPEN LAYERS
 */

var startLocation = fromLonLat([app.startLon, app.startLat]);

// Define visual tile layer (streets, terrain, etc.)
const tileLayer = new TileLayer({
  source: new OSM()
});

// Define feature vector source to manipulate later
const vectorSource = new VectorSource({});

// Define feature vector layer (routes, markers, etc.)
const vectorLayer = new VectorLayer({
  source: vectorSource
});

// Define view with start-location
const view = new View({
  center: startLocation,
  zoom: 16
});

// Define map and focus start-location
const map = new Map({
  target: 'map-container',
  layers: [
    tileLayer,
    vectorLayer
  ],
  view: view
});

// Define feature-styles
const styles = {
  'route': new Style({
    stroke: new Stroke({
      width: 6,
      color: [229, 81, 76, 0.89],
    }),
    zIndex: 10
  }),
  'trainstop': new Style({
    image: new Icon({
      anchor: [0.5, 1],
      src: './train-stop.png',
    }),
    zIndex: 20
  }),
  'train': new Style({
    image: new CircleStyle({
      radius: 7,
      fill: new Fill({color: 'black'}),
      stroke: new Stroke({
        color: 'white',
        width: 2,
      }),
    }),
    zIndex: 99
  }),
  'markers': new Style({
    image: new CircleStyle({
      radius: 4,
      fill: new Fill({color: 'white'}),
      stroke: new Stroke({
        color: 'black',
        width: 2,
      }),
    }),
    zIndex: 30
  })
};

// Define features
const startMarker = new Feature({
  type: 'trainstop',
  geometry: new Point(startLocation)
});

const trainPosition = startMarker.getGeometry().clone();
const trainMarker = new Feature({
  type: 'train',
  geometry: trainPosition,
});

var routeGeom = new LineString(currPath).transform('EPSG:4326', 'EPSG:3857');
var routeFeature = new Feature({
  type: 'route',
  geometry: routeGeom
});
var routeTemp = routeGeom.getCoordinates();

// Position markers
for (let i = 0; i < 25; i++) {
  positionMarkers.push(new Feature({
    type: 'markers',
    geometry: new Point(startLocation)
  }));
}

// Add and display features
vectorSource.addFeatures([startMarker, trainMarker, routeFeature]);
vectorSource.addFeatures(positionMarkers);
vectorLayer.setStyle(function (feature) {
  return styles[feature.get('type')];
});


/* 
 * FUNCTIONS
 */

function moveTrain(dX, dY) {
  if (dFunctionCount > 2 && dFunctionCount%20 == 0) {
    if (dMarkerCount < positionMarkers.length-1) {
      positionMarkers[dMarkerCount].setGeometry(new Point(fromLonLat([dX, dY])));
      dMarkerCount++;
    } else {
      dMarkerCount = 0;
    }
  }
  dFunctionCount++;

  routeTemp.push(fromLonLat([dX, dY]));
  routeGeom.setCoordinates(routeTemp);
  trainPosition.setCoordinates(fromLonLat([dX, dY]));
  trainMarker.setGeometry(trainPosition);
  vectorLayer.getRenderer().changed();
}

function connectServer() {
  if (!hasWSConnection) {
    // Establish WS connection
    tcpBttn.textContent = 'Verbindungsaufbau..';

    socket = new WebSocket(`ws://${app.host}:${app.port}`);

    socket.onopen = function(e) {
      bmKoppelung = + new Date();
      console.log('[ws-open] Connecting Server...');
      // Request connection to server
      socket.send(JSON.stringify('connection request'));
    };

    socket.onerror = function(error) {
      console.log('[ws-error] %o', error.target);
      tcpBttn.textContent = 'Verbindung fehlgeschlagen';
      dotOne.style.backgroundColor = 'red';
      dotTwo.style.backgroundColor = 'red';
    };

    socket.onclose = function(event) {
      console.log('[ws-close] Connection closed: %s %s', event.code, event.reason);
      tcpBttn.textContent = 'Verbinden';
      dotOne.classList.remove('dot-pending');
      dotTwo.classList.remove('dot-pending');
      hasWSConnection = false;
    };

    socket.onmessage = function(event) {
      console.log('[ws-message] Data received: %s', event.data);
      var recievedData = JSON.parse(event.data);
      switch (recievedData) {
        case 'request ok':
          console.log(+ new Date() - bmKoppelung);
          tcpBttn.textContent = 'Trennen';
          dotOne.classList.add('dot-pending');
          dotTwo.classList.add('dot-pending');
          hasWSConnection = true;
          break;
        case 'new simulation':
          isVisualizing = true;
          tcpBttn.textContent = 'Visualisiert...';
          dotOne.classList.remove('dot-pending');
          dotTwo.classList.remove('dot-pending');
          dotOne.style.backgroundColor = 'green';
          dotTwo.style.backgroundColor = 'green';
          // Reset route
          routeTemp = [];
          routeGeom.setCoordinates(routeTemp);
          vectorLayer.getRenderer().changed();
          break;
        case 'end simulation':
          isVisualizing = false;
          tcpBttn.textContent = 'Trennen';
          dotOne.classList.add('dot-pending');
          dotTwo.classList.add('dot-pending');
          break;
        default:
          if (recievedData.length == 2) {
            // Handle incoming data from simulink
            moveTrain(recievedData[0], recievedData[1]);
          } else {
            console.log('[ws-message] Unknown data recieved!');
          }
          break;
      }
    };
  } else {
    // Terminate WS connection
    tcpBttn.textContent = 'Verbinden';
    dotOne.classList.remove('dot-pending');
    dotTwo.classList.remove('dot-pending');
    socket.close(1000, 'User terminated the connection');
    hasWSConnection = false;
  }
}
connectServer();

function setStartCoordinates() {
  // Sanitize input
  let coordArr = sanitizeString(startCoordInput.value);
  // Check for vaild input
  if (coordArr && coordArr.length == 2) {
    if (hasWSConnection) {
      console.log('Valid new start-coordinates: %s ; %s', coordArr[0], coordArr[1]);
      startCoordInput.value = '';
      triggerPopup('&#9745; Koordinaten gesetzt');
      // Set new start coordinates
      startLocation = fromLonLat([parseFloat(coordArr[1]), parseFloat(coordArr[0])]);
      trainPosition.setCoordinates(startLocation);
      startMarker.setGeometry(new Point(startLocation));
      // Move view to new start-location
      view.animate({
        center: startLocation,
        duration: 2000
      });
      // Tell the server
      socket.send(JSON.stringify([parseFloat(coordArr[1]), parseFloat(coordArr[0])]));
    } else {
      console.log('Could not forward new start-coordinates to server');
      triggerPopup('&#9888;<br>Bitte zuerst mit Server verbinden');
    }
  } else {
    console.log('Invalid new start-coordinates');
    triggerPopup('&#9888; Eingabe fehlerhaft');
  }
}


/* 
 * EVENTS
 */

// Event: Set start-coordinates
startCoordBttn.addEventListener('click', function() {
  if (!isVisualizing) {
    setStartCoordinates();
  } else {
    triggerPopup('&#9888;<br>Eingabe bei laufender Visualisierung gesperrt');
  }
});

// Event: Establish and handle WS-connection
tcpBttn.addEventListener('click', function() {
  if (!isVisualizing) { connectServer(); }
});


/*
 * UTILITY FUNCTIONS
 */

function sanitizeString(str){
  str = str.replace(/[^a-z0-9áéíóúñü \.,_-]/gim,"");
  return str.trim().match(/-?[0-9]+\.-?[0-9]+/g);
}

function triggerPopup(popupText) {
  startCoordPopup.innerHTML = popupText;
  startCoordPopup.classList.add('show');
  setTimeout(function(){startCoordPopup.classList.remove('show');}, 3000);
}
