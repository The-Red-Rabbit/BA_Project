import {OSM, Vector as VectorSource} from 'ol/source';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import Feature from 'ol/Feature';
import {Map, View} from 'ol';
import Point from 'ol/geom/Point';
import {circular} from 'ol/geom/Polygon';
import Polyline from 'ol/format/Polyline';
import {Circle as CircleStyle, Fill, Icon, Stroke, Style} from 'ol/style';
import {fromLonLat} from 'ol/proj';
import {getVectorContext} from 'ol/render';
import GeoJSON from 'ol/format/GeoJSON';



// Load input-data and pick arbitrary location for now
var inputData = require('./data/input-data.json');
var lon = inputData['startLocations'][0]['lon'];
var lat = inputData['startLocations'][0]['lat'];

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

// Define map and focus start-location
const map = new Map({
  target: 'map-container',
  layers: [
    tileLayer,
    vectorLayer
  ],
  view: new View({
    center: fromLonLat([lat, lon]),
    zoom: 16,
  }),
});

// Add and render examples
const geom = new Point(fromLonLat([lat, lon]));
const feature = new Feature(geom);
feature.setStyle(new Style({
  image: new CircleStyle({
    radius: 7,
    fill: new Fill({color: 'red'}),
    stroke: new Stroke({
      color: 'white',
      width: 1
    })
  })
}));
vectorSource.addFeature(feature);

// Get GPS location of the user
/*
navigator.geolocation.watchPosition(
  function (pos) {
    const coords = [pos.coords.longitude, pos.coords.latitude];
    const accuracy = circular(coords, pos.coords.accuracy);
    vectorSource.clear(true);
    vectorSource.addFeatures([
      new Feature(
        accuracy.transform('EPSG:4326', map.getView().getProjection())
      ),
      new Feature(new Point(fromLonLat(coords))),
    ]);
  },
  function (error) {
    alert(`ERROR: ${error.message}`);
  },
  {
    enableHighAccuracy: true,
  }
);
*/

// Define all styles for animation features
const styles = {
  'route': new Style({
    stroke: new Stroke({
      width: 6,
      color: [50, 112, 14, 0.89],
    }),
  }),
  'icon': new Style({
    image: new Icon({
      anchor: [0.5, 1],
      src: './train-stop.png',
    }),
  }),
  'geoMarker': new Style({
    image: new CircleStyle({
      radius: 7,
      fill: new Fill({color: 'black'}),
      stroke: new Stroke({
        color: 'white',
        width: 2,
      }),
    }),
  }),
};




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
import Modify from 'ol/interaction/Modify';
map.addInteraction(
  new Modify({
    source: vectorSourceRoute,
  })
);




/*
// Testing custom node modules
var mtest = require('./testmodul.js');
console.log('hurra! '+mtest.myDateTime());
*/

