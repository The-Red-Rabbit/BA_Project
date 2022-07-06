import {OSM, Vector as VectorSource} from 'ol/source';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import Feature from 'ol/Feature';
import {Map, View} from 'ol';
import Point from 'ol/geom/Point';
import {circular} from 'ol/geom/Polygon';
import Polyline from 'ol/format/Polyline';
import {Circle as CircleStyle, Fill, Icon, Stroke, Style} from 'ol/style';
import {fromLonLat, transform} from 'ol/proj';
import {getVectorContext} from 'ol/render';
import GeoJSON from 'ol/format/GeoJSON';


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
      color: [50, 112, 14, 0.89],
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

// Add and display features
vectorSource.addFeatures([startMarker, trainMarker]);
vectorLayer.setStyle(function (feature) {
  return styles[feature.get('type')];
});


/* 
 * FUNCTIONS
 */

function moveTrain(dX, dY) {
  console.log('Debug moveTrain - Coords: %O - Deltas: x=%f y=%f', trainPosition.getCoordinates(), dX, dY);
  trainPosition.setCoordinates([trainPosition.getCoordinates()[0]+dX, trainPosition.getCoordinates()[1]+dY]);
  trainMarker.setGeometry(trainPosition);
  vectorLayer.getRenderer().changed();
  //vectorSource.refresh();
}


/* 
 * EVENTS
 */

startCoordBttn.addEventListener('click', function() {
  // Sanitize input
  let coordInputValue = sanitizeString(startCoordInput.value);
  // Check for vaild input
  let coordArr = coordInputValue.match(/-?[0-9]+\.-?[0-9]+/g);
  if (coordInputValue && coordArr && coordArr.length == 2) {
    console.log('valid: %s ; %s', coordArr[0], coordArr[1]);
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

var dataIndex = 1;
    var prevCoordX = 0;
    var prevCoordY = 0;
tcpBttn.addEventListener('click', function() {
  // Check for existing WS connection
  if (!hasWSConnection) {
    // Establish WS connection
    tcpBttn.textContent = 'Verbindungsaufbau..';

    //socket = new WebSocket('wss://redr.uber.space/ep');
    //socket = new WebSocket('ws://localhost:8080');
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
      console.log(`[ws-message] Data No.%s received from server: %o`, dataIndex, event.data);
      // Check for request answer or data
      if (event.data == 'request ok') {
        tcpBttn.textContent = 'Trennen';
        dotOne.classList.add('dot-pending');
        dotTwo.classList.add('dot-pending');
        hasWSConnection = true;
      } else {
        // Handle incoming data from simulink
        //...
        if (dataIndex%2 == 0) {
          moveTrain(0, event.data-prevCoordY);
          prevCoordY = event.data;
        } else {
          moveTrain(event.data-prevCoordX, 0);
          prevCoordX = event.data;
        }
        dataIndex++;
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
// Load a route (String) from a file
var routeData = require('./data/example-route.json');

const polygon = require('./data/features.json');
const encode = require('geojson-polyline').encode
const encoded = encode(polygon);
console.log(encoded.features[0].geometry.coordinates);
console.log(routeData.routes[0].geometry);

const route = new Polyline({
  factor: 1e5,
}).readGeometry(encoded.features[0].geometry.coordinates, {
  dataProjection: 'EPSG:4326',
  featureProjection: 'EPSG:3857',
});

var geoJ = new GeoJSON();
const vectorSourceGeoj = new VectorSource({
  format: new GeoJSON(),
  url: './features.json',
});




const mroute = new Polyline({
  factor: 1e5,
}).readGeometry(vectorSourceGeoj.geometry, {
  dataProjection: 'EPSG:4326',
  featureProjection: 'EPSG:3857',
});
const mrouteFeature = new Feature({
  type: 'route'
});
mrouteFeature.setGeometry(mroute);

// Define all features
const routeFeature = new Feature({
  type: 'route',
  geometry: route,
});
const startMarker = new Feature({
  type: 'icon',
  geometry: new Point(route.getFirstCoordinate()),
});
const endMarker = new Feature({
  type: 'icon',
  geometry: new Point(route.getLastCoordinate()),
});
const position = startMarker.getGeometry().clone();
const geoMarker = new Feature({
  type: 'geoMarker',
  geometry: position,
});

// Define a new VectorSource
const vectorSourceRoute = new VectorSource({
  features: [routeFeature, geoMarker, startMarker, endMarker],
});
// Define, populate and add a new VectorLayer
const vectorLayerRoute = new VectorLayer({
  source: vectorSourceRoute,
  style: function (feature) {
    return styles[feature.get('type')];
  },
});
map.addLayer(vectorLayerRoute);

 */



/*
// Testing moving the train manualy in east direction; Button is disabled for now
const moveButton = document.getElementById('move-train');
moveButton.style.display = 'none';
moveButton.addEventListener('click', function() {
  console.log('Debug move-bttn Click!\n'+position.getCoordinates());
  position.setCoordinates([position.getCoordinates()[0]+100, position.getCoordinates()[1]]);
  geoMarker.setGeometry(position);
});


// Copypasta Animation-Feature

const speedInput = document.getElementById('speed');
const startButton = document.getElementById('start-train');
let animating = false;
let distance = 0;
let lastTime;

function moveFeature(event) {
  const speed = Number(speedInput.value);
  const time = event.frameState.time;
  const elapsedTime = time - lastTime;
  distance = (distance + (speed * elapsedTime) / 1e5) % 2;
  lastTime = time;
  
  const currentCoordinate = route.getCoordinateAt(
    distance > 1 ? 2 - distance : distance
  );
  position.setCoordinates(currentCoordinate);
  const vectorContext = getVectorContext(event);
  vectorContext.setStyle(new Style({
    image: new CircleStyle({
      radius: 7,
      fill: new Fill({color: 'black'}),
      stroke: new Stroke({
        color: 'white',
        width: 2
      })
    })
  }));
  vectorContext.drawGeometry(position);
  // tell OpenLayers to continue the postrender animation
  map.render();
}

function startAnimation() {
  animating = true;
  lastTime = Date.now();
  startButton.textContent = 'Stop Animation';
  vectorLayerRoute.on('postrender', moveFeature);
  // hide geoMarker and trigger map render through change event
  geoMarker.setGeometry(null);
}

function stopAnimation() {
  animating = false;
  startButton.textContent = 'Start';

  // Keep marker at current animation position
  geoMarker.setGeometry(position);
  vectorLayerRoute.un('postrender', moveFeature);
}

startButton.addEventListener('click', function() {
  console.log('Click!');
  if (animating) {
    stopAnimation();
  } else {
    startAnimation();
  }
});
*/


/*
const example = require('bundle-text:./data/route-data.csv');
 
console.log(example);
*/


/*
// Define GEOJSON vector layer
const vectorLayerGeoj = new VectorLayer({
  source: vectorSourceGeoj
});
map.addLayer(vectorLayerGeoj);
*/



/*
// Testing custom node modules
var mtest = require('./testmodul.js');
console.log('hurra! '+mtest.myDateTime());
*/











/*
 * UTILITY FUNCTIONS
 */

function sanitizeString(str){
  str = str.replace(/[^a-z0-9áéíóúñü \.,_-]/gim,"");
  return str.trim();
}