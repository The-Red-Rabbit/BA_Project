import OSM from 'ol/source/OSM';
import GeoJSON from 'ol/format/GeoJSON';
//var GeoJSON = require('geojson');
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Map, View} from 'ol';
import {fromLonLat} from 'ol/proj';
import sync from 'ol-hashed';
import DragAndDrop from 'ol/interaction/DragAndDrop';


const source = new VectorSource();



var data = [
    { name: 'Location A', category: 'Store', street: 'Market', lat: 39.984, lng: -75.343 },
    { name: 'Location B', category: 'House', street: 'Broad', lat: 39.284, lng: -75.833 },
    { name: 'Location C', category: 'Office', street: 'South', lat: 39.123, lng: -74.534 }
  ];

const map = new Map({
  target: 'map-container',
  layers: [
      /*
    new TileLayer({
        source: new OSM(),
      }),
      
    new VectorLayer({
        source: new VectorSource({
          format: new GeoJSON(),
          url: 'data/countries.json',
        }),
      })
      */
  ],
  view: new View({
    center: fromLonLat([0, 0]),
    zoom: 2,
  }),
});

const layer = new VectorLayer({
    source: source,
  });

  map.addLayer(layer);

  map.addInteraction(
    new DragAndDrop({
      source: source,
      formatConstructors: [GeoJSON],
    })
  );
  
  


sync(map);






var data = [
    { name: 'Location A', category: 'Store', street: 'Market', lat: 39.984, lng: -75.343 },
    { name: 'Location B', category: 'House', street: 'Broad', lat: 39.284, lng: -75.833 },
    { name: 'Location C', category: 'Office', street: 'South', lat: 39.123, lng: -74.534 }
  ];

//console.log(GeoJSON.parse(data, {Point: ['lat', 'lng']}));
//console.log(GeoJSON.parse('data/countries.json'));