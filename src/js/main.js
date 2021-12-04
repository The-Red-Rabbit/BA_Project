import OSM from 'ol/source/OSM';
import GeoJSON from 'ol/format/GeoJSON';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Map, View} from 'ol';
import {fromLonLat} from 'ol/proj';
import sync from 'ol-hashed';


const map = new Map({
  target: 'map-container',
  layers: [
    new TileLayer({
        source: new OSM(),
      }),
    new VectorLayer({
        source: new VectorSource({
          format: new GeoJSON(),
          url: '../data/countries.json',
        }),
      }),
  ],
  view: new View({
    center: fromLonLat([0, 0]),
    zoom: 2,
  }),
});

sync(map);