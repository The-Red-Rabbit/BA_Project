import {OSM, Vector as VectorSource} from 'ol/source';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {Map, View, Feature} from 'ol';
import Point from 'ol/geom/Point';
import {circular} from 'ol/geom/Polygon';
import Polyline from 'ol/format/Polyline';
import {Circle as CircleStyle, Fill, Icon, Stroke, Style} from 'ol/style';
import {fromLonLat, toLonLat, transform} from 'ol/proj';
import {getVectorContext} from 'ol/render';
import GeoJSON from 'ol/format/GeoJSON';
import LineString from 'ol/geom/LineString';


/* 
 * VARIABLES
 */

var hasWSConnection = false;
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
  }),
  'trainstop': new Style({
    image: new Icon({
      anchor: [0.5, 1],
      src: './train-stop.png',
    }),
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
  }),
  'debugtrain': new Style({
    image: new CircleStyle({
      radius: 7,
      fill: new Fill({color: 'red'}),
      stroke: new Stroke({
        color: 'white',
        width: 2,
      }),
    }),
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

//Debug markers
var debugMarkers = [];
for (let i = 0; i < 25; i++) {
  debugMarkers.push(new Feature({
    type: 'debugtrain',
    geometry: new Point(startLocation)
  }));
}
vectorSource.addFeatures(debugMarkers);
var dMarkerCount = 0;
var dFunctionCount = 0;

//route
var currPath = [];

var routeGeom = new LineString(currPath).transform('EPSG:4326', 'EPSG:3857');

var routeFeature = new Feature({
  type: 'route',
  geometry: routeGeom
});
vectorSource.addFeature(routeFeature);
var foo = routeGeom.getCoordinates();




// Add and display features
vectorSource.addFeatures([startMarker, trainMarker]);
vectorLayer.setStyle(function (feature) {
  return styles[feature.get('type')];
});


/* 
 * FUNCTIONS
 */

function moveTrain(dX, dY) {
  /*
  console.log('Debug #%d moveTrain - Coords: x=%f y=%f', dFunctionCount, dX, dY);
  if (dFunctionCount > 2 && dFunctionCount%10 == 0) {
    if (dMarkerCount < debugMarkers.length-1) {
      debugMarkers[dMarkerCount].setGeometry(new Point(fromLonLat([dX, dY])));
      dMarkerCount++;
    } else {
      dMarkerCount = 0;
    }
  }
  dFunctionCount++;
*/

foo.push(fromLonLat([dX, dY]));
routeGeom.setCoordinates(foo);


  
  trainPosition.setCoordinates(fromLonLat([dX, dY]));
  trainMarker.setGeometry(trainPosition);
  vectorLayer.getRenderer().changed();
  //vectorSource.refresh();
}


/* 
 * EVENTS
 */

// Event: Set start-coordinates
startCoordBttn.addEventListener('click', function() {
  // Sanitize input
  let coordArr = sanitizeString(startCoordInput.value);
  // Check for vaild input
  if (coordArr && coordArr.length == 2) {
    console.log('New valid start-coordinates: %s ; %s', coordArr[0], coordArr[1]);
    startCoordInput.value = '';
    triggerPopup('&#9745; Koordinaten gesetzt');
    // Set new start coordinates
    startLocation = fromLonLat([parseFloat(coordArr[1]), parseFloat(coordArr[0])]);
    trainPosition.setCoordinates(startLocation);
    startMarker.setGeometry(trainPosition);
    // Move view to new start-location
    view.animate({
      center: startLocation,
      duration: 2000
    });
  } else {
    console.log('invalid');
    triggerPopup('&#9888; Eingabe fehlerhaft');
  }
  function triggerPopup(popupText) {
    startCoordPopup.innerHTML = popupText;
    startCoordPopup.classList.add('show');
    setTimeout(function(){startCoordPopup.classList.remove('show');}, 3000);
  }
});

// Event: Establish and handle WS-connection
tcpBttn.addEventListener('click', function() {
  // Check for existing WS connection
  if (!hasWSConnection) {
    // Establish WS connection
    tcpBttn.textContent = 'Verbindungsaufbau..';

    //socket = new WebSocket('wss://redr.uber.space/ep');
    socket = new WebSocket(`ws://${app.host}:${app.port}`);
    
    socket.onopen = function(e) {
      console.log("[ws-open] Connection established. Sending request...");
      // Request connection to server
      socket.send("connection request");
    };

    socket.onerror = function(error) {
      console.log(`[ws-error] %o`, error.target);
      tcpBttn.textContent = 'Verbindung fehlgeschlagen';
      dotOne.style.backgroundColor = 'red';
    };

    socket.onclose = function(event) {
      console.log('[ws-close] Connection closed: %s %s', event.code, event.reason);
      tcpBttn.textContent = 'Verbinden';
      dotOne.classList.remove('dot-pending');
      dotTwo.classList.remove('dot-pending');
      hasWSConnection = false;
    };

    
    socket.onmessage = function(event) {
      console.log(`[ws-message] Data received from server: %s`, event.data);
      // Check for request answer or data
      if (event.data == 'request ok') {
        tcpBttn.textContent = 'Trennen';
        dotOne.classList.add('dot-pending');
        dotTwo.classList.add('dot-pending');
        hasWSConnection = true;
        console.log('Connection established!');
      }
      var recCoords = JSON.parse(event.data);
      if (recCoords.length == 2) {
        // Handle incoming data from simulink
        moveTrain(recCoords[0], recCoords[1]);
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
});


/*
 * UTILITY FUNCTIONS
 */

function sanitizeString(str){
  str = str.replace(/[^a-z0-9áéíóúñü \.,_-]/gim,"");
  return str.trim().match(/-?[0-9]+\.-?[0-9]+/g);
}