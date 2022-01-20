import {OSM, Vector as VectorSource} from 'ol/source';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import Feature from 'ol/Feature';
import {Map, View} from 'ol';
import Point from 'ol/geom/Point';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';
import {fromLonLat} from 'ol/proj';

// Load input-data
var inputData = require('./data/input-data.json');
var lon = inputData['startLocations'][0]['lon'];
var lat = inputData['startLocations'][0]['lat'];

// Define vector source
const vectorSource = new VectorSource({});

// Define visual tile layer
const tileLayer = new TileLayer({
  source: new OSM()
});

// Define feature vector layer
const vectorLayer = new VectorLayer({
  source: vectorSource
});

// Define map
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
