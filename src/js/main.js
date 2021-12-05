import OSM from 'ol/source/OSM';
import GeoJSON from 'ol/format/GeoJSON';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Map, View} from 'ol';
import {fromLonLat} from 'ol/proj';
import sync from 'ol-hashed';
import DragAndDrop from 'ol/interaction/DragAndDrop';
import Modify from 'ol/interaction/Modify';
import Draw from 'ol/interaction/Draw';




const source = new VectorSource();

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

map.addInteraction(
    new Modify({
      source: source,
    })
  );
  
  map.addInteraction(
    new Draw({
      type: 'Polygon',
      source: source,
    })
  );
  
  const clear = document.getElementById('clear');
clear.addEventListener('click', function () {
  source.clear();
});

const format = new GeoJSON({featureProjection: 'EPSG:3857'});
const download = document.getElementById('download');
source.on('change', function () {
  const features = source.getFeatures();
  const json = format.writeFeatures(features);
  download.href =
    'data:application/json;charset=utf-8,' + encodeURIComponent(json);
});

  


sync(map);

